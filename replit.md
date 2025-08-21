# PBL Pedagogy Tool - Pivot-and-Launch Project-Based Learning Platform

## Overview

This is a full-stack web application that provides a comprehensive toolkit for implementing project-based learning using the Pivot-and-Launch methodology. The platform helps faculty create, manage, and optimize educational projects while preventing information overload through curated, focused content delivery.

## User Preferences

Preferred communication style: Simple, everyday language.
Focus areas: Knowledge Integrations (not AI), Fintech, Information Systems, and Data Science.

## Recent Changes

### January 23, 2025
- **Research Integration:** Reshaped platform based on comprehensive PNL research report
- **Pivot Assets Module:** Created research-based core knowledge anchoring system
- **Cognitive Load Analytics:** Implemented Paas/Leppink measurement framework for learning optimization
- **Enhanced Schema:** Added tables for pivot cards, worked examples, retrieval activities, and cognitive load tracking
- **Transfer-Focused Design:** Implemented progressive context variation (near → moderate → far transfer)
- **Information Overload Mitigation:** Added attention budgeting and triage systems
- **Load-Aware Materials:** Applied cognitive load theory principles throughout platform
- **Spaced Retrieval System:** Integrated evidence-based retention practices
- **Research Documentation:** Created comprehensive implementation guide linking theory to practice
- **Document Management System:** Completed comprehensive document upload and management with object storage integration
- **Interdisciplinary Expansion:** Added project templates and examples for humanities (literature, history, philosophy), physical sciences (biochemistry, chemistry, biology), visual arts, and mathematics
- **Enhanced Navigation:** Added Document Manager to sidebar navigation with proper routing
- Fixed critical SelectItem component errors and enhanced platform stability

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API with conventional HTTP methods
- **Middleware**: Custom logging middleware for API requests
- **Error Handling**: Centralized error handling with status codes

### Project Structure
```
├── client/          # Frontend React application
├── server/          # Backend Express.js application
├── shared/          # Shared TypeScript types and schemas
└── migrations/      # Database migration files
```

## Key Components

### Database Layer
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless)
- **Schema Location**: `shared/schema.ts` - centralized schema definitions
- **Connection**: Connection pooling with `@neondatabase/serverless`

### API Structure
The application follows a resource-based API structure:
- `/api/faculty` - Faculty management endpoints
- `/api/projects` - Project CRUD operations
- `/api/templates` - Project template management
- `/api/contributions` - Student collaboration features
- `/api/knowledge-base` - Institutional content library
- `/api/analytics` - Usage analytics and reporting

### Authentication & Authorization
Currently configured for development with session-based approach using:
- `connect-pg-simple` for PostgreSQL session storage
- Faculty-based access control (single-tenant per faculty member)

### Core Domain Models
1. **Faculty** - User profiles with institutional information
2. **Projects** - PBL projects with pivot concepts and launch applications
3. **ProjectTemplates** - Reusable project frameworks by discipline
4. **StudentContributions** - Collaborative feedback and suggestions
5. **KnowledgeBase** - Institutional content and resources
6. **ObjectiveConversions** - Learning objective transformations
7. **AnalyticsEvents** - Usage tracking and metrics

## Data Flow

### Request Flow
1. Client makes request through React Query
2. API client (`lib/api.ts`) handles HTTP communication
3. Express routes validate and process requests
4. Storage layer (`server/storage.ts`) manages database operations
5. Drizzle ORM executes type-safe SQL queries
6. Response flows back through the same chain

### State Management
- **Server State**: TanStack Query manages caching, loading states, and mutations
- **Client State**: React hooks for local component state
- **Form State**: React Hook Form with Zod validation schemas

### Real-time Features
- Session-based state persistence
- Optimistic updates for better user experience
- Background refetching for data consistency

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless** - PostgreSQL serverless driver
- **drizzle-orm** & **drizzle-kit** - Database ORM and migration tools
- **@tanstack/react-query** - Server state management
- **@hookform/resolvers** & **zod** - Form validation
- **@radix-ui/** - Accessible UI components
- **tailwindcss** - Utility-first CSS framework

### Development Tools
- **tsx** - TypeScript execution for development
- **esbuild** - Fast JavaScript bundler for production
- **@replit/vite-plugin-runtime-error-modal** - Development error handling

### UI Component System
The application uses a comprehensive design system based on:
- Shadcn/ui component library
- Custom PBL-specific color palette (crimson, professional blue, gold amber)
- Anti-overload design principles built into components
- Responsive design with mobile-first approach

## Deployment Strategy

### Build Process
- **Development**: `npm run dev` - Uses tsx for hot reloading
- **Production Build**: `npm run build` - Vite builds client, esbuild bundles server
- **Database**: `npm run db:push` - Applies schema changes to database

### Environment Configuration
- **DATABASE_URL** - PostgreSQL connection string (required)
- **NODE_ENV** - Environment mode (development/production)
- **REPL_ID** - Replit-specific configuration for development tools

### Production Deployment
- Client assets built to `dist/public`
- Server bundle created in `dist/index.js`
- Static file serving handled by Express in production
- Database migrations managed through Drizzle Kit

### Development Environment
- Vite dev server with HMR for frontend
- Express server with automatic TypeScript compilation
- Integrated error overlay for development debugging
- Replit-specific development banner and tools