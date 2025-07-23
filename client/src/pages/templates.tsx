import { useState } from "react";
import { useProjectTemplates } from "@/hooks/use-projects";
import { useDefaultFaculty } from "@/hooks/use-faculty";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import TemplateCard from "@/components/templates/template-card";
import { Search, Filter, Plus, FileText, Download } from "lucide-react";
import type { TemplateFilters } from "@/types";

const DISCIPLINES = [
  { value: "", label: "All Disciplines" },
  { value: "blockchain", label: "Blockchain Technology" },
  { value: "data-science", label: "Data Science" },
  { value: "fintech", label: "Financial Technology" },
  { value: "business", label: "Business Strategy" },
  { value: "information-systems", label: "Information Systems" },
];

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "development", label: "Development" },
  { value: "analysis", label: "Analysis" },
  { value: "innovation", label: "Innovation" },
  { value: "strategy", label: "Strategy" },
];

const DIFFICULTY_LEVELS = [
  { value: "", label: "All Levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export default function Templates() {
  const [filters, setFilters] = useState<TemplateFilters>({
    discipline: "",
    category: "",
    difficulty: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

  const { data: faculty } = useDefaultFaculty();
  const { data: templates = [], isLoading } = useProjectTemplates(filters.discipline);

  // Filter templates based on search and filters
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !filters.category || template.category === filters.category;
    const matchesDifficulty = !filters.difficulty || template.difficultyLevel === filters.difficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const handleFilterChange = (key: keyof TemplateFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ discipline: "", category: "", difficulty: "" });
    setSearchQuery("");
  };

  const handleCreateProject = (templateId: number) => {
    // This would navigate to project creation with the template pre-loaded
    console.log("Creating project from template:", templateId);
  };

  const handleExportTemplate = (templateId: number) => {
    // This would export the template as PDF/DOCX
    console.log("Exporting template:", templateId);
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

      {/* Results Summary */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-gray-600">
          Showing {filteredTemplates.length} of {templates.length} templates
        </p>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
          <Button size="sm" className="pbl-button-primary">
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
              Try adjusting your filters or search terms to find templates.
            </p>
            <Button onClick={clearFilters} variant="outline">
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onCreateProject={() => handleCreateProject(template.id)}
              onExportTemplate={() => handleExportTemplate(template.id)}
              isSelected={selectedTemplate === template.id}
              onSelect={() => setSelectedTemplate(template.id)}
            />
          ))}
        </div>
      )}

      {/* Featured Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Featured Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="focus-card p-0 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardHeader>
              <CardTitle className="text-red-800">Blockchain Voting System</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700 mb-4">
                Most popular template for teaching smart contract development through 
                practical democratic applications.
              </p>
              <div className="flex items-center justify-between">
                <Badge className="bg-red-600 text-white">Trending</Badge>
                <Button size="sm" className="bg-red-600 text-white hover:bg-red-700">
                  Use Template
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="focus-card p-0 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">AI-Powered Data Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-700 mb-4">
                New template integrating machine learning with real-world business datasets 
                for comprehensive data science education.
              </p>
              <div className="flex items-center justify-between">
                <Badge className="bg-blue-600 text-white">New</Badge>
                <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                  Use Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
