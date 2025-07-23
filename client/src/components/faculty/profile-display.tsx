import { useDefaultFaculty } from "@/hooks/use-faculty";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export default function FacultyProfile() {
  const { data: faculty, isLoading, error } = useDefaultFaculty();

  if (isLoading) {
    return (
      <div className="flex items-center space-x-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    );
  }

  if (error || !faculty) {
    return (
      <div className="flex items-center space-x-3">
        <Avatar className="w-10 h-10">
          <AvatarFallback className="bg-red-600 text-white">
            DT
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium text-gray-800">Prof. Daniel Treku</p>
          <p className="text-xs text-gray-500">Fintech, Information Systems and Data Science</p>
        </div>
      </div>
    );
  }

  const initials = faculty.name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="faculty-profile">
      <Avatar className="faculty-avatar">
        {faculty.photoUrl && (
          <AvatarImage 
            src={faculty.photoUrl} 
            alt={faculty.name}
            className="object-cover"
          />
        )}
        <AvatarFallback className="bg-red-600 text-white">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm font-medium text-gray-800">{faculty.name}</p>
        <p className="text-xs text-gray-500">{faculty.title}</p>
      </div>
    </div>
  );
}
