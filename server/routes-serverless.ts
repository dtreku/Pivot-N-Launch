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
  // Seed endpoint for database initialization
  app.post('/api/seed', async (req, res) => {
    try {
      console.log("Seeding database with admin accounts...");

      // Create admin accounts
      const adminAccounts = [
        {
          email: "dtreku@wpi.edu",
          name: "Prof. Daniel Treku",
          password: await bcrypt.hash("admin123", 10),
          role: "super_admin",
          status: "approved",
          title: "Professor of Information Systems and Fintech",
          department: "Information Systems and Fintech",
          bio: "Information systems and fintech professor and collaborative faculty in the data science program. Expert in Pivot-and-Launch pedagogy and cognitive load management.",
          expertise: ["Blockchain", "Fintech", "Data Science", "Information Systems", "Knowledge Integrations", "Project-Based Learning"]
        },
        {
          email: "kwobbe@wpi.edu", 
          name: "Prof. Kristin Wobbe",
          password: await bcrypt.hash("admin123", 10),
          role: "admin",
          status: "approved",
          title: "Professor of Mathematical Sciences",
          department: "Mathematical Sciences",
          bio: "Professor specializing in applied mathematics and data science education.",
          expertise: ["Applied Mathematics", "Data Science", "Statistical Analysis", "Project-Based Learning"]
        },
        {
          email: "kalechasseur@wpi.edu",
          name: "Prof. Kimberly LeChasseur",
          password: await bcrypt.hash("admin123", 10),
          role: "admin",
          status: "approved", 
          title: "Professor of Engineering Education",
          department: "Engineering Education",
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
        password: hashedPassword,
        title,
        department,
        bio,
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

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return app;
}