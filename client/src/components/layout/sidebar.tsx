import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  BookOpen,
  Database,
  FileText,
  Home,
  WandSparkles,
  Plug,
  RefreshCw,
  Users,
} from "lucide-react";

const navigation = [
  {
    name: "Pedagogy Tool",
    href: "/dashboard",
    icon: Home,
    description: "Overview and quick actions",
  },
  {
    name: "Methodology Wizard", 
    href: "/methodology-wizard",
    icon: WandSparkles,
    description: "Guided Pivot-and-Launch setup",
  },
  {
    name: "Objectives Converter",
    href: "/objectives-converter", 
    icon: RefreshCw,
    description: "Transform learning objectives",
  },
  {
    name: "Project Templates",
    href: "/templates",
    icon: FileText,
    description: "Pre-built project frameworks",
  },
  {
    name: "Student Collaboration",
    href: "/collaboration",
    icon: Users,
    description: "Student contributions and feedback",
  },
  {
    name: "Knowledge Base",
    href: "/knowledge-base",
    icon: Database,
    description: "Institutional content library",
  },
];

const tools = [
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    description: "Usage and effectiveness metrics",
  },
  {
    name: "Integrations",
    href: "/integrations",
    icon: Plug,
    description: "AI tools and survey platforms",
  },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200 overflow-y-auto">
      <nav className="p-4 space-y-2">
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Main Features
          </h2>
        </div>

        {navigation.map((item) => {
          const isActive = location === item.href || (item.href === "/dashboard" && location === "/");
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "nav-link text-gray-700 hover:text-red-600",
                  isActive && "active bg-gray-100 text-red-600 font-medium"
                )}
              >
                <Icon 
                  className={cn(
                    "nav-icon",
                    isActive && "text-red-600"
                  )} 
                />
                {item.name}
              </div>
            </Link>
          );
        })}

        <div className="pt-4 border-t border-gray-200 mt-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Tools
          </h3>

          {tools.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "nav-link text-gray-700 hover:text-red-600",
                    isActive && "active bg-gray-100 text-red-600 font-medium"
                  )}
                >
                  <Icon 
                    className={cn(
                      "nav-icon",
                      isActive && "text-red-600"
                    )} 
                  />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
