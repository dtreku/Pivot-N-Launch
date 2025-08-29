# Pivot-and-Launch PBL Pedagogy Toolkit

**🎓 A comprehensive project-based learning platform revolutionizing education through research-validated methodologies**

[![Deploy Status](https://api.netlify.com/api/v1/badges/placeholder/deploy-status)](https://PNLToolkit.professordtreku.com)
[![License](https://img.shields.io/badge/License-Educational%20Use-blue.svg)](LICENSE)

**Live Platform**: [PNLToolkit.professordtreku.com](https://PNLToolkit.professordtreku.com)

## 🌟 Overview

The Pivot-and-Launch PBL Toolkit is a cutting-edge educational platform that implements research-validated project-based learning methodologies. Built for educators, institutions, and students worldwide, it provides comprehensive tools for creating, managing, and optimizing PBL experiences while preventing cognitive overload through advanced analytics.

### 🎯 Key Features

**🔐 Multi-Role Authentication System**
- Secure registration with admin approval workflow
- Role-based access control (Super Admin, Admin, Instructor, Student)
- Multi-admin management for institutional governance

**📚 Comprehensive Project Management**
- Pivot-and-Launch methodology implementation
- Cross-disciplinary project templates (Fintech, Data Science, Humanities, Physical Sciences)
- Real-time collaboration tools and team management
- Progress tracking and analytics dashboard

**🧠 Cognitive Load Analytics**
- Research-based cognitive load measurement (Paas/Leppink framework)
- Attention budgeting and information triage systems
- Load-aware material delivery and spaced retrieval integration
- Transfer-focused design (near → moderate → far transfer)

**🔬 Research-Backed Pedagogy**
- Evidence-based learning optimization
- Progressive context variation for enhanced outcomes
- Institutional knowledge base integration
- Document management with secure object storage

## Quick Start

### Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up your database and environment variables (copy `.env.example` to `.env`)
4. Run database migrations: `npm run db:push`
5. Start the development server: `npm run dev`
6. Visit `http://localhost:5000`

### Admin Access

Three admin accounts are pre-configured:
- **Super Admin**: Prof. Daniel Treku (dtreku@wpi.edu)
- **Admin**: Prof. Kathy Wobbe (kwobbe@wpi.edu)  
- **Admin**: Prof. Kristen Alecha-Sseur (kalechasseur@wpi.edu)

*Default password: `admin123` (change immediately after first login)*

### Public Registration

New users can register directly through the platform with automatic admin approval workflow.

## 🌐 Production Deployment

The platform is deployed at **[PNLToolkit.professordtreku.com](https://PNLToolkit.professordtreku.com)** with:

- ✅ Automated deployments via GitHub Actions
- ✅ SSL certificate and custom domain configuration
- ✅ Serverless functions for backend API
- ✅ Cloud database with automated backups
- ✅ Performance monitoring and analytics

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for complete deployment instructions including custom domain setup.

### Environment Variables

```
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_secure_random_string
NODE_ENV=production
```

## 🛠️ Technology Stack

**Frontend**
- React 18 with TypeScript
- Tailwind CSS + Shadcn/ui components
- TanStack Query for state management
- Wouter for client-side routing

**Backend**
- Express.js with TypeScript
- PostgreSQL with Drizzle ORM
- Session-based authentication with bcryptjs
- RESTful API architecture

**Infrastructure**
- Netlify hosting with Functions
- GitHub Actions CI/CD pipeline
- Cloud PostgreSQL (Neon/Supabase)
- Custom domain with SSL encryption

## Documentation

- [Deployment Guide](DEPLOYMENT.md) - Complete deployment instructions
- [replit.md](replit.md) - Technical architecture and development notes

## Research Foundation

This platform is based on comprehensive research in project-based learning methodology, specifically implementing the Pivot-and-Launch framework with:

- Cognitive load theory principles
- Information overload mitigation strategies
- Evidence-based retention practices
- Progressive transfer learning design

## 🤝 Contributing

We welcome contributions from educators, developers, and researchers:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support & Contact

- **Platform Issues**: Create a GitHub issue
- **Educational Support**: Contact Prof. Daniel Treku (dtreku@wpi.edu)
- **Technical Questions**: See documentation or open a discussion

## 🎓 Educational Focus Areas

- **Knowledge Integrations** (not AI)
- **Fintech and Financial Technology**
- **Information Systems**
- **Data Science and Analytics**
- **Interdisciplinary Project Design**

## License

**Educational Use License** - Copyright (c) 2025 Daniel Treku (dtreku@wpi.edu)

This software is licensed for educational use only. All rights reserved.

**Permitted Uses:**
- Use in accredited educational institutions
- Non-commercial educational activities
- Academic research and educational content creation
- Sharing with educators for non-commercial purposes

**Prohibited:**
- Commercial use or distribution
- Modifications or derivative works
- Use in commercial educational products

**Attribution Required:** Must credit Daniel Treku in all uses.

For commercial licensing: dtreku@wpi.edu

---

**Built with ❤️ for educators by Prof. Daniel Treku and the WPI Educational Technology Team**

*Revolutionizing project-based learning through research-validated methodologies and cutting-edge technology.*