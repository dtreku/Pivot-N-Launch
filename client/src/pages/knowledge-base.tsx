import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDefaultFaculty } from "@/hooks/use-faculty";
import { knowledgeBaseApi } from "@/lib/api";
import { apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Database,
  Search,
  Upload,
  Plus,
  FileText,
  File,
  Image,
  Film,
  Music,
  Archive,
  Eye,
  Download,
  Trash2,
  Lock,
  Globe,
  Tags,
  Calendar,
} from "lucide-react";
import type { KnowledgeBaseFilter } from "@/types";

const uploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  tags: z.string().optional(),
  isPrivate: z.boolean().default(true),
});

type UploadForm = z.infer<typeof uploadSchema>;

const FILE_TYPE_ICONS = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  txt: File,
  md: File,
  jpg: Image,
  jpeg: Image,
  png: Image,
  gif: Image,
  mp4: Film,
  mov: Film,
  mp3: Music,
  wav: Music,
  zip: Archive,
  rar: Archive,
};

const FILE_TYPE_COLORS = {
  pdf: "text-red-600",
  doc: "text-blue-600",
  docx: "text-blue-600",
  txt: "text-gray-600",
  md: "text-purple-600",
  jpg: "text-green-600",
  jpeg: "text-green-600",
  png: "text-green-600",
  gif: "text-green-600",
  mp4: "text-red-600",
  mov: "text-red-600",
  mp3: "text-yellow-600",
  wav: "text-yellow-600",
  zip: "text-orange-600",
  rar: "text-orange-600",
};

export default function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<KnowledgeBaseFilter>({
    tags: [],
    fileType: "",
    search: "",
  });
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const { data: faculty } = useDefaultFaculty();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<UploadForm>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      title: "",
      content: "",
      tags: "",
      isPrivate: true,
    },
  });

  const { data: knowledgeBase = [], isLoading } = useQuery({
    queryKey: ["/api/knowledge-base/faculty", faculty?.id],
    queryFn: () => knowledgeBaseApi.getByFaculty(faculty!.id),
    enabled: !!faculty?.id,
  });

  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ["/api/knowledge-base/search", faculty?.id, searchQuery],
    queryFn: () => knowledgeBaseApi.search(faculty!.id, searchQuery),
    enabled: !!faculty?.id && searchQuery.length > 2,
  });

  const createEntry = useMutation({
    mutationFn: knowledgeBaseApi.create,
    onSuccess: () => {
      // Invalidate both the list and search queries with proper keys
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base/faculty", faculty?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base/search"] });
      setIsUploadOpen(false);
      form.reset();
      toast({
        title: "Content Added",
        description: "Your content has been added to the knowledge base.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to add content: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteEntry = useMutation({
    mutationFn: knowledgeBaseApi.delete,
    onSuccess: () => {
      // Invalidate both the list and search queries with proper keys
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base/faculty", faculty?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base/search"] });
      toast({
        title: "Content Deleted",
        description: "The content has been removed from your knowledge base.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete content: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Quick Upload handlers
  const handleGetUploadParameters = async (fileName: string) => {
    const response = await apiRequest("/api/documents/upload-url", "POST", { fileName }) as unknown as { uploadURL: string };
    return {
      method: "PUT" as const,
      url: response.uploadURL,
    };
  };

  const handleUploadComplete = async (result: any) => {
    if (!faculty?.id || !result.successful) return;

    try {
      // Create knowledge base entries for all uploaded files in batch
      const uploadPromises = result.successful.map(async (file: any) => {
        const fileType = file.name?.split('.').pop()?.toLowerCase() || 'unknown';
        
        // Create a downloadable URL path instead of storing the temporary presigned URL
        // Extract the object key from the upload URL to construct download path
        let downloadUrl = '';
        if (file.uploadURL) {
          // The upload URL contains the object path - extract it for downloads
          const urlParts = file.uploadURL.split('/');
          const bucketIndex = urlParts.findIndex(part => part.includes('.'));
          if (bucketIndex > -1) {
            const objectPath = urlParts.slice(bucketIndex + 1).join('/');
            downloadUrl = `/objects/${objectPath}`;
          }
        }
        
        return createEntry.mutateAsync({
          facultyId: faculty.id,
          title: file.name || 'Uploaded File',
          content: `File uploaded: ${file.name}. Original size: ${(file.size / 1024 / 1024).toFixed(2)} MB`,
          fileType: fileType,
          fileUrl: downloadUrl,
          tags: ['upload', 'quick-upload'],
          isPrivate: true,
        });
      });

      await Promise.all(uploadPromises);

      toast({
        title: "Files Uploaded",
        description: `${result.successful.length} file(s) added to your knowledge base.`,
      });
      
    } catch (error) {
      console.error('Failed to create knowledge base entries:', error);
      toast({
        title: "Upload Error", 
        description: "Files uploaded but failed to add to knowledge base. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = (data: UploadForm) => {
    if (!faculty?.id) return;

    const tags = data.tags ? data.tags.split(",").map(tag => tag.trim()) : [];

    createEntry.mutate({
      facultyId: faculty.id,
      title: data.title,
      content: data.content,
      tags,
      isPrivate: data.isPrivate,
      fileType: "text", // For now, we're handling text content
    });
  };

  const displayItems = searchQuery.length > 2 ? searchResults : knowledgeBase;

  // Filter items based on current filters
  const filteredItems = displayItems.filter(item => {
    const matchesFileType = !filters.fileType || item.fileType === filters.fileType;
    const matchesTags = !filters.tags?.length || 
      filters.tags.some(tag => item.tags?.includes(tag));
    
    return matchesFileType && matchesTags;
  });

  // Get unique tags and file types for filtering
  const allTags = Array.from(new Set(knowledgeBase.flatMap(item => item.tags || [])));
  const allFileTypes = Array.from(new Set(knowledgeBase.map(item => item.fileType).filter(Boolean)));

  const getFileIcon = (fileType: string) => {
    const IconComponent = FILE_TYPE_ICONS[fileType as keyof typeof FILE_TYPE_ICONS] || File;
    return IconComponent;
  };

  const getFileColor = (fileType: string) => {
    return FILE_TYPE_COLORS[fileType as keyof typeof FILE_TYPE_COLORS] || "text-gray-600";
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this content?")) {
      deleteEntry.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="anti-overload-container">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-8 w-24" />
                </Card>
              ))}
            </div>
          </div>
          <div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="anti-overload-container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Institutional Knowledge Base
        </h1>
        <p className="text-gray-600 text-lg">
          Private vector database for uploading and curating institution-specific content
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search and Upload */}
          <Card className="focus-card p-0">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search your knowledge base..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                  <DialogTrigger asChild>
                    <Button className="pbl-button-primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Content
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add to Knowledge Base</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Content title..." />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Content</FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  rows={8}
                                  placeholder="Paste your content here, or upload files..."
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="tags"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tags (comma-separated)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="e.g., blockchain, smart contracts, syllabus"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex items-center justify-between pt-4">
                          <div className="flex items-center space-x-2">
                            <Lock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              Content will be kept private to your institution
                            </span>
                          </div>
                          <Button
                            type="submit"
                            disabled={createEntry.isPending}
                            className="pbl-button-primary"
                          >
                            {createEntry.isPending ? "Adding..." : "Add Content"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              {searchQuery.length > 2 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    {isSearching ? "Searching..." : `Found ${searchResults.length} results for "${searchQuery}"`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content Grid */}
          {filteredItems.length === 0 ? (
            <Card className="focus-card">
              <CardContent className="text-center py-12">
                <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  {searchQuery ? "No search results" : "No content yet"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery 
                    ? "Try different search terms or check your filters"
                    : "Start building your institutional knowledge base by adding content"
                  }
                </p>
                <Button onClick={() => setIsUploadOpen(true)} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Content
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredItems.map(item => {
                const FileIcon = getFileIcon(item.fileType || "text");
                const fileColor = getFileColor(item.fileType || "text");
                
                return (
                  <Card key={item.id} className="focus-card p-0">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg bg-gray-100 ${fileColor}`}>
                            <FileIcon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate">{item.title}</CardTitle>
                            <div className="flex items-center space-x-2 mt-1">
                              {item.isPrivate ? (
                                <Lock className="w-3 h-3 text-gray-400" />
                              ) : (
                                <Globe className="w-3 h-3 text-gray-400" />
                              )}
                              <span className="text-xs text-gray-500">
                                {new Date(item.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button size="sm" variant="ghost">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                        {item.content}
                      </p>
                      
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {item.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{item.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <ObjectUploader
                maxNumberOfFiles={10}
                maxFileSize={50 * 1024 * 1024} // 50MB
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={handleUploadComplete}
                buttonClassName="w-full"
              >
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drag & drop files here
                  </p>
                  <span className="text-sm font-medium text-gray-700">
                    Choose Files
                  </span>
                </div>
              </ObjectUploader>
              <div className="mt-4 text-xs text-gray-500">
                Supported: PDF, DOC, DOCX, TXT, Images, Audio, Video
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {allFileTypes.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    File Type
                  </label>
                  <div className="space-y-1">
                    {allFileTypes.map(type => (
                      <label key={type} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="fileType"
                          value={type}
                          checked={filters.fileType === type}
                          onChange={(e) => setFilters(prev => ({ 
                            ...prev, 
                            fileType: e.target.checked ? type : undefined 
                          }))}
                          className="w-3 h-3"
                        />
                        <span className="text-sm capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {allTags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {allTags.slice(0, 10).map(tag => (
                      <Badge
                        key={tag}
                        variant={filters.tags?.includes(tag) ? "default" : "secondary"}
                        className="cursor-pointer text-xs"
                        onClick={() => {
                          const currentTags = filters.tags || [];
                          const newTags = currentTags.includes(tag)
                            ? currentTags.filter(t => t !== tag)
                            : [...currentTags, tag];
                          setFilters(prev => ({ ...prev, tags: newTags }));
                        }}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {(filters.fileType || filters.tags?.length) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({ tags: [], fileType: "", search: "" })}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Knowledge Base Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Items:</span>
                  <span className="font-medium">{knowledgeBase.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>File Types:</span>
                  <span className="font-medium">{allFileTypes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tags:</span>
                  <span className="font-medium">{allTags.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Private Items:</span>
                  <span className="font-medium">
                    {knowledgeBase.filter(item => item.isPrivate).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
