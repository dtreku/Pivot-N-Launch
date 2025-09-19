// Standalone Express server for external deployment (Railway/Render/Fly)
// This replaces the complex Netlify Functions approach

import express from 'express';
import cors from 'cors';
import { storage } from './storage';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
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
} from '@shared/schema';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration for Netlify frontend
app.use(cors({
  origin: [
    'https://pnltoolkit.professordtreku.com',
    'http://localhost:5000',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));

// JWT secret - must be set in production
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET or SESSION_SECRET environment variable is required');
}

// Middleware to verify JWT tokens
function requireAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.facultyId = decoded.facultyId;
    req.userId = decoded.facultyId; // For compatibility
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'PBL Toolkit API'
  });
});

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const faculty = await storage.getFacultyByEmail(email);
    if (!faculty || !faculty.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, faculty.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        facultyId: faculty.id,
        email: faculty.email,
        role: faculty.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ 
      token,
      faculty: {
        id: faculty.id,
        email: faculty.email,
        firstName: faculty.firstName,
        lastName: faculty.lastName,
        role: faculty.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const faculty = await storage.getFaculty(req.facultyId);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    res.json({
      id: faculty.id,
      email: faculty.email,
      firstName: faculty.firstName,
      lastName: faculty.lastName,
      role: faculty.role
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Database initialization endpoint
app.post('/api/init-db', async (req, res) => {
  try {
    await storage.init();
    res.json({ message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Database initialization error:', error);
    res.status(500).json({ message: 'Failed to initialize database' });
  }
});

// Seed admin user endpoint
app.post('/api/seed', async (req, res) => {
  try {
    await storage.init();
    
    // Check if admin already exists
    const existingAdmin = await storage.getFacultyByEmail('dtreku@wpi.edu');
    if (existingAdmin) {
      return res.json({ message: 'Admin user already exists' });
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminFaculty = await storage.createFaculty({
      email: 'dtreku@wpi.edu',
      firstName: 'Daniel',
      lastName: 'Treku',
      institution: 'Worcester Polytechnic Institute',
      department: 'Computer Science',
      title: 'Professor',
      passwordHash: hashedPassword,
      role: 'super_admin' as const,
      isActive: true
    });

    res.json({ 
      message: 'Admin user created successfully',
      adminId: adminFaculty.id
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ message: 'Failed to seed database' });
  }
});

// Add all other API routes here (faculty, projects, etc.)
// Copy from existing routes but with requireAuth middleware

// Faculty endpoints
app.get('/api/faculty', requireAuth, async (req, res) => {
  try {
    const faculty = await storage.listFaculty();
    res.json(faculty);
  } catch (error) {
    console.error('List faculty error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Projects endpoints
app.get('/api/projects', requireAuth, async (req, res) => {
  try {
    const projects = await storage.listProjects(req.facultyId);
    res.json(projects);
  } catch (error) {
    console.error('List projects error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/projects', requireAuth, async (req, res) => {
  try {
    const validatedData = insertProjectSchema.parse({
      ...req.body,
      facultyId: req.facultyId
    });
    
    const project = await storage.createProject(validatedData);
    res.status(201).json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid project data', errors: error.errors });
    }
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 PBL Toolkit API server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});

export default app;