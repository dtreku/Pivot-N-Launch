import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowDown, Sparkles, RefreshCw, BookOpen, Target, Lightbulb } from "lucide-react";
import { useDefaultFaculty } from "@/hooks/use-faculty";
import { objectiveConversionApi } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const conversionSchema = z.object({
  originalObjective: z.string().min(10, "Objective must be at least 10 characters"),
  discipline: z.string().min(1, "Please select a discipline"),
  context: z.string().optional(),
});

type ConversionForm = z.infer<typeof conversionSchema>;

interface ConversionResult {
  converted: string;
  pivotElements: string[];
  launchApplications: string[];
  implementationTips: string[];
}

export default function ConverterForm() {
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const { data: faculty } = useDefaultFaculty();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ConversionForm>({
    resolver: zodResolver(conversionSchema),
    defaultValues: {
      originalObjective: "",
      discipline: "",
      context: "",
    },
  });

  const createConversion = useMutation({
    mutationFn: objectiveConversionApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/objective-conversions"] });
      toast({
        title: "Conversion Saved",
        description: "Your learning objective conversion has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to save conversion: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const generatePBLFramework = (objective: string, discipline: string, context?: string): ConversionResult => {
    // Enhanced AI-like conversion logic with discipline-specific frameworks
    const disciplineFrameworks = {
      blockchain: {
        converted: `Transform "${objective}" into: Build a practical blockchain application that demonstrates ${objective.toLowerCase()}, allowing students to learn through hands-on development while understanding real-world implementation challenges, security considerations, and industry best practices.`,
        pivotElements: [
          "Cryptographic fundamentals",
          "Distributed systems concepts", 
          "Smart contract architecture",
          "Consensus mechanisms",
          "Security protocols"
        ],
        launchApplications: [
          "Decentralized application development",
          "Token economics design",
          "Cross-chain interoperability",
          "Enterprise blockchain integration",
          "Regulatory compliance analysis"
        ],
        implementationTips: [
          "Start with simple smart contracts",
          "Use testnet environments for safety",
          "Emphasize security best practices",
          "Connect to real industry use cases"
        ]
      },
      "data-science": {
        converted: `Convert "${objective}" into: Solve a real-world data problem that requires ${objective.toLowerCase()}, enabling students to apply theoretical knowledge through practical analysis while developing critical thinking about data interpretation, model validation, and ethical decision-making in data science.`,
        pivotElements: [
          "Statistical foundations",
          "Data preprocessing techniques",
          "Algorithm selection criteria",
          "Model evaluation methods",
          "Ethical data practices"
        ],
        launchApplications: [
          "Business forecasting models",
          "Healthcare analytics projects",
          "Social impact data analysis",
          "Predictive maintenance systems",
          "Recommendation engine development"
        ],
        implementationTips: [
          "Use real datasets from industry partners",
          "Emphasize data storytelling",
          "Include bias detection exercises",
          "Connect to current research trends"
        ]
      },
      fintech: {
        converted: `Evolve "${objective}" to: Design an innovative fintech solution that incorporates ${objective.toLowerCase()}, challenging students to understand financial technology through practical application while considering regulatory frameworks, user experience design, and market validation strategies.`,
        pivotElements: [
          "Financial system architecture",
          "Payment processing protocols",
          "Risk assessment methodologies",
          "Regulatory compliance frameworks",
          "User experience principles"
        ],
        launchApplications: [
          "Mobile payment solutions",
          "Robo-advisor platforms",
          "Peer-to-peer lending systems",
          "Cryptocurrency exchanges",
          "InsurTech innovations"
        ],
        implementationTips: [
          "Partner with financial institutions",
          "Include regulatory considerations",
          "Focus on user-centered design",
          "Address cybersecurity concerns"
        ]
      },
      business: {
        converted: `Enhance "${objective}" by: Develop a comprehensive business strategy project that applies ${objective.toLowerCase()}, allowing students to practice strategic thinking through real case studies, stakeholder analysis, and practical business challenges with measurable outcomes.`,
        pivotElements: [
          "Strategic analysis frameworks",
          "Market research methodologies",
          "Financial modeling techniques",
          "Leadership principles",
          "Change management strategies"
        ],
        launchApplications: [
          "Market entry strategies",
          "Digital transformation initiatives", 
          "Sustainability programs",
          "Innovation management",
          "Crisis response planning"
        ],
        implementationTips: [
          "Use current business cases",
          "Include stakeholder perspectives",
          "Focus on implementation feasibility",
          "Emphasize ethical considerations"
        ]
      },
      "information-systems": {
        converted: `Transform "${objective}" into: Design and implement an information system solution that demonstrates ${objective.toLowerCase()}, enabling students to understand systems thinking through practical development while considering user needs, technical constraints, and organizational impact.`,
        pivotElements: [
          "Systems analysis and design",
          "Database design principles",
          "User interface design",
          "Security architecture",
          "Project management methodologies"
        ],
        launchApplications: [
          "Enterprise resource planning",
          "Customer relationship management",
          "Supply chain optimization",
          "Business intelligence dashboards",
          "Mobile application development"
        ],
        implementationTips: [
          "Use agile development methods",
          "Include user testing phases",
          "Emphasize documentation",
          "Connect to industry standards"
        ]
      }
    };

    const disciplineKey = discipline.toLowerCase().replace(/\s+/g, "-") as keyof typeof disciplineFrameworks;
    const framework = disciplineFrameworks[disciplineKey];
    
    if (framework) {
      return framework;
    }

    // Default framework for other disciplines
    return {
      converted: `Transform "${objective}" into a project-based learning experience that allows students to apply knowledge through practical implementation, real-world problem solving, and collaborative exploration while maintaining focus on core learning outcomes.`,
      pivotElements: [
        "Foundational concepts",
        "Core methodologies", 
        "Essential skills",
        "Critical thinking frameworks",
        "Professional standards"
      ],
      launchApplications: [
        "Real-world case studies",
        "Industry partnerships",
        "Community projects",
        "Innovation challenges",
        "Peer collaboration"
      ],
      implementationTips: [
        "Start with clear learning objectives",
        "Provide structured scaffolding",
        "Include regular checkpoints",
        "Emphasize reflection and iteration"
      ]
    };
  };

  const onSubmit = async (data: ConversionForm) => {
    if (!faculty?.id) return;

    setIsConverting(true);
    
    // Simulate processing time for better UX
    setTimeout(() => {
      const result = generatePBLFramework(data.originalObjective, data.discipline, data.context);
      setConversionResult(result);
      setIsConverting(false);

      // Save the conversion
      createConversion.mutate({
        facultyId: faculty.id,
        originalObjective: data.originalObjective,
        convertedFramework: result.converted,
        discipline: data.discipline,
      });
    }, 2000);
  };

  const clearForm = () => {
    form.reset();
    setConversionResult(null);
  };

  return (
    <div className="space-y-8">
      {/* Conversion Form */}
      <Card className="focus-card p-0">
        <CardHeader>
          <CardTitle className="flex items-center">
            <RefreshCw className="w-5 h-5 mr-2 text-red-600" />
            Learning Objective Converter
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                        placeholder="e.g., Learn the basics of solidity syntax and smart contract development..."
                        rows={4}
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
                        placeholder="Course level, student background, specific requirements, time constraints..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={isConverting}
                  className="flex-1 pbl-button-primary"
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
                
                {(conversionResult || form.formState.isDirty) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearForm}
                  >
                    Clear
                  </Button>
                )}
              </div>
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
            <div className="space-y-6">
              {/* Original vs Converted */}
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
                    <p className="text-sm text-gray-800">{conversionResult?.converted}</p>
                  )}
                </div>
              </div>

              {/* Detailed Breakdown */}
              {conversionResult && !isConverting && (
                <>
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pivot Elements */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-3 flex items-center">
                        <Target className="w-4 h-4 mr-2" />
                        Pivot Elements (Core Concepts)
                      </h4>
                      <ul className="space-y-2">
                        {conversionResult.pivotElements.map((element, index) => (
                          <li key={index} className="flex items-start text-sm text-blue-700">
                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0" />
                            {element}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Launch Applications */}
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-medium text-green-800 mb-3 flex items-center">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Launch Applications (Extensions)
                      </h4>
                      <ul className="space-y-2">
                        {conversionResult.launchApplications.map((application, index) => (
                          <li key={index} className="flex items-start text-sm text-green-700">
                            <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 mr-2 flex-shrink-0" />
                            {application}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Implementation Tips */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-3 flex items-center">
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Implementation Tips
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {conversionResult.implementationTips.map((tip, index) => (
                        <div key={index} className="flex items-start text-sm text-yellow-700">
                          <Badge variant="outline" className="mr-2 text-xs">
                            {index + 1}
                          </Badge>
                          {tip}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button className="pbl-button-primary">
                      Create Project from Framework
                    </Button>
                    <Button variant="outline">
                      Export as Template
                    </Button>
                    <Button variant="outline">
                      Share with Colleagues
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
