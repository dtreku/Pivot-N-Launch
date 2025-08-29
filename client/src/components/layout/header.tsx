import { Button } from "@/components/ui/button";
import { Download, Lightbulb } from "lucide-react";
import FacultyProfile from "@/components/faculty/profile-display";

export default function Header() {
  const handleExportToolkit = () => {
    // TODO: Implement export functionality
    console.log("Export toolkit requested");
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <Lightbulb className="text-white w-5 h-5" />
              </div>
              <h1 className="ml-3 text-xl font-bold text-gray-800">
                Pivot-and-Launch PBL Pedagogy Tool
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button 
              onClick={handleExportToolkit}
              className="bg-blue-800 text-white hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Toolkit
            </Button>
            
            <FacultyProfile />
          </div>
        </div>
      </div>
    </header>
  );
}
