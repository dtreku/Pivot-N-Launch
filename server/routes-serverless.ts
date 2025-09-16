// Serverless-compatible routes for Netlify Functions
import type { Express } from "express";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import session from "express-session";
import connectPg from "connect-pg-simple";

export async function registerRoutes(app: Express) {
  // Configure session middleware for serverless
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
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
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.session?.facultyId) {
      return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
  };

  // Middleware to require admin role
  const requireAdmin = (req: any, res: any, next: any) => {
    if (req.session?.role === 'super_admin' || req.session?.role === 'admin') {
      return next();
    }
    return res.status(403).json({ message: "Admin access required" });
  };
  // Seed endpoint for database initialization - ADMIN ONLY
  app.post('/api/seed', requireAuth, requireAdmin, async (req, res) => {
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

      res.json({
        success: true,
        message: "Database seeded successfully",
        users: createdUsers.map(u => ({ name: u.name, email: u.email, role: u.role }))
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

  // Authentication endpoints
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

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

      // Create session
      (req.session as any).facultyId = faculty.id;
      (req.session as any).role = faculty.role;
      (req.session as any).name = faculty.name;
      (req.session as any).email = faculty.email;

      await storage.updateLastLogin(faculty.id);

      res.json({
        success: true,
        faculty: {
          id: faculty.id,
          name: faculty.name,
          email: faculty.email,
          role: faculty.role,
          status: faculty.status
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

  // Export toolkit endpoint - Enhanced with instructor data
  app.get('/api/export/toolkit', async (req, res) => {
    try {
      const facultyId = (req.session as any)?.facultyId;
      const includeInstructorData = req.query.includeInstructor === 'true';
      
      // Require auth only for instructor-specific exports
      if (includeInstructorData && !facultyId) {
        return res.status(401).json({ message: "Authentication required for instructor data export" });
      }
      
      // Base toolkit data
      const exportData = {
        platform: "PBL Toolkit",
        version: "1.0.0",
        exported_at: new Date().toISOString(),
        export_type: includeInstructorData ? "instructor_custom" : "general",
        features: [
          "Methodology Wizard",
          "Learning Objectives Converter", 
          "Document Manager",
          "Student Collaboration",
          "Analytics Dashboard",
          "Knowledge Base",
          "Pivot Assets",
          "Project Templates"
        ]
      };

      // If instructor data requested, include their content
      if (includeInstructorData && facultyId) {
        try {
          // Get instructor's projects
          const projects = await storage.getProjectsByFaculty(facultyId);
          
          // Get instructor's knowledge base
          const knowledgeBase = await storage.getKnowledgeBaseByFaculty(facultyId);
          
          // Get instructor's document uploads
          const documents = await storage.getDocumentUploadsByFaculty(facultyId);
          
          // Add instructor-specific data
          exportData.instructor_data = {
            faculty_id: facultyId,
            projects: projects.map(p => ({
              id: p.id,
              title: p.title,
              description: p.description,
              discipline: p.discipline,
              status: p.status,
              created_at: p.createdAt
            })),
            knowledge_base_entries: knowledgeBase.length,
            documents_uploaded: documents.length,
            total_content_items: projects.length + knowledgeBase.length + documents.length
          };
        } catch (error) {
          console.error("Error fetching instructor data:", error);
          // Continue with basic export if instructor data fails
        }
      }
      
      res.setHeader('Content-Type', 'application/json');
      const filename = includeInstructorData ? 
        `pbl-toolkit-instructor-${new Date().toISOString().split('T')[0]}.json` :
        `pbl-toolkit-general-${new Date().toISOString().split('T')[0]}.json`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.json(exportData);
    } catch (error) {
      console.error("Export toolkit error:", error);
      res.status(500).json({ message: "Failed to export toolkit" });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return app;
}