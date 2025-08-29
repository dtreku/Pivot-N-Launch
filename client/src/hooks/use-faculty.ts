import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { facultyApi } from "@/lib/api";
import type { Faculty, InsertFaculty } from "@/types";
import { useToast } from "@/hooks/use-toast";

export function useFaculty(id?: number) {
  return useQuery({
    queryKey: ["/api/faculty", id],
    queryFn: () => facultyApi.get(id!),
    enabled: !!id,
  });
}

export function useFacultyByEmail(email?: string) {
  return useQuery({
    queryKey: ["/api/faculty/email", email],
    queryFn: () => facultyApi.getByEmail(email!),
    enabled: !!email,
  });
}

export function useCreateFaculty() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (faculty: InsertFaculty) => facultyApi.create(faculty),
    onSuccess: (faculty) => {
      queryClient.invalidateQueries({ queryKey: ["/api/faculty"] });
      toast({
        title: "Faculty Created",
        description: `Profile for ${faculty.name} has been created successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create faculty profile: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateFaculty() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, faculty }: { id: number; faculty: Partial<InsertFaculty> }) =>
      facultyApi.update(id, faculty),
    onSuccess: (faculty) => {
      queryClient.invalidateQueries({ queryKey: ["/api/faculty"] });
      toast({
        title: "Profile Updated",
        description: `${faculty.name}'s profile has been updated successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update faculty profile: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

// Default faculty for development (Prof. Daniel Treku)
export function useDefaultFaculty() {
  return useQuery({
    queryKey: ["/api/faculty/email", "daniel.treku@university.edu"],
    queryFn: () => facultyApi.getByEmail("daniel.treku@university.edu"),
    retry: false,
  });
}
