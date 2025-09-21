import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDefaultFaculty } from "@/hooks/use-faculty";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import TemplateCard from "@/components/templates/template-card";
import { Search, Filter, Plus, FileText, Download, CheckSquare, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { TemplateFilters } from "@/types";

const DISCIPLINES = [
  { value: "all", label: "All Disciplines" },
  { value: "blockchain", label: "Blockchain Technology" },
  { value: "data-science", label: "Data Science" },
  { value: "fintech", label: "Financial Technology" },
  { value: "information-systems", label: "Information Systems" },
  { value: "biochemistry", label: "Biochemistry" },
  { value: "chemistry", label: "Chemistry" },
  { value: "biology", label: "Biology" },
  { value: "literature", label: "Literature & Language Arts" },
  { value: "history", label: "History" },
  { value: "philosophy", label: "Philosophy" },
  { value: "visual-arts", label: "Visual Arts" },
  { value: "mathematics", label: "Mathematics" },
  { value: "business", label: "Business Strategy" },
];

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "development", label: "Development" },
  { value: "analysis", label: "Analysis" },
  { value: "research", label: "Research" },
  { value: "creative", label: "Creative & Design" },
  { value: "laboratory", label: "Laboratory & Experimental" },
  { value: "innovation", label: "Innovation" },
  { value: "strategy", label: "Strategy" },
  { value: "interdisciplinary", label: "Interdisciplinary" },
];

const DIFFICULTY_LEVELS = [
  { value: "all", label: "All Levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export default function Templates() {
  const [filters, setFilters] = useState<TemplateFilters>({
    discipline: "all",
    category: "all",
    difficulty: "all",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplates, setSelectedTemplates] = useState<Set<number>>(new Set());
  const [showPendingOnly, setShowPendingOnly] = useState(false);

  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const { data: faculty } = useDefaultFaculty();
  
  // Use new search API endpoint
  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['templates', 'search', filters, searchQuery, showPendingOnly],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.discipline !== 'all') params.append('discipline', filters.discipline);
      if (searchQuery) params.append('q', searchQuery);
      if (showPendingOnly && (faculty?.role === 'super_admin' || faculty?.role === 'admin')) params.append('status', 'pending');
      
      const response = await fetch(`/api/templates/search?${params}`);
      if (!response.ok) throw new Error('Failed to search templates');
      return response.json();
    }
  });
  
  // Get featured templates using working search endpoint
  const { data: featuredTemplates = [] } = useQuery({
    queryKey: ['templates', 'featured'],
    queryFn: async () => {
      const response = await fetch('/api/templates/search?featuredOnly=true');
      if (!response.ok) throw new Error('Failed to fetch featured templates');
      return response.json();
    }
  });

  // Filter search results client-side for category and difficulty (not available in API yet)
  const filteredTemplates = searchResults.filter(template => {
    const matchesCategory = filters.category === "all" || !filters.category || template.category === filters.category;
    const matchesDifficulty = filters.difficulty === "all" || !filters.difficulty || template.difficultyLevel === filters.difficulty;
    
    return matchesCategory && matchesDifficulty;
  });

  const handleFilterChange = (key: keyof TemplateFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ discipline: "all", category: "all", difficulty: "all" });
    setSearchQuery("");
  };

  const handleTemplateSelect = (templateId: number, selected: boolean) => {
    const newSelected = new Set(selectedTemplates);
    if (selected) {
      newSelected.add(templateId);
    } else {
      newSelected.delete(templateId);
    }
    setSelectedTemplates(newSelected);
  };
  
  const handleSelectAll = () => {
    if (selectedTemplates.size === filteredTemplates.length) {
      setSelectedTemplates(new Set());
    } else {
      setSelectedTemplates(new Set(filteredTemplates.map(t => t.id)));
    }
  };

  const handleCreateProject = (templateId: number) => {
    // Navigate to methodology wizard to CREATE A PROJECT with template pre-loaded
    setLocation(`/methodology-wizard?mode=create-project&templateId=${templateId}`);
    toast({
      title: "Creating Project from Template",
      description: "Setting up your new project with the selected template...",
    });
  };

  const handleExportSelected = async (format: 'json' | 'csv' | 'docx' = 'json') => {
    try {
      const templateIds = Array.from(selectedTemplates);
      if (templateIds.length === 0) {
        toast({
          title: "No Templates Selected",
          description: "Please select templates to export.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('/api/templates/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ templateIds, format }),
      });

      if (!response.ok) throw new Error('Failed to export templates');

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Set appropriate filename based on format
      const filename = format === 'docx' 
        ? 'PBL-Templates-Professional-Guide.docx'
        : format === 'csv' 
        ? 'PBL-Templates-Data.csv'
        : 'PBL-Templates-Complete-Data.json';
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      const formatDisplay = format === 'docx' ? 'Professional Word Document' : format.toUpperCase();
      toast({
        title: "Templates Exported",
        description: `${templateIds.length} template(s) exported successfully as ${formatDisplay}.`,
      });
      
      // Clear selection after export
      setSelectedTemplates(new Set());
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Unable to export templates. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleExportTemplate = async (templateId: number) => {
    setSelectedTemplates(new Set([templateId]));
    await handleExportSelected('json');
  };

  const handleCreateCustomTemplate = () => {
    // Navigate to methodology wizard for custom template creation
    setLocation('/methodology-wizard?mode=create-template');
    toast({
      title: "Create Custom Template",
      description: "Redirecting to methodology wizard to create your custom template...",
    });
  };
  
  const handleApproveTemplate = async (templateId: number) => {
    try {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch(`/api/templates/${templateId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionId}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) throw new Error('Failed to approve template');
      
      toast({
        title: "Template Approved",
        description: "Template has been approved and is now available to all users.",
      });
      
      // Refresh the templates list
      window.location.reload();
    } catch (error) {
      console.error('Approval error:', error);
      toast({
        title: "Approval Failed",
        description: "Unable to approve template. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleRejectTemplate = async (templateId: number) => {
    try {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch(`/api/templates/${templateId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionId}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) throw new Error('Failed to reject template');
      
      toast({
        title: "Template Rejected",
        description: "Template has been rejected.",
      });
      
      // Refresh the templates list
      window.location.reload();
    } catch (error) {
      console.error('Rejection error:', error);
      toast({
        title: "Rejection Failed",
        description: "Unable to reject template. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="anti-overload-container">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="focus-card p-0">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="anti-overload-container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Project Templates
        </h1>
        <p className="text-gray-600 text-lg">
          Pre-built project frameworks adaptable to any academic discipline
        </p>
      </div>

      {/* Filters and Search */}
      <Card className="focus-card p-0 mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={filters.discipline}
              onValueChange={(value) => handleFilterChange("discipline", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Discipline" />
              </SelectTrigger>
              <SelectContent>
                {DISCIPLINES.map(discipline => (
                  <SelectItem key={discipline.value} value={discipline.value}>
                    {discipline.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.category}
              onValueChange={(value) => handleFilterChange("category", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.difficulty}
              onValueChange={(value) => handleFilterChange("difficulty", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTY_LEVELS.map(level => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(filters.discipline || filters.category || filters.difficulty || searchQuery) && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Active filters:</span>
                {filters.discipline && (
                  <Badge variant="secondary">
                    {DISCIPLINES.find(d => d.value === filters.discipline)?.label}
                  </Badge>
                )}
                {filters.category && (
                  <Badge variant="secondary">
                    {CATEGORIES.find(c => c.value === filters.category)?.label}
                  </Badge>
                )}
                {filters.difficulty && (
                  <Badge variant="secondary">
                    {DIFFICULTY_LEVELS.find(l => l.value === filters.difficulty)?.label}
                  </Badge>
                )}
                {searchQuery && (
                  <Badge variant="secondary">"{searchQuery}"</Badge>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Panel for Pending Templates */}
      {(faculty?.role === 'super_admin' || faculty?.role === 'admin') && (
        <Card className="focus-card p-0 mb-6 border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800">
              Template Approval Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-pending"
                  checked={showPendingOnly}
                  onCheckedChange={setShowPendingOnly}
                  data-testid="checkbox-show-pending"
                />
                <label htmlFor="show-pending" className="text-sm font-medium">
                  Show pending templates only
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <p className="text-gray-600">
            Showing {filteredTemplates.length} of {searchResults.length} templates
          </p>
          {selectedTemplates.size > 0 && (
            <p className="text-blue-600 font-medium">
              {selectedTemplates.size} selected
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {filteredTemplates.length > 0 && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                data-testid="button-select-all"
              >
                {selectedTemplates.size === filteredTemplates.length ? (
                  <CheckSquare className="w-4 h-4 mr-2" />
                ) : (
                  <Square className="w-4 h-4 mr-2" />
                )}
                {selectedTemplates.size === filteredTemplates.length ? 'Deselect All' : 'Select All'}
              </Button>
              {selectedTemplates.size > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportSelected('docx')}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                    data-testid="button-export-docx"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export DOCX
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportSelected('json')}
                    data-testid="button-export-json"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export JSON
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportSelected('csv')}
                    data-testid="button-export-csv"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </>
              )}
            </div>
          )}
          <Button 
            size="sm" 
            className="pbl-button-primary"
            onClick={handleCreateCustomTemplate}
            data-testid="button-create-custom-template"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Custom Template
          </Button>
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card className="focus-card">
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No templates found</h3>
            <p className="text-gray-600 mb-4">
              {showPendingOnly ? 
                "No pending templates found." :
                "Try adjusting your filters or search terms to find templates."
              }
            </p>
            <Button onClick={clearFilters} variant="outline">
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <div key={template.id} className="relative">
              <div className="absolute top-2 left-2 z-10">
                <Checkbox
                  checked={selectedTemplates.has(template.id)}
                  onCheckedChange={(checked) => handleTemplateSelect(template.id, checked as boolean)}
                  className="bg-white border-2 border-gray-300 shadow-sm"
                  data-testid={`checkbox-template-${template.id}`}
                />
              </div>
              <TemplateCard
                template={template}
                onCreateProject={() => handleCreateProject(template.id)}
                onExportTemplate={() => handleExportTemplate(template.id)}
                isSelected={selectedTemplates.has(template.id)}
                onSelect={() => handleTemplateSelect(template.id, !selectedTemplates.has(template.id))}
                showApprovalActions={(faculty?.role === 'super_admin' || faculty?.role === 'admin') && template.status === 'pending'}
                onApprove={() => handleApproveTemplate(template.id)}
                onReject={() => handleRejectTemplate(template.id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Featured Section */}
      {featuredTemplates.length > 0 && !showPendingOnly && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Featured Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTemplates.map((template, index) => {
              const gradientClasses = [
                'bg-gradient-to-br from-red-50 to-red-100 border-red-200',
                'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200',
                'bg-gradient-to-br from-green-50 to-green-100 border-green-200',
                'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200',
                'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200',
              ];
              const textClasses = [
                'text-red-800',
                'text-blue-800', 
                'text-green-800',
                'text-purple-800',
                'text-amber-800',
              ];
              const buttonClasses = [
                'bg-red-600 text-white hover:bg-red-700',
                'bg-blue-600 text-white hover:bg-blue-700',
                'bg-green-600 text-white hover:bg-green-700',
                'bg-purple-600 text-white hover:bg-purple-700',
                'bg-amber-600 text-white hover:bg-amber-700',
              ];
              
              const gradientClass = gradientClasses[index % gradientClasses.length];
              const textClass = textClasses[index % textClasses.length];
              const buttonClass = buttonClasses[index % buttonClasses.length];
              
              return (
                <Card key={template.id} className={`focus-card p-0 ${gradientClass}`}>
                  <CardHeader>
                    <CardTitle className={textClass}>{template.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`${textClass.replace('800', '700')} mb-4`}>
                      {template.description || 'Featured template for comprehensive project-based learning.'}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge className={buttonClass}>Featured</Badge>
                      <Button 
                        size="sm" 
                        className={buttonClass}
                        onClick={() => handleCreateProject(template.id)}
                        data-testid={`button-use-featured-template-${template.id}`}
                      >
                        Use Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
