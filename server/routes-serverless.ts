// Serverless-compatible routes for Netlify Functions
import type { Express } from "express";

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}
import { storage } from "./storage";
import { z } from "zod";
import bcrypt from "bcryptjs";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { 
  insertFacultySchema,
  insertProjectSchema,
  insertStudentContributionSchema,
  insertKnowledgeBaseSchema,
  insertObjectiveConversionSchema,
  insertSurveyResponseSchema,
  insertAnalyticsEventSchema,
  insertDocumentUploadSchema,
  insertTeamSchema
} from "@shared/schema";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import OpenAI from "openai";
import { encryptApiKey, decryptApiKey, isApiKeyEncrypted } from "./crypto";
// Temporarily commented out GitHub service to fix build issues
// TODO: Re-enable after resolving esbuild dependency issues
// import { getUserRepositories, parseGitHubUrl, GitHubDeploymentService, type GitHubUpdateFile } from "./github-service";

// Import database connection for serverless database operations
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Helper function for error handling
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

async function registerRoutes(app: Express) {
  // Override storage validateCredentials to use static bcrypt import for serverless
  const originalValidateCredentials = storage.validateCredentials.bind(storage);
  storage.validateCredentials = async (email: string, password: string) => {
    try {
      console.log("Serverless validateCredentials called for:", email);
      const user = await storage.getFacultyByEmail(email);
      console.log("User found:", !!user, "has password:", !!user?.passwordHash);
      
      if (!user || !user.passwordHash) {
        console.log("No user or password hash found");
        return null;
      }
      
      console.log("Comparing password with hash length:", user.passwordHash.length);
      const isValid = await bcrypt.compare(password, user.passwordHash);
      console.log("Password comparison result:", isValid);
      return isValid ? user : null;
    } catch (error) {
      console.error("Serverless validateCredentials error:", error);
      return null;
    }
  };

  // Configure session middleware for serverless
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  // Use SESSION_SECRET or generate a warning with fallback
  const sessionSecret = process.env.SESSION_SECRET || 'pbl-toolkit-fallback-session-key-2025';
  
  if (!process.env.SESSION_SECRET) {
    console.warn('⚠️  WARNING: SESSION_SECRET not set. Using fallback key. Set SESSION_SECRET environment variable for production security.');
  }

  app.use(session({
    secret: sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  }));

  // Middleware to check if user is authenticated
  const requireAuth = async (req: any, res: any, next: any) => {
    if (!req.session?.facultyId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const faculty = await storage.getFaculty(req.session.facultyId);
      if (!faculty || !faculty.isActive || faculty.status !== 'approved') {
        return res.status(401).json({ message: "Faculty account inactive or not approved" });
      }

      req.user = faculty;
      next();
    } catch (error) {
      return res.status(500).json({ message: "Authentication error" });
    }
  };

  // Middleware to check admin access (super_admin or admin)
  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.user || !['super_admin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  // Middleware to check super admin access
  const requireSuperAdmin = (req: any, res: any, next: any) => {
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({ message: "Super admin access required" });
    }
    next();
  };

  // Middleware to check if user is approved
  const requireApproved = (req: any, res: any, next: any) => {
    if (req.user?.status !== 'approved') {
      return res.status(403).json({ message: "Account pending approval" });
    }
    next();
  };

  // Database initialization endpoint - creates tables (NO AUTH REQUIRED for first setup)
  app.post('/api/init-db', async (req, res) => {
    try {
      console.log("Initializing database tables...");
      
      // Create tables using raw SQL since Drizzle push isn't available in serverless
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "faculty" (
          "id" serial PRIMARY KEY NOT NULL,
          "name" varchar(255) NOT NULL,
          "email" varchar(255) NOT NULL UNIQUE,
          "password_hash" varchar(255),
          "role" varchar(50) DEFAULT 'instructor' NOT NULL,
          "status" varchar(50) DEFAULT 'pending' NOT NULL,
          "is_active" boolean DEFAULT true NOT NULL,
          "title" varchar(255) NOT NULL,
          "department" varchar(255) NOT NULL,
          "institution" varchar(255) NOT NULL,
          "photo_url" text,
          "bio" text,
          "expertise" jsonb DEFAULT '[]',
          "team_id" integer,
          "last_login_at" timestamp,
          "approved_by" integer,
          "approved_at" timestamp,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS "sessions" (
          "sid" varchar PRIMARY KEY,
          "sess" jsonb NOT NULL,
          "expire" timestamp NOT NULL
        );
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" ("expire");
      `);

      // Create project_templates table (CRITICAL for template system) - MATCH ACTUAL SCHEMA
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "project_templates" (
          "id" serial PRIMARY KEY NOT NULL,
          "name" varchar(255) NOT NULL,
          "description" text NOT NULL,
          "discipline" varchar(100) NOT NULL,
          "category" varchar(100) NOT NULL,
          "template" jsonb NOT NULL,
          "icon" varchar(100),
          "color" varchar(50),
          "estimated_duration" varchar(50),
          "difficulty_level" varchar(50) DEFAULT 'intermediate',
          "is_active" boolean DEFAULT true,
          "created_by" integer,
          "status" varchar(50) DEFAULT 'pending' NOT NULL,
          "approved_by" integer,
          "approved_at" timestamp,
          "is_featured" boolean DEFAULT false,
          "created_at" timestamp DEFAULT now() NOT NULL
        );
      `);

      // Create other essential tables
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "projects" (
          "id" serial PRIMARY KEY NOT NULL,
          "title" varchar(255) NOT NULL,
          "description" text NOT NULL,
          "faculty_id" integer NOT NULL,
          "template_id" integer,
          "pivot_concept" text NOT NULL,
          "launch_application" text NOT NULL,
          "learning_objectives" jsonb DEFAULT '[]',
          "deliverables" jsonb DEFAULT '[]',
          "status" varchar(50) DEFAULT 'active' NOT NULL,
          "start_date" date,
          "end_date" date,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS "student_contributions" (
          "id" serial PRIMARY KEY NOT NULL,
          "project_id" integer NOT NULL,
          "student_name" varchar(255) NOT NULL,
          "student_email" varchar(255) NOT NULL,
          "contribution_type" varchar(100) NOT NULL,
          "content" text NOT NULL,
          "status" varchar(50) DEFAULT 'pending' NOT NULL,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL
        );
      `);

      console.log("All database tables created successfully (including project_templates)");
      
      res.json({
        success: true,
        message: "Database initialized successfully"
      });
      
    } catch (error) {
      console.error("Database initialization error:", error);
      res.status(500).json({
        success: false,
        message: "Database initialization failed",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Seed endpoint for database initialization - SUPER ADMIN ONLY
  app.post('/api/seed', requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      console.log("Seeding database with admin accounts...");

      // Create admin accounts
      const adminAccounts = [
        {
          email: "dtreku@wpi.edu",
          name: "Prof. Daniel Treku",
          passwordHash: await bcrypt.hash("admin123", 10),
          role: "super_admin",
          status: "approved",
          title: "Professor of Information Systems and Fintech",
          department: "Information Systems and Fintech",
          institution: "Worcester Polytechnic Institute",
          bio: "Information systems and fintech professor and collaborative faculty in the data science program. Expert in Pivot-and-Launch pedagogy and cognitive load management.",
          expertise: ["Blockchain", "Fintech", "Data Science", "Information Systems", "Knowledge Integrations", "Project-Based Learning"]
        },
        {
          email: "kwobbe@wpi.edu", 
          name: "Prof. Kristin Wobbe",
          passwordHash: await bcrypt.hash("admin123", 10),
          role: "admin",
          status: "approved",
          title: "Professor of Mathematical Sciences",
          department: "Mathematical Sciences",
          institution: "Worcester Polytechnic Institute",
          bio: "Professor specializing in applied mathematics and data science education.",
          expertise: ["Applied Mathematics", "Data Science", "Statistical Analysis", "Project-Based Learning"]
        },
        {
          email: "kalechasseur@wpi.edu",
          name: "Prof. Kimberly LeChasseur",
          passwordHash: await bcrypt.hash("admin123", 10),
          role: "admin",
          status: "approved", 
          title: "Professor of Engineering Education",
          department: "Engineering Education",
          institution: "Worcester Polytechnic Institute",
          bio: "Professor focused on innovative engineering education methodologies and pedagogy.",
          expertise: ["Engineering Education", "Pedagogy", "Curriculum Design", "Project-Based Learning"]
        }
      ];

      // Create each admin account
      const createdUsers = [];
      for (const account of adminAccounts) {
        try {
          const user = await storage.createFaculty(account);
          createdUsers.push(user);
          console.log(`Created user: ${account.name} (${account.email})`);
        } catch (error) {
          console.log(`User ${account.email} might already exist, skipping...`);
        }
      }

      // Create default project templates
      console.log("Creating project templates...");
      const templates = [
        {
          name: "Blockchain Applications",
          description: "Smart contract development with real-world use cases",
          discipline: "Blockchain",
          category: "Development",
          template: {
            phases: ["Research", "Design", "Development", "Testing", "Deployment"],
            deliverables: ["Smart Contract", "Documentation", "Test Cases"],
            tools: ["Solidity", "Remix", "Web3"],
          },
          icon: "fas fa-cubes",
          color: "#DC143C",
          estimatedDuration: "8-12 weeks",
          difficultyLevel: "intermediate",
          status: "approved",
          isActive: true
        },
        {
          name: "Data Science",
          description: "Real-world data analysis and machine learning projects",
          discipline: "Data Science",
          category: "Analysis",
          template: {
            phases: ["Data Collection", "Exploration", "Modeling", "Validation", "Presentation"],
            deliverables: ["Dataset", "Analysis Report", "ML Model", "Visualizations"],
            tools: ["Python", "Jupyter", "Pandas", "Scikit-learn"],
          },
          icon: "fas fa-chart-bar",
          color: "#1E3A8A",
          estimatedDuration: "6-10 weeks",
          difficultyLevel: "intermediate",
          status: "approved",
          isActive: true
        },
        {
          name: "Fintech Solutions",
          description: "Financial technology innovation projects",
          discipline: "Fintech",
          category: "Innovation",
          template: {
            phases: ["Market Research", "Solution Design", "Prototype", "Testing", "Launch"],
            deliverables: ["Business Plan", "Prototype", "Security Analysis", "User Testing"],
            tools: ["APIs", "Mobile Dev", "Security Tools"],
          },
          icon: "fas fa-money-bill-wave",
          color: "#F59E0B",
          estimatedDuration: "10-14 weeks",
          difficultyLevel: "advanced",
          status: "approved",
          isActive: true
        },
        {
          name: "Business Strategy",
          description: "Strategic planning and implementation projects",
          discipline: "Business",
          category: "Strategy",
          template: {
            phases: ["Analysis", "Strategy Development", "Planning", "Implementation", "Evaluation"],
            deliverables: ["SWOT Analysis", "Strategic Plan", "Implementation Roadmap"],
            tools: ["Analytics Tools", "Project Management", "Presentation Software"],
          },
          icon: "fas fa-briefcase",
          color: "#10B981",
          estimatedDuration: "4-8 weeks",
          difficultyLevel: "beginner",
          status: "approved",
          isActive: true
        },
        {
          name: "Biochemistry Lab Investigation",
          description: "Protein analysis and enzyme kinetics research projects",
          discipline: "Biochemistry",
          category: "Laboratory",
          template: {
            phases: ["Literature Review", "Experimental Design", "Data Collection", "Analysis", "Research Report"],
            deliverables: ["Research Proposal", "Lab Protocols", "Data Analysis", "Scientific Paper"],
            tools: ["Spectrophotometry", "Chromatography", "Statistical Software", "Lab Notebooks"],
          },
          icon: "fas fa-flask",
          color: "#059669",
          estimatedDuration: "10-14 weeks",
          difficultyLevel: "advanced",
          status: "approved",
          isActive: true
        },
        {
          name: "Literary Analysis & Cultural Context",
          description: "Comparative literature analysis with historical and cultural perspectives",
          discipline: "Literature",
          category: "Research",
          template: {
            phases: ["Text Selection", "Contextual Research", "Critical Analysis", "Comparative Study", "Thesis Writing"],
            deliverables: ["Annotated Bibliography", "Critical Essays", "Comparative Analysis", "Research Thesis"],
            tools: ["Digital Archives", "Citation Management", "Text Analysis Software", "Presentation Tools"],
          },
          icon: "fas fa-book-open",
          color: "#7C3AED",
          estimatedDuration: "8-12 weeks",
          difficultyLevel: "intermediate",
          status: "approved",
          isActive: true
        },
        {
          name: "Historical Research Project",
          description: "Primary source investigation and historical narrative construction",
          discipline: "History",
          category: "Research",
          template: {
            phases: ["Topic Selection", "Source Collection", "Source Analysis", "Narrative Construction", "Presentation"],
            deliverables: ["Research Proposal", "Primary Source Portfolio", "Historical Analysis", "Digital Exhibition"],
            tools: ["Digital Archives", "Timeline Software", "GIS Mapping", "Multimedia Tools"],
          },
          icon: "fas fa-scroll",
          color: "#B45309",
          estimatedDuration: "6-10 weeks",
          difficultyLevel: "intermediate",
          status: "approved",
          isActive: true
        },
        {
          name: "Visual Arts & Design Thinking",
          description: "Creative problem-solving through artistic expression and design principles",
          discipline: "Visual Arts",
          category: "Creative",
          template: {
            phases: ["Inspiration Gathering", "Concept Development", "Prototyping", "Refinement", "Exhibition"],
            deliverables: ["Mood Board", "Concept Sketches", "Final Artwork", "Artist Statement", "Portfolio"],
            tools: ["Digital Art Software", "3D Modeling", "Photography", "Presentation Platforms"],
          },
          icon: "fas fa-palette",
          color: "#EC4899",
          estimatedDuration: "6-8 weeks",
          difficultyLevel: "beginner",
          status: "approved",
          isActive: true
        },
        {
          name: "Mathematical Modeling & Real-World Applications",
          description: "Applied mathematics projects solving practical problems",
          discipline: "Mathematics",
          category: "Analysis",
          template: {
            phases: ["Problem Identification", "Model Development", "Mathematical Analysis", "Validation", "Application"],
            deliverables: ["Problem Statement", "Mathematical Model", "Analysis Report", "Software Implementation"],
            tools: ["MATLAB", "Python", "Wolfram Alpha", "Graphing Software"],
          },
          icon: "fas fa-square-root-alt",
          color: "#1F2937",
          estimatedDuration: "8-10 weeks",
          difficultyLevel: "advanced",
          status: "approved",
          isActive: true
        }
      ];

      // Insert templates directly via SQL since we don't have storage.createProjectTemplate in serverless
      let templatesCreated = 0;
      for (const template of templates) {
        try {
          await pool.query(`
            INSERT INTO project_templates (
              name, description, discipline, category, template, icon, color,
              estimated_duration, difficulty_level, status, is_active, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (name) DO NOTHING
          `, [
            template.name,
            template.description,
            template.discipline,
            template.category,
            JSON.stringify(template.template),
            template.icon,
            template.color,
            template.estimatedDuration,
            template.difficultyLevel,
            template.status,
            template.isActive,
            new Date()
          ]);
          templatesCreated++;
          console.log(`Created template: ${template.name}`);
        } catch (error) {
          console.log(`Template ${template.name} might already exist, skipping...`);
        }
      }

      res.json({
        success: true,
        message: "Database seeded successfully",
        users: createdUsers.map(u => ({ name: u.name, email: u.email, role: u.role })),
        templatesCreated
      });

    } catch (error) {
      console.error("Error seeding database:", error);
      res.status(500).json({
        success: false,
        message: "Error seeding database",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Simple test endpoint to verify routing
  app.get('/api/test/hello', (req, res) => {
    res.json({ 
      message: "Hello from production!", 
      timestamp: new Date().toISOString(),
      environment: "serverless"
    });
  });

  // Test endpoint to check database connection
  app.get('/api/test/faculty', async (req, res) => {
    try {
      const faculty = await storage.getFacultyByEmail('dtreku@wpi.edu');
      res.json({
        found: !!faculty,
        email: faculty?.email,
        role: faculty?.role,
        status: faculty?.status,
        hasPasswordHash: !!faculty?.passwordHash,
        passwordHashLength: faculty?.passwordHash?.length
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // Authentication endpoints
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Use regular authentication flow
      const faculty = await storage.validateCredentials(email, password);
      if (!faculty) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check if user is approved
      if (faculty.status !== 'approved') {
        return res.status(401).json({ 
          message: faculty.status === 'pending' ? 
            "Your account is pending approval" : 
            "Your account has been rejected"
        });
      }

      // Create simple session ID for serverless compatibility
      const sessionId = `session_${faculty.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Update last login
      try {
        await storage.updateLastLogin(faculty.id);
      } catch (loginUpdateError) {
        console.warn("Could not update last login:", loginUpdateError);
        // Don't fail login if this fails
      }

      res.json({
        sessionId: sessionId,
        faculty: {
          id: faculty.id,
          name: faculty.name,
          email: faculty.email,
          role: faculty.role,
          title: faculty.title,
          department: faculty.department,
          institution: faculty.institution
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session?.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Error logging out" });
      }
      res.json({ success: true });
    });
  });

  app.get('/api/auth/me', requireAuth, async (req, res) => {
    try {
      const faculty = await storage.getFaculty((req.session as any).facultyId);
      if (!faculty) {
        return res.status(404).json({ message: "Faculty not found" });
      }
      res.json(faculty);
    } catch (error) {
      console.error("Get faculty error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Registration endpoint
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { name, email, password, title, department, bio, expertise } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email, and password are required" });
      }

      // Check if user already exists
      const existingFaculty = await storage.getFacultyByEmail(email);
      if (existingFaculty) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new faculty with pending status
      const newFaculty = await storage.createFaculty({
        name,
        email,
        passwordHash: hashedPassword,
        title: title || "Instructor",
        department: department || "General",
        institution: "Worcester Polytechnic Institute",
        bio: bio || "",
        expertise: expertise || [],
        role: "instructor",
        status: "pending"
      });

      res.json({
        success: true,
        message: "Registration submitted successfully. Your account is pending admin approval.",
        faculty: {
          id: newFaculty.id,
          name: newFaculty.name,
          email: newFaculty.email,
          status: newFaculty.status
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin endpoints for user management
  app.get('/api/admin/pending-users', requireAuth, requireAdmin, async (req, res) => {
    try {
      const pendingUsers = await storage.getPendingFaculty();
      res.json(pendingUsers);
    } catch (error) {
      console.error("Get pending users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/admin/approve-user/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const adminId = (req.session as any).facultyId;
      
      const approvedUser = await storage.approveFaculty(userId, adminId);
      if (!approvedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ success: true, user: approvedUser });
    } catch (error) {
      console.error("Approve user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/admin/reject-user/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      const rejectedUser = await storage.rejectFaculty(userId);
      if (!rejectedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ success: true, user: rejectedUser });
    } catch (error) {
      console.error("Reject user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Analytics presentation endpoint
  app.get('/api/analytics/presentation', async (req, res) => {
    try {
      // Generate a basic analytics presentation report
      const presentationHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PBL Analytics Presentation</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #DC143C; text-align: center; margin-bottom: 30px; }
        h2 { color: #1E3A8A; border-bottom: 2px solid #1E3A8A; padding-bottom: 10px; }
        .metric { background: #f8f9fa; padding: 20px; margin: 20px 0; border-left: 4px solid #DC143C; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric p { margin: 0; color: #666; font-size: 14px; }
        .disclaimer { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin-top: 30px; }
        .footer { text-align: center; margin-top: 40px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Pivot-and-Launch PBL Analytics Report</h1>
        
        <h2>Platform Overview</h2>
        <div class="metric">
            <h3>🚀 Platform Status</h3>
            <p>Your PBL Toolkit is fully operational and ready for educational innovation.</p>
        </div>
        
        <div class="metric">
            <h3>📚 Core Features Available</h3>
            <p>Methodology Wizard ✓ | Learning Objectives Converter ✓ | Document Manager ✓ | Student Collaboration ✓</p>
        </div>
        
        <h2>Recent Activity</h2>
        <div class="metric">
            <h3>🎯 Learning Objectives Converted</h3>
            <p>Transforming traditional objectives into engaging project-based frameworks</p>
        </div>
        
        <div class="metric">
            <h3>🤝 Student Engagement</h3>
            <p>Platform ready for student collaboration and contribution management</p>
        </div>
        
        <div class="disclaimer">
            <strong>Note:</strong> This is a demonstration report showing platform capabilities.
        </div>
        
        <div class="footer">
            Generated by PBL Toolkit Analytics Engine
        </div>
    </div>
</body>
</html>`;
      
      res.setHeader('Content-Type', 'text/html');
      res.send(presentationHtml);
    } catch (error) {
      console.error("Analytics presentation error:", error);
      res.status(500).json({ message: "Failed to generate presentation" });
    }
  });

  // Student contributions endpoints - SECURED
  app.get('/api/contributions', requireAuth, async (req, res) => {
    try {
      const contributions = await storage.getAllStudentContributions();
      res.json(contributions);
    } catch (error) {
      console.error("Get contributions error:", error);
      res.status(500).json({ message: "Failed to fetch contributions" });
    }
  });

  app.post('/api/contributions', requireAuth, async (req, res) => {
    try {
      // Basic validation
      if (!req.body || !req.body.projectId || !req.body.content) {
        return res.status(400).json({ message: "Project ID and content are required" });
      }

      const contribution = await storage.createStudentContribution(req.body);
      res.status(201).json(contribution);
    } catch (error) {
      console.error("Create contribution error:", error);
      res.status(500).json({ message: "Failed to create contribution" });
    }
  });

  app.put('/api/contributions/:id/status', requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const contribution = await storage.updateStudentContributionStatus(id, status);
      
      if (!contribution) {
        return res.status(404).json({ message: "Contribution not found" });
      }
      
      res.json(contribution);
    } catch (error) {
      console.error("Update contribution status error:", error);
      res.status(500).json({ message: "Failed to update contribution status" });
    }
  });

  // Project template endpoints
  // Search templates with filters (MUST come before /:id route)
  app.get('/api/templates/search', async (req, res) => {
    try {
      console.log("Searching templates from serverless...", req.query);
      const { status, discipline, q, featuredOnly, createdBy } = req.query;
      
      let query = `
        SELECT id, name, description, discipline, category, template, 
               icon, color, estimated_duration, difficulty_level, 
               is_active, status, is_featured, created_at
        FROM project_templates 
        WHERE is_active = true
      `;
      
      const params = [];
      let paramIndex = 1;
      
      // Add status filter
      if (status && status !== 'all') {
        query += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      } else {
        // Default to approved templates only
        query += ` AND status = $${paramIndex}`;
        params.push('approved');
        paramIndex++;
      }
      
      // Add discipline filter
      if (discipline && discipline !== 'all') {
        query += ` AND discipline = $${paramIndex}`;
        params.push(discipline);
        paramIndex++;
      }
      
      // Add search query filter
      if (q) {
        query += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
        params.push(`%${q}%`);
        paramIndex++;
      }
      
      // Add featured filter
      if (featuredOnly === 'true') {
        query += ` AND is_featured = true`;
      }
      
      // Add created by filter
      if (createdBy && !isNaN(parseInt(createdBy as string))) {
        query += ` AND created_by = $${paramIndex}`;
        params.push(parseInt(createdBy as string));
        paramIndex++;
      }
      
      query += ` ORDER BY created_at DESC`;
      
      console.log("Executing search query:", query, "with params:", params);
      const result = await pool.query(query, params);
      
      console.log(`Found ${result.rows.length} templates matching search criteria`);
      res.json(result.rows);
    } catch (error) {
      console.error("Error searching templates:", error);
      res.status(500).json({ 
        message: "Failed to search templates", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.get('/api/templates', async (req, res) => {
    try {
      const { discipline } = req.query;
      let templates;
      
      // Treat "all" as no filter, only apply discipline filter for specific disciplines
      if (discipline && typeof discipline === 'string' && discipline !== 'all') {
        templates = await storage.getProjectTemplatesByDiscipline(discipline);
      } else {
        templates = await storage.getProjectTemplates();
      }
      
      res.json(templates);
    } catch (error) {
      console.error("Get templates error:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.get('/api/templates/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getProjectTemplate(id);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Get template error:", error);
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });

  app.post('/api/templates', requireAuth, async (req, res) => {
    try {
      // Basic validation for template creation
      if (!req.body || !req.body.title || !req.body.discipline) {
        return res.status(400).json({ message: "Title and discipline are required" });
      }

      const template = await storage.createProjectTemplate(req.body);
      res.status(201).json(template);
    } catch (error) {
      console.error("Create template error:", error);
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  // Export toolkit endpoint with multiple format support  
  app.get('/api/export/toolkit', async (req, res) => {
    try {
      const format = req.query.format as string || 'json';
      const currentDate = new Date().toISOString().split('T')[0];
      
      // Comprehensive PBL Toolkit for Instructors
      const toolkitData = {
        title: "Pivot-and-Launch PBL Pedagogy Toolkit",
        subtitle: "Complete Implementation Guide for Instructors",
        version: "1.0.0",
        exported_at: new Date().toISOString(),
        
        methodology_overview: {
          title: "The Pivot-and-Launch Approach",
          description: "Transform traditional learning objectives into engaging, real-world project experiences",
          core_principles: [
            "Pivot Concepts: Essential knowledge anchors providing foundational understanding",
            "Launch Applications: Real-world contexts where students apply their learning",
            "Cognitive Load Management: Prevent information overload through structured delivery",
            "Progressive Transfer: Near → Moderate → Far transfer contexts",
            "Assessment Integration: Authentic evaluation aligned with project outcomes"
          ]
        },
        
        implementation_framework: {
          phase_1: {
            title: "Pivot Phase (Weeks 1-3)",
            description: "Establish core knowledge anchors",
            activities: [
              "Define essential concepts students must master",
              "Create foundational knowledge materials",
              "Design scaffolded practice exercises",
              "Establish assessment criteria for core concepts"
            ]
          },
          phase_2: {
            title: "Launch Phase (Weeks 4-8)", 
            description: "Apply knowledge in authentic contexts",
            activities: [
              "Design real-world application scenarios",
              "Create project briefs with clear stakeholder needs",
              "Facilitate student team formation",
              "Provide ongoing coaching and feedback"
            ]
          },
          phase_3: {
            title: "Integration Phase (Weeks 9-12)",
            description: "Transfer learning to new contexts",
            activities: [
              "Present novel application challenges",
              "Facilitate peer review and critique",
              "Support student reflection on learning",
              "Assess both process and product outcomes"
            ]
          }
        },
        
        cognitive_load_strategies: {
          title: "Managing Cognitive Load",
          techniques: [
            "Chunking: Break complex tasks into manageable segments",
            "Scaffolding: Provide temporary support structures",
            "Worked Examples: Demonstrate problem-solving processes",
            "Spaced Practice: Distribute learning over time",
            "Retrieval Practice: Regular low-stakes testing"
          ],
          attention_budgeting: [
            "Limit new information to 3-5 key points per session",
            "Use visual organizers to reduce working memory load",
            "Provide clear navigation and progress indicators",
            "Eliminate extraneous cognitive load from materials"
          ]
        },
        
        assessment_strategies: {
          formative_assessment: [
            "Regular check-ins during project development",
            "Peer feedback sessions using structured protocols",
            "Self-reflection prompts tied to learning objectives",
            "Progress monitoring through milestone reviews"
          ],
          summative_assessment: [
            "Authentic performance tasks aligned with real-world standards",
            "Portfolio-based evaluation of learning progression",
            "Stakeholder presentation with external evaluation",
            "Transfer task demonstrating application to new contexts"
          ],
          rubric_design: [
            "Clearly defined performance levels (novice to expert)",
            "Observable behaviors and measurable outcomes",
            "Integration of both process and product criteria",
            "Alignment with stated learning objectives"
          ]
        },
        
        technology_integration: {
          platform_features: [
            "Methodology Wizard: Step-by-step project setup guidance",
            "Learning Objectives Converter: Transform traditional goals to PBL format", 
            "Student Collaboration Portal: Facilitate peer interaction and feedback",
            "Document Manager: Organize and share course materials",
            "Analytics Dashboard: Track student engagement and progress",
            "Knowledge Base: Build institutional content library",
            "Pivot Assets: Create and manage core concept materials"
          ],
          best_practices: [
            "Start with simple tools and gradually add complexity",
            "Ensure technology supports rather than dominates learning",
            "Provide clear tutorials and support for students",
            "Regular backup and version control of project materials"
          ]
        },
        
        troubleshooting_guide: {
          common_challenges: [
            {
              issue: "Students struggle with open-ended projects",
              solution: "Provide more scaffolding in the Pivot phase; create intermediate checkpoints"
            },
            {
              issue: "Cognitive overload in complex projects", 
              solution: "Break projects into smaller phases; use attention budgeting techniques"
            },
            {
              issue: "Uneven group participation",
              solution: "Implement individual accountability measures; rotate group roles"
            },
            {
              issue: "Difficulty with authentic assessment",
              solution: "Use external stakeholders; create realistic project constraints"
            }
          ]
        },
        
        quick_start_checklist: [
          "□ Define your Pivot: Identify essential knowledge students must acquire",
          "□ Design your Launch: Create authentic application contexts", 
          "□ Plan Assessment: Develop rubrics for process and product evaluation",
          "□ Set Up Platform: Configure methodology wizard with your parameters",
          "□ Create Materials: Upload key documents and pivot assets",
          "□ Test Workflow: Run through the complete process yourself",
          "□ Launch Pilot: Start with a small group to refine approach",
          "□ Iterate and Improve: Use student feedback to enhance the experience"
        ],
        
        support_resources: {
          professional_development: [
            "WPI Project-Based Learning Institute workshops",
            "PBL Community of Practice meetings", 
            "Online training modules and video tutorials",
            "Peer mentoring network connections"
          ],
          technical_support: [
            "Platform help documentation",
            "Live chat support during business hours",
            "Email support: dtreku@wpi.edu",
            "Community forums for instructor questions"
          ]
        },
        
        generated_by: "WPI Pivot-and-Launch PBL Platform",
        platform_url: "https://pnltoolkit.professordtreku.com",
        contact: "For additional support, contact your instructional designer or visit the help documentation"
      };

      // Generate content based on format
      if (format === 'text') {
        const textContent = generateTextContent(toolkitData);
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="pbl-toolkit-instructor-guide-${currentDate}.txt"`);
        res.send(textContent);
      } else if (format === 'word') {
        const htmlContent = generateHTMLContent(toolkitData);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="pbl-toolkit-instructor-guide-${currentDate}.html"`);
        res.send(htmlContent);
      } else if (format === 'pdf') {
        const htmlContent = generateHTMLContent(toolkitData);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="pbl-toolkit-instructor-guide-${currentDate}.html"`);
        res.send(htmlContent);
      } else {
        // Default to JSON for backward compatibility
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="pbl-toolkit-instructor-guide-${currentDate}.json"`);
        res.json(toolkitData);
      }
    } catch (error) {
      console.error("Export toolkit error:", error);
      res.status(500).json({ message: "Failed to export toolkit" });
    }
  });

  // Helper function to generate text content
  function generateTextContent(data: any): string {
    let content = `${data.title}\n${data.subtitle}\nVersion: ${data.version}\nExported: ${data.exported_at}\n\n`;
    
    content += `${'='.repeat(60)}\n`;
    content += `${data.methodology_overview.title.toUpperCase()}\n`;
    content += `${'='.repeat(60)}\n\n`;
    content += `${data.methodology_overview.description}\n\n`;
    content += `Core Principles:\n`;
    data.methodology_overview.core_principles.forEach((principle: string, index: number) => {
      content += `${index + 1}. ${principle}\n`;
    });
    
    content += `\n${'='.repeat(60)}\n`;
    content += `IMPLEMENTATION FRAMEWORK\n`;
    content += `${'='.repeat(60)}\n\n`;
    
    // Implementation phases
    Object.values(data.implementation_framework).forEach((phase: any) => {
      content += `${phase.title}\n`;
      content += `${'-'.repeat(phase.title.length)}\n`;
      content += `${phase.description}\n\n`;
      content += `Activities:\n`;
      phase.activities.forEach((activity: string) => {
        content += `• ${activity}\n`;
      });
      content += `\n`;
    });
    
    content += `${'='.repeat(60)}\n`;
    content += `COGNITIVE LOAD STRATEGIES\n`;
    content += `${'='.repeat(60)}\n\n`;
    content += `${data.cognitive_load_strategies.title}\n\n`;
    content += `Techniques:\n`;
    data.cognitive_load_strategies.techniques.forEach((technique: string) => {
      content += `• ${technique}\n`;
    });
    content += `\nAttention Budgeting:\n`;
    data.cognitive_load_strategies.attention_budgeting.forEach((item: string) => {
      content += `• ${item}\n`;
    });
    
    content += `\n${'='.repeat(60)}\n`;
    content += `ASSESSMENT STRATEGIES\n`;
    content += `${'='.repeat(60)}\n\n`;
    content += `Formative Assessment:\n`;
    data.assessment_strategies.formative_assessment.forEach((item: string) => {
      content += `• ${item}\n`;
    });
    content += `\nSummative Assessment:\n`;
    data.assessment_strategies.summative_assessment.forEach((item: string) => {
      content += `• ${item}\n`;
    });
    content += `\nRubric Design:\n`;
    data.assessment_strategies.rubric_design.forEach((item: string) => {
      content += `• ${item}\n`;
    });
    
    content += `\n${'='.repeat(60)}\n`;
    content += `TECHNOLOGY INTEGRATION\n`;
    content += `${'='.repeat(60)}\n\n`;
    content += `Platform Features:\n`;
    data.technology_integration.platform_features.forEach((feature: string) => {
      content += `• ${feature}\n`;
    });
    content += `\nBest Practices:\n`;
    data.technology_integration.best_practices.forEach((practice: string) => {
      content += `• ${practice}\n`;
    });
    
    content += `\n${'='.repeat(60)}\n`;
    content += `TROUBLESHOOTING GUIDE\n`;
    content += `${'='.repeat(60)}\n\n`;
    data.troubleshooting_guide.common_challenges.forEach((challenge: any, index: number) => {
      content += `${index + 1}. Issue: ${challenge.issue}\n`;
      content += `   Solution: ${challenge.solution}\n\n`;
    });
    
    content += `${'='.repeat(60)}\n`;
    content += `QUICK START CHECKLIST\n`;
    content += `${'='.repeat(60)}\n\n`;
    data.quick_start_checklist.forEach((item: string) => {
      content += `${item}\n`;
    });
    
    content += `\n${'='.repeat(60)}\n`;
    content += `SUPPORT RESOURCES\n`;
    content += `${'='.repeat(60)}\n\n`;
    content += `Professional Development:\n`;
    data.support_resources.professional_development.forEach((resource: string) => {
      content += `• ${resource}\n`;
    });
    content += `\nTechnical Support:\n`;
    data.support_resources.technical_support.forEach((support: string) => {
      content += `• ${support}\n`;
    });
    
    content += `\n${'='.repeat(60)}\n`;
    content += `Generated by: ${data.generated_by}\n`;
    content += `Platform: ${data.platform_url}\n`;
    content += `Contact: ${data.contact}\n`;
    
    return content;
  }

  // Helper function to generate HTML content for Word/PDF
  function generateHTMLContent(data: any): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title}</title>
    <style>
        body { 
            font-family: 'Times New Roman', serif; 
            line-height: 1.6; 
            margin: 40px; 
            color: #333;
            max-width: 800px;
        }
        h1 { 
            color: #2c3e50; 
            border-bottom: 3px solid #3498db; 
            padding-bottom: 15px; 
            text-align: center;
            font-size: 24px;
        }
        h2 { 
            color: #34495e; 
            margin-top: 40px; 
            border-bottom: 2px solid #ecf0f1;
            padding-bottom: 10px;
        }
        h3 { 
            color: #7f8c8d; 
            margin-top: 25px;
        }
        ul { 
            margin-left: 20px; 
            padding-left: 0;
        }
        li { 
            margin-bottom: 8px; 
        }
        .overview { 
            background-color: #f8f9fa; 
            padding: 25px; 
            border-radius: 8px; 
            border-left: 5px solid #3498db;
            margin: 20px 0;
        }
        .phase { 
            margin: 25px 0; 
            padding: 20px; 
            border-left: 4px solid #3498db; 
            background-color: #fdfdfd;
        }
        .checklist { 
            background-color: #e8f5e8; 
            padding: 20px; 
            border-radius: 8px;
            border-left: 5px solid #27ae60;
        }
        .troubleshooting { 
            background-color: #fff3cd; 
            padding: 15px; 
            border-radius: 8px;
            border-left: 5px solid #ffc107;
            margin: 15px 0;
        }
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #ecf0f1;
            text-align: center;
            color: #7f8c8d;
            font-size: 12px;
        }
        @media print {
            body { margin: 20px; }
            .page-break { page-break-before: always; }
        }
    </style>
</head>
<body>
    <h1>${data.title}</h1>
    <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="border: none; margin: 10px 0;">${data.subtitle}</h2>
        <p><strong>Version:</strong> ${data.version} | <strong>Exported:</strong> ${new Date(data.exported_at).toLocaleDateString()}</p>
    </div>
    
    <div class="overview">
        <h2>${data.methodology_overview.title}</h2>
        <p><strong>${data.methodology_overview.description}</strong></p>
        <h3>Core Principles:</h3>
        <ul>
            ${data.methodology_overview.core_principles.map((principle: string) => `<li>${principle}</li>`).join('')}
        </ul>
    </div>
    
    <div class="page-break"></div>
    <h2>Implementation Framework</h2>
    
    ${Object.values(data.implementation_framework).map((phase: any) => `
        <div class="phase">
            <h3>${phase.title}</h3>
            <p><em>${phase.description}</em></p>
            <h4>Activities:</h4>
            <ul>
                ${phase.activities.map((activity: string) => `<li>${activity}</li>`).join('')}
            </ul>
        </div>
    `).join('')}
    
    <div class="page-break"></div>
    <h2>Cognitive Load Strategies</h2>
    <div class="phase">
        <h3>${data.cognitive_load_strategies.title}</h3>
        <h4>Techniques:</h4>
        <ul>
            ${data.cognitive_load_strategies.techniques.map((technique: string) => `<li>${technique}</li>`).join('')}
        </ul>
        <h4>Attention Budgeting:</h4>
        <ul>
            ${data.cognitive_load_strategies.attention_budgeting.map((item: string) => `<li>${item}</li>`).join('')}
        </ul>
    </div>
    
    <h2>Assessment Strategies</h2>
    <div class="phase">
        <h3>Formative Assessment</h3>
        <ul>
            ${data.assessment_strategies.formative_assessment.map((item: string) => `<li>${item}</li>`).join('')}
        </ul>
        <h3>Summative Assessment</h3>
        <ul>
            ${data.assessment_strategies.summative_assessment.map((item: string) => `<li>${item}</li>`).join('')}
        </ul>
        <h3>Rubric Design</h3>
        <ul>
            ${data.assessment_strategies.rubric_design.map((item: string) => `<li>${item}</li>`).join('')}
        </ul>
    </div>
    
    <h2>Technology Integration</h2>
    <div class="phase">
        <h3>Platform Features</h3>
        <ul>
            ${data.technology_integration.platform_features.map((feature: string) => `<li>${feature}</li>`).join('')}
        </ul>
        <h3>Best Practices</h3>
        <ul>
            ${data.technology_integration.best_practices.map((practice: string) => `<li>${practice}</li>`).join('')}
        </ul>
    </div>
    
    <div class="page-break"></div>
    <h2>Troubleshooting Guide</h2>
    ${data.troubleshooting_guide.common_challenges.map((challenge: any, index: number) => `
        <div class="troubleshooting">
            <h4>${index + 1}. Issue: ${challenge.issue}</h4>
            <p><strong>Solution:</strong> ${challenge.solution}</p>
        </div>
    `).join('')}
    
    <h2>Quick Start Checklist</h2>
    <div class="checklist">
        <ul style="list-style-type: none; margin-left: 0;">
            ${data.quick_start_checklist.map((item: string) => `<li style="margin-bottom: 10px;">${item}</li>`).join('')}
        </ul>
    </div>
    
    <h2>Support Resources</h2>
    <div class="phase">
        <h3>Professional Development</h3>
        <ul>
            ${data.support_resources.professional_development.map((resource: string) => `<li>${resource}</li>`).join('')}
        </ul>
        <h3>Technical Support</h3>
        <ul>
            ${data.support_resources.technical_support.map((support: string) => `<li>${support}</li>`).join('')}
        </ul>
    </div>
    
    <div class="footer">
        <p><strong>Generated by:</strong> ${data.generated_by}</p>
        <p><strong>Platform:</strong> <a href="${data.platform_url}">${data.platform_url}</a></p>
        <p>${data.contact}</p>
    </div>
</body>
</html>`;
  }

  // Add comprehensive project templates endpoint
  app.post('/api/templates/seed-comprehensive', async (req, res) => {
    try {
      // Data Science PBL Template based on user's detailed example
      const dataSciengeTemplate = {
        name: "Data Science Pivot-and-Launch Framework",
        description: "Comprehensive 12-week data science PBL using Big Idea methodology with video game market analysis",
        discipline: "data-science",
        category: "analysis",
        difficultyLevel: "intermediate",
        pivotConcept: "Problem Framing and Stakeholder Analysis",
        launchContext: "Real-world data analysis for business decision-making",
        learningObjectives: [
          "Articulate business problems using Big Idea framework",
          "Perform exploratory data analysis with stakeholder focus",
          "Create actionable recommendations from data insights",
          "Present findings to non-technical audiences"
        ],
        assessmentRubric: "Big Idea (10%) + EDA Quality (25%) + Visual Storytelling (20%) + Reasoning (20%) + Recommendations (15%) + Communication (10%)",
        template: {
          phases: {
            pivot_phase: {
              title: "Pivot Phase (Weeks 1-3): Big Idea and Feedback Studio",
              activities: [
                "Complete Big Idea worksheet on business scenario",
                "Peer feedback sessions on problem clarity and stakeholder relevance",
                "Practice audience-appropriate language and framing decisions",
                "Establish one-sentence Big Idea as reference point"
              ],
              deliverables: [
                "Big Idea worksheet with problem-stakeholder-story-action framework",
                "Peer feedback documentation",
                "Refined problem statement"
              ]
            },
            launch_phase_1: {
              title: "Launch 1 (Weeks 3-6): Video Game Market Analysis",
              activities: [
                "Apply Big Idea to worldwide video game sales dataset",
                "Perform exploratory data analysis guided by stakeholder needs",
                "Create visualizations that support narrative",
                "Develop actionable recommendations"
              ],
              deliverables: [
                "10-12 minute group video presentation",
                "Stakeholder-ready slide deck",
                "EDA brief with data limits and handling strategies"
              ]
            },
            launch_phase_2: {
              title: "Launch 2 (Weeks 6-10): Student-Selected Data Stories",
              activities: [
                "Select own dataset and stakeholder",
                "Repeat Big Idea → EDA → Story → Action workflow", 
                "Transfer methodology to new domain context",
                "Present professional recommendations"
              ],
              deliverables: [
                "Final presentation with stakeholder focus",
                "Data analysis portfolio",
                "Reflection on methodology transfer"
              ]
            }
          },
          cognitive_load_management: [
            "Tools introduced as needed (spreadsheets → Python → SQL)",
            "Big Idea anchors curate EDA choices",
            "Visual organizers for data exploration",
            "Chunked deliverables to prevent overwhelm"
          ],
          assessment_details: {
            framing: "Problem clarity, stakeholder specificity, claim/action alignment (10%)",
            eda_quality: "Data understanding, descriptive statistics, missingness strategy (25%)",
            visual_storytelling: "Chart choice, labeling, narrative support (20%)",
            reasoning: "Hypotheses, feature engineering, inference limits (20%)",
            recommendations: "Stakeholder-relevant actions with risks noted (15%)",
            communication: "Equal participation, professional structure, time discipline (10%)"
          }
        }
      };

      // Blockchain Voting System Template  
      const blockchainTemplate = {
        name: "Blockchain Voting System",
        description: "Smart contract development through practical democratic applications with real-world stakeholder analysis",
        discipline: "blockchain", 
        category: "development",
        difficultyLevel: "advanced",
        pivotConcept: "Decentralized Trust and Consensus Mechanisms",
        launchContext: "Municipal election transparency and security challenges",
        learningObjectives: [
          "Understand blockchain consensus and cryptographic principles",
          "Design secure voting smart contracts",
          "Address real-world deployment challenges",
          "Present technical solutions to non-technical stakeholders"
        ],
        assessmentRubric: "Technical Implementation (30%) + Security Analysis (25%) + Stakeholder Communication (20%) + Real-world Viability (25%)",
        template: {
          phases: {
            pivot_phase: {
              title: "Pivot Phase: Trust and Consensus Foundations",
              activities: [
                "Study cryptographic primitives and hash functions",
                "Analyze consensus mechanisms (PoW, PoS, PBFT)",
                "Understand smart contract security principles",
                "Practice stakeholder problem identification"
              ]
            },
            launch_phase: {
              title: "Launch Phase: Municipal Voting Solution",
              activities: [
                "Partner with local election officials",
                "Design voting smart contract with security features",
                "Create voter interface and verification system",
                "Present solution to election commission"
              ]
            }
          }
        }
      };

      // Knowledge-Driven Data Analysis Template
      const mlDataTemplate = {
        name: "Knowledge-Driven Data Analysis",
        description: "Machine learning integration with real-world business datasets for comprehensive data science education",
        discipline: "data-science",
        category: "analysis", 
        difficultyLevel: "advanced",
        pivotConcept: "Domain Knowledge Integration in ML Pipelines",
        launchContext: "Business intelligence and predictive modeling for industry partners",
        learningObjectives: [
          "Integrate domain expertise into ML model design",
          "Validate model assumptions against business reality",
          "Communicate uncertainty and limitations to stakeholders",
          "Deploy models with appropriate monitoring"
        ],
        assessmentRubric: "Technical Implementation (25%) + Domain Integration (25%) + Model Validation (20%) + Business Communication (20%) + Deployment Strategy (10%)",
        template: {
          phases: {
            pivot_phase: {
              title: "Pivot Phase: Domain Knowledge and ML Fundamentals",
              activities: [
                "Study business domain and stakeholder needs",
                "Learn ML algorithms with business context",
                "Practice feature engineering with domain experts",
                "Understand model interpretability requirements"
              ]
            },
            launch_phase: {
              title: "Launch Phase: Industry Partnership Project",
              activities: [
                "Work with real business datasets and constraints",
                "Build models that address specific business questions",
                "Validate results with domain experts",
                "Present actionable insights to business stakeholders"
              ]
            }
          }
        }
      };

      // Add templates to storage (this would be done through proper storage interface)
      const templates = [dataSciengeTemplate, blockchainTemplate, mlDataTemplate];
      
      res.json({ 
        message: "Comprehensive templates created successfully",
        templates: templates.map(t => ({ name: t.name, discipline: t.discipline })),
        count: templates.length
      });
    } catch (error) {
      console.error("Error creating comprehensive templates:", error);
      res.status(500).json({ message: "Failed to create comprehensive templates" });
    }
  });

  // Faculty management routes
  app.get("/api/faculty/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const faculty = await storage.getFaculty(id);
      
      if (!faculty) {
        return res.status(404).json({ message: "Faculty not found" });
      }
      
      res.json(faculty);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch faculty", error: getErrorMessage(error) });
    }
  });

  app.get("/api/faculty/email/:email", async (req, res) => {
    try {
      const faculty = await storage.getFacultyByEmail(req.params.email);
      if (!faculty) {
        return res.status(404).json({ message: "Faculty not found" });
      }
      res.json(faculty);
    } catch (error) {
      console.error("Error fetching faculty by email:", error);
      res.status(500).json({ message: "Failed to fetch faculty" });
    }
  });

  app.post("/api/faculty", async (req, res) => {
    try {
      const validatedData = insertFacultySchema.parse(req.body);
      const faculty = await storage.createFaculty(validatedData);
      res.status(201).json(faculty);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid faculty data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create faculty", error: getErrorMessage(error) });
    }
  });

  app.put("/api/faculty/:id", async (req, res) => {
    try {
      const faculty = await storage.updateFaculty(parseInt(req.params.id), req.body);
      if (!faculty) {
        return res.status(404).json({ message: "Faculty not found" });
      }
      res.json(faculty);
    } catch (error) {
      console.error("Error updating faculty:", error);
      res.status(500).json({ message: "Failed to update faculty" });
    }
  });

  // Team management routes
  app.get("/api/teams", requireAuth, async (req: any, res) => {
    try {
      const teams = await storage.getTeamsByAdmin(req.session.facultyId);
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.post("/api/teams", requireAuth, async (req: any, res) => {
    try {
      const teamData = { ...req.body, facultyId: req.session.facultyId };
      const team = await storage.createTeam(teamData);
      res.status(201).json(team);
    } catch (error) {
      console.error("Error creating team:", error);
      res.status(500).json({ message: "Failed to create team" });
    }
  });

  app.get("/api/teams/:id/members", requireAuth, async (req, res) => {
    try {
      const members = await storage.getTeamMembers(parseInt(req.params.id));
      res.json(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  // Project management routes
  app.get("/api/projects/faculty/:facultyId", async (req, res) => {
    try {
      const projects = await storage.getProjectsByFaculty(parseInt(req.params.facultyId));
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(parseInt(req.params.id));
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project", error: getErrorMessage(error) });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.updateProject(parseInt(req.params.id), req.body);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      await storage.deleteProject(parseInt(req.params.id));
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // GitHub Integration Routes
  // Contributions routes
  app.get("/api/contributions/project/:projectId", async (req, res) => {
    try {
      const contributions = await storage.getStudentContributionsByProject(parseInt(req.params.projectId));
      res.json(contributions);
    } catch (error) {
      console.error("Error fetching contributions:", error);
      res.status(500).json({ message: "Failed to fetch contributions" });
    }
  });

  app.post("/api/contributions", async (req, res) => {
    try {
      const validatedData = insertStudentContributionSchema.parse(req.body);
      const contribution = await storage.createStudentContribution(validatedData);
      res.status(201).json(contribution);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contribution data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create contribution", error: getErrorMessage(error) });
    }
  });

  app.put("/api/contributions/:id/status", async (req, res) => {
    try {
      const contribution = await storage.updateStudentContributionStatus(
        parseInt(req.params.id),
        req.body.status
      );
      if (!contribution) {
        return res.status(404).json({ message: "Contribution not found" });
      }
      res.json(contribution);
    } catch (error) {
      console.error("Error updating contribution status:", error);
      res.status(500).json({ message: "Failed to update contribution status" });
    }
  });

  // Knowledge base routes
  app.get("/api/knowledge-base/faculty/:facultyId", async (req, res) => {
    try {
      const items = await storage.getKnowledgeBaseByFaculty(parseInt(req.params.facultyId));
      res.json(items);
    } catch (error) {
      console.error("Error fetching knowledge base:", error);
      res.status(500).json({ message: "Failed to fetch knowledge base" });
    }
  });

  app.post("/api/knowledge-base", async (req, res) => {
    try {
      const item = await storage.createKnowledgeBaseEntry(req.body);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating knowledge base item:", error);
      res.status(500).json({ message: "Failed to create knowledge base item" });
    }
  });

  app.get("/api/knowledge-base/search/:facultyId", async (req, res) => {
    try {
      const query = req.query.q as string;
      const category = req.query.category as string;
      const items = await storage.searchKnowledgeBase(
        parseInt(req.params.facultyId),
        query
      );
      res.json(items);
    } catch (error) {
      console.error("Error searching knowledge base:", error);
      res.status(500).json({ message: "Failed to search knowledge base" });
    }
  });

  app.delete("/api/knowledge-base/:id", async (req, res) => {
    try {
      await storage.deleteKnowledgeBaseEntry(parseInt(req.params.id));
      res.json({ message: "Knowledge base item deleted successfully" });
    } catch (error) {
      console.error("Error deleting knowledge base item:", error);
      res.status(500).json({ message: "Failed to delete knowledge base item" });
    }
  });

  // Analytics routes
  app.get("/api/dashboard/stats/:facultyId", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats(parseInt(req.params.facultyId));
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.post("/api/analytics", async (req, res) => {
    try {
      const event = await storage.createAnalyticsEvent(req.body);
      res.status(201).json(event);
    } catch (error) {
      console.error("Error logging analytics:", error);
      res.status(500).json({ message: "Failed to log analytics" });
    }
  });

  app.get("/api/analytics/faculty/:facultyId", async (req, res) => {
    try {
      const events = await storage.getAnalyticsByFaculty(parseInt(req.params.facultyId));
      res.json(events);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Admin user management routes
  app.get("/api/admin/users", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      // TODO: Implement getAllUsers in storage
      res.json([]);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/users/pending", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      // TODO: Implement getPendingUsers in storage
      res.json([]);
    } catch (error) {
      console.error("Error fetching pending users:", error);
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  });

  app.post("/api/admin/users/:id/approve", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      // TODO: Implement approveUser in storage
      res.json({ message: "User approved successfully" });
    } catch (error) {
      console.error("Error approving user:", error);
      res.status(500).json({ message: "Failed to approve user" });
    }
  });

  app.post("/api/admin/users/:id/reject", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      // TODO: Implement rejectUser in storage
      res.json({ message: "User rejected successfully" });
    } catch (error) {
      console.error("Error rejecting user:", error);
      res.status(500).json({ message: "Failed to reject user" });
    }
  });

  app.post("/api/admin/users", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { name, email, password, title, department, institution, role = "instructor" } = req.body;

      if (!name || !email || !password || !title || !department || !institution) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Check if email already exists
      const existingFaculty = await storage.getFacultyByEmail(email);
      if (existingFaculty) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      const facultyData = {
        name,
        email,
        passwordHash,
        role,
        title,
        department,
        institution,
        isActive: true,
        status: "approved"
      };

      const faculty = await storage.createFaculty(facultyData);
      res.status(201).json({
        id: faculty.id,
        name: faculty.name,
        email: faculty.email,
        role: faculty.role,
        status: faculty.status
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Document management routes
  app.get("/api/documents/faculty/:facultyId", async (req, res) => {
    try {
      const documents = await storage.getDocumentUploadsByFaculty(parseInt(req.params.facultyId));
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post("/api/documents/upload-url", async (req, res) => {
    try {
      const { fileName, fileType, fileSize } = req.body;
      // TODO: Implement generateUploadUrl in storage
      const uploadUrl = { uploadURL: `https://example.com/upload/${fileName}` };
      res.json(uploadUrl);
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ message: "Failed to generate upload URL" });
    }
  });

  app.post("/api/documents", async (req, res) => {
    try {
      const document = await storage.createDocumentUpload(req.body);
      res.status(201).json(document);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      
      // Update download count in database if this is a tracked document
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(req.path);
      
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error downloading document:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteDocumentUpload(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document", error: getErrorMessage(error) });
    }
  });

  // Faculty settings routes
  app.get("/api/faculty/:id/settings", requireAuth, async (req, res) => {
    try {
      const facultyId = parseInt(req.params.id);
      
      // Strict authorization check - users can only access their own settings
      if (req.user.id !== facultyId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const faculty = await storage.getFaculty(facultyId);
      if (!faculty) {
        return res.status(404).json({ message: "Faculty not found" });
      }
      
      res.json({
        hasApiKey: !!(faculty.openaiApiKey && faculty.openaiApiKey.length > 0),
        // Never return the actual API key for security
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings", error: getErrorMessage(error) });
    }
  });

  app.put("/api/faculty/:id/api-key", requireAuth, async (req, res) => {
    try {
      const facultyId = parseInt(req.params.id);
      
      // Strict authorization check - users can only update their own API key
      if (req.user.id !== facultyId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Validate request body
      const apiKeySchema = z.object({
        apiKey: z.string().min(20, "API key must be at least 20 characters").regex(/^sk-/, "API key must start with 'sk-'")
      });
      
      const validatedData = apiKeySchema.parse(req.body);
      
      // Encrypt the API key before storing
      const encryptedApiKey = encryptApiKey(validatedData.apiKey);
      await storage.updateFaculty(facultyId, { openaiApiKey: encryptedApiKey });
      
      res.json({ message: "API key updated successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid API key", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update API key", error: getErrorMessage(error) });
    }
  });

  app.delete("/api/faculty/:id/api-key", requireAuth, async (req, res) => {
    try {
      const facultyId = parseInt(req.params.id);
      
      // Strict authorization check - users can only delete their own API key
      if (req.user.id !== facultyId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.updateFaculty(facultyId, { openaiApiKey: null });
      
      res.json({ message: "API key removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove API key", error: getErrorMessage(error) });
    }
  });

  // OpenAI integration routes
  app.post("/api/openai/test", requireAuth, async (req, res) => {
    try {
      // Validate request body
      const testKeySchema = z.object({
        apiKey: z.string().min(20, "API key must be at least 20 characters")
      });
      
      const validatedData = testKeySchema.parse(req.body);
      
      // Test the API key by making a simple request
      const openai = new OpenAI({ apiKey: validatedData.apiKey });
      
      try {
        // Use a very small, inexpensive request to test the key
        await openai.models.list();
        res.json({ valid: true, message: "API key is valid" });
      } catch (openaiError: any) {
        if (openaiError?.status === 401) {
          return res.status(400).json({ valid: false, message: "Invalid API key" });
        }
        throw openaiError;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to test API key", error: getErrorMessage(error) });
    }
  });

  // Search routes
  app.post("/api/search/documents", requireAuth, async (req, res) => {
    try {
      const { query, facultyId } = req.body;
      // TODO: Implement searchDocuments in storage
      const results: any[] = [];
      res.json(results);
    } catch (error) {
      console.error("Error searching documents:", error);
      res.status(500).json({ message: "Failed to search documents" });
    }
  });

  // Integration management routes
  app.get("/api/integrations", requireAuth, async (req, res) => {
    try {
      // TODO: Implement getIntegrations in storage
      const integrations: any[] = [];
      res.json(integrations);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ message: "Failed to fetch integrations" });
    }
  });

  app.post("/api/integrations/connect", requireAuth, async (req, res) => {
    try {
      // TODO: Implement connectIntegration in storage
      const integration = { id: 1, ...req.body };
      res.status(201).json(integration);
    } catch (error) {
      console.error("Error connecting integration:", error);
      res.status(500).json({ message: "Failed to connect integration" });
    }
  });

  app.put("/api/integrations/:id/configure", requireAuth, async (req, res) => {
    try {
      // TODO: Implement configureIntegration in storage
      const integration = { id: parseInt(req.params.id), ...req.body };
      res.json(integration);
    } catch (error) {
      console.error("Error configuring integration:", error);
      res.status(500).json({ message: "Failed to configure integration" });
    }
  });

  app.delete("/api/integrations/:id", requireAuth, async (req, res) => {
    try {
      // TODO: Implement deleteIntegration in storage
      const integrationId = parseInt(req.params.id);
      res.json({ message: "Integration deleted successfully" });
    } catch (error) {
      console.error("Error deleting integration:", error);
      res.status(500).json({ message: "Failed to delete integration" });
    }
  });

  /* TEMPORARILY DISABLED - GitHub routes causing build issues
  app.get('/api/github/repositories', requireAuth, requireAdmin, async (req, res) => {
    try {
      const repositories = await getUserRepositories();
      res.json({ repositories });
    } catch (error) {
      console.error('Error fetching GitHub repositories:', error);
      res.status(500).json({ message: 'Failed to fetch repositories', error: getErrorMessage(error) });
    }
  });*/

  /* TEMPORARILY DISABLED - GitHub deploy route
  app.post('/api/github/deploy', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { repositoryUrl, deploymentMessage } = req.body;
      
      if (!repositoryUrl) {
        return res.status(400).json({ message: 'Repository URL is required' });
      }

      const parsedRepo = parseGitHubUrl(repositoryUrl);
      if (!parsedRepo) {
        return res.status(400).json({ message: 'Invalid GitHub repository URL' });
      }

      const deploymentService = new GitHubDeploymentService(parsedRepo.owner, parsedRepo.repo);
      
      // Read the current routes-serverless.ts file
      const fs = await import('fs/promises');
      const routesServerlessContent = await fs.readFile('server/routes-serverless.ts', 'utf8');
      
      const filesToUpdate: GitHubUpdateFile[] = [
        {
          path: 'server/routes-serverless.ts',
          content: routesServerlessContent,
          message: deploymentMessage || 'Update production routes via PBL Toolkit'
        }
      ];

      const results = await deploymentService.updateMultipleFiles(filesToUpdate);
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      res.json({
        success: failureCount === 0,
        message: `Deployment completed: ${successCount} files updated successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
        results,
        repository: parsedRepo
      });

    } catch (error) {
      console.error('GitHub deployment error:', error);
      res.status(500).json({ message: 'Deployment failed', error: getErrorMessage(error) });
    }
  }); */

  /* TEMPORARILY DISABLED - GitHub deploy-full route
  app.post('/api/github/deploy-full', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { repositoryUrl, deploymentMessage } = req.body;
      
      if (!repositoryUrl) {
        return res.status(400).json({ message: 'Repository URL is required' });
      }

      const parsedRepo = parseGitHubUrl(repositoryUrl);
      if (!parsedRepo) {
        return res.status(400).json({ message: 'Invalid GitHub repository URL' });
      }

      const deploymentService = new GitHubDeploymentService(parsedRepo.owner, parsedRepo.repo);
      
      // Read multiple production files
      const fs = await import('fs/promises');
      const [routesServerlessContent, netlifyTomlContent, netlifyFunctionContent] = await Promise.all([
        fs.readFile('server/routes-serverless.ts', 'utf8'),
        fs.readFile('netlify.toml', 'utf8').catch(() => ''),
        fs.readFile('netlify/functions/server.js', 'utf8').catch(() => '')
      ]);
      
      const filesToUpdate: GitHubUpdateFile[] = [
        {
          path: 'server/routes-serverless.ts',
          content: routesServerlessContent,
          message: deploymentMessage || 'Update production routes with latest changes'
        }
      ];

      // Add netlify.toml if it exists
      if (netlifyTomlContent) {
        filesToUpdate.push({
          path: 'netlify.toml',
          content: netlifyTomlContent,
          message: 'Update Netlify configuration'
        });
      }

      // Add netlify function if it exists
      if (netlifyFunctionContent) {
        filesToUpdate.push({
          path: 'netlify/functions/server.js',
          content: netlifyFunctionContent,
          message: 'Update Netlify function to import routes-serverless.js'
        });
      }

      const results = await deploymentService.updateMultipleFiles(filesToUpdate);
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      res.json({
        success: failureCount === 0,
        message: `Full deployment completed: ${successCount} files updated successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
        results,
        repository: parsedRepo,
        filesDeployed: filesToUpdate.map(f => f.path)
      });

    } catch (error) {
      console.error('GitHub full deployment error:', error);
      res.status(500).json({ message: 'Full deployment failed', error: getErrorMessage(error) });
    }
  }); */

  /* TEMPORARILY DISABLED - GitHub repository info route
  app.get('/api/github/repository/:owner/:repo/info', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { owner, repo } = req.params;
      const deploymentService = new GitHubDeploymentService(owner, repo);
      
      const repoInfo = await deploymentService.getRepositoryInfo();
      if (!repoInfo) {
        return res.status(404).json({ message: 'Repository not found or access denied' });
      }

      res.json(repoInfo);
    } catch (error) {
      console.error('Error fetching repository info:', error);
      res.status(500).json({ message: 'Failed to fetch repository information', error: getErrorMessage(error) });
    }
  }); */

  // TEMPORARY: Unauthenticated template seeding for initial setup
  app.post('/api/seed-templates', async (req, res) => {
    try {
      console.log("Seeding templates without authentication...");

      // Create default project templates
      const templates = [
        {
          name: "Blockchain Applications",
          description: "Smart contract development with real-world use cases",
          discipline: "Blockchain",
          category: "Development",
          template: {
            phases: ["Research", "Design", "Development", "Testing", "Deployment"],
            deliverables: ["Smart Contract", "Documentation", "Test Cases"],
            tools: ["Solidity", "Remix", "Web3"],
          },
          icon: "fas fa-cubes",
          color: "#DC143C",
          estimatedDuration: "8-12 weeks",
          difficultyLevel: "intermediate",
          status: "approved",
          isActive: true
        },
        {
          name: "Data Science",
          description: "Real-world data analysis and machine learning projects",
          discipline: "Data Science",
          category: "Analysis",
          template: {
            phases: ["Data Collection", "Exploration", "Modeling", "Validation", "Presentation"],
            deliverables: ["Dataset", "Analysis Report", "ML Model", "Visualizations"],
            tools: ["Python", "Jupyter", "Pandas", "Scikit-learn"],
          },
          icon: "fas fa-chart-bar",
          color: "#1E3A8A",
          estimatedDuration: "6-10 weeks",
          difficultyLevel: "intermediate",
          status: "approved",
          isActive: true
        },
        {
          name: "Fintech Solutions",
          description: "Financial technology innovation projects",
          discipline: "Fintech",
          category: "Innovation",
          template: {
            phases: ["Market Research", "Solution Design", "Prototype", "Testing", "Launch"],
            deliverables: ["Business Plan", "Prototype", "Security Analysis", "User Testing"],
            tools: ["APIs", "Mobile Dev", "Security Tools"],
          },
          icon: "fas fa-money-bill-wave",
          color: "#F59E0B",
          estimatedDuration: "10-14 weeks",
          difficultyLevel: "advanced",
          status: "approved",
          isActive: true
        },
        {
          name: "Business Strategy",
          description: "Strategic planning and implementation projects",
          discipline: "Business",
          category: "Strategy",
          template: {
            phases: ["Analysis", "Strategy Development", "Planning", "Implementation", "Evaluation"],
            deliverables: ["SWOT Analysis", "Strategic Plan", "Implementation Roadmap"],
            tools: ["Analytics Tools", "Project Management", "Presentation Software"],
          },
          icon: "fas fa-briefcase",
          color: "#10B981",
          estimatedDuration: "4-8 weeks",
          difficultyLevel: "beginner",
          status: "approved",
          isActive: true
        },
        {
          name: "Biochemistry Lab Investigation",
          description: "Protein analysis and enzyme kinetics research projects",
          discipline: "Biochemistry",
          category: "Laboratory",
          template: {
            phases: ["Literature Review", "Experimental Design", "Data Collection", "Analysis", "Research Report"],
            deliverables: ["Research Proposal", "Lab Protocols", "Data Analysis", "Scientific Paper"],
            tools: ["Spectrophotometry", "Chromatography", "Statistical Software", "Lab Notebooks"],
          },
          icon: "fas fa-flask",
          color: "#059669",
          estimatedDuration: "10-14 weeks",
          difficultyLevel: "advanced",
          status: "approved",
          isActive: true
        },
        {
          name: "Literary Analysis & Cultural Context",
          description: "Comparative literature analysis with historical and cultural perspectives",
          discipline: "Literature",
          category: "Research",
          template: {
            phases: ["Text Selection", "Contextual Research", "Critical Analysis", "Comparative Study", "Thesis Writing"],
            deliverables: ["Annotated Bibliography", "Critical Essays", "Comparative Analysis", "Research Thesis"],
            tools: ["Digital Archives", "Citation Management", "Text Analysis Software", "Presentation Tools"],
          },
          icon: "fas fa-book-open",
          color: "#7C3AED",
          estimatedDuration: "8-12 weeks",
          difficultyLevel: "intermediate",
          status: "approved",
          isActive: true
        },
        {
          name: "Historical Research Project",
          description: "Primary source investigation and historical narrative construction",
          discipline: "History",
          category: "Research",
          template: {
            phases: ["Topic Selection", "Source Collection", "Source Analysis", "Narrative Construction", "Presentation"],
            deliverables: ["Research Proposal", "Primary Source Portfolio", "Historical Analysis", "Digital Exhibition"],
            tools: ["Digital Archives", "Timeline Software", "GIS Mapping", "Multimedia Tools"],
          },
          icon: "fas fa-scroll",
          color: "#B45309",
          estimatedDuration: "6-10 weeks",
          difficultyLevel: "intermediate",
          status: "approved",
          isActive: true
        },
        {
          name: "Visual Arts & Design Thinking",
          description: "Creative problem-solving through artistic expression and design principles",
          discipline: "Visual Arts",
          category: "Creative",
          template: {
            phases: ["Inspiration Gathering", "Concept Development", "Prototyping", "Refinement", "Exhibition"],
            deliverables: ["Mood Board", "Concept Sketches", "Final Artwork", "Artist Statement", "Portfolio"],
            tools: ["Digital Art Software", "3D Modeling", "Photography", "Presentation Platforms"],
          },
          icon: "fas fa-palette",
          color: "#EC4899",
          estimatedDuration: "6-8 weeks",
          difficultyLevel: "beginner",
          status: "approved",
          isActive: true
        },
        {
          name: "Mathematical Modeling & Real-World Applications",
          description: "Applied mathematics projects solving practical problems",
          discipline: "Mathematics",
          category: "Analysis",
          template: {
            phases: ["Problem Identification", "Model Development", "Mathematical Analysis", "Validation", "Application"],
            deliverables: ["Problem Statement", "Mathematical Model", "Analysis Report", "Software Implementation"],
            tools: ["MATLAB", "Python", "Wolfram Alpha", "Graphing Software"],
          },
          icon: "fas fa-square-root-alt",
          color: "#1F2937",
          estimatedDuration: "8-10 weeks",
          difficultyLevel: "advanced",
          status: "approved",
          isActive: true
        }
      ];

      // Insert templates directly via SQL
      let templatesCreated = 0;
      for (const template of templates) {
        try {
          await pool.query(`
            INSERT INTO project_templates (
              name, description, discipline, category, template, icon, color,
              estimated_duration, difficulty_level, status, is_active, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (name) DO NOTHING
          `, [
            template.name,
            template.description,
            template.discipline,
            template.category,
            JSON.stringify(template.template),
            template.icon,
            template.color,
            template.estimatedDuration,
            template.difficultyLevel,
            template.status,
            template.isActive,
            new Date()
          ]);
          templatesCreated++;
          console.log(`Created template: ${template.name}`);
        } catch (error) {
          console.log(`Template ${template.name} might already exist, skipping...`);
        }
      }

      res.json({
        success: true,
        message: "Templates seeded successfully",
        templatesCreated
      });

    } catch (error) {
      console.error("Template seeding error:", error);
      res.status(500).json({
        success: false,
        message: "Template seeding failed",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // TEMPORARY: Schema migration endpoint to add missing columns
  app.post('/api/migrate-schema', async (req, res) => {
    try {
      console.log("Running schema migration to add missing columns...");

      // Add missing columns to project_templates table
      await pool.query(`
        ALTER TABLE project_templates 
        ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
      `);

      await pool.query(`
        ALTER TABLE project_templates 
        ADD COLUMN IF NOT EXISTS category varchar(100) NOT NULL DEFAULT 'general';
      `);

      await pool.query(`
        ALTER TABLE project_templates 
        ADD COLUMN IF NOT EXISTS template jsonb NOT NULL DEFAULT '{}'::jsonb;
      `);

      await pool.query(`
        ALTER TABLE project_templates 
        ADD COLUMN IF NOT EXISTS icon varchar(100);
      `);

      await pool.query(`
        ALTER TABLE project_templates 
        ADD COLUMN IF NOT EXISTS color varchar(50);
      `);

      console.log("Schema migration completed successfully");
      
      res.json({
        success: true,
        message: "Schema migration completed successfully - missing columns added"
      });
      
    } catch (error) {
      console.error("Schema migration error:", error);
      res.status(500).json({
        success: false,
        message: "Schema migration failed",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // TEMPORARY: Database reset endpoint to fix production schema
  app.post('/api/reset-templates', async (req, res) => {
    try {
      console.log("Resetting project_templates table with correct schema...");
      
      // Drop existing table (if exists)
      await pool.query(`DROP TABLE IF EXISTS project_templates CASCADE;`);
      console.log("Dropped old project_templates table");
      
      // Create new table with correct schema
      await pool.query(`
        CREATE TABLE "project_templates" (
          "id" serial PRIMARY KEY NOT NULL,
          "name" varchar(255) NOT NULL,
          "description" text NOT NULL,
          "discipline" varchar(100) NOT NULL,
          "category" varchar(100) NOT NULL,
          "template" jsonb NOT NULL,
          "icon" varchar(100),
          "color" varchar(50),
          "estimated_duration" varchar(50),
          "difficulty_level" varchar(50) DEFAULT 'intermediate',
          "is_active" boolean DEFAULT true,
          "created_by" integer,
          "status" varchar(50) DEFAULT 'pending' NOT NULL,
          "approved_by" integer,
          "approved_at" timestamp,
          "is_featured" boolean DEFAULT false,
          "created_at" timestamp DEFAULT now() NOT NULL
        );
      `);
      console.log("Created new project_templates table with correct schema");
      
      // Insert templates
      const templates = [
        {
          name: "Blockchain Applications",
          description: "Smart contract development with real-world use cases",
          discipline: "Blockchain",
          category: "Development",
          template: {
            phases: ["Research", "Design", "Development", "Testing", "Deployment"],
            deliverables: ["Smart Contract", "Documentation", "Test Cases"],
            tools: ["Solidity", "Remix", "Web3"],
          },
          icon: "fas fa-cubes",
          color: "#DC143C",
          estimatedDuration: "8-12 weeks",
          difficultyLevel: "intermediate",
          status: "approved",
          isActive: true
        },
        {
          name: "Data Science",
          description: "Real-world data analysis and machine learning projects",
          discipline: "Data Science",
          category: "Analysis",
          template: {
            phases: ["Data Collection", "Exploration", "Modeling", "Validation", "Presentation"],
            deliverables: ["Dataset", "Analysis Report", "ML Model", "Visualizations"],
            tools: ["Python", "Jupyter", "Pandas", "Scikit-learn"],
          },
          icon: "fas fa-chart-bar",
          color: "#1E3A8A",
          estimatedDuration: "6-10 weeks",
          difficultyLevel: "intermediate",
          status: "approved",
          isActive: true
        },
        {
          name: "Fintech Solutions",
          description: "Financial technology innovation projects",
          discipline: "Fintech",
          category: "Innovation",
          template: {
            phases: ["Market Research", "Solution Design", "Prototype", "Testing", "Launch"],
            deliverables: ["Business Plan", "Prototype", "Security Analysis", "User Testing"],
            tools: ["APIs", "Mobile Dev", "Security Tools"],
          },
          icon: "fas fa-money-bill-wave",
          color: "#F59E0B",
          estimatedDuration: "10-14 weeks",
          difficultyLevel: "advanced",
          status: "approved",
          isActive: true
        },
        {
          name: "Business Strategy",
          description: "Strategic planning and implementation projects",
          discipline: "Business",
          category: "Strategy",
          template: {
            phases: ["Analysis", "Strategy Development", "Planning", "Implementation", "Evaluation"],
            deliverables: ["SWOT Analysis", "Strategic Plan", "Implementation Roadmap"],
            tools: ["Analytics Tools", "Project Management", "Presentation Software"],
          },
          icon: "fas fa-briefcase",
          color: "#10B981",
          estimatedDuration: "4-8 weeks",
          difficultyLevel: "beginner",
          status: "approved",
          isActive: true
        },
        {
          name: "Biochemistry Lab Investigation",
          description: "Protein analysis and enzyme kinetics research projects",
          discipline: "Biochemistry",
          category: "Laboratory",
          template: {
            phases: ["Literature Review", "Experimental Design", "Data Collection", "Analysis", "Research Report"],
            deliverables: ["Research Proposal", "Lab Protocols", "Data Analysis", "Scientific Paper"],
            tools: ["Spectrophotometry", "Chromatography", "Statistical Software", "Lab Notebooks"],
          },
          icon: "fas fa-flask",
          color: "#059669",
          estimatedDuration: "10-14 weeks",
          difficultyLevel: "advanced",
          status: "approved",
          isActive: true
        },
        {
          name: "Literary Analysis & Cultural Context",
          description: "Comparative literature analysis with historical and cultural perspectives",
          discipline: "Literature",
          category: "Research",
          template: {
            phases: ["Text Selection", "Contextual Research", "Critical Analysis", "Comparative Study", "Thesis Writing"],
            deliverables: ["Annotated Bibliography", "Critical Essays", "Comparative Analysis", "Research Thesis"],
            tools: ["Digital Archives", "Citation Management", "Text Analysis Software", "Presentation Tools"],
          },
          icon: "fas fa-book-open",
          color: "#7C3AED",
          estimatedDuration: "8-12 weeks",
          difficultyLevel: "intermediate",
          status: "approved",
          isActive: true
        },
        {
          name: "Historical Research Project",
          description: "Primary source investigation and historical narrative construction",
          discipline: "History",
          category: "Research",
          template: {
            phases: ["Topic Selection", "Source Collection", "Source Analysis", "Narrative Construction", "Presentation"],
            deliverables: ["Research Proposal", "Primary Source Portfolio", "Historical Analysis", "Digital Exhibition"],
            tools: ["Digital Archives", "Timeline Software", "GIS Mapping", "Multimedia Tools"],
          },
          icon: "fas fa-scroll",
          color: "#B45309",
          estimatedDuration: "6-10 weeks",
          difficultyLevel: "intermediate",
          status: "approved",
          isActive: true
        },
        {
          name: "Visual Arts & Design Thinking",
          description: "Creative problem-solving through artistic expression and design principles",
          discipline: "Visual Arts",
          category: "Creative",
          template: {
            phases: ["Inspiration Gathering", "Concept Development", "Prototyping", "Refinement", "Exhibition"],
            deliverables: ["Mood Board", "Concept Sketches", "Final Artwork", "Artist Statement", "Portfolio"],
            tools: ["Digital Art Software", "3D Modeling", "Photography", "Presentation Platforms"],
          },
          icon: "fas fa-palette",
          color: "#EC4899",
          estimatedDuration: "6-8 weeks",
          difficultyLevel: "beginner",
          status: "approved",
          isActive: true
        },
        {
          name: "Mathematical Modeling & Real-World Applications",
          description: "Applied mathematics projects solving practical problems",
          discipline: "Mathematics",
          category: "Analysis",
          template: {
            phases: ["Problem Identification", "Model Development", "Mathematical Analysis", "Validation", "Application"],
            deliverables: ["Problem Statement", "Mathematical Model", "Analysis Report", "Software Implementation"],
            tools: ["MATLAB", "Python", "Wolfram Alpha", "Graphing Software"],
          },
          icon: "fas fa-square-root-alt",
          color: "#1F2937",
          estimatedDuration: "8-10 weeks",
          difficultyLevel: "advanced",
          status: "approved",
          isActive: true
        }
      ];

      let templatesCreated = 0;
      for (const template of templates) {
        await pool.query(`
          INSERT INTO project_templates (
            name, description, discipline, category, template, icon, color,
            estimated_duration, difficulty_level, status, is_active, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          template.name,
          template.description,
          template.discipline,
          template.category,
          JSON.stringify(template.template),
          template.icon,
          template.color,
          template.estimatedDuration,
          template.difficultyLevel,
          template.status,
          template.isActive,
          new Date()
        ]);
        templatesCreated++;
        console.log(`Created template: ${template.name}`);
      }
      
      res.json({
        success: true,
        message: "Database reset complete - templates ready!",
        templatesCreated
      });
      
    } catch (error) {
      console.error("Database reset error:", error);
      res.status(500).json({
        success: false,
        message: "Database reset failed",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // TEMPORARY: Debug endpoint to check production database
  app.get('/api/debug/templates', async (req, res) => {
    try {
      console.log("Debugging templates in production database...");
      
      // Check table structure
      const tableInfo = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'project_templates'
        ORDER BY ordinal_position;
      `);
      
      // Check template count
      const countResult = await pool.query(`SELECT COUNT(*) as count FROM project_templates;`);
      
      // Get a few templates
      const templatesResult = await pool.query(`
        SELECT id, name, description, discipline, category, is_active, status 
        FROM project_templates 
        LIMIT 5;
      `);
      
      res.json({
        success: true,
        tableStructure: tableInfo.rows,
        templateCount: countResult.rows[0].count,
        sampleTemplates: templatesResult.rows
      });
      
    } catch (error) {
      console.error("Debug error:", error);
      res.status(500).json({
        success: false,
        message: "Debug failed",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Add 404 guard for unmatched /api/* paths AFTER all routes are registered
  app.use("/api/*", (_req, res) => res.status(404).json({ message: "API endpoint not found" }));

  return app;
}

// Simple export that should work with esbuild
export default registerRoutes;
