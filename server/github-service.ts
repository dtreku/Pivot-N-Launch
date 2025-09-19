import { Octokit } from '@octokit/rest';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

export interface GitHubUpdateFile {
  path: string;
  content: string;
  message?: string;
}

export interface GitHubCommitResult {
  success: boolean;
  commitSha?: string;
  message?: string;
  error?: string;
}

export class GitHubDeploymentService {
  private owner: string;
  private repo: string;
  
  constructor(owner: string, repo: string) {
    this.owner = owner;
    this.repo = repo;
  }

  async getCurrentFileSha(client: Octokit, filePath: string): Promise<string | null> {
    try {
      const { data } = await client.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
      });

      // Check if it's a file (not a directory)
      if ('sha' in data && !Array.isArray(data)) {
        return data.sha;
      }
      return null;
    } catch (error: any) {
      // File doesn't exist yet
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async updateFile(filePath: string, content: string, commitMessage?: string): Promise<GitHubCommitResult> {
    try {
      const client = await getUncachableGitHubClient();
      const currentSha = await this.getCurrentFileSha(client, filePath);
      
      const updateData: any = {
        owner: this.owner,
        repo: this.repo,
        path: filePath,
        message: commitMessage || `Update ${filePath} via PBL Toolkit automation`,
        content: Buffer.from(content).toString('base64'),
      };

      // Add SHA if file exists (for updates)
      if (currentSha) {
        updateData.sha = currentSha;
      }

      const { data } = await client.rest.repos.createOrUpdateFileContents(updateData);

      return {
        success: true,
        commitSha: data.commit.sha,
        message: `Successfully ${currentSha ? 'updated' : 'created'} ${filePath}`
      };
    } catch (error: any) {
      console.error('GitHub update error:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  async updateMultipleFiles(files: GitHubUpdateFile[]): Promise<GitHubCommitResult[]> {
    const results: GitHubCommitResult[] = [];
    
    for (const file of files) {
      const result = await this.updateFile(file.path, file.content, file.message);
      results.push(result);
      
      // Add small delay between updates to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }

  async getRepositoryInfo(): Promise<{ name: string; url: string; defaultBranch: string } | null> {
    try {
      const client = await getUncachableGitHubClient();
      const { data } = await client.rest.repos.get({
        owner: this.owner,
        repo: this.repo,
      });

      return {
        name: data.full_name,
        url: data.html_url,
        defaultBranch: data.default_branch
      };
    } catch (error: any) {
      console.error('Error getting repository info:', error);
      return null;
    }
  }
}

// Helper function to get user's repositories
export async function getUserRepositories(): Promise<any[]> {
  try {
    const client = await getUncachableGitHubClient();
    const { data } = await client.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 50
    });

    return data.map(repo => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      private: repo.private,
      url: repo.html_url,
      defaultBranch: repo.default_branch,
      updatedAt: repo.updated_at
    }));
  } catch (error: any) {
    console.error('Error fetching repositories:', error);
    return [];
  }
}

// Helper to parse GitHub URL and extract owner/repo
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const githubRegex = /github\.com\/([^\/]+)\/([^\/]+)(?:\.git)?(?:\/.*)?$/;
  const match = url.match(githubRegex);
  
  if (match) {
    return {
      owner: match[1],
      repo: match[2]
    };
  }
  
  return null;
}