import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import {
  Plug,
  ExternalLink,
  Check,
  AlertCircle,
  Settings,
  Cloud,
  Brain,
  BarChart3,
  Users,
  FileText,
  MessageSquare,
  Zap,
  Shield,
  Globe,
  Database,
} from "lucide-react";
import type { IntegrationStatus } from "@/types";

const integrationConfigSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  endpoint: z.string().url("Must be a valid URL").optional(),
  settings: z.record(z.any()).optional(),
});

type IntegrationConfig = z.infer<typeof integrationConfigSchema>;

const INTEGRATIONS: Array<{
  id: string;
  name: string;
  description: string;
  category: "ai" | "survey" | "lms" | "cloud" | "analytics";
  status: IntegrationStatus["status"];
  icon: any;
  color: string;
  features: string[];
  pricing: string;
  documentation: string;
  requiresAuth: boolean;
  enterprise?: boolean;
}> = [
  {
    id: "notebooklm",
    name: "Google NotebookLM",
    description: "Knowledge-powered research assistant for institutional knowledge curation",
    category: "knowledge",
    status: "connected",
    icon: Brain,
    color: "blue",
    features: [
      "Document analysis and summarization",
      "Automatic fact-checking",
      "Research assistance",
      "Audio overview generation",
      "BigQuery integration"
    ],
    pricing: "Enterprise: Usage-based pricing",
    documentation: "https://cloud.google.com/agentspace/notebooklm-enterprise/docs",
    requiresAuth: true,
    enterprise: true,
  },
  {
    id: "copilot",
    name: "Microsoft Copilot",
    description: "Knowledge assistant for brainstorming projects and generating content",
    category: "knowledge",
    status: "available",
    icon: Zap,
    color: "purple",
    features: [
      "Project brainstorming",
      "Research question generation",
      "Project structure creation",
      "Timeline management",
      "Content adaptation"
    ],
    pricing: "Microsoft 365: $30/user/month",
    documentation: "https://docs.microsoft.com/copilot",
    requiresAuth: true,
  },
  {
    id: "qualtrics",
    name: "Qualtrics",
    description: "Advanced survey platform for student feedback collection",
    category: "survey",
    status: "connected",
    icon: BarChart3,
    color: "orange",
    features: [
      "Student feedback surveys",
      "Real-time analytics",
      "Advanced reporting",
      "API integration",
      "Custom dashboards"
    ],
    pricing: "Enterprise: Custom pricing",
    documentation: "https://api.qualtrics.com/",
    requiresAuth: true,
    enterprise: true,
  },
  {
    id: "canvas",
    name: "Canvas LMS",
    description: "Learning Management System integration for seamless course delivery",
    category: "lms",
    status: "available",
    icon: FileText,
    color: "red",
    features: [
      "Grade passback",
      "Assignment sync",
      "Student roster import",
      "Content integration",
      "Single sign-on"
    ],
    pricing: "Institutional license required",
    documentation: "https://canvas.instructure.com/doc/api/",
    requiresAuth: true,
  },
  {
    id: "teams",
    name: "Microsoft Teams",
    description: "Collaboration platform for student team projects",
    category: "cloud",
    status: "available",
    icon: Users,
    color: "blue",
    features: [
      "Team creation",
      "File sharing",
      "Video conferencing",
      "Project channels",
      "Assignment integration"
    ],
    pricing: "Microsoft 365: Included",
    documentation: "https://docs.microsoft.com/graph/teams-concept",
    requiresAuth: true,
  },
  {
    id: "github",
    name: "GitHub Classroom",
    description: "Code repository management for programming projects",
    category: "cloud",
    status: "available",
    icon: Database,
    color: "gray",
    features: [
      "Repository management",
      "Assignment distribution",
      "Code review tools",
      "Progress tracking",
      "Collaboration features"
    ],
    pricing: "Free for education",
    documentation: "https://docs.github.com/education",
    requiresAuth: true,
  },
];

export default function Integrations() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [configDialog, setConfigDialog] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<IntegrationConfig>({
    resolver: zodResolver(integrationConfigSchema),
    defaultValues: {
      apiKey: "",
      endpoint: "",
      settings: {},
    },
  });

  // Fetch user's integrations from API
  const { data: integrationsData, isLoading: integrationsLoading } = useQuery({
    queryKey: ["/api/integrations"],
  });

  const userConnections = integrationsData?.userConnections || [];
  const adminConnections = integrationsData?.adminConnections || [];

  // Combine static integration info with connection status
  const combinedIntegrations = INTEGRATIONS.map(integration => {
    const userConnection = userConnections.find(
      conn => conn.integrationId === integration.id
    );
    const adminConnection = adminConnections.find(
      conn => conn.integrationId === integration.id
    );
    
    return {
      ...integration,
      status: (userConnection || adminConnection) ? "connected" : "available",
      connectionId: userConnection?.id || adminConnection?.id,
      isAdminConnection: !!adminConnection && !userConnection,
    };
  });

  const filteredIntegrations = selectedCategory === "all" 
    ? combinedIntegrations 
    : combinedIntegrations.filter(integration => integration.category === selectedCategory);

  const getStatusIcon = (status: IntegrationStatus["status"]) => {
    switch (status) {
      case "connected":
        return <Check className="w-4 h-4 text-green-600" />;
      case "available":
        return <Plug className="w-4 h-4 text-gray-400" />;
      case "disconnected":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusBadge = (status: IntegrationStatus["status"]) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
      case "available":
        return <Badge variant="outline">Available</Badge>;
      case "disconnected":
        return <Badge className="bg-red-100 text-red-800">Disconnected</Badge>;
    }
  };

  // Connect integration mutation
  const connectMutation = useMutation({
    mutationFn: async (integrationData: {
      integrationId: string;
      integrationName: string;
      integrationType: string;
      parameters?: Record<string, any>;
      isAdminManaged?: boolean;
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

  // Disconnect integration mutation
  const disconnectMutation = useMutation({
    mutationFn: async (connectionId: number) => {
      return await apiRequest(`/api/integrations/${connectionId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      toast({
        title: "Integration Disconnected",
        description: "Successfully disconnected from the integration.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Disconnection Failed",
        description: error?.message || "Failed to disconnect integration",
        variant: "destructive",
      });
    },
  });

  const handleConnect = (integrationId: string) => {
    const integration = INTEGRATIONS.find(i => i.id === integrationId);
    if (!integration) return;

    connectMutation.mutate({
      integrationId: integration.id,
      integrationName: integration.name,
      integrationType: integration.category,
      parameters: {},
      isAdminManaged: false,
    });
  };

  const handleDisconnect = (integrationId: string) => {
    const integration = combinedIntegrations.find(i => i.id === integrationId);
    if (!integration?.connectionId) return;

    disconnectMutation.mutate(integration.connectionId);
  };

  // Configuration mutation
  const configureMutation = useMutation({
    mutationFn: async (configData: {
      connectionId: number;
      parameters: Record<string, any>;
    }) => {
      return await apiRequest(`/api/integrations/${configData.connectionId}/configure`, "PUT", { parameters: configData.parameters });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      setConfigDialog(null);
      form.reset();
      toast({
        title: "Integration Configured",
        description: "Successfully updated integration settings.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Configuration Failed", 
        description: error?.message || "Failed to update integration settings",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: IntegrationConfig) => {
    const integration = combinedIntegrations.find(i => i.id === configDialog);
    if (!integration?.connectionId) return;

    configureMutation.mutate({
      connectionId: integration.connectionId,
      parameters: {
        apiKey: data.apiKey,
        endpoint: data.endpoint,
        ...data.settings,
      },
    });
  };

  const categories = [
    { value: "all", label: "All Integrations", icon: Plug },
    { value: "knowledge", label: "Knowledge Tools", icon: Brain },
    { value: "survey", label: "Survey Platforms", icon: BarChart3 },
    { value: "lms", label: "Learning Management", icon: FileText },
    { value: "cloud", label: "Cloud Services", icon: Cloud },
    { value: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  if (integrationsLoading) {
    return (
      <div className="anti-overload-container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Integrations
          </h1>
          <p className="text-gray-600 text-lg">
            Connect knowledge tools, survey platforms, and educational services to enhance your PBL toolkit
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-pulse text-gray-500 mb-4">Loading integrations...</div>
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="anti-overload-container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Integrations
        </h1>
        <p className="text-gray-600 text-lg">
          Connect knowledge tools, survey platforms, and educational services to enhance your PBL toolkit
        </p>
      </div>

      {/* Connected Services Overview */}
      <Card className="focus-card p-0 mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2 text-green-600" />
            Connected Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-800">NotebookLM Enterprise</p>
                <p className="text-sm text-gray-600">Knowledge Research Assistant</p>
              </div>
              <Check className="w-5 h-5 text-green-600" />
            </div>

            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-800">Qualtrics</p>
                <p className="text-sm text-gray-600">Survey Platform</p>
              </div>
              <Check className="w-5 h-5 text-green-600" />
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-800">Microsoft Copilot</p>
                <p className="text-sm text-gray-600">Available to Connect</p>
              </div>
              <Button size="sm" variant="outline">Connect</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          {categories.map(category => {
            const Icon = category.icon;
            return (
              <TabsTrigger key={category.value} value={category.value} className="flex items-center space-x-2">
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{category.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={selectedCategory}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIntegrations.map(integration => {
              const Icon = integration.icon;
              
              return (
                <Card key={integration.id} className="focus-card p-0">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 bg-${integration.color}-600 rounded-lg flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          {integration.enterprise && (
                            <Badge variant="outline" className="text-xs mt-1">
                              Enterprise
                            </Badge>
                          )}
                        </div>
                      </div>
                      {getStatusIcon(integration.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm mb-4">
                      {integration.description}
                    </p>

                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-gray-800 text-sm mb-2">Features:</h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {integration.features.slice(0, 3).map(feature => (
                            <li key={feature} className="flex items-center">
                              <div className="w-1 h-1 bg-gray-400 rounded-full mr-2" />
                              {feature}
                            </li>
                          ))}
                          {integration.features.length > 3 && (
                            <li className="text-gray-500">+{integration.features.length - 3} more</li>
                          )}
                        </ul>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        {getStatusBadge(integration.status)}
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(integration.documentation, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                          
                          {integration.status === "connected" ? (
                            <>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <Settings className="w-3 h-3 mr-1" />
                                    Config
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Configure {integration.name}</DialogTitle>
                                  </DialogHeader>
                                  <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                      <FormField
                                        control={form.control}
                                        name="apiKey"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>API Key</FormLabel>
                                            <FormControl>
                                              <Input {...field} type="password" placeholder="Enter API key..." />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      
                                      {integration.requiresAuth && (
                                        <FormField
                                          control={form.control}
                                          name="endpoint"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Endpoint URL (Optional)</FormLabel>
                                              <FormControl>
                                                <Input {...field} placeholder="https://api.example.com" />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                      )}

                                      <div className="flex justify-end space-x-2">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          onClick={() => handleDisconnect(integration.id)}
                                          disabled={disconnectMutation.isPending}
                                          data-testid={`button-disconnect-${integration.id}`}
                                        >
                                          {disconnectMutation.isPending ? "Disconnecting..." : "Disconnect"}
                                        </Button>
                                        <Button 
                                          type="submit"
                                          disabled={configureMutation.isPending}
                                          data-testid={`button-update-config-${integration.id}`}
                                        >
                                          {configureMutation.isPending ? "Updating..." : "Update"}
                                        </Button>
                                      </div>
                                    </form>
                                  </Form>
                                </DialogContent>
                              </Dialog>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleConnect(integration.id)}
                              className="pbl-button-primary"
                              disabled={connectMutation.isPending}
                              data-testid={`button-connect-${integration.id}`}
                            >
                              {connectMutation.isPending ? "Connecting..." : "Connect"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Integration Benefits */}
      <Card className="focus-card p-0 mt-8">
        <CardHeader>
          <CardTitle>Why Use Integrations?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Brain className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-medium text-gray-800 mb-2">Enhanced AI Support</h3>
              <p className="text-sm text-gray-600">
                Leverage advanced AI tools for content generation, research assistance, and intelligent recommendations.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-800 mb-2">Rich Analytics</h3>
              <p className="text-sm text-gray-600">
                Collect comprehensive feedback and analytics to continuously improve your PBL methodology.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-800 mb-2">Workflow Automation</h3>
              <p className="text-sm text-gray-600">
                Streamline repetitive tasks and focus on what matters most - effective teaching and learning.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
