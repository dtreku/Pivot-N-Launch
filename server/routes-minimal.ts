// Minimal serverless routes for Netlify Functions - focusing on core functionality
import type { Express } from "express";
import bcrypt from "bcryptjs";
// Import database connection directly for serverless
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });
import { faculty } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express) {
  
  // Database initialization endpoint - creates tables and seeds data
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

      console.log("Database tables created successfully");
      
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

  // Seed endpoint for database initialization
  app.post('/api/seed', async (req, res) => {
    try {
      console.log("Seeding database with admin accounts...");

      // Create admin accounts with proper schema types
      const adminAccounts = [
        {
          email: "dtreku@wpi.edu",
          name: "Prof. Daniel Treku",
          passwordHash: await bcrypt.hash("admin123", 10),
          role: "super_admin" as const,
          status: "approved" as const,
          title: "Professor of Information Systems and Fintech",
          department: "Information Systems and Fintech",
          institution: "Worcester Polytechnic Institute",
          isActive: true,
          bio: "Information systems and fintech professor and collaborative faculty in the data science program. Expert in Pivot-and-Launch pedagogy and cognitive load management.",
          expertise: ["Blockchain", "Fintech", "Data Science", "Information Systems", "Knowledge Integrations", "Project-Based Learning"]
        },
        {
          email: "kwobbe@wpi.edu", 
          name: "Prof. Kristin Wobbe",
          passwordHash: await bcrypt.hash("admin123", 10),
          role: "admin" as const,
          status: "approved" as const,
          title: "Professor of Mathematical Sciences",
          department: "Mathematical Sciences",
          institution: "Worcester Polytechnic Institute",
          isActive: true,
          bio: "Professor specializing in applied mathematics and data science education.",
          expertise: ["Applied Mathematics", "Data Science", "Statistical Analysis", "Project-Based Learning"]
        },
        {
          email: "kalechasseur@wpi.edu",
          name: "Prof. Kimberly LeChasseur",
          passwordHash: await bcrypt.hash("admin123", 10),
          role: "admin" as const,
          status: "approved" as const, 
          title: "Professor of Engineering Education",
          department: "Engineering Education",
          institution: "Worcester Polytechnic Institute",
          isActive: true,
          bio: "Professor focused on innovative engineering education methodologies and pedagogy.",
          expertise: ["Engineering Education", "Pedagogy", "Curriculum Design", "Project-Based Learning"]
        }
      ];

      // Create each admin account using direct DB calls
      const createdUsers = [];
      for (const account of adminAccounts) {
        try {
          const [user] = await db
            .insert(faculty)
            .values(account)
            .onConflictDoNothing()
            .returning();
          
          if (user) {
            createdUsers.push(user);
            console.log(`Created user: ${account.name} (${account.email})`);
          } else {
            console.log(`User ${account.email} already exists, skipping...`);
          }
        } catch (error) {
          console.log(`Error creating ${account.email}:`, error);
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

  // Simple login endpoint
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Find user in database
      const [user] = await db
        .select()
        .from(faculty)
        .where(eq(faculty.email, email))
        .limit(1);

      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check password
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check if user is approved
      if (user.status !== 'approved') {
        return res.status(401).json({ 
          message: user.status === 'pending' ? 
            "Your account is pending approval" : 
            "Your account has been rejected"
        });
      }

      res.json({
        success: true,
        message: "Login successful",
        faculty: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ 
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'PBL Toolkit API'
    });
  });

  return app;
}