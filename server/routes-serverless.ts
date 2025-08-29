// Serverless-compatible routes for Netlify Functions
import type { Express } from "express";
import { storage } from "./storage";
import bcrypt from "bcryptjs";

export async function registerRoutes(app: Express) {
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

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return app;
}