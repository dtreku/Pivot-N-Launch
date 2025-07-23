import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, real } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Faculty table
export const faculty = pgTable("faculty", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  department: varchar("department", { length: 255 }).notNull(),
  institution: varchar("institution", { length: 255 }).notNull(),
  photoUrl: text("photo_url"),
  bio: text("bio"),
  expertise: jsonb("expertise").$type<string[]>().default([]),
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

// Relations
export const facultyRelations = relations(faculty, ({ many }) => ({
  projects: many(projects),
  knowledgeBase: many(knowledgeBase),
  objectiveConversions: many(objectiveConversions),
  analyticsEvents: many(analyticsEvents),
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
