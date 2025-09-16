import { useDefaultFaculty } from "@/hooks/use-faculty";
import { useProjects, useDashboardStats } from "@/hooks/use-projects";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/ui/stats-card";
import AntiOverloadBanner from "@/components/ui/anti-overload-banner";
import { 
  ChartGantt, 
  Users, 
  TrendingUp, 
  Lightbulb,
  WandSparkles,
  Plus,
  Upload,
  Presentation,
  MessageSquare,
  ArrowDown,
  Brain,
  Zap,
  BarChart3,
  Check,
  Plug,
  AlertCircle
} from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: faculty } = useDefaultFaculty();
  const { data: projects = [] } = useProjects(faculty?.id);
  const { data: stats } = useDashboardStats(faculty?.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch integrations data to show dynamic status
  const { data: integrationsData } = useQuery<{
    userConnections: any[];
    adminConnections: any[];
    userRole: string;
  }>({
    queryKey: ["/api/integrations"],
  });

  const userConnections = integrationsData?.userConnections || [];
  const adminConnections = integrationsData?.adminConnections || [];
  const userRole = integrationsData?.userRole || 'instructor';
  const isAdmin = userRole === 'super_admin' || userRole === 'admin';

  // AI integration definitions (same as main integrations page)
  const AI_INTEGRATIONS = [
    {
      id: "notebooklm",
      name: "NotebookLM",
      icon: Brain,
      color: "blue",
    },
    {
      id: "copilot", 
      name: "Copilot",
      icon: Zap,
      color: "purple",
    },
    {
      id: "qualtrics",
      name: "Qualtrics", 
      icon: BarChart3,
      color: "orange",
    }
  ];

  // Get dynamic status for AI integrations
  const getIntegrationStatus = (integrationId: string) => {
    const userConnection = userConnections.find(
      (conn: any) => conn.integrationId === integrationId
    );
    const adminConnection = adminConnections.find(
      (conn: any) => conn.integrationId === integrationId
    );
    return (userConnection || adminConnection) ? "connected" : "available";
  };

  // Connect integration mutation
  const connectMutation = useMutation({
    mutationFn: async (integrationData: {
      integrationId: string;
      integrationName: string;
      integrationType: string;
    }) => {
      return await apiRequest("/api/integrations/connect", "POST", integrationData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      toast({
        title: "Integration Connected",
        description: "Successfully connected to the integration.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error?.message || "Failed to connect integration",
        variant: "destructive",
      });
    },
  });

  const handleConnect = (integrationId: string, integrationName: string) => {
    connectMutation.mutate({
      integrationId,
      integrationName,
      integrationType: "knowledge",
    });
  };

  return (
    <div className="anti-overload-container">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Pivot-and-Launch PBL Pedagogy Tool
        </h1>
        <p className="text-gray-600 text-lg">
          Transform information overload into focused, deep learning experiences
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Active Projects"
          value={stats?.activeProjects || 0}
          subtitle="Active Projects"
          icon={ChartGantt}
          iconColor="crimson"
        />
        <StatsCard
          title="Students Engaged"  
          value={stats?.studentsEngaged || 0}
          subtitle="Students Engaged"
          icon={Users}
          iconColor="blue"
        />
        <StatsCard
          title="Completion Rate"
          value={`${stats?.completionRate || 0}%`}
          subtitle="Completion Rate"
          icon={TrendingUp}
          iconColor="amber"
        />
        <StatsCard
          title="Average Rating"
          value={stats?.avgRating || 0}
          subtitle="Avg. Rating"
          icon={Lightbulb}
          iconColor="green"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Methodology Wizard */}
          <div className="focus-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Methodology Wizard</h2>
              <Link href="/methodology-wizard">
                <Button className="pbl-button-primary">
                  <WandSparkles className="w-4 h-4 mr-2" />
                  Start Wizard
                </Button>
              </Link>
            </div>
            
            <div className="space-y-4">
              <div className="methodology-step">
                <h3 className="font-medium text-gray-800 mb-2">
                  Step 1: Define Core Concepts (Pivot)
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  Strengthen foundational knowledge in your subject area
                </p>
                <div className="progress-bar">
                  <div className="progress-fill crimson w-3/4"></div>
                </div>
              </div>
              
              <div className="methodology-step">
                <h3 className="font-medium text-gray-800 mb-2">
                  Step 2: Extend Application (Launch)
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  Apply knowledge to new and diverse contexts
                </p>
                <div className="progress-bar">
                  <div className="progress-fill blue w-1/2"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Objectives Converter */}
          <div className="focus-card">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Learning Objectives Converter
            </h2>
            <p className="text-gray-600 mb-6">
              Transform traditional learning objectives into Pivot-and-Launch project frameworks
            </p>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-2">Traditional Objective</h3>
                <p className="text-sm text-gray-600 italic">
                  "Learn the basics of solidity syntax"
                </p>
              </div>
              
              <div className="flex justify-center">
                <ArrowDown className="text-yellow-500 w-6 h-6" />
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-medium text-red-600 mb-2">PBL Project Framework</h3>
                <p className="text-sm text-gray-800">
                  "Build a decentralized voting system smart contract that demonstrates core 
                  Solidity concepts through real-world application"
                </p>
              </div>
            </div>
            
            <Link href="/objectives-converter">
              <Button className="w-full mt-4 pbl-button-secondary">
                Convert My Objectives
              </Button>
            </Link>
          </div>

          {/* Project Templates Preview */}
          <div className="focus-card">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Featured Project Templates
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="template-card blockchain">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center mr-3">
                    <ChartGantt className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-medium text-gray-800">Blockchain Applications</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Smart contract development with real-world use cases
                </p>
                <div className="flex items-center text-xs text-gray-500">
                  <span>8-12 weeks</span>
                </div>
              </div>
              
              <div className="template-card data-science">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-blue-800 rounded-lg flex items-center justify-center mr-3">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-medium text-gray-800">Data Science</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Real-world data analysis and machine learning projects
                </p>
                <div className="flex items-center text-xs text-gray-500">
                  <span>6-10 weeks</span>
                </div>
              </div>
            </div>
            
            <Link href="/templates">
              <Button className="w-full mt-6 pbl-button-secondary">
                <Plus className="w-4 h-4 mr-2" />
                View All Templates
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <div className="focus-card">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
            
            <div className="space-y-3">
              <Link href="/templates">
                <Button className="w-full flex items-center justify-between p-3 bg-red-50 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-colors" data-testid="button-create-project">
                  <span className="font-medium">Create New Project</span>
                  <Plus className="w-4 h-4" />
                </Button>
              </Link>
              
              <Link href="/documents">
                <Button variant="outline" className="w-full flex items-center justify-between p-3" data-testid="button-upload-materials">
                  <span className="font-medium">Upload Course Materials</span>
                  <Upload className="w-4 h-4" />
                </Button>
              </Link>
              
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-between p-3" 
                data-testid="button-generate-presentation"
                onClick={() => {
                  window.open('/api/analytics/presentation', '_blank');
                }}
              >
                <span className="font-medium">Generate Presentation</span>
                <Presentation className="w-4 h-4" />
              </Button>
              
              <Link href="/collaboration">
                <Button variant="outline" className="w-full flex items-center justify-between p-3" data-testid="button-student-feedback">
                  <span className="font-medium">View Student Feedback</span>
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Recent Student Contributions */}
          <div className="focus-card">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Recent Contributions
            </h2>
            
            <div className="space-y-4">
              <div className="collaboration-card suggestion">
                <div className="w-8 h-8 bg-blue-800 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">DT</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">Daniel Treku</p>
                  <p className="text-xs text-gray-600">
                    Suggested: Blockchain voting system with mobile interface
                  </p>
                </div>
              </div>
              
              <div className="collaboration-card reflection">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">AS</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">Alice Smith</p>
                  <p className="text-xs text-gray-600">
                    Critical reflection: Need more real-world data examples
                  </p>
                </div>
              </div>
            </div>
            
            <Link href="/collaboration">
              <Button variant="outline" className="w-full mt-4 text-sm">
                View All Contributions
              </Button>
            </Link>
          </div>

          {/* Integration Status - Dynamic Data */}
          <div className="focus-card">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">AI Integrations</h2>
            
            <div className="space-y-3">
              {AI_INTEGRATIONS.map(integration => {
                const Icon = integration.icon;
                const status = getIntegrationStatus(integration.id);
                const isConnected = status === "connected";
                
                return (
                  <div key={integration.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 bg-${integration.color}-600 rounded-lg flex items-center justify-center mr-3`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{integration.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{status}</p>
                      </div>
                    </div>
                    {isConnected ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-blue-800"
                        onClick={() => handleConnect(integration.id, integration.name)}
                        disabled={connectMutation.isPending}
                        data-testid={`button-connect-${integration.id}`}
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
            
            <Link href="/integrations">
              <Button variant="outline" className="w-full mt-4 text-sm">
                View All Integrations
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Anti-Overload Banner */}
      <AntiOverloadBanner />
    </div>
  );
}
