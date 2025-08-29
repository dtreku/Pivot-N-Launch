# Deployment Guide - PBL Toolkit Presentations

This guide walks you through deploying the PBL Toolkit presentation materials to GitHub and Netlify with the custom domain `pnltoolkitpresentation.professordtreku.com`.

## Prerequisites

1. **GitHub Account**: [github.com](https://github.com)
2. **Netlify Account**: [netlify.com](https://netlify.com)
3. **Domain Access**: Ability to configure DNS for `professordtreku.com`

## Step 1: Create GitHub Repository

### 1.1 Create New Repository
1. Go to GitHub and create a new repository
2. Repository name: `PNLToolkitPresentation`
3. Set to Public (for easier Netlify integration)
4. Initialize with README (optional)

### 1.2 Upload Presentation Files
Copy these files to your new repository:
```
PNLToolkitPresentation/
├── index.html
├── deployment-success-presentation.html
├── research-enhanced-slide-deck.html
├── slide-deck.html
├── slide-content.html
├── netlify.toml
├── README.md
└── deployment-guide.md
```

### 1.3 Initial Commit
```bash
git init
git add .
git commit -m "Initial commit: PBL Toolkit Presentations"
git remote add origin https://github.com/[your-username]/PNLToolkitPresentation.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Netlify

### 2.1 Connect Repository
1. Log in to [Netlify](https://app.netlify.com)
2. Click "New site from Git"
3. Choose "GitHub" as your Git provider
4. Select the `PNLToolkitPresentation` repository

### 2.2 Configure Build Settings
- **Build command**: Leave empty (static HTML files)
- **Publish directory**: `.` (root directory)
- **Branch to deploy**: `main`

### 2.3 Deploy Site
1. Click "Deploy site"
2. Netlify will assign a random subdomain like `amazing-pastry-123456.netlify.app`
3. Wait for deployment to complete (usually 1-2 minutes)

## Step 3: Configure Custom Domain

### 3.1 Add Custom Domain in Netlify
1. Go to Site Settings > Domain Management
2. Click "Add custom domain"
3. Enter: `pnltoolkitpresentation.professordtreku.com`
4. Click "Verify" and then "Add domain"

### 3.2 Configure DNS
Add this CNAME record with your domain provider:

```
Type: CNAME
Name: pnltoolkitpresentation
Value: [your-netlify-subdomain].netlify.app
TTL: 3600 (or Auto)
```

**Example**:
```
Type: CNAME
Name: pnltoolkitpresentation
Value: amazing-pastry-123456.netlify.app
```

### 3.3 Enable SSL
1. In Netlify, go to Site Settings > Domain Management
2. Scroll to "HTTPS" section
3. SSL certificate will be automatically provisioned (may take up to 24 hours)
4. Enable "Force HTTPS redirect"

## Step 4: Verify Deployment

### 4.1 Test URLs
Verify these URLs work correctly:
- [https://pnltoolkitpresentation.professordtreku.com](https://pnltoolkitpresentation.professordtreku.com) (homepage)
- [https://pnltoolkitpresentation.professordtreku.com/deployment-success-presentation.html](https://pnltoolkitpresentation.professordtreku.com/deployment-success-presentation.html)
- [https://pnltoolkitpresentation.professordtreku.com/presentation](https://pnltoolkitpresentation.professordtreku.com/presentation) (redirect test)

### 4.2 Test Features
- **Navigation**: Arrow keys work in presentations
- **Responsive Design**: Check on mobile and desktop
- **Security**: HTTPS is working and forced
- **Performance**: Pages load quickly

## Step 5: Configure Automatic Deployments

### 5.1 GitHub Integration
Netlify automatically deploys when you push to the main branch:
```bash
# Make changes to presentations
git add .
git commit -m "Update presentation content"
git push origin main
# Netlify automatically deploys within 2-3 minutes
```

### 5.2 Deploy Notifications
1. In Netlify, go to Site Settings > Build & Deploy
2. Scroll to "Deploy notifications"
3. Add email notifications for deploy success/failure
4. Optional: Add Slack webhook for team notifications

## Advanced Configuration

### Environment Variables
No environment variables needed for static HTML presentations.

### Build Hooks
Create a build hook for manual deployments:
1. Site Settings > Build & Deploy > Build hooks
2. Create new hook with name "Manual Deploy"
3. Use the webhook URL to trigger deployments programmatically

### Branch Deploys
Enable branch deploys for testing:
1. Site Settings > Build & Deploy > Continuous Deployment
2. Enable "Deploy previews" for pull requests
3. Enable "Branch deploys" for all branches

## Troubleshooting

### Common Issues

**Domain not working**:
- Check DNS propagation (may take 24-48 hours)
- Verify CNAME record is correct
- Ensure no conflicting A records exist

**SSL certificate issues**:
- Wait up to 24 hours for automatic provisioning
- Check domain ownership verification
- Contact Netlify support if certificate fails

**Presentation not loading**:
- Check browser console for JavaScript errors
- Verify all HTML files are properly formatted
- Test in incognito mode to rule out caching

**Build failures**:
- Check deploy logs in Netlify dashboard
- Verify all files are committed to Git
- Ensure no syntax errors in HTML files

### Support Resources
- **Netlify Documentation**: [docs.netlify.com](https://docs.netlify.com)
- **GitHub Support**: [support.github.com](https://support.github.com)
- **DNS Help**: Contact your domain provider

## Success Checklist

- [ ] GitHub repository created and populated
- [ ] Netlify site deployed successfully
- [ ] Custom domain configured and working
- [ ] SSL certificate active and HTTPS forced
- [ ] All presentations load correctly
- [ ] Navigation and interactivity working
- [ ] Mobile responsiveness verified
- [ ] Automatic deployments functioning

## Next Steps

1. **Test all presentations** thoroughly on different devices
2. **Share URLs** with stakeholders and faculty
3. **Monitor analytics** through Netlify dashboard
4. **Regular updates** as platform evolves
5. **Backup strategy** for presentation content

---

**Deployment Complete**: Your PBL Toolkit presentations are now live at `pnltoolkitpresentation.professordtreku.com`

For questions or support: Prof. Daniel Treku (dtreku@wpi.edu)