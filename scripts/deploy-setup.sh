#!/bin/bash

# Pivot-and-Launch PBL Toolkit - GitHub & Netlify Deployment Setup
# This script helps automate the GitHub repository setup and provides deployment guidance

echo "🎓 Pivot-and-Launch PBL Toolkit - Deployment Setup"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}Initializing Git repository...${NC}"
    git init
    echo "✅ Git initialized"
else
    echo "✅ Git repository already exists"
fi

# Check if .gitignore exists
if [ ! -f ".gitignore" ]; then
    echo -e "${YELLOW}Creating .gitignore file...${NC}"
    cat > .gitignore << EOF
# Dependencies
node_modules/
npm-debug.log*

# Environment variables
.env
.env.local
.env.production

# Build outputs
dist/
build/

# IDE files
.vscode/
.idea/

# OS files
.DS_Store
Thumbs.db

# Logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Database
*.db
*.sqlite

# Cache
.cache/
EOF
    echo "✅ .gitignore created"
fi

echo ""
echo -e "${BLUE}Next Steps for GitHub & Netlify Deployment:${NC}"
echo ""

echo "1. 📁 Create GitHub Repository"
echo "   - Go to: https://github.com/new"
echo "   - Repository name: Pivot-N-Launch"
echo "   - Description: Pivot-and-Launch Project-Based Learning Pedagogy Toolkit"
echo "   - Make it Public for educational sharing"
echo ""

echo "2. 🔗 Connect Local Repository to GitHub"
echo "   Run these commands in your terminal:"
echo ""
echo -e "${GREEN}   git add .${NC}"
echo -e "${GREEN}   git commit -m \"Initial commit: PBL Pedagogy Toolkit\"${NC}"
echo -e "${GREEN}   git branch -M main${NC}"
echo -e "${GREEN}   git remote add origin https://github.com/dtreku/Pivot-N-Launch.git${NC}"
echo -e "${GREEN}   git push -u origin main${NC}"
echo ""

echo "3. 🌐 Deploy to Netlify"
echo "   - Go to: https://app.netlify.com"
echo "   - Click \"New site from Git\""
echo "   - Connect your GitHub account"
echo "   - Select your repository"
echo "   - Build settings:"
echo "     • Build command: npm run build"
echo "     • Publish directory: dist/public"
echo "     • Functions directory: netlify/functions"
echo ""

echo "4. ⚙️ Configure Environment Variables in Netlify"
echo "   Go to Site settings > Environment variables and add:"
echo ""
echo -e "${YELLOW}   DATABASE_URL${NC}=your_postgresql_connection_string"
echo -e "${YELLOW}   SESSION_SECRET${NC}=your_secure_random_string"
echo -e "${YELLOW}   NODE_ENV${NC}=production"
echo ""
echo "   Generate SESSION_SECRET with:"
echo -e "${GREEN}   node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"${NC}"
echo ""

echo "5. 🌍 Set Up Custom Domain (PNLToolkit.professordtreku.com)"
echo "   - In Netlify: Site settings > Domain management"
echo "   - Add custom domain: PNLToolkit.professordtreku.com"
echo "   - Configure DNS with your domain provider:"
echo "     • Type: CNAME"
echo "     • Name: PNLToolkit"
echo "     • Value: [your-netlify-site].netlify.app"
echo ""

echo "6. 🗄️ Set Up Cloud Database"
echo "   Recommended providers:"
echo "   - Neon (https://neon.tech) - Free PostgreSQL"
echo "   - Supabase (https://supabase.com) - Free PostgreSQL"
echo "   - Railway (https://railway.app) - PostgreSQL hosting"
echo ""

echo "7. 🌱 Seed Database"
echo "   After deployment, visit your site and run:"
echo -e "${GREEN}   curl -X POST https://PNLToolkit.professordtreku.com/api/seed${NC}"
echo ""

echo "8. 🔑 First Login"
echo "   Admin accounts (default password: admin123):"
echo "   - Super Admin: Prof. Daniel Treku (dtreku@wpi.edu)"
echo "   - Admin: Prof. Kristin Wobbe (kwobbe@wpi.edu)"
echo "   - Admin: Prof. Kimberly LeChasseur (kalechasseur@wpi.edu)"
echo ""
echo -e "${RED}   ⚠️  Change passwords immediately after first login!${NC}"
echo ""

echo "📚 For detailed instructions, see DEPLOYMENT.md"
echo ""
echo "🎉 Ready to revolutionize project-based learning!"