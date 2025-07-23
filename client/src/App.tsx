import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import MethodologyWizard from "@/pages/methodology-wizard";
import ObjectivesConverter from "@/pages/objectives-converter";
import Templates from "@/pages/templates";
import Collaboration from "@/pages/collaboration";
import KnowledgeBase from "@/pages/knowledge-base";
import Analytics from "@/pages/analytics";
import Integrations from "@/pages/integrations";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";

function Router() {
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
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
