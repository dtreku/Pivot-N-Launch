import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, real } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Faculty table - Enhanced with authentication  
export const faculty = pgTable("faculty", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  role: varchar("role", { length: 50 }).default("instructor").notNull(), // 'super_admin', 'admin', 'instructor', 'student'
  status: varchar("status", { length: 50 }).default("pending").notNull(), // 'pending', 'approved', 'rejected', 'inactive'
  isActive: boolean("is_active").default(true).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  department: varchar("department", { length: 255 }).notNull(),
  institution: varchar("institution", { length: 255 }).notNull(),
  photoUrl: text("photo_url"),
  bio: text("bio"),
  expertise: jsonb("expertise").$type<string[]>().default([]),
  openaiApiKey: text("openai_api_key"), // User's personal OpenAI API key
  teamId: integer("team_id"), // For team management
  lastLoginAt: timestamp("last_login_at"),
  approvedBy: integer("approved_by"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  facultyId: integer("faculty_id").references(() => faculty.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  discipline: varchar("discipline", { length: 100 }).notNull(),
  objectives: jsonb("objectives").$type<string[]>().default([]),
  pivotConcepts: jsonb("pivot_concepts").$type<string[]>().default([]),
  launchApplications: jsonb("launch_applications").$type<string[]>().default([]),
  templateId: integer("template_id"),
  status: varchar("status", { length: 50 }).default("draft").notNull(),
  duration: varchar("duration", { length: 50 }),
  difficulty: varchar("difficulty", { length: 50 }).default("intermediate"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Project templates table
export const projectTemplates = pgTable("project_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  discipline: varchar("discipline", { length: 100 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  template: jsonb("template").notNull(),
  icon: varchar("icon", { length: 100 }),
  color: varchar("color", { length: 50 }),
  estimatedDuration: varchar("estimated_duration", { length: 50 }),
  difficultyLevel: varchar("difficulty_level", { length: 50 }).default("intermediate"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Student contributions table
export const studentContributions = pgTable("student_contributions", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  studentName: varchar("student_name", { length: 255 }).notNull(),
  studentEmail: varchar("student_email", { length: 255 }),
  contributionType: varchar("contribution_type", { length: 100 }).notNull(), // 'suggestion', 'reflection', 'feedback'
  content: text("content").notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Pivot Cards table - Core knowledge anchors based on research
export const pivotCards = pgTable("pivot_cards", {
  id: serial("id").primaryKey(),
  facultyId: integer("faculty_id").references(() => faculty.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  discipline: varchar("discipline", { length: 100 }).notNull(),
  definition: text("definition").notNull(),
  constraints: text("constraints"),
  minimalExample: text("minimal_example"),
  counterExample: text("counter_example"),
  misconceptions: jsonb("misconceptions").$type<string[]>().default([]),
  retrievalCount: integer("retrieval_count").default(0),
  masteryLevel: real("mastery_level").default(0),
  cognitiveLoadRating: real("cognitive_load_rating"), // Based on Paas scale
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Worked Examples table - Guided exemplars with self-explanation
export const workedExamples = pgTable("worked_examples", {
  id: serial("id").primaryKey(),
  pivotCardId: integer("pivot_card_id").references(() => pivotCards.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  steps: jsonb("steps").$type<string[]>().notNull(),
  selfExplanationPrompts: jsonb("self_explanation_prompts").$type<string[]>().default([]),
  completionProblem: text("completion_problem"),
  intrinsicLoadLevel: varchar("intrinsic_load_level", { length: 50 }).default("moderate"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Retrieval Activities table - Spaced repetition system
export const retrievalActivities = pgTable("retrieval_activities", {
  id: serial("id").primaryKey(),
  pivotCardId: integer("pivot_card_id").references(() => pivotCards.id).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'flashcard', 'concept-check', 'application'
  question: text("question").notNull(),
  answer: text("answer"),
  options: jsonb("options").$type<string[]>(),
  correctAnswer: integer("correct_answer"),
  difficulty: varchar("difficulty", { length: 50 }).default("basic"),
  lastShown: timestamp("last_shown"),
  nextDue: timestamp("next_due"),
  successRate: real("success_rate").default(0),
  avgResponseTime: real("avg_response_time"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Launch Contexts table - Progressive transfer contexts
export const launchContexts = pgTable("launch_contexts", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  transferLevel: varchar("transfer_level", { length: 50 }).notNull(), // 'near', 'moderate', 'far'
  contextDimensions: jsonb("context_dimensions").$type<{
    stakeholders?: string[];
    dataRegime?: string;
    constraints?: string[];
    riskLevel?: string;
    regulatoryContext?: string;
  }>(),
  scaffoldingLevel: varchar("scaffolding_level", { length: 50 }).default("high"),
  cognitiveLoadTarget: real("cognitive_load_target").default(6), // 1-9 Paas scale
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Cognitive Load Measurements table - Research tracking
export const cognitiveLoadMeasurements = pgTable("cognitive_load_measurements", {
  id: serial("id").primaryKey(),
  facultyId: integer("faculty_id").references(() => faculty.id),
  projectId: integer("project_id").references(() => projects.id),
  pivotCardId: integer("pivot_card_id").references(() => pivotCards.id),
  studentIdentifier: varchar("student_identifier", { length: 255 }), // Anonymous
  mentalEffort: integer("mental_effort"), // Paas 1-9 scale
  intrinsicLoad: integer("intrinsic_load"), // Leppink scale
  extraneousLoad: integer("extraneous_load"), // Leppink scale
  germaneLoad: integer("germane_load"), // Leppink scale
  technostressLevel: integer("technostress_level"), // 1-7 scale
  interruptionCount: integer("interruption_count"),
  timeToRefocus: real("time_to_refocus"), // Minutes
  overloadIndicators: jsonb("overload_indicators").$type<string[]>().default([]),
  measurementContext: varchar("measurement_context", { length: 100 }), // 'pivot', 'launch', 'assessment'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Knowledge base documents table
export const knowledgeBase = pgTable("knowledge_base", {
  id: serial("id").primaryKey(),
  facultyId: integer("faculty_id").references(() => faculty.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  fileType: varchar("file_type", { length: 50 }),
  fileUrl: text("file_url"),
  tags: jsonb("tags").$type<string[]>().default([]),
  embedding: text("embedding"), // Vector embedding for search
  isPrivate: boolean("is_private").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Learning objectives converter table
export const objectiveConversions = pgTable("objective_conversions", {
  id: serial("id").primaryKey(),
  facultyId: integer("faculty_id").references(() => faculty.id).notNull(),
  originalObjective: text("original_objective").notNull(),
  convertedFramework: text("converted_framework").notNull(),
  discipline: varchar("discipline", { length: 100 }),
  feedbackRating: real("feedback_rating"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Survey responses table (Qualtrics integration)
export const surveyResponses = pgTable("survey_responses", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  surveyId: varchar("survey_id", { length: 255 }).notNull(),
  responseId: varchar("response_id", { length: 255 }).notNull(),
  responseData: jsonb("response_data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Analytics tracking table
export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  facultyId: integer("faculty_id").references(() => faculty.id),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  eventData: jsonb("event_data"),
  sessionId: varchar("session_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Document uploads table for manual document sharing with vector database support
export const documentUploads = pgTable("document_uploads", {
  id: serial("id").primaryKey(),
  facultyId: integer("faculty_id").references(() => faculty.id).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  fileUrl: text("file_url").notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).default("manual"),
  isPublic: boolean("is_public").default(false),
  downloadCount: integer("download_count").default(0),
  // Vector database fields
  includeInVectorDb: boolean("include_in_vector_db").default(false),
  vectorStatus: varchar("vector_status", { length: 20 }).default("none"), // none, queued, processing, ready, error
  textContent: text("text_content"), // extracted text for embedding
  embeddings: text("embeddings"), // pgvector doesn't have direct Drizzle support, we'll handle this separately
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const facultyRelations = relations(faculty, ({ many }) => ({
  projects: many(projects),
  knowledgeBase: many(knowledgeBase),
  objectiveConversions: many(objectiveConversions),
  analyticsEvents: many(analyticsEvents),
  documentUploads: many(documentUploads),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  faculty: one(faculty, {
    fields: [projects.facultyId],
    references: [faculty.id],
  }),
  template: one(projectTemplates, {
    fields: [projects.templateId],
    references: [projectTemplates.id],
  }),
  studentContributions: many(studentContributions),
  surveyResponses: many(surveyResponses),
}));

export const studentContributionsRelations = relations(studentContributions, ({ one }) => ({
  project: one(projects, {
    fields: [studentContributions.projectId],
    references: [projects.id],
  }),
}));

export const knowledgeBaseRelations = relations(knowledgeBase, ({ one }) => ({
  faculty: one(faculty, {
    fields: [knowledgeBase.facultyId],
    references: [faculty.id],
  }),
}));

export const objectiveConversionsRelations = relations(objectiveConversions, ({ one }) => ({
  faculty: one(faculty, {
    fields: [objectiveConversions.facultyId],
    references: [faculty.id],
  }),
}));

export const surveyResponsesRelations = relations(surveyResponses, ({ one }) => ({
  project: one(projects, {
    fields: [surveyResponses.projectId],
    references: [projects.id],
  }),
}));

export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  faculty: one(faculty, {
    fields: [analyticsEvents.facultyId],
    references: [faculty.id],
  }),
}));

export const documentUploadsRelations = relations(documentUploads, ({ one }) => ({
  faculty: one(faculty, {
    fields: [documentUploads.facultyId],
    references: [faculty.id],
  }),
}));

// Insert schemas
export const insertFacultySchema = createInsertSchema(faculty).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectTemplateSchema = createInsertSchema(projectTemplates).omit({
  id: true,
  createdAt: true,
});

export const insertStudentContributionSchema = createInsertSchema(studentContributions).omit({
  id: true,
  createdAt: true,
});

export const insertKnowledgeBaseSchema = createInsertSchema(knowledgeBase).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertObjectiveConversionSchema = createInsertSchema(objectiveConversions).omit({
  id: true,
  createdAt: true,
});

export const insertSurveyResponseSchema = createInsertSchema(surveyResponses).omit({
  id: true,
  createdAt: true,
});

export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentUploadSchema = createInsertSchema(documentUploads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Teams table for instructor team management
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  adminId: integer("admin_id").references(() => faculty.id).notNull(),
  institutionId: varchar("institution_id", { length: 255 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Sessions table for authentication
export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey(),
  facultyId: integer("faculty_id").references(() => faculty.id).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// System settings table for admin-only configurations
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  settingKey: varchar("setting_key", { length: 255 }).notNull().unique(),
  settingValue: text("setting_value"),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(), // 'openai', 'general', etc.
  isEncrypted: boolean("is_encrypted").default(false),
  updatedBy: integer("updated_by").references(() => faculty.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User statistics tracking
export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  facultyId: integer("faculty_id").references(() => faculty.id).notNull(),
  loginCount: integer("login_count").default(0).notNull(),
  projectsCreated: integer("projects_created").default(0).notNull(),
  templatesUsed: integer("templates_used").default(0).notNull(),
  lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
  totalTimeSpent: integer("total_time_spent").default(0).notNull(), // in minutes
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert schemas
export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSystemSettingsSchema = createInsertSchema(systemSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserStatsSchema = createInsertSchema(userStats).omit({
  id: true,
  updatedAt: true,
});

// Types
export type Faculty = typeof faculty.$inferSelect;
export type InsertFaculty = z.infer<typeof insertFacultySchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type ProjectTemplate = typeof projectTemplates.$inferSelect;
export type InsertProjectTemplate = z.infer<typeof insertProjectTemplateSchema>;

export type StudentContribution = typeof studentContributions.$inferSelect;
export type InsertStudentContribution = z.infer<typeof insertStudentContributionSchema>;

export type KnowledgeBase = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeBase = z.infer<typeof insertKnowledgeBaseSchema>;

export type ObjectiveConversion = typeof objectiveConversions.$inferSelect;
export type InsertObjectiveConversion = z.infer<typeof insertObjectiveConversionSchema>;

export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type InsertSurveyResponse = z.infer<typeof insertSurveyResponseSchema>;

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;

export type DocumentUpload = typeof documentUploads.$inferSelect;
export type InsertDocumentUpload = z.infer<typeof insertDocumentUploadSchema>;

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;

export type Session = typeof sessions.$inferSelect;

export type SystemSettings = typeof systemSettings.$inferSelect;
export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;

export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
