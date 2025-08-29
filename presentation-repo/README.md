# PBL Toolkit Presentations

**🎓 Worcester Polytechnic Institute | Department of Information Systems & Fintech**

[![Netlify Status](https://api.netlify.com/api/v1/badges/placeholder/deploy-status)](https://pnltoolkitpresentation.professordtreku.com)

## Overview

This repository contains presentation materials for the Pivot-and-Launch Project-Based Learning Toolkit platform. The presentations are deployed as static HTML files and accessible at [pnltoolkitpresentation.professordtreku.com](https://pnltoolkitpresentation.professordtreku.com).

**Main Platform**: [PNLToolkit.professordtreku.com](https://PNLToolkit.professordtreku.com)

## Available Presentations

### 1. Deployment Success Presentation
**File**: `deployment-success-presentation.html`  
**URL**: [/deployment-success-presentation.html](https://pnltoolkitpresentation.professordtreku.com/deployment-success-presentation.html)  
**Purpose**: Comprehensive overview of successful platform deployment  
**Audience**: Administrators, faculty, stakeholders

### 2. Research-Enhanced Slide Deck
**File**: `research-enhanced-slide-deck.html`  
**URL**: [/research-enhanced-slide-deck.html](https://pnltoolkitpresentation.professordtreku.com/research-enhanced-slide-deck.html)  
**Purpose**: Detailed research methodology and implementation  
**Audience**: Academic researchers, educational technologists

### 3. General Overview
**File**: `slide-deck.html`  
**URL**: [/slide-deck.html](https://pnltoolkitpresentation.professordtreku.com/slide-deck.html)  
**Purpose**: Platform introduction and feature overview  
**Audience**: General audiences

### 4. Content Summary
**File**: `slide-content.html`  
**URL**: [/slide-content.html](https://pnltoolkitpresentation.professordtreku.com/slide-content.html)  
**Purpose**: Essential content and capability overview  
**Audience**: Faculty and educators

## Quick Access Links

- **Homepage**: [pnltoolkitpresentation.professordtreku.com](https://pnltoolkitpresentation.professordtreku.com)
- **Main Presentation**: [/presentation](https://pnltoolkitpresentation.professordtreku.com/presentation) (redirects to deployment success)
- **Research Focus**: [/research](https://pnltoolkitpresentation.professordtreku.com/research) (redirects to research deck)
- **Overview**: [/overview](https://pnltoolkitpresentation.professordtreku.com/overview) (redirects to general deck)

## Deployment

### Netlify Configuration
- **Build Command**: None (static HTML files)
- **Publish Directory**: `.` (root directory)
- **Custom Domain**: `pnltoolkitpresentation.professordtreku.com`
- **SSL**: Automatically configured

### GitHub Repository Setup
1. Create new repository: `PNLToolkitPresentation`
2. Copy presentation files to repository
3. Connect to Netlify for automatic deployments
4. Configure custom domain in Netlify settings

### DNS Configuration
Add CNAME record for subdomain:
```
Type: CNAME
Name: pnltoolkitpresentation
Value: [netlify-site-name].netlify.app
```

## File Structure

```
presentation-repo/
├── index.html                           # Homepage with presentation links
├── deployment-success-presentation.html # Main deployment presentation
├── research-enhanced-slide-deck.html    # Research-focused presentation
├── slide-deck.html                      # General overview presentation
├── slide-content.html                   # Content summary presentation
├── netlify.toml                         # Netlify configuration
└── README.md                            # This file
```

## Features

### WPI Branding
- **Primary Colors**: Crimson Red (#dc143c), Navy Blue (#1e3a8a)
- **Supporting Colors**: White, Light Grey, Dark Grey
- **Professional Design**: Gradients, animations, responsive layout

### Navigation
- **Keyboard Support**: Arrow keys for slide navigation
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Smooth Transitions**: CSS animations and transitions
- **Interactive Elements**: Hover effects and button states

### Security & Performance
- **Security Headers**: XSS protection, content security policy
- **Caching**: Optimized cache headers for performance
- **Redirects**: SEO-friendly URL redirects
- **SSL**: Automatic HTTPS encryption

## Usage Guidelines

### For Presentations
1. **Full-Screen Mode**: Press F11 for best presentation experience
2. **Navigation**: Use arrow keys or on-screen buttons
3. **Mobile Support**: Presentations work on all devices
4. **Printing**: Use browser print function for handouts

### For Sharing
- **Direct Links**: Share specific presentation URLs
- **QR Codes**: Generate QR codes for easy mobile access
- **Embedding**: Presentations can be embedded in other sites
- **Offline Access**: Download HTML files for offline use

## Updates and Maintenance

### Content Updates
1. Edit HTML files directly in repository
2. Push changes to GitHub main branch
3. Netlify automatically deploys updates
4. Changes are live within minutes

### Adding New Presentations
1. Create new HTML file in repository
2. Follow existing design patterns and WPI branding
3. Update `index.html` to include new presentation link
4. Add redirect rules to `netlify.toml` if needed

## Support

### Technical Issues
- **Repository**: GitHub Issues for presentation bugs
- **Hosting**: Netlify support for deployment issues
- **Domain**: DNS provider support for domain configuration

### Content Questions
- **Contact**: Prof. Daniel Treku (dtreku@wpi.edu)
- **Platform**: [PNLToolkit.professordtreku.com](https://PNLToolkit.professordtreku.com)
- **Documentation**: See main platform documentation

## License

**Educational Use License** - Copyright (c) 2025 Daniel Treku, Worcester Polytechnic Institute

These presentation materials are licensed for educational use only at accredited institutions.

---

**Built for Worcester Polytechnic Institute**  
*Department of Information Systems & Fintech*  
*Revolutionizing project-based learning through research-validated methodologies*