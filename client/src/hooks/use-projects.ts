import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectApi, templateApi, dashboardApi } from "@/lib/api";
import type { Project, InsertProject, ProjectTemplate } from "@/types";
import { useToast } from "@/hooks/use-toast";

export function useProjects(facultyId?: number) {
  return useQuery({
    queryKey: ["/api/projects/faculty", facultyId],
    queryFn: () => projectApi.getByFaculty(facultyId!),
    enabled: !!facultyId,
  });
}

export function useProject(id?: number) {
  return useQuery({
    queryKey: ["/api/projects", id],
    queryFn: () => projectApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (project: InsertProject) => projectApi.create(project),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Project Created",
        description: `${project.title} has been created successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create project: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, project }: { id: number; project: Partial<InsertProject> }) =>
      projectApi.update(id, project),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Project Updated",
        description: `${project.title} has been updated successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update project: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => projectApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Project Deleted",
        description: "The project has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete project: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

export function useProjectTemplates(discipline?: string) {
  return useQuery({
    queryKey: ["/api/templates", discipline],
    queryFn: () => templateApi.getAll(discipline),
  });
}

export function useProjectTemplate(id?: number) {
  return useQuery({
    queryKey: ["/api/templates", id],
    queryFn: () => templateApi.get(id!),
    enabled: !!id,
  });
}

export function useDashboardStats(facultyId?: number) {
  return useQuery({
    queryKey: ["/api/dashboard/stats", facultyId],
    queryFn: () => dashboardApi.getStats(facultyId!),
    enabled: !!facultyId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
