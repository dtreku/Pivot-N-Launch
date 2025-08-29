# Deployment Guide - PBL Pedagogy Tool

This guide walks you through deploying the Pivot-and-Launch Project-Based Learning Platform to GitHub and Netlify with the custom domain PNLToolkit.professordtreku.com.

## Prerequisites

1. **GitHub Account**: Create account at [github.com](https://github.com)
2. **Netlify Account**: Create account at [netlify.com](https://netlify.com)
3. **PostgreSQL Database**: Set up a cloud database (recommended: [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app))

## Step 1: Database Setup

1. Create a PostgreSQL database on your preferred cloud provider
2. Copy the connection string (DATABASE_URL)
3. Run database migrations:
   ```bash
   npm run db:push
   ```

## Step 2: GitHub Repository Setup

1. Create a new repository on GitHub
2. Initialize git in your project (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: PBL Pedagogy Tool"
   ```
3. Add GitHub remote and push:
   ```bash
   git remote add origin https://github.com/yourusername/Pivot-N-Launch-PBL-Pedagogy-Tool.git
   git branch -M main
   git push -u origin main
   ```

## Step 3: Netlify Deployment

### Option A: Connect GitHub Repository
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click "New site from Git"
3. Connect your GitHub account
4. Select your repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist/public`
   - **Functions directory**: `netlify/functions`

### Option B: Manual Deploy
1. Build the project locally:
   ```bash
   npm run build
   ```
2. Drag and drop the `dist/public` folder to Netlify

## Step 4: Environment Variables

Set these environment variables in Netlify:

1. Go to Site Settings > Environment Variables
2. Add the following variables:

```
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_secure_random_string_here
NODE_ENV=production
```

To generate a SESSION_SECRET, use:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 5: Seed Database

After deployment, seed your database with the super admin:

1. Access your deployed site
2. Make a POST request to `/api/seed` or use this curl command:
   ```bash
   curl -X POST https://PNLToolkit.professordtreku.com/api/seed
   ```

## Step 6: First Login

Use these credentials to access the platform:
- **Email**: dtreku@wpi.edu
- **Password**: admin123

⚠️ **Important**: Change the password immediately after first login for security.

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `SESSION_SECRET` | Secret for session encryption | `abc123def456...` |
| `NODE_ENV` | Environment mode | `production` |

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correct
- Ensure database accepts connections from Netlify IPs
- Check database user permissions

### Build Failures
- Verify all dependencies are in package.json
- Check build logs for specific errors
- Ensure TypeScript types are correct

### Authentication Issues
- Verify SESSION_SECRET is set
- Check that database is seeded with super admin
- Ensure secure connections (HTTPS) in production

## Custom Domain Setup (PNLToolkit.professordtreku.com)

### Step 1: Configure Domain in Netlify
1. In Netlify Dashboard, go to Site Settings > Domain Management
2. Click "Add custom domain"
3. Enter: `PNLToolkit.professordtreku.com`
4. Verify domain ownership

### Step 2: DNS Configuration
Configure these DNS records with your domain provider:

**For subdomain (PNLToolkit.professordtreku.com):**
```
Type: CNAME
Name: PNLToolkit
Value: your-netlify-site.netlify.app
```

**Alternative with A records (if CNAME not supported):**
```
Type: A
Name: PNLToolkit
Value: 75.2.60.5
```

### Step 3: Enable HTTPS
- HTTPS is automatically enabled by Netlify
- SSL certificate will be provisioned within 24 hours
- Force HTTPS redirect in Netlify settings

## Monitoring and Updates

### Automated Deployments
- Every push to main branch triggers automatic deployment
- Preview deployments for pull requests
- Build status notifications via email/Slack

### Monitoring
- Monitor Netlify Functions logs for server issues
- Set up Netlify Analytics for usage insights
- Database performance monitoring recommended
- Uptime monitoring for PNLToolkit.professordtreku.com

### Updates and Maintenance
- Regular database backups (automated through cloud provider)
- Monitor for security updates in dependencies
- Test new features in preview deployments before merging
- Keep admin accounts secure with strong passwords

## Support

For issues with deployment:
1. Check Netlify build logs
2. Verify environment variables
3. Test database connectivity
4. Contact super admin (dtreku@wpi.edu) for access issues