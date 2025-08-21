import { apiRequest } from "./queryClient";
import type {
  Faculty,
  InsertFaculty,
  Project,
  InsertProject,
  ProjectTemplate,
  StudentContribution,
  InsertStudentContribution,
  KnowledgeBase,
  InsertKnowledgeBase,
  ObjectiveConversion,
  InsertObjectiveConversion,
  SurveyResponse,
  InsertSurveyResponse,
  AnalyticsEvent,
  InsertAnalyticsEvent,
  DashboardStats,
} from "@/types";

// Faculty API
export const facultyApi = {
  get: async (id: number): Promise<Faculty> => {
    return await apiRequest(`/api/faculty/${id}`, "GET");
  },

  getByEmail: async (email: string): Promise<Faculty> => {
    return await apiRequest(`/api/faculty/email/${email}`, "GET");
  },

  create: async (faculty: InsertFaculty): Promise<Faculty> => {
    return await apiRequest("/api/faculty", "POST", faculty);
  },

  update: async (id: number, faculty: Partial<InsertFaculty>): Promise<Faculty> => {
    return await apiRequest(`/api/faculty/${id}`, "PUT", faculty);
  },
};

// Project API
export const projectApi = {
  get: async (id: number): Promise<Project> => {
    return await apiRequest(`/api/projects/${id}`, "GET");
  },

  getByFaculty: async (facultyId: number): Promise<Project[]> => {
    return await apiRequest(`/api/projects/faculty/${facultyId}`, "GET");
  },

  create: async (project: InsertProject): Promise<Project> => {
    return await apiRequest("/api/projects", "POST", project);
  },

  update: async (id: number, project: Partial<InsertProject>): Promise<Project> => {
    return await apiRequest(`/api/projects/${id}`, "PUT", project);
  },

  delete: async (id: number): Promise<void> => {
    await apiRequest(`/api/projects/${id}`, "DELETE");
  },
};

// Template API
export const templateApi = {
  getAll: async (discipline?: string): Promise<ProjectTemplate[]> => {
    const url = discipline ? `/api/templates?discipline=${discipline}` : "/api/templates";
    return await apiRequest(url, "GET");
  },

  get: async (id: number): Promise<ProjectTemplate> => {
    return await apiRequest(`/api/templates/${id}`, "GET");
  },
};

// Student contribution API
export const contributionApi = {
  getByProject: async (projectId: number): Promise<StudentContribution[]> => {
    return await apiRequest(`/api/contributions/project/${projectId}`, "GET");
  },

  create: async (contribution: InsertStudentContribution): Promise<StudentContribution> => {
    return await apiRequest("/api/contributions", "POST", contribution);
  },

  updateStatus: async (id: number, status: string): Promise<StudentContribution> => {
    return await apiRequest(`/api/contributions/${id}/status`, "PUT", { status });
  },
};

// Knowledge base API
export const knowledgeBaseApi = {
  getByFaculty: async (facultyId: number): Promise<KnowledgeBase[]> => {
    return await apiRequest(`/api/knowledge-base/faculty/${facultyId}`, "GET");
  },

  create: async (entry: InsertKnowledgeBase): Promise<KnowledgeBase> => {
    return await apiRequest("/api/knowledge-base", "POST", entry);
  },

  search: async (facultyId: number, query: string): Promise<KnowledgeBase[]> => {
    return await apiRequest(`/api/knowledge-base/search/${facultyId}?query=${encodeURIComponent(query)}`, "GET");
  },

  delete: async (id: number): Promise<void> => {
    await apiRequest(`/api/knowledge-base/${id}`, "DELETE");
  },
};

// Objective conversion API
export const objectiveConversionApi = {
  getByFaculty: async (facultyId: number): Promise<ObjectiveConversion[]> => {
    return await apiRequest(`/api/objective-conversions/faculty/${facultyId}`, "GET");
  },

  create: async (conversion: InsertObjectiveConversion): Promise<ObjectiveConversion> => {
    return await apiRequest("/api/objective-conversions", "POST", conversion);
  },
};

// Survey response API
export const surveyApi = {
  createResponse: async (response: InsertSurveyResponse): Promise<SurveyResponse> => {
    return await apiRequest("/api/survey-responses", "POST", response);
  },

  getByProject: async (projectId: number): Promise<SurveyResponse[]> => {
    return await apiRequest(`/api/survey-responses/project/${projectId}`, "GET");
  },
};

// Analytics API
export const analyticsApi = {
  createEvent: async (event: InsertAnalyticsEvent): Promise<AnalyticsEvent> => {
    return await apiRequest("/api/analytics", "POST", event);
  },

  getByFaculty: async (facultyId: number, eventType?: string): Promise<AnalyticsEvent[]> => {
    const url = eventType 
      ? `/api/analytics/faculty/${facultyId}?eventType=${eventType}`
      : `/api/analytics/faculty/${facultyId}`;
    return await apiRequest(url, "GET");
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async (facultyId: number): Promise<DashboardStats> => {
    return await apiRequest(`/api/dashboard/stats/${facultyId}`, "GET");
  },
};

// Seed API (for development)
export const seedApi = {
  seed: async (): Promise<{ message: string; faculty: Faculty; templatesCreated: number }> => {
    return await apiRequest("/api/seed", "POST");
  },
};
