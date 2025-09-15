import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Upload, Download, FileText, Trash2, BookOpen, FlaskConical, Palette, Calculator, Search, Bot, Zap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { DocumentUpload } from "@shared/schema";
import type { UploadResult } from "@uppy/core";

interface DocumentManagerProps {
  facultyId: number;
}

export default function DocumentManager({ facultyId }: DocumentManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadCategory, setUploadCategory] = useState("manual");
  const [includeInVectorDb, setIncludeInVectorDb] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DocumentUpload[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { data: documents = [], isLoading } = useQuery<DocumentUpload[]>({
    queryKey: ["/api/documents/faculty", facultyId],
  });

  const uploadMutation = useMutation({
    mutationFn: async (documentData: {
      facultyId: number;
      fileName: string;
      originalName: string;
      fileSize: number;
      mimeType: string;
      fileUrl: string;
      description?: string;
      category: string;
      includeInVectorDb?: boolean;
    }) => {
      return apiRequest("/api/documents", "POST", documentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents/faculty", facultyId] });
      toast({
        title: "Success",
        description: includeInVectorDb 
          ? "Document uploaded successfully! Available for on-demand access and added to vector database for AI-powered search."
          : "Document uploaded successfully! Available for on-demand access.",
      });
      setUploadDescription("");
      setIncludeInVectorDb(false);
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: number) => {
      return apiRequest(`/api/documents/${documentId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents/faculty", facultyId] });
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed", 
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
    },
  });

  const vectorizeMutation = useMutation({
    mutationFn: (documentId: number) => {
      return apiRequest(`/api/documents/${documentId}/vectorize`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents/faculty", facultyId] });
      toast({
        title: "Success",
        description: "Document vectorized successfully! Now available for AI-powered search.",
      });
    },
    onError: (error) => {
      toast({
        title: "Vectorization Failed",
        description: error.message || "Failed to vectorize document",
        variant: "destructive",
      });
    },
  });

  const searchDocuments = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await apiRequest("/api/search/documents", "POST", {
        query: searchQuery,
        limit: 10
      });
      setSearchResults(response.documents || []);
      toast({
        title: "Search Complete",
        description: `Found ${response.documents?.length || 0} relevant documents`,
      });
    } catch (error: any) {
      toast({
        title: "Search Failed",
        description: error.message || "Failed to search documents",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleGetUploadParameters = async (fileName: string) => {
    const response = await apiRequest("/api/documents/upload-url", "POST", { fileName }) as unknown as { uploadURL: string };
    return {
      method: "PUT" as const,
      url: response.uploadURL,
    };
  };

  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const file = result.successful[0];
      const uploadURL = file.uploadURL as string;
      
      uploadMutation.mutate({
        facultyId,
        fileName: file.name || 'untitled',
        originalName: file.name || 'untitled',
        fileSize: file.size || 0,
        mimeType: file.type || "application/octet-stream",
        fileUrl: uploadURL,
        description: uploadDescription,
        category: uploadCategory,
        includeInVectorDb: includeInVectorDb,
      });
    }
  };

  const handleDownload = (document: DocumentUpload) => {
    // Normalize the file URL to object path for download
    const objectPath = document.fileUrl.includes('/objects/') 
      ? document.fileUrl 
      : `/objects/uploads/${document.fileName}`;
    
    window.open(objectPath, '_blank');
  };

  const disciplineExamples = [
    {
      icon: BookOpen,
      discipline: "Humanities",
      color: "bg-purple-100 text-purple-800",
      examples: [
        "Digital Humanities Archive - Historical document digitization project",
        "Literary Analysis Corpus - Comparative literature analysis with computational tools",
        "Cultural Heritage Mapping - Interactive timeline of cultural artifacts",
        "Philosophy Ethics Case Studies - Applied ethics in modern contexts",
        "Language Evolution Project - Tracking linguistic changes over time"
      ]
    },
    {
      icon: FlaskConical,
      discipline: "Biochemistry",
      color: "bg-green-100 text-green-800", 
      examples: [
        "Protein Structure Analysis - 3D modeling of enzyme binding sites",
        "Metabolic Pathway Simulation - Interactive biochemical reaction networks",
        "Drug Discovery Pipeline - From target identification to clinical trials",
        "Molecular Diagnostics Platform - Point-of-care testing development",
        "Bioinformatics Workflow - Genomic data analysis and interpretation"
      ]
    },
    {
      icon: Palette,
      discipline: "Arts & Design",
      color: "bg-pink-100 text-pink-800",
      examples: [
        "Interactive Art Installation - Technology-enhanced public art projects",
        "Digital Media Portfolio - Cross-platform creative content development",
        "Sustainable Design Challenge - Eco-friendly product innovation",
        "Community Art Therapy - Art as healing in healthcare settings",
        "Virtual Museum Curation - Digital exhibition design and storytelling"
      ]
    },
    {
      icon: Calculator,
      discipline: "Mathematics",
      color: "bg-blue-100 text-blue-800",
      examples: [
        "Mathematical Modeling Lab - Real-world problem solving with calculus",
        "Statistics in Sports Analytics - Data-driven performance optimization",
        "Cryptography Applications - Modern security and privacy protection",
        "Optimization Theory Project - Operations research in business contexts",
        "Mathematical Biology - Population dynamics and disease modeling"
      ]
    }
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading documents...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Document Manager</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Upload and manage your PBL materials for on-demand access. Contact{" "}
          <a href="mailto:dtreku@wpi.edu" className="text-blue-600 hover:underline font-medium">
            dtreku@wpi.edu
          </a>{" "}
          for any document requests or assistance.
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Documents
          </CardTitle>
          <CardDescription>
            Share documents, templates, and resources for manual distribution and on-demand availability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the document..."
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                placeholder="e.g., templates, resources, guides"
              />
            </div>
          </div>
          
          {/* Vector Database Integration Option */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="vector-db" className="text-sm font-medium text-blue-900">
                  Include in Vector Database
                </Label>
                <p className="text-xs text-blue-700 mt-1">
                  Enable AI-powered search, semantic analysis, and intelligent document retrieval. 
                  Documents will be processed for enhanced question-answering and content discovery.
                </p>
              </div>
              <Switch
                id="vector-db"
                checked={includeInVectorDb}
                onCheckedChange={setIncludeInVectorDb}
                data-testid="switch-vector-db"
              />
            </div>
          </div>
          
          <ObjectUploader
            maxNumberOfFiles={5}
            maxFileSize={50 * 1024 * 1024} // 50MB
            onGetUploadParameters={handleGetUploadParameters}
            onComplete={handleUploadComplete}
            buttonClassName="w-full"
          >
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span>Upload Documents</span>
            </div>
          </ObjectUploader>
        </CardContent>
      </Card>

      {/* Discipline Examples Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-center">PBL Examples Across Disciplines</h2>
        <p className="text-center text-gray-600 max-w-4xl mx-auto">
          The Pivot-and-Launch methodology extends beyond technical fields to encompass humanities, 
          physical sciences, and creative disciplines, demonstrating its versatility in knowledge integration.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          {disciplineExamples.map((discipline, index) => (
            <Card key={index} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <discipline.icon className="h-6 w-6 text-blue-600" />
                  {discipline.discipline}
                  <Badge className={discipline.color}>
                    {discipline.examples.length} Examples
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {discipline.examples.map((example, exampleIndex) => (
                    <li key={exampleIndex} className="flex items-start gap-2 text-sm">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      <span>{example}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* AI-Powered Document Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI-Powered Document Search
          </CardTitle>
          <CardDescription>
            Use natural language to search through your vectorized documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Search documents using natural language (e.g., 'blockchain voting systems')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchDocuments()}
              className="flex-1"
            />
            <Button 
              onClick={searchDocuments} 
              disabled={isSearching || !searchQuery.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSearching ? (
                <>
                  <Bot className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>
          
          {searchResults.length > 0 && (
            <div className="space-y-3 mt-4">
              <h4 className="font-medium text-gray-800">Search Results ({searchResults.length})</h4>
              {searchResults.map((document: DocumentUpload) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between p-3 border border-blue-200 rounded-lg bg-blue-50"
                >
                  <div className="flex-1">
                    <h5 className="font-medium text-blue-900">{document.originalName}</h5>
                    {document.description && (
                      <p className="text-sm text-blue-700 mt-1">{document.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-blue-600">
                      <span>Category: {document.category}</span>
                      <span>Size: {Math.round((document.fileSize || 0) / 1024)} KB</span>
                      <span>Relevance Score: High</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(document)}
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {searchQuery && searchResults.length === 0 && !isSearching && (
            <div className="text-center py-4 text-gray-500">
              No documents found for "{searchQuery}". Make sure documents are vectorized for AI search.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Uploaded Documents Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Uploaded Documents ({documents.length})
          </CardTitle>
          <CardDescription>
            Documents available for on-demand access and AI-powered search
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No documents uploaded yet. Use the upload button above to add your first document.
            </p>
          ) : (
            <div className="space-y-3">
              {documents.map((document: DocumentUpload) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{document.originalName}</h3>
                    {document.description && (
                      <p className="text-sm text-gray-600 mt-1">{document.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Category: {document.category}</span>
                      <span>Size: {Math.round((document.fileSize || 0) / 1024)} KB</span>
                      <span>Downloads: {document.downloadCount || 0}</span>
                      <span>Uploaded: {new Date(document.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {document.vectorStatus !== "ready" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => vectorizeMutation.mutate(document.id)}
                        disabled={vectorizeMutation.isPending}
                        className="border-purple-300 text-purple-700 hover:bg-purple-50"
                        title="Enable AI-powered search for this document"
                      >
                        <Zap className="h-4 w-4 mr-1" />
                        Vectorize
                      </Button>
                    )}
                    {document.vectorStatus === "ready" && (
                      <Badge variant="outline" className="text-purple-700 border-purple-300 bg-purple-50">
                        <Bot className="h-3 w-3 mr-1" />
                        AI Ready
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(document)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMutation.mutate(document.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}