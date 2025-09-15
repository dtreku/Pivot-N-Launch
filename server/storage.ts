import { 
  faculty, 
  projects, 
  projectTemplates, 
  studentContributions, 
  knowledgeBase, 
  objectiveConversions, 
  surveyResponses, 
  analyticsEvents,
  documentUploads,
  teams,
  sessions,
  systemSettings,
  userStats,
  integrationConnections,
  integrationParameters,
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
  type InsertAnalyticsEvent,
  type DocumentUpload,
  type InsertDocumentUpload,
  type Team,
  type InsertTeam,
  type Session,
  type SystemSettings,
  type InsertSystemSettings,
  type UserStats,
  type InsertUserStats,
  type IntegrationConnection,
  type InsertIntegrationConnection,
  type IntegrationParameter,
  type InsertIntegrationParameter
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, like, sql } from "drizzle-orm";

export interface IStorage {
  // Faculty methods
  getFaculty(id: number): Promise<Faculty | undefined>;
  getFacultyByEmail(email: string): Promise<Faculty | undefined>;
  createFaculty(faculty: InsertFaculty): Promise<Faculty>;
  updateFaculty(id: number, faculty: Partial<InsertFaculty>): Promise<Faculty | undefined>;
  getAllFaculty(): Promise<Faculty[]>;
  getPendingFaculty(): Promise<Faculty[]>;
  approveFaculty(id: number, approvedBy: number): Promise<Faculty | undefined>;
  rejectFaculty(id: number): Promise<Faculty | undefined>;
  setFacultyStatus(id: number, status: string): Promise<Faculty | undefined>;

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

  // Document upload methods
  getDocumentUploadsByFaculty(facultyId: number): Promise<DocumentUpload[]>;
  createDocumentUpload(upload: InsertDocumentUpload): Promise<DocumentUpload>;
  getDocumentUpload(id: number): Promise<DocumentUpload | undefined>;
  updateDocumentUpload(id: number, upload: Partial<InsertDocumentUpload>): Promise<DocumentUpload | undefined>;
  deleteDocumentUpload(id: number): Promise<boolean>;
  incrementDownloadCount(id: number): Promise<void>;

  // Authentication methods
  validateCredentials(email: string, password: string): Promise<Faculty | null>;
  createSession(facultyId: number): Promise<Session>;
  getSession(sessionId: string): Promise<Session | undefined>;
  deleteSession(sessionId: string): Promise<boolean>;
  updateLastLogin(facultyId: number): Promise<void>;

  // Team management methods
  getTeamsByAdmin(adminId: number): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  getTeam(id: number): Promise<Team | undefined>;
  updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team | undefined>;
  deleteTeam(id: number): Promise<boolean>;
  getTeamMembers(teamId: number): Promise<Faculty[]>;
  addTeamMember(teamId: number, facultyId: number): Promise<void>;
  removeTeamMember(teamId: number, facultyId: number): Promise<void>;

  // System settings methods (admin only)
  getSystemSetting(key: string): Promise<SystemSettings | undefined>;
  setSystemSetting(setting: InsertSystemSettings): Promise<SystemSettings>;
  updateSystemSetting(key: string, value: string, updatedBy?: number): Promise<SystemSettings | undefined>;
  deleteSystemSetting(key: string): Promise<boolean>;

  // Vector search methods
  vectorSearchDocuments(facultyId: number, queryEmbedding: number[], limit?: number): Promise<DocumentUpload[]>;
  updateDocumentEmbeddings(documentId: number, embeddings: string, textContent: string): Promise<DocumentUpload | undefined>;
  markDocumentForVectorization(documentId: number): Promise<DocumentUpload | undefined>;

  // User statistics methods
  getUserStats(facultyId: number): Promise<UserStats | undefined>;
  createUserStats(stats: InsertUserStats): Promise<UserStats>;
  updateUserStats(facultyId: number, stats: Partial<UserStats>): Promise<UserStats | undefined>;
  incrementLoginCount(facultyId: number): Promise<void>;
  updateActivityTime(facultyId: number, minutesSpent: number): Promise<void>;

  // Integration methods
  getIntegrationConnections(facultyId: number): Promise<IntegrationConnection[]>;
  getAdminIntegrationConnections(): Promise<IntegrationConnection[]>;
  createIntegrationConnection(connection: InsertIntegrationConnection): Promise<IntegrationConnection>;
  updateIntegrationConnection(id: number, connection: Partial<IntegrationConnection>): Promise<IntegrationConnection | undefined>;
  deleteIntegrationConnection(id: number): Promise<boolean>;
  getIntegrationConnection(id: number): Promise<IntegrationConnection | undefined>;
  
  getIntegrationParameters(connectionId: number): Promise<IntegrationParameter[]>;
  createIntegrationParameter(parameter: InsertIntegrationParameter): Promise<IntegrationParameter>;
  updateIntegrationParameter(id: number, parameter: Partial<IntegrationParameter>): Promise<IntegrationParameter | undefined>;
  deleteIntegrationParameter(id: number): Promise<boolean>;
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
      .values(insertFaculty)
      .returning();
    return result;
  }

  async updateFaculty(id: number, updateData: Partial<InsertFaculty>): Promise<Faculty | undefined> {
    const [result] = await db
      .update(faculty)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(faculty.id, id))
      .returning();
    return result || undefined;
  }

  async getAllFaculty(): Promise<Faculty[]> {
    return await db
      .select()
      .from(faculty)
      .orderBy(desc(faculty.createdAt));
  }

  async getPendingFaculty(): Promise<Faculty[]> {
    return await db
      .select()
      .from(faculty)
      .where(eq(faculty.status, "pending"))
      .orderBy(desc(faculty.createdAt));
  }

  async approveFaculty(id: number, approvedBy: number): Promise<Faculty | undefined> {
    const [result] = await db
      .update(faculty)
      .set({ 
        status: "approved",
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(faculty.id, id))
      .returning();
    return result || undefined;
  }

  async rejectFaculty(id: number): Promise<Faculty | undefined> {
    const [result] = await db
      .update(faculty)
      .set({ 
        status: "rejected",
        updatedAt: new Date()
      })
      .where(eq(faculty.id, id))
      .returning();
    return result || undefined;
  }

  async setFacultyStatus(id: number, status: string): Promise<Faculty | undefined> {
    const [result] = await db
      .update(faculty)
      .set({ 
        status,
        updatedAt: new Date()
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
      .values(project)
      .returning();
    return result;
  }

  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined> {
    const [result] = await db
      .update(projects)
      .set(project)
      .where(eq(projects.id, id))
      .returning();
    return result || undefined;
  }

  async deleteProject(id: number): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id));
    return (result.rowCount ?? 0) > 0;
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
      .values(entry)
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
    return (result.rowCount ?? 0) > 0;
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

  // Document upload methods
  async getDocumentUploadsByFaculty(facultyId: number): Promise<DocumentUpload[]> {
    return await db
      .select()
      .from(documentUploads)
      .where(eq(documentUploads.facultyId, facultyId))
      .orderBy(desc(documentUploads.createdAt));
  }

  async createDocumentUpload(upload: InsertDocumentUpload): Promise<DocumentUpload> {
    const [result] = await db
      .insert(documentUploads)
      .values(upload)
      .returning();
    return result;
  }

  async getDocumentUpload(id: number): Promise<DocumentUpload | undefined> {
    const [result] = await db.select().from(documentUploads).where(eq(documentUploads.id, id));
    return result || undefined;
  }

  async updateDocumentUpload(id: number, upload: Partial<InsertDocumentUpload>): Promise<DocumentUpload | undefined> {
    const [result] = await db
      .update(documentUploads)
      .set(upload)
      .where(eq(documentUploads.id, id))
      .returning();
    return result || undefined;
  }

  async deleteDocumentUpload(id: number): Promise<boolean> {
    const result = await db.delete(documentUploads).where(eq(documentUploads.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async incrementDownloadCount(id: number): Promise<void> {
    await db
      .update(documentUploads)
      .set({ downloadCount: sql`download_count + 1` })
      .where(eq(documentUploads.id, id));
  }

  // Authentication methods
  async validateCredentials(email: string, password: string): Promise<Faculty | null> {
    const bcrypt = await import('bcryptjs');
    const [user] = await db.select().from(faculty).where(eq(faculty.email, email));
    
    if (!user || !user.passwordHash) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    return isValid ? user : null;
  }

  async createSession(facultyId: number): Promise<Session> {
    const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const [result] = await db
      .insert(sessions)
      .values({
        id: sessionId,
        facultyId,
        expiresAt,
      })
      .returning();

    return result;
  }

  async getSession(sessionId: string): Promise<Session | undefined> {
    const [result] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    
    // Check if session is expired
    if (result && result.expiresAt < new Date()) {
      await this.deleteSession(sessionId);
      return undefined;
    }

    return result || undefined;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const result = await db.delete(sessions).where(eq(sessions.id, sessionId));
    return (result.rowCount ?? 0) > 0;
  }

  async updateLastLogin(facultyId: number): Promise<void> {
    await db
      .update(faculty)
      .set({ lastLoginAt: new Date() })
      .where(eq(faculty.id, facultyId));
  }

  // Team management methods
  async getTeamsByAdmin(adminId: number): Promise<Team[]> {
    return await db
      .select()
      .from(teams)
      .where(eq(teams.adminId, adminId))
      .orderBy(desc(teams.createdAt));
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const [result] = await db
      .insert(teams)
      .values(team)
      .returning();
    return result;
  }

  async getTeam(id: number): Promise<Team | undefined> {
    const [result] = await db.select().from(teams).where(eq(teams.id, id));
    return result || undefined;
  }

  async updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team | undefined> {
    const [result] = await db
      .update(teams)
      .set(team)
      .where(eq(teams.id, id))
      .returning();
    return result || undefined;
  }

  async deleteTeam(id: number): Promise<boolean> {
    const result = await db.delete(teams).where(eq(teams.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getTeamMembers(teamId: number): Promise<Faculty[]> {
    return await db
      .select()
      .from(faculty)
      .where(eq(faculty.teamId, teamId));
  }

  async addTeamMember(teamId: number, facultyId: number): Promise<void> {
    await db
      .update(faculty)
      .set({ teamId })
      .where(eq(faculty.id, facultyId));
  }

  async removeTeamMember(teamId: number, facultyId: number): Promise<void> {
    await db
      .update(faculty)
      .set({ teamId: null })
      .where(and(eq(faculty.id, facultyId), eq(faculty.teamId, teamId)));
  }

  // User statistics methods
  async getUserStats(facultyId: number): Promise<UserStats | undefined> {
    const [result] = await db.select().from(userStats).where(eq(userStats.facultyId, facultyId));
    return result || undefined;
  }

  async createUserStats(stats: InsertUserStats): Promise<UserStats> {
    const [result] = await db
      .insert(userStats)
      .values(stats)
      .returning();
    return result;
  }

  async updateUserStats(facultyId: number, stats: Partial<UserStats>): Promise<UserStats | undefined> {
    const [result] = await db
      .update(userStats)
      .set(stats)
      .where(eq(userStats.facultyId, facultyId))
      .returning();
    return result || undefined;
  }

  async incrementLoginCount(facultyId: number): Promise<void> {
    await db
      .update(userStats)
      .set({ 
        loginCount: sql`login_count + 1`,
        lastActiveAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(userStats.facultyId, facultyId));
  }

  async updateActivityTime(facultyId: number, minutesSpent: number): Promise<void> {
    await db
      .update(userStats)
      .set({ 
        totalTimeSpent: sql`total_time_spent + ${minutesSpent}`,
        lastActiveAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(userStats.facultyId, facultyId));
  }

  // System settings methods (admin only)
  async getSystemSetting(key: string): Promise<SystemSettings | undefined> {
    const [result] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.settingKey, key));
    return result || undefined;
  }

  async setSystemSetting(setting: InsertSystemSettings): Promise<SystemSettings> {
    // Try to update existing setting first
    const existing = await this.getSystemSetting(setting.settingKey);
    if (existing) {
      const [result] = await db
        .update(systemSettings)
        .set({
          ...setting,
          updatedAt: new Date()
        })
        .where(eq(systemSettings.settingKey, setting.settingKey))
        .returning();
      return result;
    } else {
      // Create new setting
      const [result] = await db
        .insert(systemSettings)
        .values(setting)
        .returning();
      return result;
    }
  }

  async updateSystemSetting(key: string, value: string, updatedBy?: number): Promise<SystemSettings | undefined> {
    const [result] = await db
      .update(systemSettings)
      .set({
        settingValue: value,
        updatedBy,
        updatedAt: new Date()
      })
      .where(eq(systemSettings.settingKey, key))
      .returning();
    return result || undefined;
  }

  async deleteSystemSetting(key: string): Promise<boolean> {
    const result = await db
      .delete(systemSettings)
      .where(eq(systemSettings.settingKey, key));
    return (result.rowCount ?? 0) > 0;
  }

  // Vector search methods
  async vectorSearchDocuments(facultyId: number, queryEmbedding: number[], limit = 10): Promise<DocumentUpload[]> {
    // Use pgvector extension for actual similarity search
    const queryVector = `[${queryEmbedding.join(',')}]`;
    
    return await db
      .select()
      .from(documentUploads)
      .where(and(
        eq(documentUploads.facultyId, facultyId),
        sql`${documentUploads.embeddings} IS NOT NULL`,
        eq(documentUploads.vectorStatus, "ready")
      ))
      .orderBy(sql`${documentUploads.embeddings}::vector <-> ${queryVector}::vector`)
      .limit(limit);
  }

  async updateDocumentEmbeddings(documentId: number, embeddings: string, textContent: string): Promise<DocumentUpload | undefined> {
    const [result] = await db
      .update(documentUploads)
      .set({
        embeddings,
        textContent,
        vectorStatus: "ready",
        updatedAt: new Date()
      })
      .where(eq(documentUploads.id, documentId))
      .returning();
    return result || undefined;
  }

  async markDocumentForVectorization(documentId: number): Promise<DocumentUpload | undefined> {
    const [result] = await db
      .update(documentUploads)
      .set({
        includeInVectorDb: true,
        vectorStatus: "queued",
        updatedAt: new Date()
      })
      .where(eq(documentUploads.id, documentId))
      .returning();
    return result || undefined;
  }

  // Integration methods
  async getIntegrationConnections(facultyId: number): Promise<IntegrationConnection[]> {
    return await db
      .select()
      .from(integrationConnections)
      .where(eq(integrationConnections.facultyId, facultyId))
      .orderBy(desc(integrationConnections.createdAt));
  }

  async getAdminIntegrationConnections(): Promise<IntegrationConnection[]> {
    return await db
      .select()
      .from(integrationConnections)
      .where(eq(integrationConnections.isAdminManaged, true))
      .orderBy(desc(integrationConnections.createdAt));
  }

  async createIntegrationConnection(connection: InsertIntegrationConnection): Promise<IntegrationConnection> {
    const [result] = await db
      .insert(integrationConnections)
      .values(connection)
      .returning();
    return result;
  }

  async updateIntegrationConnection(id: number, connection: Partial<IntegrationConnection>): Promise<IntegrationConnection | undefined> {
    const [result] = await db
      .update(integrationConnections)
      .set({ ...connection, updatedAt: new Date() })
      .where(eq(integrationConnections.id, id))
      .returning();
    return result || undefined;
  }

  async deleteIntegrationConnection(id: number): Promise<boolean> {
    // Also delete associated parameters
    await db
      .delete(integrationParameters)
      .where(eq(integrationParameters.connectionId, id));
    
    const result = await db
      .delete(integrationConnections)
      .where(eq(integrationConnections.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getIntegrationConnection(id: number): Promise<IntegrationConnection | undefined> {
    const [result] = await db
      .select()
      .from(integrationConnections)
      .where(eq(integrationConnections.id, id));
    return result || undefined;
  }

  async getIntegrationParameters(connectionId: number): Promise<IntegrationParameter[]> {
    return await db
      .select()
      .from(integrationParameters)
      .where(eq(integrationParameters.connectionId, connectionId))
      .orderBy(integrationParameters.parameterKey);
  }

  async createIntegrationParameter(parameter: InsertIntegrationParameter): Promise<IntegrationParameter> {
    const [result] = await db
      .insert(integrationParameters)
      .values(parameter)
      .returning();
    return result;
  }

  async updateIntegrationParameter(id: number, parameter: Partial<IntegrationParameter>): Promise<IntegrationParameter | undefined> {
    const [result] = await db
      .update(integrationParameters)
      .set({ ...parameter, updatedAt: new Date() })
      .where(eq(integrationParameters.id, id))
      .returning();
    return result || undefined;
  }

  async deleteIntegrationParameter(id: number): Promise<boolean> {
    const result = await db
      .delete(integrationParameters)
      .where(eq(integrationParameters.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();
