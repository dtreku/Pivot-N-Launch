import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, ArrowDown, Lightbulb, BookOpen, Target, Sparkles } from "lucide-react";
import { useDefaultFaculty } from "@/hooks/use-faculty";
import { objectiveConversionApi } from "@/lib/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const conversionSchema = z.object({
  originalObjective: z.string().min(10, "Objective must be at least 10 characters"),
  discipline: z.string().min(1, "Please select a discipline"),
  context: z.string().optional(),
});

type ConversionForm = z.infer<typeof conversionSchema>;

const EXAMPLE_CONVERSIONS = [
  {
    discipline: "Blockchain",
    original: "Learn the basics of solidity syntax",
    converted: "Build a decentralized voting system smart contract that demonstrates core Solidity concepts through real-world application, enabling students to understand syntax through practical implementation",
    pivotConcepts: ["Smart contract structure", "Data types and storage", "Function modifiers"],
    launchApplications: ["Voting mechanisms", "Access control", "Event logging"]
  },
  {
    discipline: "Data Science",
    original: "Understand machine learning algorithms",
    converted: "Develop a predictive model for real-world business problem using multiple ML algorithms, comparing their effectiveness and learning to select appropriate methods based on data characteristics",
    pivotConcepts: ["Algorithm fundamentals", "Data preprocessing", "Model evaluation"],
    launchApplications: ["Business forecasting", "Pattern recognition", "Decision support systems"]
  },
  {
    discipline: "Fintech",
    original: "Learn about digital payment systems",
    converted: "Design and prototype a secure digital payment solution addressing specific market needs, integrating multiple payment technologies while considering regulatory compliance",
    pivotConcepts: ["Payment protocols", "Security frameworks", "Regulatory requirements"],
    launchApplications: ["Mobile payments", "Cross-border transactions", "Merchant integration"]
  }
];

export default function ObjectivesConverter() {
  const [conversionResult, setConversionResult] = useState<string>("");
  const [isConverting, setIsConverting] = useState(false);
  const { data: faculty } = useDefaultFaculty();
  const { toast } = useToast();

  const form = useForm<ConversionForm>({
    resolver: zodResolver(conversionSchema),
    defaultValues: {
      originalObjective: "",
      discipline: "",
      context: "",
    },
  });

  const { data: previousConversions, isLoading: conversionsLoading } = useQuery({
    queryKey: ["/api/objective-conversions/faculty", faculty?.id],
    queryFn: () => objectiveConversionApi.getByFaculty(faculty!.id),
    enabled: !!faculty?.id,
  });

  const createConversion = useMutation({
    mutationFn: objectiveConversionApi.create,
    onSuccess: (conversion) => {
      toast({
        title: "Conversion Saved",
        description: "Your learning objective conversion has been saved successfully.",
      });
    },
  });

  const onSubmit = async (data: ConversionForm) => {
    if (!faculty?.id) return;

    setIsConverting(true);
    
    // Simulate AI conversion process
    setTimeout(() => {
      const converted = generatePBLFramework(data.originalObjective, data.discipline);
      setConversionResult(converted);
      setIsConverting(false);

      // Save the conversion
      createConversion.mutate({
        facultyId: faculty.id,
        originalObjective: data.originalObjective,
        convertedFramework: converted,
        discipline: data.discipline,
      });
    }, 2000);
  };

  const generatePBLFramework = (objective: string, discipline: string): string => {
    // This would integrate with AI services in production
    const frameworks: Record<string, string> = {
      blockchain: `Transform "${objective}" into: Build a practical blockchain application that demonstrates ${objective.toLowerCase()}, allowing students to learn through hands-on development while understanding real-world implementation challenges and industry best practices.`,
      "data-science": `Convert "${objective}" into: Solve a real-world data problem that requires ${objective.toLowerCase()}, enabling students to apply theoretical knowledge through practical analysis while developing critical thinking about data interpretation and decision-making.`,
      fintech: `Evolve "${objective}" to: Design an innovative fintech solution that incorporates ${objective.toLowerCase()}, challenging students to understand financial technology through practical application while considering regulatory and market constraints.`,
      business: `Enhance "${objective}" by: Develop a comprehensive business strategy project that applies ${objective.toLowerCase()}, allowing students to practice strategic thinking through real case studies and practical business challenges.`,
    };

    const disciplineKey = discipline.toLowerCase().replace(/\s+/g, "-");
    return frameworks[disciplineKey] || `Transform "${objective}" into a project-based learning experience that allows students to apply knowledge through practical implementation and real-world problem solving.`;
  };

  const loadExample = (example: typeof EXAMPLE_CONVERSIONS[0]) => {
    form.setValue("originalObjective", example.original);
    form.setValue("discipline", example.discipline);
    setConversionResult(example.converted);
  };

  return (
    <div className="anti-overload-container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Learning Objectives Converter
        </h1>
        <p className="text-gray-600 text-lg">
          Transform traditional learning objectives into Pivot-and-Launch project frameworks
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Converter */}
        <div className="lg:col-span-2 space-y-8">
          {/* Conversion Form */}
          <Card className="focus-card p-0">
            <CardHeader>
              <CardTitle className="flex items-center">
                <RefreshCw className="w-5 h-5 mr-2 text-red-600" />
                Objective Converter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="discipline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="pbl-label">Discipline</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="pbl-input">
                              <SelectValue placeholder="Select your subject area" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="blockchain">Blockchain Technology</SelectItem>
                            <SelectItem value="data-science">Data Science</SelectItem>
                            <SelectItem value="fintech">Financial Technology</SelectItem>
                            <SelectItem value="business">Business Strategy</SelectItem>
                            <SelectItem value="information-systems">Information Systems</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="originalObjective"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="pbl-label">Traditional Learning Objective</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            className="pbl-textarea"
                            placeholder="e.g., Learn the basics of solidity syntax..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="context"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="pbl-label">Additional Context (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            className="pbl-textarea"
                            placeholder="Course level, student background, specific requirements..."
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isConverting}
                    className="w-full pbl-button-primary"
                  >
                    {isConverting ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Converting to PBL Framework...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Convert to PBL Framework
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Conversion Result */}
          {(conversionResult || isConverting) && (
            <Card className="focus-card p-0">
              <CardHeader>
                <CardTitle>Conversion Result</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-800 mb-2 flex items-center">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Traditional Objective
                    </h3>
                    <p className="text-sm text-gray-600 italic">
                      {form.getValues("originalObjective")}
                    </p>
                  </div>
                  
                  <div className="flex justify-center">
                    <ArrowDown className="text-yellow-500 w-6 h-6" />
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-medium text-red-600 mb-2 flex items-center">
                      <Target className="w-4 h-4 mr-2" />
                      PBL Project Framework
                    </h3>
                    {isConverting ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-5/6" />
                      </div>
                    ) : (
                      <p className="text-sm text-gray-800">{conversionResult}</p>
                    )}
                  </div>

                  {conversionResult && !isConverting && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-medium text-blue-800 mb-2">Pivot Elements</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• Core concept mastery</li>
                          <li>• Foundational skills</li>
                          <li>• Reference knowledge</li>
                        </ul>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-medium text-green-800 mb-2">Launch Applications</h4>
                        <ul className="text-sm text-green-700 space-y-1">
                          <li>• Real-world implementation</li>
                          <li>• Creative problem solving</li>
                          <li>• Collaborative learning</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Previous Conversions */}
          {previousConversions && previousConversions.length > 0 && (
            <Card className="focus-card p-0">
              <CardHeader>
                <CardTitle>Your Previous Conversions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {previousConversions.slice(0, 3).map((conversion, index) => (
                    <div key={conversion.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="outline">{conversion.discipline}</Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(conversion.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Original:</span> {conversion.originalObjective}
                      </p>
                      <p className="text-sm text-gray-800">
                        <span className="font-medium">Converted:</span> {conversion.convertedFramework}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Examples */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                Example Conversions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {EXAMPLE_CONVERSIONS.map((example, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {example.discipline}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => loadExample(example)}
                      className="text-xs"
                    >
                      Try This
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">From:</span> {example.original}
                  </p>
                  <p className="text-xs text-gray-800">
                    <span className="font-medium">To:</span> {example.converted.slice(0, 100)}...
                  </p>
                  {index < EXAMPLE_CONVERSIONS.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Methodology Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Conversion Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <div>
                  <span className="font-medium text-red-600">Pivot:</span> Identify core concepts 
                  that serve as foundational knowledge reference points.
                </div>
                <div>
                  <span className="font-medium text-blue-600">Launch:</span> Design applications 
                  that extend knowledge into diverse, challenging contexts.
                </div>
                <div>
                  <span className="font-medium text-green-600">Balance:</span> Maintain connection 
                  between core concepts and practical applications.
                </div>
                <div>
                  <span className="font-medium text-yellow-600">Anti-Overload:</span> Focus on 
                  deep understanding rather than broad coverage.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          {previousConversions && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Conversions:</span>
                    <span className="font-medium">{previousConversions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Disciplines Covered:</span>
                    <span className="font-medium">
                      {new Set(previousConversions.map(c => c.discipline)).size}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg. Rating:</span>
                    <span className="font-medium">
                      {previousConversions
                        .filter(c => c.feedbackRating)
                        .reduce((acc, c) => acc + (c.feedbackRating || 0), 0) / 
                       previousConversions.filter(c => c.feedbackRating).length || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
