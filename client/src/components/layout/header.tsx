import { Button } from "@/components/ui/button";
import { Download, Lightbulb } from "lucide-react";
import FacultyProfile from "@/components/faculty/profile-display";
import BackButton from "@/components/layout/back-button";
import { useToast } from "@/hooks/use-toast";

export default function Header() {
  const { toast } = useToast();

  const handleExportToolkit = async () => {
    try {
      // Call the API endpoint to export toolkit (with instructor data if logged in)
      const response = await fetch('/api/export/toolkit?includeInstructor=true');
      
      if (!response.ok) {
        throw new Error('Failed to export toolkit');
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'pbl-toolkit-export.json';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "PBL Toolkit has been exported with your instructor data.",
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Unable to export toolkit. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <BackButton />
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
              data-testid="button-export-toolkit"
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
