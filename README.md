# PBL Pedagogy Tool - Pivot-and-Launch Project-Based Learning Platform

A comprehensive toolkit for implementing project-based learning using the research-validated Pivot-and-Launch methodology. This platform helps educators create, manage, and optimize educational projects while preventing information overload through curated, focused content delivery.

## Features

- **Instructor Authentication**: Role-based access control with super admin and instructor roles
- **Team Management**: Create and manage student teams and project collaborations
- **Cognitive Load Analytics**: Research-based learning optimization using Paas/Leppink measurement framework
- **Project Templates**: Pre-built templates for multiple disciplines (Fintech, Information Systems, Data Science, Humanities, Physical Sciences)
- **Document Management**: Secure file upload and management with object storage integration
- **Transfer-Focused Design**: Progressive context variation for enhanced learning outcomes

## Quick Start

### Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up your database and environment variables (copy `.env.example` to `.env`)
4. Run database migrations: `npm run db:push`
5. Start the development server: `npm run dev`
6. Visit `http://localhost:5000`

### Super Admin Access

Default credentials (change after first login):
- Email: `dtreku@wpi.edu`
- Password: `admin123`

## Deployment

This platform is designed for deployment on Netlify with GitHub integration.

### Quick Deploy

1. Run the deployment script: `./scripts/deploy.sh`
2. Follow the prompts to set up your GitHub repository
3. Connect to Netlify and configure environment variables
4. See `DEPLOYMENT.md` for detailed instructions

### Environment Variables

```
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_secure_random_string
NODE_ENV=production
```

## Architecture

- **Frontend**: React with TypeScript, TailwindCSS, and Shadcn/ui components
- **Backend**: Node.js Express server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based with bcryptjs password hashing
- **Deployment**: Netlify serverless functions with GitHub Actions CI/CD

## Documentation

- [Deployment Guide](DEPLOYMENT.md) - Complete deployment instructions
- [replit.md](replit.md) - Technical architecture and development notes

## Research Foundation

This platform is based on comprehensive research in project-based learning methodology, specifically implementing the Pivot-and-Launch framework with:

- Cognitive load theory principles
- Information overload mitigation strategies
- Evidence-based retention practices
- Progressive transfer learning design

## Support

For technical issues or access problems, contact the super admin at `dtreku@wpi.edu`.

## License

Educational use license - see institution policies for commercial use.