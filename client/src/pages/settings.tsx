import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Key, 
  User, 
  Settings as SettingsIcon, 
  Save, 
  Eye, 
  EyeOff,
  AlertCircle,
  CheckCircle,
  Trash2,
  Shield
} from "lucide-react";

export default function Settings() {
  const { faculty, refreshUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiKeyStatus, setApiKeyStatus] = useState<"none" | "testing" | "valid" | "invalid">("none");
  const [showSystemApiKey, setShowSystemApiKey] = useState(false);
  const [systemApiKey, setSystemApiKey] = useState("");
  const [systemApiKeyStatus, setSystemApiKeyStatus] = useState<"none" | "valid" | "loading">("loading");

  const isAdmin = faculty?.role === 'super_admin' || faculty?.role === 'admin';

  // Load current API key status
  const { data: userSettings, isLoading } = useQuery({
    queryKey: ["/api/faculty/settings", faculty?.id],
    queryFn: () => apiRequest(`/api/faculty/${faculty?.id}/settings`, "GET"),
    enabled: !!faculty?.id,
    onSuccess: (data: any) => {
      if (data.hasApiKey) {
        setApiKeyStatus("valid");
      }
    }
  });

  const updateApiKeyMutation = useMutation({
    mutationFn: (newApiKey: string) => {
      return apiRequest(`/api/faculty/${faculty?.id}/api-key`, "PUT", { apiKey: newApiKey });
    },
    onSuccess: () => {
      setApiKeyStatus("valid");
      queryClient.invalidateQueries({ queryKey: ["/api/faculty/settings", faculty?.id] });
      refreshUser();
      toast({
        title: "Success",
        description: "OpenAI API key updated successfully",
      });
      setApiKey(""); // Clear the input for security only on success
    },
    onError: (error: any) => {
      setApiKeyStatus("invalid");
      toast({
        title: "Error",
        description: error.message || "Failed to update API key",
        variant: "destructive",
      });
      // Don't clear the API key on error so user can fix and retry
    },
  });

  const deleteApiKeyMutation = useMutation({
    mutationFn: () => {
      return apiRequest(`/api/faculty/${faculty?.id}/api-key`, "DELETE");
    },
    onSuccess: () => {
      setApiKeyStatus("none");
      queryClient.invalidateQueries({ queryKey: ["/api/faculty/settings", faculty?.id] });
      refreshUser();
      toast({
        title: "Success",
        description: "OpenAI API key removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove API key",
        variant: "destructive",
      });
    },
  });

  // Load system default API key status (admin only)
  const { data: systemSettings } = useQuery({
    queryKey: ["/api/admin/settings/openai-key"],
    queryFn: () => apiRequest("/api/admin/settings/openai-key", "GET"),
    enabled: isAdmin,
    onSuccess: (data: any) => {
      setSystemApiKeyStatus(data.hasDefaultKey ? "valid" : "none");
    },
    onError: () => {
      setSystemApiKeyStatus("none");
    }
  });

  const updateSystemApiKeyMutation = useMutation({
    mutationFn: (newSystemKey: string) => {
      return apiRequest("/api/admin/settings/openai-key", "PUT", { apiKey: newSystemKey });
    },
    onSuccess: () => {
      setSystemApiKeyStatus("valid");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/openai-key"] });
      toast({
        title: "Success",
        description: "System default OpenAI API key updated successfully",
      });
      setSystemApiKey(""); // Clear the input for security
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update system default API key",
        variant: "destructive",
      });
    },
  });

  const deleteSystemApiKeyMutation = useMutation({
    mutationFn: () => {
      return apiRequest("/api/admin/settings/openai-key", "DELETE");
    },
    onSuccess: () => {
      setSystemApiKeyStatus("none");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/openai-key"] });
      toast({
        title: "Success",
        description: "System default OpenAI API key removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove system default API key",
        variant: "destructive",
      });
    },
  });

  const testApiKeyMutation = useMutation({
    mutationFn: (testKey: string) => {
      return apiRequest("/api/openai/test", "POST", { apiKey: testKey });
    },
    onMutate: () => {
      setApiKeyStatus("testing");
    },
    onSuccess: () => {
      setApiKeyStatus("valid");
      toast({
        title: "Success",
        description: "API key is valid and working!",
      });
      // Don't clear the input on test success so user can save it
    },
    onError: () => {
      setApiKeyStatus("invalid");
      toast({
        title: "Invalid API Key",
        description: "The API key is not valid or has expired",
        variant: "destructive",
      });
      // Don't clear the input on test failure so user can see and fix the key
    },
  });

  const handleSaveApiKey = () => {
    if (!apiKey || apiKey.length < 20) {
      toast({
        title: "Invalid API Key",
        description: "Please enter a valid OpenAI API key",
        variant: "destructive",
      });
      return;
    }
    updateApiKeyMutation.mutate(apiKey);
  };

  const handleTestApiKey = () => {
    if (!apiKey || apiKey.length < 20) {
      toast({
        title: "Invalid API Key",
        description: "Please enter a valid OpenAI API key to test",
        variant: "destructive",
      });
      return;
    }
    testApiKeyMutation.mutate(apiKey);
  };

  const getApiKeyStatusIcon = () => {
    switch (apiKeyStatus) {
      case "valid":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "invalid":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "testing":
        return <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      default:
        return null;
    }
  };

  const getApiKeyStatusText = () => {
    switch (apiKeyStatus) {
      case "valid":
        return "Valid API key configured";
      case "invalid":
        return "Invalid or expired API key";
      case "testing":
        return "Testing API key...";
      default:
        return "No API key configured";
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <SettingsIcon className="w-8 h-8" />
          Account Settings
        </h1>
        <p className="text-lg text-gray-600">
          Manage your account preferences and API integrations
        </p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Your account details and institutional information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-sm font-medium">Name</Label>
              <p className="text-gray-800">{faculty?.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Email</Label>
              <p className="text-gray-600">{faculty?.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Role</Label>
              <p className="text-gray-600 capitalize">{faculty?.role?.replace('_', ' ')}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Institution</Label>
              <p className="text-gray-600">{faculty?.institution}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* OpenAI API Key Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            OpenAI API Key
          </CardTitle>
          <CardDescription>
            Configure your personal OpenAI API key for document processing and semantic search.
            This enables AI-powered features like document analysis and intelligent search.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* API Key Status */}
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            {getApiKeyStatusIcon()}
            <span className="text-sm font-medium">{getApiKeyStatusText()}</span>
          </div>

          {/* API Key Input */}
          <div className="space-y-2">
            <Label htmlFor="api-key">OpenAI API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="api-key"
                  type={showApiKey ? "text" : "password"}
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  data-testid="input-openai-api-key"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <Button
                onClick={handleTestApiKey}
                variant="outline"
                disabled={!apiKey || testApiKeyMutation.isPending}
                data-testid="button-test-api-key"
              >
                Test
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Get your API key from{" "}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                OpenAI Platform
              </a>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleSaveApiKey}
              disabled={!apiKey || updateApiKeyMutation.isPending}
              data-testid="button-save-api-key"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateApiKeyMutation.isPending ? "Saving..." : "Save API Key"}
            </Button>
            
            {userSettings?.hasApiKey && (
              <Button
                variant="outline"
                onClick={() => deleteApiKeyMutation.mutate()}
                disabled={deleteApiKeyMutation.isPending}
                data-testid="button-remove-api-key"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleteApiKeyMutation.isPending ? "Removing..." : "Remove API Key"}
              </Button>
            )}
          </div>

          {/* Benefits Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">What this enables:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• AI-powered document analysis and text extraction</li>
              <li>• Semantic search across your uploaded materials</li>
              <li>• Intelligent content recommendations</li>
              <li>• Automated document summarization</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* System Administration Section (Admin Only) */}
      {isAdmin && (
        <>
          <Separator />
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600" />
                System Administration
              </CardTitle>
              <CardDescription>
                Configure system-wide settings. This section is only available to administrators.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* System Default OpenAI API Key */}
              <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                <h4 className="font-medium text-orange-900 mb-2 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  System Default OpenAI API Key
                </h4>
                <p className="text-sm text-orange-800 mb-4">
                  This key serves as a fallback when users don't have their own OpenAI API key configured.
                  It will be used for system-wide operations and AI features for users without personal keys.
                </p>
                
                {/* System API Key Status */}
                <div className="flex items-center gap-2 p-3 bg-white rounded-lg mb-4">
                  {systemApiKeyStatus === "valid" && <CheckCircle className="w-4 h-4 text-green-600" />}
                  {systemApiKeyStatus === "none" && <AlertCircle className="w-4 h-4 text-gray-600" />}
                  {systemApiKeyStatus === "loading" && (
                    <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                  )}
                  <span className="text-sm font-medium">
                    {systemApiKeyStatus === "valid" && "System default key configured"}
                    {systemApiKeyStatus === "none" && "No system default key"}
                    {systemApiKeyStatus === "loading" && "Loading..."}
                  </span>
                </div>

                {/* System API Key Input */}
                <div className="space-y-2">
                  <Label htmlFor="system-api-key">System Default OpenAI API Key</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="system-api-key"
                        type={showSystemApiKey ? "text" : "password"}
                        placeholder="sk-..."
                        value={systemApiKey}
                        onChange={(e) => setSystemApiKey(e.target.value)}
                        data-testid="input-system-openai-api-key"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowSystemApiKey(!showSystemApiKey)}
                      >
                        {showSystemApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* System API Key Actions */}
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => updateSystemApiKeyMutation.mutate(systemApiKey)}
                    disabled={!systemApiKey || updateSystemApiKeyMutation.isPending}
                    className="bg-orange-600 hover:bg-orange-700"
                    data-testid="button-save-system-api-key"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateSystemApiKeyMutation.isPending ? "Saving..." : "Save System Key"}
                  </Button>
                  
                  {systemSettings?.hasDefaultKey && (
                    <Button
                      variant="outline"
                      onClick={() => deleteSystemApiKeyMutation.mutate()}
                      disabled={deleteSystemApiKeyMutation.isPending}
                      className="border-red-300 text-red-700 hover:bg-red-50"
                      data-testid="button-remove-system-api-key"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {deleteSystemApiKeyMutation.isPending ? "Removing..." : "Remove System Key"}
                    </Button>
                  )}
                </div>

                {/* Warning about system key */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                  <p className="text-sm text-red-800">
                    <strong>Security Notice:</strong> The system default API key should be managed carefully. 
                    It will be used for users who don't have their own keys configured. 
                    Monitor usage and costs associated with this key.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}