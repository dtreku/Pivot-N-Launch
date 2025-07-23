import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertFacultySchema,
  insertProjectSchema,
  insertStudentContributionSchema,
  insertKnowledgeBaseSchema,
  insertObjectiveConversionSchema,
  insertSurveyResponseSchema,
  insertAnalyticsEventSchema
} from "@shared/schema";

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

  // Seed initial data route (for development)
  app.post("/api/seed", async (req, res) => {
    try {
      // Create default faculty (Prof. Daniel Treku)
      const defaultFaculty = await storage.createFaculty({
        name: "Prof. Daniel Treku",
        email: "daniel.treku@university.edu",
        title: "Professor of Fintech, Information Systems and Data Science",
        department: "Information Systems and Fintech",
        institution: "University",
        photoUrl: "/api/faculty-photo", // This would be handled by a separate file upload endpoint
        bio: "Information systems and fintech professor and collaborative faculty in the data science program",
        expertise: ["Blockchain", "Fintech", "Data Science", "Information Systems", "Knowledge Integrations"],
      });

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
      ];

      for (const template of templates) {
        await storage.createProjectTemplate(template);
      }

      res.json({ 
        message: "Database seeded successfully",
        faculty: defaultFaculty,
        templatesCreated: templates.length,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to seed database", error: getErrorMessage(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
