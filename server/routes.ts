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
import { encryptApiKey, decryptApiKey, isApiKeyEncrypted } from "./crypto";
import { GitHubDeploymentService, getUserRepositories, parseGitHubUrl, type GitHubUpdateFile } from "./github-service";

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

  // Rate limiting middleware for testing (simple in-memory solution)
  const testKeyLimiter = new Map<string, { count: number; lastReset: number }>();
  const TEST_LIMIT = 5; // 5 attempts per hour
  const TEST_WINDOW = 60 * 60 * 1000; // 1 hour

  app.post("/api/openai/test", requireAuth, async (req, res) => {
    try {
      // Rate limiting
      const userId = req.user.id.toString();
      const now = Date.now();
      const userLimits = testKeyLimiter.get(userId);
      
      if (userLimits) {
        if (now - userLimits.lastReset > TEST_WINDOW) {
          // Reset the counter if window passed
          testKeyLimiter.set(userId, { count: 1, lastReset: now });
        } else if (userLimits.count >= TEST_LIMIT) {
          return res.status(429).json({ message: "Too many test attempts. Please try again later." });
        } else {
          userLimits.count++;
        }
      } else {
        testKeyLimiter.set(userId, { count: 1, lastReset: now });
      }
      
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

  // Admin-only system settings routes

  // Get system default OpenAI key status (admin only)
  app.get("/api/admin/settings/openai-key", requireAuth, requireAdmin, async (req, res) => {
    try {
      const setting = await storage.getSystemSetting("default_openai_api_key");
      res.json({
        hasDefaultKey: !!(setting?.settingValue && setting.settingValue.length > 0),
        updatedBy: setting?.updatedBy,
        updatedAt: setting?.updatedAt
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch system settings", error: getErrorMessage(error) });
    }
  });

  // Set system default OpenAI key (admin only)  
  app.put("/api/admin/settings/openai-key", requireAuth, requireAdmin, async (req, res) => {
    try {
      const apiKeySchema = z.object({
        apiKey: z.string().min(20, "API key must be at least 20 characters").startsWith("sk-", "API key must start with 'sk-'")
      });
      
      const validatedData = apiKeySchema.parse(req.body);
      
      // Encrypt the system default API key
      const encryptedApiKey = encryptApiKey(validatedData.apiKey);
      
      await storage.setSystemSetting({
        settingKey: "default_openai_api_key",
        settingValue: encryptedApiKey,
        description: "Default OpenAI API key for system-wide operations",
        category: "openai",
        isEncrypted: true,
        updatedBy: req.user.id
      });
      
      res.json({ message: "System default API key updated successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update system default API key", error: getErrorMessage(error) });
    }
  });

  // Remove system default OpenAI key (admin only)
  app.delete("/api/admin/settings/openai-key", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteSystemSetting("default_openai_api_key");
      res.json({ message: "System default API key removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove system default API key", error: getErrorMessage(error) });
    }
  });

  // Helper function to get available OpenAI API key (user key or system default)
  async function getOpenAIApiKey(userId: number): Promise<string | null> {
    try {
      // First try user's personal API key
      const faculty = await storage.getFaculty(userId);
      if (faculty?.openaiApiKey && isApiKeyEncrypted(faculty.openaiApiKey)) {
        const decryptedKey = decryptApiKey(faculty.openaiApiKey);
        if (decryptedKey) return decryptedKey;
      }
      
      // Fall back to system default key (admin-only)
      const systemSetting = await storage.getSystemSetting("default_openai_api_key");
      if (systemSetting?.settingValue && isApiKeyEncrypted(systemSetting.settingValue)) {
        const decryptedKey = decryptApiKey(systemSetting.settingValue);
        if (decryptedKey) return decryptedKey;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get OpenAI API key:', error);
      return null;
    }
  }

  // Vector search endpoints
  app.post("/api/documents/:id/vectorize", requireAuth, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const apiKey = await getOpenAIApiKey(req.user.id);
      
      if (!apiKey) {
        return res.status(400).json({ message: "No OpenAI API key configured. Please set your personal API key in settings." });
      }
      
      // Get document
      const document = await storage.getDocumentUpload(documentId);
      if (!document || document.facultyId !== req.user.id) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Mark for vectorization
      await storage.markDocumentForVectorization(documentId);
      
      // Extract text content based on file type
      let textContent = document.textContent || "";
      
      if (!textContent && document.mimeType?.includes("pdf")) {
        try {
          // Extract text from PDF
          const pdfParse = require('pdf-parse');
          const response = await fetch(document.fileUrl);
          const buffer = await response.arrayBuffer();
          const pdfData = await pdfParse(Buffer.from(buffer));
          textContent = pdfData.text;
        } catch (error) {
          console.warn("Failed to extract PDF text:", error);
          textContent = document.fileName; // Fallback to filename
        }
      } else if (!textContent) {
        textContent = document.fileName; // Fallback to filename for other types
      }

      // Generate embeddings using OpenAI
      const openai = new OpenAI({ apiKey });
      
      try {
        const response = await openai.embeddings.create({
          model: "text-embedding-ada-002",
          input: textContent.slice(0, 8000) // Limit to ~8k characters to stay within token limits
        });
        
        const embeddings = JSON.stringify(response.data[0].embedding);
        await storage.updateDocumentEmbeddings(documentId, embeddings, textContent);
        
        res.json({ message: "Document vectorized successfully", status: "ready" });
      } catch (openaiError: any) {
        await storage.updateDocumentEmbeddings(documentId, "", "");
        if (openaiError?.status === 401) {
          return res.status(400).json({ message: "Invalid OpenAI API key" });
        }
        throw openaiError;
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to vectorize document", error: getErrorMessage(error) });
    }
  });

  app.post("/api/search/documents", requireAuth, async (req, res) => {
    try {
      const searchSchema = z.object({
        query: z.string().min(1, "Search query is required"),
        limit: z.number().min(1).max(50).optional().default(10)
      });
      
      const validatedData = searchSchema.parse(req.body);
      const apiKey = await getOpenAIApiKey(req.user.id);
      
      if (!apiKey) {
        return res.status(400).json({ message: "No OpenAI API key configured. Please set your personal API key in settings." });
      }
      
      // Generate embedding for search query
      const openai = new OpenAI({ apiKey });
      const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: validatedData.query
      });
      
      const queryEmbedding = response.data[0].embedding;
      
      // Search documents using vector similarity (simplified implementation)
      const documents = await storage.vectorSearchDocuments(req.user.id, queryEmbedding, validatedData.limit);
      
      res.json({ documents, query: validatedData.query });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to search documents", error: getErrorMessage(error) });
    }
  });

  // Integration management routes
  app.get("/api/integrations", requireAuth, async (req, res) => {
    try {
      const connections = await storage.getIntegrationConnections(req.user.id);
      
      // Get admin-managed integrations filtered by user's institution
      const adminConnections = await storage.getAdminIntegrationConnections(req.user.institution);
      
      res.json({ 
        userConnections: connections, 
        adminConnections: adminConnections,
        userRole: req.user.role // Include user role so frontend knows permission level
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch integrations", error: getErrorMessage(error) });
    }
  });

  app.post("/api/integrations/connect", requireAuth, async (req, res) => {
    try {
      const connectSchema = z.object({
        integrationId: z.string().min(1),
        integrationName: z.string().min(1),
        integrationType: z.string().min(1),
        parameters: z.record(z.any()).optional(),
        isAdminManaged: z.boolean().optional().default(false)
      });
      
      const validatedData = connectSchema.parse(req.body);
      
      // Only admins can create admin-managed connections
      if (validatedData.isAdminManaged && req.user.role !== 'super_admin' && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can create system-wide integrations" });
      }

      // Access control: Users can only connect if there's an admin connection OR they are admin
      if (!validatedData.isAdminManaged && req.user.role !== 'super_admin' && req.user.role !== 'admin') {
        const adminConnections = await storage.getAdminIntegrationConnections(req.user.institution);
        const hasAdminConnection = adminConnections.some(conn => conn.integrationId === validatedData.integrationId);
        
        if (!hasAdminConnection) {
          return res.status(403).json({ 
            message: "This service is not available. Please contact your institution administrator to enable this integration." 
          });
        }
      }
      
      // Create the integration connection
      const connection = await storage.createIntegrationConnection({
        facultyId: validatedData.isAdminManaged ? null : req.user.id,
        integrationId: validatedData.integrationId,
        integrationName: validatedData.integrationName,
        integrationType: validatedData.integrationType,
        status: "connected",
        isAdminManaged: validatedData.isAdminManaged,
        institution: validatedData.isAdminManaged ? req.user.institution : null,
        lastConnectedAt: new Date()
      });
      
      // Add parameters if provided
      if (validatedData.parameters) {
        for (const [key, value] of Object.entries(validatedData.parameters)) {
          await storage.createIntegrationParameter({
            connectionId: connection.id,
            parameterKey: key,
            parameterValue: typeof value === 'string' ? value : JSON.stringify(value),
            parameterType: typeof value === 'object' ? 'json' : typeof value,
            isRequired: true
          });
        }
      }
      
      res.json({ connection, message: "Integration connected successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to connect integration", error: getErrorMessage(error) });
    }
  });

  app.put("/api/integrations/:id/configure", requireAuth, async (req, res) => {
    try {
      const connectionId = parseInt(req.params.id);
      const connection = await storage.getIntegrationConnection(connectionId);
      
      if (!connection) {
        return res.status(404).json({ message: "Integration connection not found" });
      }
      
      // Check permissions - users can only configure their own integrations, admins can configure admin-managed ones from their institution
      const isAdmin = req.user.role === 'super_admin' || req.user.role === 'admin';
      if (connection.facultyId !== req.user.id && !(isAdmin && connection.isAdminManaged && connection.institution === req.user.institution)) {
        return res.status(403).json({ message: "You don't have permission to configure this integration" });
      }
      
      const configSchema = z.object({
        parameters: z.record(z.any())
      });
      
      const validatedData = configSchema.parse(req.body);
      
      // Delete existing parameters
      const existingParams = await storage.getIntegrationParameters(connectionId);
      for (const param of existingParams) {
        await storage.deleteIntegrationParameter(param.id);
      }
      
      // Add new parameters
      for (const [key, value] of Object.entries(validatedData.parameters)) {
        await storage.createIntegrationParameter({
          connectionId: connectionId,
          parameterKey: key,
          parameterValue: typeof value === 'string' ? value : JSON.stringify(value),
          parameterType: typeof value === 'object' ? 'json' : typeof value,
          isRequired: true
        });
      }
      
      // Update connection status
      await storage.updateIntegrationConnection(connectionId, {
        status: "connected",
        lastConnectedAt: new Date()
      });
      
      res.json({ message: "Integration configured successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to configure integration", error: getErrorMessage(error) });
    }
  });

  app.delete("/api/integrations/:id", requireAuth, async (req, res) => {
    try {
      const connectionId = parseInt(req.params.id);
      const connection = await storage.getIntegrationConnection(connectionId);
      
      if (!connection) {
        return res.status(404).json({ message: "Integration connection not found" });
      }
      
      // Check permissions - users can only delete their own integrations, admins can delete admin-managed ones from their institution
      const isAdmin = req.user.role === 'super_admin' || req.user.role === 'admin';
      if (connection.facultyId !== req.user.id && !(isAdmin && connection.isAdminManaged && connection.institution === req.user.institution)) {
        return res.status(403).json({ message: "You don't have permission to delete this integration" });
      }
      
      await storage.deleteIntegrationConnection(connectionId);
      res.json({ message: "Integration disconnected successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to disconnect integration", error: getErrorMessage(error) });
    }
  });

  app.get("/api/integrations/:id/parameters", requireAuth, async (req, res) => {
    try {
      const connectionId = parseInt(req.params.id);
      const connection = await storage.getIntegrationConnection(connectionId);
      
      if (!connection) {
        return res.status(404).json({ message: "Integration connection not found" });
      }
      
      // Check permissions - users can only view their own integration parameters, admins can view admin-managed ones from their institution  
      const isAdmin = req.user.role === 'super_admin' || req.user.role === 'admin';
      if (connection.facultyId !== req.user.id && !(isAdmin && connection.isAdminManaged && connection.institution === req.user.institution)) {
        return res.status(403).json({ message: "You don't have permission to view this integration's parameters" });
      }
      
      const parameters = await storage.getIntegrationParameters(connectionId);
      res.json({ parameters });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch integration parameters", error: getErrorMessage(error) });
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

  // GitHub Integration Routes
  app.get('/api/github/repositories', requireAuth, requireAdmin, async (req, res) => {
    try {
      const repositories = await getUserRepositories();
      res.json({ repositories });
    } catch (error) {
      console.error('Error fetching GitHub repositories:', error);
      res.status(500).json({ message: 'Failed to fetch repositories', error: getErrorMessage(error) });
    }
  });

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
  });

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
      const [routesServerlessContent, netlifyTomlContent] = await Promise.all([
        fs.readFile('server/routes-serverless.ts', 'utf8'),
        fs.readFile('netlify.toml', 'utf8').catch(() => '')
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
  });

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
  });

  // Add 404 guard for unmatched /api/* paths AFTER all routes are registered
  app.use("/api/*", (_req, res) => res.status(404).json({ message: "API endpoint not found" }));

  const httpServer = createServer(app);
  return httpServer;
}
