import { useDefaultFaculty } from "@/hooks/use-faculty";
import { useProjects, useDashboardStats } from "@/hooks/use-projects";
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
  ArrowDown
} from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: faculty } = useDefaultFaculty();
  const { data: projects = [] } = useProjects(faculty?.id);
  const { data: stats } = useDashboardStats(faculty?.id);

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

          {/* Integration Status */}
          <div className="focus-card">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">AI Integrations</h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white text-xs font-bold">G</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">NotebookLM</p>
                    <p className="text-xs text-gray-500">Connected</p>
                  </div>
                </div>
                <span className="integration-status connected"></span>
              </div>
              
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white text-xs font-bold">M</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">Copilot</p>
                    <p className="text-xs text-gray-500">Available</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="text-blue-800">
                  Connect
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white text-xs font-bold">Q</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">Qualtrics</p>
                    <p className="text-xs text-gray-500">Connected</p>
                  </div>
                </div>
                <span className="integration-status connected"></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Anti-Overload Banner */}
      <AntiOverloadBanner />
    </div>
  );
}
