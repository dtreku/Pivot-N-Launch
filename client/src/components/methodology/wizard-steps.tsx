import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Target, CheckCircle, AlertTriangle } from "lucide-react";
import type { WizardStep } from "@/types";

interface WizardStepProps {
  step: WizardStep;
  data: any;
  onDataChange: (data: any) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export function DisciplineStep({ data, onDataChange }: WizardStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="discipline" className="pbl-label">
          Primary Discipline
        </Label>
        <Select
          value={data.discipline || ""}
          onValueChange={(value) => onDataChange({ ...data, discipline: value })}
        >
          <SelectTrigger className="pbl-input">
            <SelectValue placeholder="Select your discipline..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="blockchain">Blockchain Technology</SelectItem>
            <SelectItem value="data-science">Data Science</SelectItem>
            <SelectItem value="fintech">Financial Technology</SelectItem>
            <SelectItem value="business">Business Strategy</SelectItem>
            <SelectItem value="information-systems">Information Systems</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="course-level" className="pbl-label">
          Course Level
        </Label>
        <Select
          value={data.courseLevel || ""}
          onValueChange={(value) => onDataChange({ ...data, courseLevel: value })}
        >
          <SelectTrigger className="pbl-input">
            <SelectValue placeholder="Select course level..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="undergraduate">Undergraduate</SelectItem>
            <SelectItem value="graduate">Graduate</SelectItem>
            <SelectItem value="professional">Professional Development</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="student-background" className="pbl-label">
          Student Background & Prerequisites
        </Label>
        <Textarea
          id="student-background"
          className="pbl-textarea"
          value={data.studentBackground || ""}
          onChange={(e) => onDataChange({ ...data, studentBackground: e.target.value })}
          placeholder="Describe student prior knowledge, skills, and any prerequisites..."
        />
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2 flex items-center">
          <Lightbulb className="w-4 h-4 mr-2" />
          Why This Matters
        </h4>
        <p className="text-sm text-blue-700">
          Selecting your discipline helps us provide relevant templates, examples, 
          and best practices specific to your field of expertise. Understanding your 
          students' background ensures appropriate complexity and scaffolding.
        </p>
      </div>
    </div>
  );
}

export function PivotConceptsStep({ data, onDataChange }: WizardStepProps) {
  const [newConcept, setNewConcept] = useState("");

  const addConcept = () => {
    if (newConcept.trim()) {
      const concepts = data.pivotConcepts || [];
      onDataChange({ 
        ...data, 
        pivotConcepts: [...concepts, newConcept.trim()] 
      });
      setNewConcept("");
    }
  };

  const removeConcept = (index: number) => {
    const concepts = data.pivotConcepts || [];
    onDataChange({ 
      ...data, 
      pivotConcepts: concepts.filter((_, i) => i !== index) 
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="pbl-label">Core Concepts (Pivot Points)</Label>
        <p className="text-sm text-gray-600 mb-3">
          List the fundamental concepts that will serve as students' mental reference points. 
          These should be deep, transferable knowledge areas.
        </p>
        
        <div className="flex gap-2 mb-3">
          <Input
            value={newConcept}
            onChange={(e) => setNewConcept(e.target.value)}
            placeholder="Enter a core concept..."
            className="flex-1"
            onKeyPress={(e) => e.key === 'Enter' && addConcept()}
          />
          <Button onClick={addConcept} variant="outline">
            Add
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(data.pivotConcepts || []).map((concept: string, index: number) => (
            <Badge
              key={index}
              variant="secondary"
              className="cursor-pointer hover:bg-red-100 hover:text-red-800"
              onClick={() => removeConcept(index)}
            >
              {concept} ✕
            </Badge>
          ))}
        </div>
      </div>
      
      <div>
        <Label className="pbl-label">Knowledge Assessment Strategy</Label>
        <p className="text-sm text-gray-600 mb-3">
          How will you help students assess the limits of their core knowledge application?
        </p>
        <Textarea
          className="pbl-textarea"
          value={data.assessmentStrategy || ""}
          onChange={(e) => onDataChange({ ...data, assessmentStrategy: e.target.value })}
          placeholder="Describe strategies for helping students understand when and how to extend their knowledge..."
        />
      </div>

      <div>
        <Label className="pbl-label">Success Indicators</Label>
        <Textarea
          className="pbl-textarea"
          value={data.successIndicators || ""}
          onChange={(e) => onDataChange({ ...data, successIndicators: e.target.value })}
          placeholder="How will you know students have mastered the core concepts?"
        />
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="font-medium text-red-600 mb-2 flex items-center">
          <Target className="w-4 h-4 mr-2" />
          Pivot Strategy
        </h4>
        <p className="text-sm text-red-700">
          Like a seesaw, the stronger your pivot point, the more controlled and effective 
          your students' knowledge extension will be. Focus on 3-5 core concepts for optimal learning.
        </p>
      </div>
    </div>
  );
}

export function LaunchApplicationsStep({ data, onDataChange }: WizardStepProps) {
  const [newApplication, setNewApplication] = useState("");

  const addApplication = () => {
    if (newApplication.trim()) {
      const applications = data.launchApplications || [];
      onDataChange({ 
        ...data, 
        launchApplications: [...applications, newApplication.trim()] 
      });
      setNewApplication("");
    }
  };

  const removeApplication = (index: number) => {
    const applications = data.launchApplications || [];
    onDataChange({ 
      ...data, 
      launchApplications: applications.filter((_, i) => i !== index) 
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="pbl-label">Application Contexts</Label>
        <p className="text-sm text-gray-600 mb-3">
          Where will students apply their core knowledge? List diverse, challenging scenarios.
        </p>
        
        <div className="flex gap-2 mb-3">
          <Input
            value={newApplication}
            onChange={(e) => setNewApplication(e.target.value)}
            placeholder="Enter an application context..."
            className="flex-1"
            onKeyPress={(e) => e.key === 'Enter' && addApplication()}
          />
          <Button onClick={addApplication} variant="outline">
            Add
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(data.launchApplications || []).map((application: string, index: number) => (
            <Badge
              key={index}
              variant="secondary"
              className="cursor-pointer hover:bg-blue-100 hover:text-blue-800"
              onClick={() => removeApplication(index)}
            >
              {application} ✕
            </Badge>
          ))}
        </div>
      </div>
      
      <div>
        <Label className="pbl-label">Collaboration Methods</Label>
        <p className="text-sm text-gray-600 mb-3">
          How will students work together to launch their knowledge into new domains?
        </p>
        <Textarea
          className="pbl-textarea"
          value={data.collaborationMethods || ""}
          onChange={(e) => onDataChange({ ...data, collaborationMethods: e.target.value })}
          placeholder="Describe group projects, peer review processes, collaborative research..."
        />
      </div>

      <div>
        <Label className="pbl-label">Real-World Connections</Label>
        <Textarea
          className="pbl-textarea"
          value={data.realWorldConnections || ""}
          onChange={(e) => onDataChange({ ...data, realWorldConnections: e.target.value })}
          placeholder="How will projects connect to industry, community, or current events?"
        />
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-600 mb-2 flex items-center">
          <CheckCircle className="w-4 h-4 mr-2" />
          Launch Principle
        </h4>
        <p className="text-sm text-yellow-700">
          The launch phase should challenge students to apply knowledge creatively while 
          maintaining connection to their core concepts. Aim for authentic, meaningful applications.
        </p>
      </div>
    </div>
  );
}

export function AssessmentStep({ data, onDataChange }: WizardStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <Label className="pbl-label">Core Knowledge Assessment</Label>
        <p className="text-sm text-gray-600 mb-3">
          How will you evaluate mastery of pivot concepts?
        </p>
        <Textarea
          className="pbl-textarea"
          value={data.coreAssessment || ""}
          onChange={(e) => onDataChange({ ...data, coreAssessment: e.target.value })}
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
          value={data.applicationAssessment || ""}
          onChange={(e) => onDataChange({ ...data, applicationAssessment: e.target.value })}
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
          value={data.antiOverloadMeasures || ""}
          onChange={(e) => onDataChange({ ...data, antiOverloadMeasures: e.target.value })}
          placeholder="Curated resources, focused learning objectives, structured feedback..."
        />
      </div>

      <div>
        <Label className="pbl-label">Rubric Elements</Label>
        <p className="text-sm text-gray-600 mb-3">
          Key criteria for evaluating student success
        </p>
        <Textarea
          className="pbl-textarea"
          value={data.rubricElements || ""}
          onChange={(e) => onDataChange({ ...data, rubricElements: e.target.value })}
          placeholder="Core concept mastery, application creativity, collaboration effectiveness..."
        />
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-600 mb-2 flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2" />
          Assessment Balance
        </h4>
        <p className="text-sm text-green-700">
          Ensure your assessment strategy evaluates both deep understanding (pivot) 
          and creative application (launch) while avoiding cognitive overload.
        </p>
      </div>
    </div>
  );
}

export function ImplementationStep({ data, onDataChange }: WizardStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="timeline" className="pbl-label">Project Timeline</Label>
          <Input
            id="timeline"
            className="pbl-input"
            value={data.timeline || ""}
            onChange={(e) => onDataChange({ ...data, timeline: e.target.value })}
            placeholder="e.g., 8-12 weeks"
          />
        </div>
        <div>
          <Label htmlFor="class-size" className="pbl-label">Expected Class Size</Label>
          <Input
            id="class-size"
            className="pbl-input"
            value={data.classSize || ""}
            onChange={(e) => onDataChange({ ...data, classSize: e.target.value })}
            placeholder="e.g., 25-30 students"
          />
        </div>
      </div>
      
      <div>
        <Label className="pbl-label">Required Resources</Label>
        <Textarea
          className="pbl-textarea"
          value={data.requiredResources || ""}
          onChange={(e) => onDataChange({ ...data, requiredResources: e.target.value })}
          placeholder="Technology, materials, external partnerships, assessment tools..."
        />
      </div>
      
      <div>
        <Label className="pbl-label">Success Metrics</Label>
        <Textarea
          className="pbl-textarea"
          value={data.successMetrics || ""}
          onChange={(e) => onDataChange({ ...data, successMetrics: e.target.value })}
          placeholder="How will you measure the effectiveness of your Pivot-and-Launch implementation?"
        />
      </div>

      <div>
        <Label className="pbl-label">Potential Challenges & Solutions</Label>
        <Textarea
          className="pbl-textarea"
          value={data.challenges || ""}
          onChange={(e) => onDataChange({ ...data, challenges: e.target.value })}
          placeholder="Anticipate implementation challenges and plan solutions..."
        />
      </div>

      <div>
        <Label className="pbl-label">Institutional Support Needed</Label>
        <Textarea
          className="pbl-textarea"
          value={data.institutionalSupport || ""}
          onChange={(e) => onDataChange({ ...data, institutionalSupport: e.target.value })}
          placeholder="What support do you need from your institution to succeed?"
        />
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-600 mb-2 flex items-center">
          <CheckCircle className="w-4 h-4 mr-2" />
          Ready to Launch!
        </h4>
        <p className="text-sm text-green-700">
          Your Pivot-and-Launch methodology is ready for implementation. 
          You'll receive a complete toolkit with templates and resources upon completion.
        </p>
      </div>
    </div>
  );
}

export const WIZARD_STEP_COMPONENTS = {
  discipline: DisciplineStep,
  "pivot-concepts": PivotConceptsStep,
  "launch-applications": LaunchApplicationsStep,
  assessment: AssessmentStep,
  implementation: ImplementationStep,
};
