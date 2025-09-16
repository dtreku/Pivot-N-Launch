import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, Lightbulb, ChevronDown, FileText, FileType, File } from "lucide-react";
import FacultyProfile from "@/components/faculty/profile-display";
import BackButton from "@/components/layout/back-button";
import { useToast } from "@/hooks/use-toast";

export default function Header() {
  const { toast } = useToast();

  const handleExportToolkit = async (format: 'json' | 'text' | 'word' | 'pdf') => {
    try {
      // Call the API endpoint with format parameter
      const response = await fetch(`/api/export/toolkit?format=${format}`);
      
      if (!response.ok) {
        throw new Error('Failed to export toolkit');
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `pbl-toolkit-guide.${
        format === 'json' ? 'json' : 
        format === 'word' ? 'html' : 
        format === 'pdf' ? 'html' : 
        'txt'
      }`;
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

      const formatNames = { 
        json: 'JSON Data', 
        text: 'Text File', 
        word: 'Word-Compatible HTML', 
        pdf: 'Printable HTML' 
      };
      toast({
        title: "Export Successful",
        description: `PBL Toolkit instructor guide has been downloaded as ${formatNames[format]}.`,
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  className="bg-blue-800 text-white hover:bg-blue-700"
                  data-testid="button-export-toolkit"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Toolkit
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem 
                  onClick={() => handleExportToolkit('json')}
                  data-testid="export-json"
                >
                  <FileType className="w-4 h-4 mr-2" />
                  JSON Data (.json)
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleExportToolkit('text')}
                  data-testid="export-text"
                >
                  <File className="w-4 h-4 mr-2" />
                  Text File (.txt)
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleExportToolkit('word')}
                  data-testid="export-word"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Word-Compatible HTML (.html)
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleExportToolkit('pdf')}
                  data-testid="export-pdf"
                >
                  <FileType className="w-4 h-4 mr-2" />
                  Printable HTML (.html)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <FacultyProfile />
          </div>
        </div>
      </div>
    </header>
  );
}
