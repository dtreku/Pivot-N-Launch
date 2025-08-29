#!/bin/bash

echo "🚀 PBL Pedagogy Tool - Deployment Script"
echo "========================================"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📝 Initializing Git repository..."
    git init
    echo "✅ Git initialized"
fi

# Add all files
echo "📁 Adding files to Git..."
git add .

# Commit changes
echo "💾 Committing changes..."
read -p "Enter commit message (or press Enter for default): " commit_msg
if [ -z "$commit_msg" ]; then
    commit_msg="Deploy PBL Pedagogy Tool with authentication system"
fi
git commit -m "$commit_msg"

# Check if remote origin exists
if git remote get-url origin &>/dev/null; then
    echo "📤 Pushing to existing repository..."
    git push
else
    echo "🔗 No remote repository found."
    echo "Please create a repository on GitHub and run:"
    echo "git remote add origin https://github.com/dtreku/Pivot-N-Launch.git"
    echo "git branch -M main"
    echo "git push -u origin main"
fi

echo ""
echo "📋 Next Steps for Netlify Deployment:"
echo "1. Go to https://app.netlify.com"
echo "2. Click 'New site from Git'"
echo "3. Connect your GitHub repository"
echo "4. Set build settings:"
echo "   - Build command: npm run build"
echo "   - Publish directory: dist/public"
echo "5. Add environment variables in Site Settings:"
echo "   - DATABASE_URL (your PostgreSQL connection string)"
echo "   - SESSION_SECRET (generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\")"
echo "   - NODE_ENV=production"
echo "6. After deployment, visit your-site.netlify.app/api/seed to create the super admin"
echo "7. Login with dtreku@wpi.edu / admin123"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"
echo "✅ Deployment preparation complete!"
