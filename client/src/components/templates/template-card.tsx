import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  Download, 
  Eye, 
  Clock, 
  Users, 
  Star, 
  BookOpen, 
  Target, 
  Lightbulb,
  CheckCircle,
  ArrowRight,
  Check,
  X,
  AlertCircle
} from "lucide-react";
import type { ProjectTemplate } from "@/types";

interface TemplateCardProps {
  template: ProjectTemplate;
  onCreateProject: () => void;
  onExportTemplate: () => void;
  isSelected?: boolean;
  onSelect?: () => void;
  showApprovalActions?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
}

export default function TemplateCard({
  template,
  onCreateProject,
  onExportTemplate,
  isSelected = false,
  onSelect,
  showApprovalActions = false,
  onApprove,
  onReject,
}: TemplateCardProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const getDifficultyColor = (level: string | null) => {
    switch (level) {
      case "beginner":
        return "bg-green-100 text-green-800";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "development":
        return "fas fa-code";
      case "analysis":
        return "fas fa-chart-line";
      case "innovation":
        return "fas fa-lightbulb";
      case "strategy":
        return "fas fa-chess";
      default:
        return "fas fa-project-diagram";
    }
  };

  const getEstimatedWorkload = () => {
    const duration = template.estimatedDuration || "";
    const weeks = duration.match(/(\d+)/)?.[0];
    if (weeks) {
      const hoursPerWeek = 6; // Estimated hours per week
      return `~${parseInt(weeks) * hoursPerWeek} hours total`;
    }
    return "Time varies";
  };

  // Parse template content for structured display with null safety
  const templateContent = typeof template.template === 'object' && template.template !== null ? template.template as any : {};
  const phases = Array.isArray(templateContent?.phases) ? templateContent.phases : [];
  const deliverables = Array.isArray(templateContent?.deliverables) ? templateContent.deliverables : [];
  const tools = Array.isArray(templateContent?.tools) ? templateContent.tools : [];

  return (
    <>
      <Card 
        className={`template-card ${template.discipline.toLowerCase().replace(/\s+/g, "-")} ${
          isSelected ? "ring-2 ring-red-500" : ""
        }`}
        onClick={onSelect}
      >
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: template.color || "#6B7280" }}
              >
                <i className={template.icon || "fas fa-project-diagram"}></i>
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg truncate">{template.name}</CardTitle>
                <div className="flex items-center space-x-2 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {template.discipline}
                  </Badge>
                  {template.difficultyLevel && (
                    <Badge className={`text-xs ${getDifficultyColor(template.difficultyLevel)}`}>
                      {template.difficultyLevel}
                    </Badge>
                  )}
                  {template.status && template.status !== 'approved' && (
                    <Badge className={`text-xs ${getStatusColor(template.status)}`}>
                      {template.status === 'pending' && <AlertCircle className="w-3 h-3 mr-1" />}
                      {template.status}
                    </Badge>
                  )}
                  {template.isFeatured && (
                    <Badge className="text-xs bg-amber-100 text-amber-800">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setIsPreviewOpen(true);
              }}
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
            {template.description}
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                <span>{template.estimatedDuration}</span>
              </div>
              <div className="flex items-center">
                <Users className="w-3 h-3 mr-1" />
                <span>Team Project</span>
              </div>
            </div>

            {phases.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">Project Phases:</h4>
                <div className="flex flex-wrap gap-1">
                  {phases.slice(0, 3).map((phase: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {phase}
                    </Badge>
                  ))}
                  {phases.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{phases.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {showApprovalActions && template.status === 'pending' ? (
              <div className="flex gap-2 pt-3 border-t">
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onApprove?.();
                  }}
                  className="flex-1 bg-green-600 text-white hover:bg-green-700 text-xs"
                  data-testid={`button-approve-${template.id}`}
                >
                  <Check className="w-3 h-3 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReject?.();
                  }}
                  className="flex-1 bg-red-600 text-white hover:bg-red-700 text-xs"
                  data-testid={`button-reject-${template.id}`}
                >
                  <X className="w-3 h-3 mr-1" />
                  Reject
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 pt-3 border-t">
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateProject();
                  }}
                  className="flex-1 pbl-button-primary text-xs"
                  disabled={template.status === 'pending' || template.status === 'rejected'}
                  data-testid={`button-use-template-${template.id}`}
                >
                  <Play className="w-3 h-3 mr-1" />
                  Use Template
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onExportTemplate();
                  }}
                  className="text-xs"
                  data-testid={`button-export-${template.id}`}
                >
                  <Download className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Template Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: template.color || "#6B7280" }}
              >
                <i className={template.icon || "fas fa-project-diagram"}></i>
              </div>
              <div>
                <span>{template.name}</span>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {template.discipline}
                  </Badge>
                  <Badge className={`text-xs ${getDifficultyColor(template.difficultyLevel)}`}>
                    {template.difficultyLevel}
                  </Badge>
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="structure">Structure</TabsTrigger>
              <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
              <TabsTrigger value="implementation">Implementation</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Project Description
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {template.description}
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{template.estimatedDuration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Workload:</span>
                      <span className="font-medium">{getEstimatedWorkload()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Difficulty:</span>
                      <Badge className={`text-xs ${getDifficultyColor(template.difficultyLevel)}`}>
                        {template.difficultyLevel}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    Learning Outcomes
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      Master core {template.discipline.toLowerCase()} concepts through practical application
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      Develop problem-solving skills in real-world contexts
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      Build collaboration and communication abilities
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      Create portfolio-worthy deliverables
                    </li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="structure" className="space-y-4">
              {phases.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Project Phases</h3>
                  <div className="space-y-3">
                    {phases.map((phase: string, index: number) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">{phase}</h4>
                          <p className="text-sm text-gray-600">
                            {index === 0 && "Initial planning and research phase"}
                            {index === 1 && "Core development and implementation"}
                            {index === 2 && "Testing and refinement"}
                            {index === 3 && "Final presentation and evaluation"}
                            {index > 3 && "Advanced project activities"}
                          </p>
                        </div>
                        {index < phases.length - 1 && (
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="deliverables" className="space-y-4">
              {deliverables.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Expected Deliverables</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {deliverables.map((deliverable: string, index: number) => (
                      <div key={index} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-gray-800">{deliverable}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Detailed specifications and requirements will be provided
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="implementation" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tools.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Recommended Tools</h3>
                    <div className="space-y-2">
                      {tools.map((tool: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {tool}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Implementation Tips
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Start with clear project scope and timeline</li>
                    <li>• Establish regular check-in points with teams</li>
                    <li>• Encourage iterative development and feedback</li>
                    <li>• Connect project outcomes to real-world applications</li>
                    <li>• Provide scaffolding for complex technical concepts</li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Pivot-and-Launch Integration</h4>
                <p className="text-sm text-blue-700">
                  This template is designed with the Pivot-and-Launch methodology in mind. 
                  Students will first master core concepts (pivot) before applying them in 
                  diverse, challenging contexts (launch) to prevent information overload while 
                  ensuring deep learning.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-3 pt-4 border-t">
            <Button 
              onClick={() => {
                onCreateProject();
                setIsPreviewOpen(false);
              }}
              className="flex-1 pbl-button-primary"
            >
              <Play className="w-4 h-4 mr-2" />
              Use This Template
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                onExportTemplate();
                setIsPreviewOpen(false);
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
