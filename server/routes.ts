import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import bcrypt from "bcryptjs";
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

// Middleware to check authentication
async function requireAuth(req: any, res: any, next: any) {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  
  if (!sessionId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const session = await storage.getSession(sessionId);
  if (!session) {
    return res.status(401).json({ message: "Invalid or expired session" });
  }

  const faculty = await storage.getFaculty(session.facultyId);
  if (!faculty || !faculty.isActive) {
    return res.status(401).json({ message: "Faculty account inactive" });
  }

  req.user = faculty;
  req.session = session;
  next();
}

// Middleware to check admin access (super_admin or admin)
async function requireAdmin(req: any, res: any, next: any) {
  if (!req.user || !['super_admin', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

// Middleware to check super admin access
async function requireSuperAdmin(req: any, res: any, next: any) {
  if (req.user?.role !== 'super_admin') {
    return res.status(403).json({ message: "Super admin access required" });
  }
  next();
}

// Middleware to check if user is approved
async function requireApproved(req: any, res: any, next: any) {
  if (req.user?.status !== 'approved') {
    return res.status(403).json({ message: "Account pending approval" });
  }
  next();
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Faculty routes
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
      const email = req.params.email;
      const faculty = await storage.getFacultyByEmail(email);
      
      if (!faculty) {
        return res.status(404).json({ message: "Faculty not found" });
      }
      
      res.json(faculty);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch faculty", error: getErrorMessage(error) });
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
      const id = parseInt(req.params.id);
      const validatedData = insertFacultySchema.partial().parse(req.body);
      const faculty = await storage.updateFaculty(id, validatedData);
      
      if (!faculty) {
        return res.status(404).json({ message: "Faculty not found" });
      }
      
      res.json(faculty);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid faculty data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update faculty", error: getErrorMessage(error) });
    }
  });

  // Public registration route
  app.post("/api/auth/register", async (req, res) => {
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
        role: ['student', 'instructor'].includes(role) ? role : 'instructor',
        status: "pending", // All new registrations need approval
        title,
        department,
        institution,
        isActive: false, // Inactive until approved
      };

      const faculty = await storage.createFaculty(facultyData);

      res.status(201).json({
        message: "Registration successful. Please wait for admin approval.",
        id: faculty.id,
        email: faculty.email,
        status: faculty.status
      });
    } catch (error) {
      res.status(500).json({ message: "Registration failed", error: getErrorMessage(error) });
    }
  });

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const faculty = await storage.validateCredentials(email, password);
      if (!faculty) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!faculty.isActive) {
        return res.status(401).json({ message: "Account is inactive" });
      }

      // Create session
      const session = await storage.createSession(faculty.id);
      
      // Update login stats
      await storage.updateLastLogin(faculty.id);
      await storage.incrementLoginCount(faculty.id);

      res.json({
        sessionId: session.id,
        faculty: {
          id: faculty.id,
          name: faculty.name,
          email: faculty.email,
          role: faculty.role,
          title: faculty.title,
          department: faculty.department,
          institution: faculty.institution,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed", error: getErrorMessage(error) });
    }
  });

  app.post("/api/auth/logout", requireAuth, async (req: any, res) => {
    try {
      await storage.deleteSession(req.session.id);
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ message: "Logout failed", error: getErrorMessage(error) });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req: any, res) => {
    try {
      const stats = await storage.getUserStats(req.user.id);
      res.json({
        faculty: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          title: req.user.title,
          department: req.user.department,
          institution: req.user.institution,
          teamId: req.user.teamId,
        },
        stats,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user data", error: getErrorMessage(error) });
    }
  });

  // Super admin routes for instructor management
  app.post("/api/admin/instructors", requireAuth, requireSuperAdmin, async (req, res) => {
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
      };

      const faculty = await storage.createFaculty(facultyData);

      // Create initial user stats
      await storage.createUserStats({
        facultyId: faculty.id,
        loginCount: 0,
        projectsCreated: 0,
        templatesUsed: 0,
        totalTimeSpent: 0,
        lastActiveAt: new Date(),
      });

      res.status(201).json({
        id: faculty.id,
        name: faculty.name,
        email: faculty.email,
        role: faculty.role,
        title: faculty.title,
        department: faculty.department,
        institution: faculty.institution,
        isActive: faculty.isActive,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create instructor", error: getErrorMessage(error) });
    }
  });

  // Team management routes
  app.get("/api/teams", requireAuth, async (req: any, res) => {
    try {
      const teams = await storage.getTeamsByAdmin(req.user.id);
      res.json(teams);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teams", error: getErrorMessage(error) });
    }
  });

  app.post("/api/teams", requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertTeamSchema.parse({
        ...req.body,
        adminId: req.user.id,
      });
      const team = await storage.createTeam(validatedData);
      res.status(201).json(team);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid team data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create team", error: getErrorMessage(error) });
    }
  });

  app.get("/api/teams/:id/members", requireAuth, async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const members = await storage.getTeamMembers(teamId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team members", error: getErrorMessage(error) });
    }
  });

  // Project routes
  app.get("/api/projects/faculty/:facultyId", async (req, res) => {
    try {
      const facultyId = parseInt(req.params.facultyId);
      const projects = await storage.getProjectsByFaculty(facultyId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects", error: getErrorMessage(error) });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project", error: getErrorMessage(error) });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      
      // Track analytics event
      await storage.createAnalyticsEvent({
        facultyId: project.facultyId,
        eventType: "project_created",
        eventData: { projectId: project.id, discipline: project.discipline },
      });
      
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
      const id = parseInt(req.params.id);
      const validatedData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(id, validatedData);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Track analytics event
      await storage.createAnalyticsEvent({
        facultyId: project.facultyId,
        eventType: "project_updated",
        eventData: { projectId: project.id, status: project.status },
      });
      
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update project", error: getErrorMessage(error) });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProject(id);
      
      if (!success) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project", error: getErrorMessage(error) });
    }
  });

  // Project templates routes
  app.get("/api/templates", async (req, res) => {
    try {
      const { discipline } = req.query;
      let templates;
      
      if (discipline && typeof discipline === 'string') {
        templates = await storage.getProjectTemplatesByDiscipline(discipline);
      } else {
        templates = await storage.getProjectTemplates();
      }
      
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch templates", error: getErrorMessage(error) });
    }
  });

  app.get("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getProjectTemplate(id);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch template", error: getErrorMessage(error) });
    }
  });

  // Student contributions routes
  app.get("/api/contributions/project/:projectId", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const contributions = await storage.getStudentContributionsByProject(projectId);
      res.json(contributions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contributions", error: getErrorMessage(error) });
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
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || typeof status !== 'string') {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const contribution = await storage.updateStudentContributionStatus(id, status);
      
      if (!contribution) {
        return res.status(404).json({ message: "Contribution not found" });
      }
      
      res.json(contribution);
    } catch (error) {
      res.status(500).json({ message: "Failed to update contribution status", error: getErrorMessage(error) });
    }
  });

  // Knowledge base routes
  app.get("/api/knowledge-base/faculty/:facultyId", async (req, res) => {
    try {
      const facultyId = parseInt(req.params.facultyId);
      const entries = await storage.getKnowledgeBaseByFaculty(facultyId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch knowledge base", error: getErrorMessage(error) });
    }
  });

  app.post("/api/knowledge-base", async (req, res) => {
    try {
      const validatedData = insertKnowledgeBaseSchema.parse(req.body);
      const entry = await storage.createKnowledgeBaseEntry(validatedData);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid knowledge base data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create knowledge base entry", error: getErrorMessage(error) });
    }
  });

  app.get("/api/knowledge-base/search/:facultyId", async (req, res) => {
    try {
      const facultyId = parseInt(req.params.facultyId);
      const { query } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const results = await storage.searchKnowledgeBase(facultyId, query);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to search knowledge base", error: getErrorMessage(error) });
    }
  });

  app.delete("/api/knowledge-base/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteKnowledgeBaseEntry(id);
      
      if (!success) {
        return res.status(404).json({ message: "Knowledge base entry not found" });
      }
      
      res.json({ message: "Knowledge base entry deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete knowledge base entry", error: getErrorMessage(error) });
    }
  });

  // Objective conversion routes
  app.get("/api/objective-conversions/faculty/:facultyId", async (req, res) => {
    try {
      const facultyId = parseInt(req.params.facultyId);
      const conversions = await storage.getObjectiveConversionsByFaculty(facultyId);
      res.json(conversions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch objective conversions", error: getErrorMessage(error) });
    }
  });

  app.post("/api/objective-conversions", async (req, res) => {
    try {
      const validatedData = insertObjectiveConversionSchema.parse(req.body);
      const conversion = await storage.createObjectiveConversion(validatedData);
      
      // Track analytics event
      await storage.createAnalyticsEvent({
        facultyId: conversion.facultyId,
        eventType: "objective_converted",
        eventData: { discipline: conversion.discipline },
      });
      
      res.status(201).json(conversion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid conversion data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create objective conversion", error: getErrorMessage(error) });
    }
  });

  // Survey response routes
  app.post("/api/survey-responses", async (req, res) => {
    try {
      const validatedData = insertSurveyResponseSchema.parse(req.body);
      const response = await storage.createSurveyResponse(validatedData);
      res.status(201).json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid survey response data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create survey response", error: getErrorMessage(error) });
    }
  });

  app.get("/api/survey-responses/project/:projectId", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const responses = await storage.getSurveyResponsesByProject(projectId);
      res.json(responses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch survey responses", error: getErrorMessage(error) });
    }
  });

  // Analytics routes
  app.post("/api/analytics", async (req, res) => {
    try {
      const validatedData = insertAnalyticsEventSchema.parse(req.body);
      const event = await storage.createAnalyticsEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid analytics data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create analytics event", error: getErrorMessage(error) });
    }
  });

  app.get("/api/analytics/faculty/:facultyId", async (req, res) => {
    try {
      const facultyId = parseInt(req.params.facultyId);
      const { eventType } = req.query;
      
      const events = await storage.getAnalyticsByFaculty(
        facultyId, 
        eventType as string || undefined
      );
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics", error: getErrorMessage(error) });
    }
  });

  // Dashboard stats route
  app.get("/api/dashboard/stats/:facultyId", async (req, res) => {
    try {
      const facultyId = parseInt(req.params.facultyId);
      const stats = await storage.getDashboardStats(facultyId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats", error: getErrorMessage(error) });
    }
  });

  // Presentation generation route
  app.get("/api/analytics/presentation", async (req, res) => {
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
            <h3>👥 Collaboration Ready</h3>
            <p>Student invitation and feedback systems are fully functional</p>
        </div>
        
        <div class="metric">
            <h3>📖 Methodology Implementation</h3>
            <p>Wizard-guided setup for Pivot-and-Launch pedagogical approach</p>
        </div>
        
        <div class="disclaimer">
            <strong>📋 Note:</strong> This is a demonstration presentation. In production, this would include real analytics data from your specific usage patterns, student engagement metrics, and learning outcome assessments.
        </div>
        
        <div class="footer">
            <p>Generated by PBL Toolkit • ${new Date().toLocaleDateString()} • WPI Implementation</p>
        </div>
    </div>
</body>
</html>`;
      
      res.setHeader('Content-Type', 'text/html');
      res.send(presentationHtml);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate presentation", error: getErrorMessage(error) });
    }
  });

  // User management routes (Admin only)
  app.get("/api/admin/users", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllFaculty();
      res.json(users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        title: user.title,
        department: user.department,
        institution: user.institution,
        isActive: user.isActive,
        createdAt: user.createdAt,
        approvedAt: user.approvedAt
      })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users", error: getErrorMessage(error) });
    }
  });

  app.get("/api/admin/users/pending", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const pendingUsers = await storage.getPendingFaculty();
      res.json(pendingUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        title: user.title,
        department: user.department,
        institution: user.institution,
        createdAt: user.createdAt
      })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending users", error: getErrorMessage(error) });
    }
  });

  app.post("/api/admin/users/:id/approve", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.approveFaculty(userId, req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Set user as active after approval
      await storage.setFacultyStatus(userId, "approved");
      await storage.updateFaculty(userId, { isActive: true });

      res.json({
        message: "User approved successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          status: user.status
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to approve user", error: getErrorMessage(error) });
    }
  });

  app.post("/api/admin/users/:id/reject", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.rejectFaculty(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        message: "User rejected successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          status: user.status
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to reject user", error: getErrorMessage(error) });
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
        role: ['student', 'instructor', 'admin'].includes(role) ? role : 'instructor',
        status: "approved", // Admin-created accounts are auto-approved
        title,
        department,
        institution,
        isActive: true,
        approvedBy: req.user.id,
        approvedAt: new Date()
      };

      const faculty = await storage.createFaculty(facultyData);

      // Create initial user stats
      await storage.createUserStats({
        facultyId: faculty.id,
        loginCount: 0,
        projectsCreated: 0,
        templatesUsed: 0,
        totalTimeSpent: 0,
        lastActiveAt: new Date(),
      });

      res.status(201).json({
        message: "User created successfully",
        user: {
          id: faculty.id,
          name: faculty.name,
          email: faculty.email,
          role: faculty.role,
          title: faculty.title,
          department: faculty.department,
          institution: faculty.institution,
          status: faculty.status
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create user", error: getErrorMessage(error) });
    }
  });

  app.put("/api/admin/users/:id/status", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { status, isActive } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const updateData: any = { status };
      if (typeof isActive === 'boolean') {
        updateData.isActive = isActive;
      }

      const user = await storage.updateFaculty(userId, updateData);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        message: "User status updated successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          status: user.status,
          isActive: user.isActive
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user status", error: getErrorMessage(error) });
    }
  });

  // Seed initial data route (for development)
  app.post("/api/seed", async (req, res) => {
    try {
      // Create admin accounts
      const passwordHash = await bcrypt.hash("admin123", 10); // Default password for setup
      
      const adminAccounts = [
        {
          name: "Prof. Daniel Treku",
          email: "dtreku@wpi.edu",
          role: "super_admin",
          title: "Professor of Fintech, Information Systems and Data Science",
          department: "Information Systems and Fintech",
          bio: "Information systems and fintech professor and collaborative faculty in the data science program. Expert in Pivot-and-Launch pedagogy and cognitive load management.",
          expertise: ["Blockchain", "Fintech", "Data Science", "Information Systems", "Knowledge Integrations", "Project-Based Learning"]
        },
        {
          name: "Prof. Kristin Wobbe",
          email: "kwobbe@wpi.edu", 
          role: "admin",
          title: "Professor of Mathematical Sciences",
          department: "Mathematical Sciences",
          bio: "Professor specializing in applied mathematics and data science education.",
          expertise: ["Applied Mathematics", "Data Science", "Statistical Analysis", "Project-Based Learning"]
        },
        {
          name: "Prof. Kimberly LeChasseur",
          email: "kalechasseur@wpi.edu",
          role: "admin", 
          title: "Professor of Engineering Education",
          department: "Engineering Education",
          bio: "Professor focused on innovative engineering education methodologies and pedagogy.",
          expertise: ["Engineering Education", "Pedagogy", "Curriculum Design", "Project-Based Learning"]
        }
      ];

      const createdAdmins = [];
      for (const adminData of adminAccounts) {
        // Check if admin already exists
        const existingAdmin = await storage.getFacultyByEmail(adminData.email);
        if (!existingAdmin) {
          const admin = await storage.createFaculty({
            ...adminData,
            passwordHash,
            status: "approved",
            isActive: true,
            institution: "Worcester Polytechnic Institute",
            photoUrl: "/api/faculty-photo",
          });

          // Create initial user stats for admin
          await storage.createUserStats({
            facultyId: admin.id,
            loginCount: 0,
            projectsCreated: 0,
            templatesUsed: 0,
            totalTimeSpent: 0,
            lastActiveAt: new Date(),
          });

          createdAdmins.push(admin);
        }
      }

      const superAdmin = createdAdmins.find(admin => admin.role === "super_admin") || createdAdmins[0];

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
        },
      ];

      for (const template of templates) {
        await storage.createProjectTemplate(template);
      }

      res.json({ 
        message: "Database seeded successfully",
        superAdmin: {
          id: superAdmin.id,
          name: superAdmin.name,
          email: superAdmin.email,
          role: superAdmin.role,
          institution: superAdmin.institution,
        },
        templatesCreated: templates.length,
        loginCredentials: {
          email: "dtreku@wpi.edu",
          password: "admin123"
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to seed database", error: getErrorMessage(error) });
    }
  });

  // Document upload routes
  app.get("/api/documents/faculty/:facultyId", async (req, res) => {
    try {
      const facultyId = parseInt(req.params.facultyId);
      const documents = await storage.getDocumentUploadsByFaculty(facultyId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents", error: getErrorMessage(error) });
    }
  });

  app.post("/api/documents/upload-url", async (req, res) => {
    try {
      const { fileName } = req.body;
      if (!fileName) {
        return res.status(400).json({ message: "fileName is required" });
      }

      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL(fileName);
      res.json({ uploadURL });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate upload URL", error: getErrorMessage(error) });
    }
  });

  app.post("/api/documents", async (req, res) => {
    try {
      const validatedData = insertDocumentUploadSchema.parse(req.body);
      const document = await storage.createDocumentUpload(validatedData);
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid document data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create document record", error: getErrorMessage(error) });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      
      // Update download count in database if this is a tracked document
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(req.path);
      // Note: In a full implementation, you'd want to track which documents correspond to which object paths
      
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

  // OpenAI API Key Management Routes
  app.get("/api/faculty/:id/settings", requireAuth, async (req, res) => {
    try {
      const facultyId = parseInt(req.params.id);
      
      // Check if the user can access this faculty's settings
      if (req.user.id !== facultyId && !['super_admin', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const faculty = await storage.getFaculty(facultyId);
      if (!faculty) {
        return res.status(404).json({ message: "Faculty not found" });
      }
      
      res.json({
        hasApiKey: !!(faculty.openaiApiKey && faculty.openaiApiKey.length > 0),
        // Don't return the actual API key for security
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings", error: getErrorMessage(error) });
    }
  });

  app.put("/api/faculty/:id/api-key", requireAuth, async (req, res) => {
    try {
      const facultyId = parseInt(req.params.id);
      const { apiKey } = req.body;
      
      // Check if the user can update this faculty's API key
      if (req.user.id !== facultyId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 20) {
        return res.status(400).json({ message: "Valid API key required" });
      }
      
      await storage.updateFaculty(facultyId, { openaiApiKey: apiKey });
      
      res.json({ message: "API key updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update API key", error: getErrorMessage(error) });
    }
  });

  app.delete("/api/faculty/:id/api-key", requireAuth, async (req, res) => {
    try {
      const facultyId = parseInt(req.params.id);
      
      // Check if the user can delete this faculty's API key
      if (req.user.id !== facultyId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.updateFaculty(facultyId, { openaiApiKey: null });
      
      res.json({ message: "API key removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove API key", error: getErrorMessage(error) });
    }
  });

  app.post("/api/openai/test", requireAuth, async (req, res) => {
    try {
      const { apiKey } = req.body;
      
      if (!apiKey || typeof apiKey !== 'string') {
        return res.status(400).json({ message: "API key required" });
      }
      
      // Test the API key by making a simple request
      const openai = new OpenAI({ apiKey });
      
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
      res.status(500).json({ message: "Failed to test API key", error: getErrorMessage(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
