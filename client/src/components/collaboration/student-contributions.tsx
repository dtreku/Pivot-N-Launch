import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { contributionApi } from "@/lib/api";
import {
  MessageSquare,
  Lightbulb,
  ThumbsUp,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  MoreHorizontal,
  Reply,
  Calendar,
} from "lucide-react";
import type { StudentContribution, Project } from "@/types";

interface StudentContributionsProps {
  contributions: StudentContribution[];
  projects: Project[];
}

export default function StudentContributions({ contributions, projects }: StudentContributionsProps) {
  const [selectedContribution, setSelectedContribution] = useState<StudentContribution | null>(null);
  const [responseText, setResponseText] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      contributionApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contributions"] });
      toast({
        title: "Status Updated",
        description: "The contribution status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const getContributionIcon = (type: string) => {
    switch (type) {
      case "suggestion":
        return <Lightbulb className="w-4 h-4 text-yellow-600" />;
      case "reflection":
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case "feedback":
        return <ThumbsUp className="w-4 h-4 text-green-600" />;
      case "question":
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "implemented":
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "pending":
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "approved":
        return "bg-green-100 text-green-800 border-green-300";
      case "implemented":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getContributionTypeColor = (type: string) => {
    switch (type) {
      case "suggestion":
        return "bg-yellow-100 text-yellow-800";
      case "reflection":
        return "bg-blue-100 text-blue-800";
      case "feedback":
        return "bg-green-100 text-green-800";
      case "question":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProjectTitle = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    return project?.title || "Unknown Project";
  };

  const getStudentInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleStatusChange = (contributionId: number, newStatus: string) => {
    updateStatus.mutate({ id: contributionId, status: newStatus });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (contributions.length === 0) {
    return (
      <Card className="focus-card">
        <CardContent className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No Contributions Yet</h3>
          <p className="text-gray-600 mb-4">
            Student contributions and feedback will appear here as they participate in your projects.
          </p>
          <Button variant="outline">
            Invite Students to Contribute
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {contributions.map(contribution => (
        <Card key={contribution.id} className="focus-card p-0">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-gray-100 text-gray-600">
                    {getStudentInitials(contribution.studentName)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-medium text-gray-800 truncate">
                      {contribution.studentName}
                    </h3>
                    {contribution.studentEmail && (
                      <span className="text-xs text-gray-500 truncate">
                        {contribution.studentEmail}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-2">
                    {getContributionIcon(contribution.contributionType)}
                    <Badge className={`text-xs ${getContributionTypeColor(contribution.contributionType)}`}>
                      {contribution.contributionType}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {getProjectTitle(contribution.projectId)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(contribution.createdAt)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge className={`text-xs border ${getStatusColor(contribution.status)}`}>
                  {getStatusIcon(contribution.status)}
                  <span className="ml-1 capitalize">{contribution.status}</span>
                </Badge>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        {getContributionIcon(contribution.contributionType)}
                        <span>Student Contribution Details</span>
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Student:</span>
                          <p>{contribution.studentName}</p>
                        </div>
                        <div>
                          <span className="font-medium">Type:</span>
                          <p className="capitalize">{contribution.contributionType}</p>
                        </div>
                        <div>
                          <span className="font-medium">Project:</span>
                          <p>{getProjectTitle(contribution.projectId)}</p>
                        </div>
                        <div>
                          <span className="font-medium">Date:</span>
                          <p>{formatDate(contribution.createdAt)}</p>
                        </div>
                      </div>
                      
                      <div>
                        <span className="font-medium text-sm">Content:</span>
                        <div className="bg-gray-50 rounded-lg p-3 mt-1">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {contribution.content}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <span className="font-medium text-sm">Status Update:</span>
                        <div className="flex items-center space-x-2 mt-2">
                          <Select
                            value={contribution.status}
                            onValueChange={(value) => handleStatusChange(contribution.id, value)}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending Review</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="implemented">Implemented</SelectItem>
                              <SelectItem value="rejected">Not Applicable</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <span className="font-medium text-sm">Faculty Response:</span>
                        <Textarea
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          placeholder="Provide feedback or response to the student..."
                          className="mt-2"
                          rows={3}
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-2 pt-4 border-t">
                        <Button variant="outline" size="sm">
                          <Reply className="w-4 h-4 mr-2" />
                          Send Response
                        </Button>
                        <Button size="sm" className="pbl-button-primary">
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <p className="text-sm text-gray-700 mb-4 line-clamp-3">
              {contribution.content}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span>Project: {getProjectTitle(contribution.projectId)}</span>
                <span>•</span>
                <span>{formatDate(contribution.createdAt)}</span>
              </div>
              
              {contribution.status === "pending" && (
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(contribution.id, "approved")}
                    className="text-xs"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(contribution.id, "rejected")}
                    className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
