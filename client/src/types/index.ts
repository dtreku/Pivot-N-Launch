// Re-export all types from shared schema for easier access
export type {
  Faculty,
  InsertFaculty,
  Project,
  InsertProject,
  ProjectTemplate,
  InsertProjectTemplate,
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
} from "@shared/schema";

// Additional frontend-specific types
export interface DashboardStats {
  activeProjects: number;
  studentsEngaged: number;
  completionRate: number;
  avgRating: number;
}

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  active: boolean;
}

export interface ObjectiveConversionForm {
  originalObjective: string;
  discipline: string;
  context?: string;
}

export interface ProjectFilters {
  discipline?: string;
  status?: string;
  search?: string;
}

export interface TemplateFilters {
  discipline?: string;
  category?: string;
  difficulty?: string;
}

export interface IntegrationStatus {
  name: string;
  status: 'connected' | 'available' | 'disconnected';
  icon: string;
  color: string;
}

export interface ContributionFilter {
  type?: string;
  status?: string;
  project?: number;
}

export interface KnowledgeBaseFilter {
  tags?: string[];
  fileType?: string;
  search?: string;
}

export interface ExportOptions {
  format: 'pdf' | 'docx' | 'pptx';
  includeProjects: boolean;
  includeTemplates: boolean;
  includeAnalytics: boolean;
}
