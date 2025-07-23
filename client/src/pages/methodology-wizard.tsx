import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, Circle, ArrowRight, ArrowLeft, WandSparkles } from "lucide-react";
import type { WizardStep } from "@/types";

const WIZARD_STEPS: WizardStep[] = [
  {
    id: "discipline",
    title: "Select Your Discipline",
    description: "Choose the primary subject area for your project-based learning implementation",
    completed: false,
    active: true,
  },
  {
    id: "pivot-concepts", 
    title: "Define Core Concepts (Pivot)",
    description: "Identify the fundamental knowledge students must master as their reference point",
    completed: false,
    active: false,
  },
  {
    id: "launch-applications",
    title: "Plan Applications (Launch)",
    description: "Design how students will apply core knowledge in diverse contexts",
    completed: false,
    active: false,
  },
  {
    id: "assessment",
    title: "Assessment Strategy",
    description: "Create evaluation methods aligned with Pivot-and-Launch principles",
    completed: false,
    active: false,
  },
  {
    id: "implementation",
    title: "Implementation Plan",
    description: "Develop timeline and resources for successful deployment",
    completed: false,
    active: false,
  },
];

export default function MethodologyWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState(WIZARD_STEPS);
  const [formData, setFormData] = useState({
    discipline: "",
    pivotConcepts: [],
    launchApplications: [],
    assessmentMethods: [],
    timeline: "",
    resources: [],
  });

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      // Mark current step as completed
      const updatedSteps = steps.map((step, index) => ({
        ...step,
        completed: index <= currentStep,
        active: index === currentStep + 1,
      }));
      setSteps(updatedSteps);
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const updatedSteps = steps.map((step, index) => ({
        ...step,
        active: index === currentStep - 1,
      }));
      setSteps(updatedSteps);
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStepData.id) {
      case "discipline":
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="discipline" className="pbl-label">
                Primary Discipline
              </Label>
              <select
                id="discipline"
                className="pbl-input"
                value={formData.discipline}
                onChange={(e) => setFormData({ ...formData, discipline: e.target.value })}
              >
                <option value="select">Select your discipline...</option>
                <option value="blockchain">Blockchain Technology</option>
                <option value="data-science">Data Science</option>
                <option value="fintech">Financial Technology</option>
                <option value="business">Business Strategy</option>
                <option value="information-systems">Information Systems</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Why This Matters</h4>
              <p className="text-sm text-blue-700">
                Selecting your discipline helps us provide relevant templates, examples, 
                and best practices specific to your field of expertise.
              </p>
            </div>
          </div>
        );

      case "pivot-concepts":
        return (
          <div className="space-y-6">
            <div>
              <Label className="pbl-label">Core Concepts (Pivot Points)</Label>
              <p className="text-sm text-gray-600 mb-3">
                List the fundamental concepts that will serve as students' mental reference points. 
                These should be deep, transferable knowledge areas.
              </p>
              <Textarea
                className="pbl-textarea"
                placeholder="e.g., Cryptographic hashing, Smart contract architecture, Consensus mechanisms..."
              />
            </div>
            
            <div>
              <Label className="pbl-label">Assessment Boundaries</Label>
              <p className="text-sm text-gray-600 mb-3">
                How will you help students assess the limits of their core knowledge application?
              </p>
              <Textarea
                className="pbl-textarea"
                placeholder="Describe strategies for helping students understand when and how to extend their knowledge..."
              />
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-600 mb-2">Pivot Strategy</h4>
              <p className="text-sm text-red-700">
                Like a seesaw, the stronger your pivot point, the more controlled and effective 
                your students' knowledge extension will be.
              </p>
            </div>
          </div>
        );

      case "launch-applications":
        return (
          <div className="space-y-6">
            <div>
              <Label className="pbl-label">Application Contexts</Label>
              <p className="text-sm text-gray-600 mb-3">
                Where will students apply their core knowledge? List diverse, challenging scenarios.
              </p>
              <Textarea
                className="pbl-textarea"
                placeholder="e.g., Real-world case studies, peer teaching sessions, innovative problem-solving projects..."
              />
            </div>
            
            <div>
              <Label className="pbl-label">Collaboration Methods</Label>
              <p className="text-sm text-gray-600 mb-3">
                How will students work together to launch their knowledge into new domains?
              </p>
              <Textarea
                className="pbl-textarea"
                placeholder="Describe group projects, peer review processes, collaborative research..."
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-600 mb-2">Launch Principle</h4>
              <p className="text-sm text-yellow-700">
                The launch phase should challenge students to apply knowledge creatively while 
                maintaining connection to their core concepts.
              </p>
            </div>
          </div>
        );

      case "assessment":
        return (
          <div className="space-y-6">
            <div>
              <Label className="pbl-label">Core Knowledge Assessment</Label>
              <p className="text-sm text-gray-600 mb-3">
                How will you evaluate mastery of pivot concepts?
              </p>
              <Textarea
                className="pbl-textarea"
                placeholder="Traditional tests, practical demonstrations, concept mapping..."
              />
            </div>
            
            <div>
              <Label className="pbl-label">Application Assessment</Label>
              <p className="text-sm text-gray-600 mb-3">
                How will you assess students' ability to launch knowledge into new contexts?
              </p>
              <Textarea
                className="pbl-textarea"
                placeholder="Project portfolios, peer evaluations, reflection journals..."
              />
            </div>

            <div>
              <Label className="pbl-label">Anti-Overload Measures</Label>
              <p className="text-sm text-gray-600 mb-3">
                What safeguards will prevent information overwhelm?
              </p>
              <Textarea
                className="pbl-textarea"
                placeholder="Curated resources, focused learning objectives, structured feedback..."
              />
            </div>
          </div>
        );

      case "implementation":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="timeline" className="pbl-label">Project Timeline</Label>
                <Input
                  id="timeline"
                  className="pbl-input"
                  placeholder="e.g., 8-12 weeks"
                />
              </div>
              <div>
                <Label htmlFor="class-size" className="pbl-label">Class Size</Label>
                <Input
                  id="class-size"
                  className="pbl-input"
                  placeholder="e.g., 25-30 students"
                />
              </div>
            </div>
            
            <div>
              <Label className="pbl-label">Required Resources</Label>
              <Textarea
                className="pbl-textarea"
                placeholder="Technology, materials, external partnerships, assessment tools..."
              />
            </div>
            
            <div>
              <Label className="pbl-label">Success Metrics</Label>
              <Textarea
                className="pbl-textarea"
                placeholder="How will you measure the effectiveness of your Pivot-and-Launch implementation?"
              />
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-600 mb-2">Ready to Launch!</h4>
              <p className="text-sm text-green-700">
                Your Pivot-and-Launch methodology is ready for implementation. 
                You'll receive a complete toolkit with templates and resources.
              </p>
            </div>
          </div>
        );

      default:
        return <div>Step content not found</div>;
    }
  };

  return (
    <div className="anti-overload-container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Pivot-and-Launch Methodology Wizard
        </h1>
        <p className="text-gray-600 text-lg">
          Guided setup for implementing strategic pedagogy in your courses
        </p>
      </div>

      {/* Pedagogical Strategy Description */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-8">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
            <WandSparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-3">About the Pivot-and-Launch Strategy</h3>
            <p className="text-blue-800 leading-relaxed">
              The "Pivot-and-Launch" pedagogical strategy is an innovative approach to project-based learning (PBL) that combines the strengths of core knowledge and application to enhance teaching and learning. The strategy is specifically designed to address the challenges posed by information overload and the rapid evolution of fields like data science, business, and AI. By strengthening foundational knowledge and applying it to diverse contexts through PBL, students will develop a deep understanding of the material and the ability to adapt to changing professional landscapes.
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Navigation */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 overflow-x-auto pb-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="flex items-center flex-shrink-0"
            >
              <div className="flex items-center">
                {step.completed ? (
                  <CheckCircle className="w-8 h-8 text-green-500" />
                ) : step.active ? (
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">{index + 1}</span>
                  </div>
                ) : (
                  <Circle className="w-8 h-8 text-gray-300" />
                )}
                <div className="ml-3">
                  <p className={`font-medium text-sm ${
                    step.active ? "text-red-600" : step.completed ? "text-green-600" : "text-gray-400"
                  }`}>
                    {step.title}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className="w-4 h-4 text-gray-300 ml-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Step Content */}
        <div className="lg:col-span-3">
          <Card className="focus-card p-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-800">
                    {currentStepData.title}
                  </CardTitle>
                  <p className="text-gray-600 mt-1">
                    {currentStepData.description}
                  </p>
                </div>
                <Badge variant={currentStepData.active ? "default" : "secondary"}>
                  {currentStepData.active ? "Current" : "Pending"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {renderStepContent()}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Navigation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Navigation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button
                onClick={handleNext}
                disabled={currentStep === steps.length - 1}
                className="w-full pbl-button-primary"
              >
                {currentStep === steps.length - 1 ? "Complete" : "Next"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <WandSparkles className="w-5 h-5 mr-2 text-red-600" />
                Pro Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Focus First:</span> Strong pivot concepts 
                  prevent information overload.
                </p>
                <p>
                  <span className="font-medium">Think Seesaw:</span> The stronger your 
                  core, the higher students can reach.
                </p>
                <p>
                  <span className="font-medium">Anti-Overload:</span> Less content, 
                  deeper understanding, better application.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Progress Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center text-sm">
                    {step.completed ? (
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    ) : step.active ? (
                      <Circle className="w-4 h-4 text-red-600 mr-2" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-300 mr-2" />
                    )}
                    <span className={step.completed ? "text-green-600" : step.active ? "text-red-600" : "text-gray-400"}>
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
