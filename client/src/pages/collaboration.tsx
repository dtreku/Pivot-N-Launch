import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDefaultFaculty } from "@/hooks/use-faculty";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/hooks/use-projects";
import { contributionApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import StudentContributions from "@/components/collaboration/student-contributions";
import {
  Users,
  MessageSquare,
  Lightbulb,
  ThumbsUp,
  Filter,
  Search,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import type { ContributionFilter } from "@/types";

const CONTRIBUTION_TYPES = [
  { value: "all", label: "All Types" },
  { value: "suggestion", label: "Project Suggestions" },
  { value: "reflection", label: "Critical Reflections" },
  { value: "feedback", label: "Feedback" },
  { value: "question", label: "Questions" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "implemented", label: "Implemented" },
  { value: "rejected", label: "Not Applicable" },
];

export default function Collaboration() {
  const [filters, setFilters] = useState<ContributionFilter>({
    type: "",
    status: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  const { data: faculty } = useDefaultFaculty();
  const { faculty: currentUser } = useAuth();
  const { data: projects = [] } = useProjects(faculty?.id);

  // Get all contributions across projects (unsorted baseline)
  const { data: rawContributions = [], isLoading } = useQuery({
    queryKey: ["/api/contributions/all", faculty?.id],
    queryFn: async () => {
      if (!projects.length) return [];
      
      const contributionsPromises = projects.map(project =>
        contributionApi.getByProject(project.id)
      );
      
      const contributionsArrays = await Promise.all(contributionsPromises);
      return contributionsArrays.flat().sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    enabled: !!faculty?.id && projects.length > 0,
  });

  // Sort contributions reactively to show current user first
  const allContributions = useMemo(() => {
    if (!rawContributions.length) return [];
    
    const currentUserEmail = currentUser?.email;
    if (!currentUserEmail) {
      // If no current user, just return date-sorted
      return rawContributions;
    }
    
    // Sort to show current user's contributions first, then others
    return [...rawContributions].sort((a, b) => {
      const aIsCurrentUser = a.studentEmail === currentUserEmail;
      const bIsCurrentUser = b.studentEmail === currentUserEmail;
      
      // If one is from current user and other is not, current user goes first
      if (aIsCurrentUser && !bIsCurrentUser) return -1;
      if (!aIsCurrentUser && bIsCurrentUser) return 1;
      
      // If both are from same user type (current user or others), sort by date
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [rawContributions, currentUser?.email]);

  // Filter contributions
  const filteredContributions = allContributions.filter(contribution => {
    const matchesSearch = !searchQuery ||
      contribution.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contribution.studentName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = !filters.type || contribution.contributionType === filters.type;
    const matchesStatus = !filters.status || contribution.status === filters.status;
    const matchesProject = !selectedProject || contribution.projectId === selectedProject;
    
    return matchesSearch && matchesType && matchesStatus && matchesProject;
  });

  // Calculate stats
  const stats = {
    total: allContributions.length,
    pending: allContributions.filter(c => c.status === "pending").length,
    approved: allContributions.filter(c => c.status === "approved").length,
    implemented: allContributions.filter(c => c.status === "implemented").length,
    uniqueStudents: new Set(allContributions.map(c => c.studentEmail)).size,
  };

  const getContributionIcon = (type: string) => {
    switch (type) {
      case "suggestion":
        return <Lightbulb className="w-4 h-4" />;
      case "reflection":
        return <MessageSquare className="w-4 h-4" />;
      case "feedback":
        return <ThumbsUp className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "implemented":
        return "bg-blue-100 text-blue-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="anti-overload-container">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-12 w-12 rounded-lg mb-4" />
              <Skeleton className="h-6 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="anti-overload-container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Student Collaboration
        </h1>
        <p className="text-gray-600 text-lg">
          Manage student contributions, feedback, and collaborative learning experiences
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="stats-card">
          <div className="flex items-center">
            <div className="stats-icon blue">
              <Users className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-800">{stats.uniqueStudents}</p>
              <p className="text-gray-500 text-sm">Active Students</p>
            </div>
          </div>
        </Card>

        <Card className="stats-card">
          <div className="flex items-center">
            <div className="stats-icon crimson">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              <p className="text-gray-500 text-sm">Total Contributions</p>
            </div>
          </div>
        </Card>

        <Card className="stats-card">
          <div className="flex items-center">
            <div className="stats-icon amber">
              <Clock className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-800">{stats.pending}</p>
              <p className="text-gray-500 text-sm">Pending Review</p>
            </div>
          </div>
        </Card>

        <Card className="stats-card">
          <div className="flex items-center">
            <div className="stats-icon green">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-800">{stats.implemented}</p>
              <p className="text-gray-500 text-sm">Implemented</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-auto grid-cols-4">
            <TabsTrigger value="all">All Contributions</TabsTrigger>
            <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            <TabsTrigger value="reflections">Reflections</TabsTrigger>
          </TabsList>

          <Button 
            className="pbl-button-primary" 
            data-testid="button-invite-students"
            onClick={() => {
              // Navigate to email invitation or modal functionality
              // For now, we'll use mailto as a fallback
              const subject = encodeURIComponent('Invitation to Contribute to PBL Project');
              const body = encodeURIComponent(`Hello,

You are invited to contribute to our Project-Based Learning initiative. Please visit our platform to share your ideas, feedback, and reflections.

Platform: ${window.location.origin}

Thank you for your participation!

Best regards,
${faculty?.name || 'Your Instructor'}`);
              
              window.location.href = `mailto:?subject=${subject}&body=${body}`;
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Invite Students
          </Button>
        </div>

        {/* Filters */}
        <Card className="focus-card p-0">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search contributions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select
                value={selectedProject?.toString() || ""}
                onValueChange={(value) => setSelectedProject(value ? parseInt(value) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.type || ""}
                onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Contribution Type" />
                </SelectTrigger>
                <SelectContent>
                  {CONTRIBUTION_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.status || ""}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <TabsContent value="all">
          <StudentContributions 
            contributions={filteredContributions}
            projects={projects}
          />
        </TabsContent>

        <TabsContent value="pending">
          <StudentContributions 
            contributions={filteredContributions.filter(c => c.status === "pending")}
            projects={projects}
          />
        </TabsContent>

        <TabsContent value="suggestions">
          <StudentContributions 
            contributions={filteredContributions.filter(c => c.contributionType === "suggestion")}
            projects={projects}
          />
        </TabsContent>

        <TabsContent value="reflections">
          <StudentContributions 
            contributions={filteredContributions.filter(c => c.contributionType === "reflection")}
            projects={projects}
          />
        </TabsContent>
      </Tabs>

      {/* Recent Activity Sidebar could go here if needed */}
    </div>
  );
}
