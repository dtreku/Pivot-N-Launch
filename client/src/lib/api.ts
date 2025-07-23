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
    const res = await apiRequest("GET", `/api/faculty/${id}`);
    return res.json();
  },

  getByEmail: async (email: string): Promise<Faculty> => {
    const res = await apiRequest("GET", `/api/faculty/email/${email}`);
    return res.json();
  },

  create: async (faculty: InsertFaculty): Promise<Faculty> => {
    const res = await apiRequest("POST", "/api/faculty", faculty);
    return res.json();
  },

  update: async (id: number, faculty: Partial<InsertFaculty>): Promise<Faculty> => {
    const res = await apiRequest("PUT", `/api/faculty/${id}`, faculty);
    return res.json();
  },
};

// Project API
export const projectApi = {
  get: async (id: number): Promise<Project> => {
    const res = await apiRequest("GET", `/api/projects/${id}`);
    return res.json();
  },

  getByFaculty: async (facultyId: number): Promise<Project[]> => {
    const res = await apiRequest("GET", `/api/projects/faculty/${facultyId}`);
    return res.json();
  },

  create: async (project: InsertProject): Promise<Project> => {
    const res = await apiRequest("POST", "/api/projects", project);
    return res.json();
  },

  update: async (id: number, project: Partial<InsertProject>): Promise<Project> => {
    const res = await apiRequest("PUT", `/api/projects/${id}`, project);
    return res.json();
  },

  delete: async (id: number): Promise<void> => {
    await apiRequest("DELETE", `/api/projects/${id}`);
  },
};

// Template API
export const templateApi = {
  getAll: async (discipline?: string): Promise<ProjectTemplate[]> => {
    const url = discipline ? `/api/templates?discipline=${discipline}` : "/api/templates";
    const res = await apiRequest("GET", url);
    return res.json();
  },

  get: async (id: number): Promise<ProjectTemplate> => {
    const res = await apiRequest("GET", `/api/templates/${id}`);
    return res.json();
  },
};

// Student contribution API
export const contributionApi = {
  getByProject: async (projectId: number): Promise<StudentContribution[]> => {
    const res = await apiRequest("GET", `/api/contributions/project/${projectId}`);
    return res.json();
  },

  create: async (contribution: InsertStudentContribution): Promise<StudentContribution> => {
    const res = await apiRequest("POST", "/api/contributions", contribution);
    return res.json();
  },

  updateStatus: async (id: number, status: string): Promise<StudentContribution> => {
    const res = await apiRequest("PUT", `/api/contributions/${id}/status`, { status });
    return res.json();
  },
};

// Knowledge base API
export const knowledgeBaseApi = {
  getByFaculty: async (facultyId: number): Promise<KnowledgeBase[]> => {
    const res = await apiRequest("GET", `/api/knowledge-base/faculty/${facultyId}`);
    return res.json();
  },

  create: async (entry: InsertKnowledgeBase): Promise<KnowledgeBase> => {
    const res = await apiRequest("POST", "/api/knowledge-base", entry);
    return res.json();
  },

  search: async (facultyId: number, query: string): Promise<KnowledgeBase[]> => {
    const res = await apiRequest("GET", `/api/knowledge-base/search/${facultyId}?query=${encodeURIComponent(query)}`);
    return res.json();
  },

  delete: async (id: number): Promise<void> => {
    await apiRequest("DELETE", `/api/knowledge-base/${id}`);
  },
};

// Objective conversion API
export const objectiveConversionApi = {
  getByFaculty: async (facultyId: number): Promise<ObjectiveConversion[]> => {
    const res = await apiRequest("GET", `/api/objective-conversions/faculty/${facultyId}`);
    return res.json();
  },

  create: async (conversion: InsertObjectiveConversion): Promise<ObjectiveConversion> => {
    const res = await apiRequest("POST", "/api/objective-conversions", conversion);
    return res.json();
  },
};

// Survey response API
export const surveyApi = {
  createResponse: async (response: InsertSurveyResponse): Promise<SurveyResponse> => {
    const res = await apiRequest("POST", "/api/survey-responses", response);
    return res.json();
  },

  getByProject: async (projectId: number): Promise<SurveyResponse[]> => {
    const res = await apiRequest("GET", `/api/survey-responses/project/${projectId}`);
    return res.json();
  },
};

// Analytics API
export const analyticsApi = {
  createEvent: async (event: InsertAnalyticsEvent): Promise<AnalyticsEvent> => {
    const res = await apiRequest("POST", "/api/analytics", event);
    return res.json();
  },

  getByFaculty: async (facultyId: number, eventType?: string): Promise<AnalyticsEvent[]> => {
    const url = eventType 
      ? `/api/analytics/faculty/${facultyId}?eventType=${eventType}`
      : `/api/analytics/faculty/${facultyId}`;
    const res = await apiRequest("GET", url);
    return res.json();
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async (facultyId: number): Promise<DashboardStats> => {
    const res = await apiRequest("GET", `/api/dashboard/stats/${facultyId}`);
    return res.json();
  },
};

// Seed API (for development)
export const seedApi = {
  seed: async (): Promise<{ message: string; faculty: Faculty; templatesCreated: number }> => {
    const res = await apiRequest("POST", "/api/seed");
    return res.json();
  },
};
