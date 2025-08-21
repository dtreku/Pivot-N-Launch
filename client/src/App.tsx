import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import MethodologyWizard from "@/pages/methodology-wizard";
import ObjectivesConverter from "@/pages/objectives-converter";
import Templates from "@/pages/templates";
import Collaboration from "@/pages/collaboration";
import KnowledgeBase from "@/pages/knowledge-base";
import Analytics from "@/pages/analytics";
import Integrations from "@/pages/integrations";
import PivotAssets from "@/pages/pivot-assets";
import CognitiveLoadAnalytics from "@/pages/cognitive-load-analytics";
import DocumentManager from "@/pages/document-manager";
import Signin from "@/pages/signin";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";

function Router() {
  const { isAuthenticated, isLoading, signin, faculty } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Signin onSignin={signin} />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/methodology-wizard" component={MethodologyWizard} />
            <Route path="/objectives-converter" component={ObjectivesConverter} />
            <Route path="/templates" component={Templates} />
            <Route path="/collaboration" component={Collaboration} />
            <Route path="/knowledge-base" component={KnowledgeBase} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/integrations" component={Integrations} />
            <Route path="/pivot-assets" component={PivotAssets} />
            <Route path="/cognitive-load-analytics" component={CognitiveLoadAnalytics} />
            <Route path="/documents">
              {() => <DocumentManager facultyId={faculty?.id || 1} />}
            </Route>
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
