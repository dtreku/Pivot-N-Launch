import { 
  faculty, 
  projects, 
  projectTemplates, 
  studentContributions, 
  knowledgeBase, 
  objectiveConversions, 
  surveyResponses, 
  analyticsEvents,
  type Faculty,
  type InsertFaculty,
  type Project,
  type InsertProject,
  type ProjectTemplate,
  type InsertProjectTemplate,
  type StudentContribution,
  type InsertStudentContribution,
  type KnowledgeBase,
  type InsertKnowledgeBase,
  type ObjectiveConversion,
  type InsertObjectiveConversion,
  type SurveyResponse,
  type InsertSurveyResponse,
  type AnalyticsEvent,
  type InsertAnalyticsEvent
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, like, sql } from "drizzle-orm";

export interface IStorage {
  // Faculty methods
  getFaculty(id: number): Promise<Faculty | undefined>;
  getFacultyByEmail(email: string): Promise<Faculty | undefined>;
  createFaculty(faculty: InsertFaculty): Promise<Faculty>;
  updateFaculty(id: number, faculty: Partial<InsertFaculty>): Promise<Faculty | undefined>;

  // Project methods
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByFaculty(facultyId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;

  // Project template methods
  getProjectTemplates(): Promise<ProjectTemplate[]>;
  getProjectTemplatesByDiscipline(discipline: string): Promise<ProjectTemplate[]>;
  getProjectTemplate(id: number): Promise<ProjectTemplate | undefined>;
  createProjectTemplate(template: InsertProjectTemplate): Promise<ProjectTemplate>;

  // Student contribution methods
  getStudentContributionsByProject(projectId: number): Promise<StudentContribution[]>;
  createStudentContribution(contribution: InsertStudentContribution): Promise<StudentContribution>;
  updateStudentContributionStatus(id: number, status: string): Promise<StudentContribution | undefined>;

  // Knowledge base methods
  getKnowledgeBaseByFaculty(facultyId: number): Promise<KnowledgeBase[]>;
  createKnowledgeBaseEntry(entry: InsertKnowledgeBase): Promise<KnowledgeBase>;
  searchKnowledgeBase(facultyId: number, query: string): Promise<KnowledgeBase[]>;
  deleteKnowledgeBaseEntry(id: number): Promise<boolean>;

  // Objective conversion methods
  getObjectiveConversionsByFaculty(facultyId: number): Promise<ObjectiveConversion[]>;
  createObjectiveConversion(conversion: InsertObjectiveConversion): Promise<ObjectiveConversion>;

  // Survey response methods
  createSurveyResponse(response: InsertSurveyResponse): Promise<SurveyResponse>;
  getSurveyResponsesByProject(projectId: number): Promise<SurveyResponse[]>;

  // Analytics methods
  createAnalyticsEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent>;
  getAnalyticsByFaculty(facultyId: number, eventType?: string): Promise<AnalyticsEvent[]>;

  // Dashboard stats
  getDashboardStats(facultyId: number): Promise<{
    activeProjects: number;
    studentsEngaged: number;
    completionRate: number;
    avgRating: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Faculty methods
  async getFaculty(id: number): Promise<Faculty | undefined> {
    const [result] = await db.select().from(faculty).where(eq(faculty.id, id));
    return result || undefined;
  }

  async getFacultyByEmail(email: string): Promise<Faculty | undefined> {
    const [result] = await db.select().from(faculty).where(eq(faculty.email, email));
    return result || undefined;
  }

  async createFaculty(insertFaculty: InsertFaculty): Promise<Faculty> {
    const [result] = await db
      .insert(faculty)
      .values({
        ...insertFaculty,
        updatedAt: new Date(),
      })
      .returning();
    return result;
  }

  async updateFaculty(id: number, updateData: Partial<InsertFaculty>): Promise<Faculty | undefined> {
    const [result] = await db
      .update(faculty)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(faculty.id, id))
      .returning();
    return result || undefined;
  }

  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    const [result] = await db.select().from(projects).where(eq(projects.id, id));
    return result || undefined;
  }

  async getProjectsByFaculty(facultyId: number): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.facultyId, facultyId))
      .orderBy(desc(projects.updatedAt));
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [result] = await db
      .insert(projects)
      .values({
        ...project,
        updatedAt: new Date(),
      })
      .returning();
    return result;
  }

  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined> {
    const [result] = await db
      .update(projects)
      .set({
        ...project,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();
    return result || undefined;
  }

  async deleteProject(id: number): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id));
    return result.rowCount > 0;
  }

  // Project template methods
  async getProjectTemplates(): Promise<ProjectTemplate[]> {
    return await db
      .select()
      .from(projectTemplates)
      .where(eq(projectTemplates.isActive, true))
      .orderBy(projectTemplates.name);
  }

  async getProjectTemplatesByDiscipline(discipline: string): Promise<ProjectTemplate[]> {
    return await db
      .select()
      .from(projectTemplates)
      .where(and(
        eq(projectTemplates.discipline, discipline),
        eq(projectTemplates.isActive, true)
      ))
      .orderBy(projectTemplates.name);
  }

  async getProjectTemplate(id: number): Promise<ProjectTemplate | undefined> {
    const [result] = await db.select().from(projectTemplates).where(eq(projectTemplates.id, id));
    return result || undefined;
  }

  async createProjectTemplate(template: InsertProjectTemplate): Promise<ProjectTemplate> {
    const [result] = await db
      .insert(projectTemplates)
      .values(template)
      .returning();
    return result;
  }

  // Student contribution methods
  async getStudentContributionsByProject(projectId: number): Promise<StudentContribution[]> {
    return await db
      .select()
      .from(studentContributions)
      .where(eq(studentContributions.projectId, projectId))
      .orderBy(desc(studentContributions.createdAt));
  }

  async createStudentContribution(contribution: InsertStudentContribution): Promise<StudentContribution> {
    const [result] = await db
      .insert(studentContributions)
      .values(contribution)
      .returning();
    return result;
  }

  async updateStudentContributionStatus(id: number, status: string): Promise<StudentContribution | undefined> {
    const [result] = await db
      .update(studentContributions)
      .set({ status })
      .where(eq(studentContributions.id, id))
      .returning();
    return result || undefined;
  }

  // Knowledge base methods
  async getKnowledgeBaseByFaculty(facultyId: number): Promise<KnowledgeBase[]> {
    return await db
      .select()
      .from(knowledgeBase)
      .where(eq(knowledgeBase.facultyId, facultyId))
      .orderBy(desc(knowledgeBase.updatedAt));
  }

  async createKnowledgeBaseEntry(entry: InsertKnowledgeBase): Promise<KnowledgeBase> {
    const [result] = await db
      .insert(knowledgeBase)
      .values({
        ...entry,
        updatedAt: new Date(),
      })
      .returning();
    return result;
  }

  async searchKnowledgeBase(facultyId: number, query: string): Promise<KnowledgeBase[]> {
    return await db
      .select()
      .from(knowledgeBase)
      .where(and(
        eq(knowledgeBase.facultyId, facultyId),
        like(knowledgeBase.content, `%${query}%`)
      ))
      .orderBy(desc(knowledgeBase.updatedAt));
  }

  async deleteKnowledgeBaseEntry(id: number): Promise<boolean> {
    const result = await db.delete(knowledgeBase).where(eq(knowledgeBase.id, id));
    return result.rowCount > 0;
  }

  // Objective conversion methods
  async getObjectiveConversionsByFaculty(facultyId: number): Promise<ObjectiveConversion[]> {
    return await db
      .select()
      .from(objectiveConversions)
      .where(eq(objectiveConversions.facultyId, facultyId))
      .orderBy(desc(objectiveConversions.createdAt));
  }

  async createObjectiveConversion(conversion: InsertObjectiveConversion): Promise<ObjectiveConversion> {
    const [result] = await db
      .insert(objectiveConversions)
      .values(conversion)
      .returning();
    return result;
  }

  // Survey response methods
  async createSurveyResponse(response: InsertSurveyResponse): Promise<SurveyResponse> {
    const [result] = await db
      .insert(surveyResponses)
      .values(response)
      .returning();
    return result;
  }

  async getSurveyResponsesByProject(projectId: number): Promise<SurveyResponse[]> {
    return await db
      .select()
      .from(surveyResponses)
      .where(eq(surveyResponses.projectId, projectId))
      .orderBy(desc(surveyResponses.createdAt));
  }

  // Analytics methods
  async createAnalyticsEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent> {
    const [result] = await db
      .insert(analyticsEvents)
      .values(event)
      .returning();
    return result;
  }

  async getAnalyticsByFaculty(facultyId: number, eventType?: string): Promise<AnalyticsEvent[]> {
    const conditions = [eq(analyticsEvents.facultyId, facultyId)];
    if (eventType) {
      conditions.push(eq(analyticsEvents.eventType, eventType));
    }
    
    return await db
      .select()
      .from(analyticsEvents)
      .where(and(...conditions))
      .orderBy(desc(analyticsEvents.createdAt));
  }

  // Dashboard stats
  async getDashboardStats(facultyId: number): Promise<{
    activeProjects: number;
    studentsEngaged: number;
    completionRate: number;
    avgRating: number;
  }> {
    // Get active projects count
    const [activeProjectsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(and(
        eq(projects.facultyId, facultyId),
        eq(projects.status, "active")
      ));

    // Get students engaged (unique contributors)
    const [studentsEngagedResult] = await db
      .select({ count: sql<number>`count(distinct student_email)` })
      .from(studentContributions)
      .innerJoin(projects, eq(studentContributions.projectId, projects.id))
      .where(eq(projects.facultyId, facultyId));

    // Get completion rate (completed projects / total projects)
    const [totalProjectsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(eq(projects.facultyId, facultyId));

    const [completedProjectsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(and(
        eq(projects.facultyId, facultyId),
        eq(projects.status, "completed")
      ));

    // Get average rating from objective conversions feedback
    const [avgRatingResult] = await db
      .select({ avg: sql<number>`avg(feedback_rating)` })
      .from(objectiveConversions)
      .where(eq(objectiveConversions.facultyId, facultyId));

    const completionRate = totalProjectsResult.count > 0 
      ? (completedProjectsResult.count / totalProjectsResult.count) * 100 
      : 0;

    return {
      activeProjects: activeProjectsResult.count || 0,
      studentsEngaged: studentsEngagedResult.count || 0,
      completionRate: Math.round(completionRate),
      avgRating: Number(avgRatingResult.avg?.toFixed(1)) || 0,
    };
  }
}

export const storage = new DatabaseStorage();
