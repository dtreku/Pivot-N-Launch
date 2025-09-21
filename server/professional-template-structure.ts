// Professional Template Structure for Pivot-and-Launch PBL Methodology
// Based on cognitive load theory and evidence-based pedagogical practices

export interface ProfessionalTemplate {
  // Pivot Phase - Core Knowledge Anchoring
  pivotPhase: {
    learningObjectives: string[];
    coreConceptDefinition: string;
    constraintsAndBoundaries: string;
    minimalWorkingExample: string;
    commonMisconceptions: string[];
    cognitiveLoadConsiderations: string;
    assessmentCriteria: {
      criterion: string;
      description: string;
      exemplar: string;
      lowPerformance: string;
      highPerformance: string;
    }[];
  };

  // Launch Phase - Application Development
  launchPhase: {
    transferActivities: {
      nearTransfer: {
        title: string;
        description: string;
        scaffolding: string[];
        deliverables: string[];
        timeEstimate: string;
      };
      moderateTransfer: {
        title: string;
        description: string;
        challengeLevel: string;
        deliverables: string[];
        timeEstimate: string;
      };
      farTransfer: {
        title: string;
        description: string;
        novelContext: string;
        deliverables: string[];
        timeEstimate: string;
      };
    };
    finalProjectRequirements: {
      description: string;
      constraints: string[];
      evaluationCriteria: string[];
      presentationFormat: string;
    };
  };

  // Project Management Structure
  phases: {
    name: string;
    duration: string;
    description: string;
    learningActivities: string[];
    deliverables: {
      name: string;
      description: string;
      format: string;
      assessmentWeight: number;
    }[];
    instructorGuidance: string;
    studentInstructions: string;
    potentialChallenges: string[];
    successIndicators: string[];
  }[];

  // Tools and Resources
  requiredTools: {
    name: string;
    purpose: string;
    learningCurve: 'low' | 'medium' | 'high';
    alternatives: string[];
  }[];

  // Assessment Framework
  assessmentStrategy: {
    formativeAssessments: {
      type: string;
      frequency: string;
      purpose: string;
    }[];
    summativeAssessments: {
      type: string;
      weight: number;
      description: string;
      rubric: string;
    }[];
    peerAssessmentGuidelines: string;
    selfReflectionPrompts: string[];
  };

  // Instructor Support Materials
  instructorResources: {
    facilitationTips: string[];
    commonStudentQuestions: { question: string; suggestedResponse: string; }[];
    troubleshootingGuide: { issue: string; solution: string; }[];
    extensionActivities: string[];
    differentiationStrategies: string[];
  };

  // Student Templates and Materials
  studentMaterials: {
    projectPlanTemplate: string;
    reflectionJournalPrompts: string[];
    collaborationGuidelines: string;
    presentationTemplate: string;
    checklistTemplates: string[];
  };

  // Cognitive Load Management
  cognitiveLoadStrategy: {
    intrinsicLoadReduction: string[];
    extraneousLoadMinimization: string[];
    germaneLoadOptimization: string[];
    informationSequencing: string;
    attentionManagement: string[];
  };

  // Additional Metadata
  metadata: {
    targetAudience: string;
    prerequisites: string[];
    learningOutcomes: string[];
    timeInvestment: {
      instructorPrep: string;
      studentWork: string;
      totalDuration: string;
    };
    adaptationNotes: string[];
    versioning: {
      version: string;
      lastUpdated: string;
      changeLog: string[];
    };
  };
}

// Enhanced template data for better professional exports
export const enhancedTemplateData: Record<string, Partial<ProfessionalTemplate>> = {
  "Blockchain Applications": {
    pivotPhase: {
      learningObjectives: [
        "Define blockchain technology and explain its core principles of decentralization, immutability, and consensus",
        "Analyze the components of a smart contract and identify appropriate use cases",
        "Evaluate the trade-offs between different blockchain platforms and consensus mechanisms"
      ],
      coreConceptDefinition: "A blockchain is a distributed, immutable ledger that maintains a continuously growing list of records (blocks) linked and secured using cryptography, enabling trustless transactions without central authority.",
      constraintsAndBoundaries: "Blockchain solutions are appropriate for scenarios requiring decentralization, transparency, and immutability, but may not be suitable for applications requiring high transaction throughput, privacy, or frequent data updates.",
      minimalWorkingExample: "A simple smart contract that stores and retrieves a single value, demonstrating state management and function calls on the blockchain.",
      commonMisconceptions: [
        "Blockchain is only for cryptocurrency",
        "All blockchains are public and open",
        "Smart contracts are automatically legally binding",
        "Blockchain eliminates the need for all intermediaries"
      ],
      cognitiveLoadConsiderations: "Introduce blockchain concepts progressively: start with digital ledgers, then add decentralization, followed by cryptographic security, before combining all elements.",
      assessmentCriteria: [
        {
          criterion: "Conceptual Understanding",
          description: "Student demonstrates understanding of blockchain principles",
          exemplar: "Clearly explains decentralization, consensus, and immutability with real-world analogies",
          lowPerformance: "Confuses blockchain with database or provides inaccurate definitions",
          highPerformance: "Connects principles to implementation details and can explain trade-offs"
        }
      ]
    },
    launchPhase: {
      transferActivities: {
        nearTransfer: {
          title: "Supply Chain Transparency",
          description: "Adapt the core smart contract concepts to track product provenance in a supply chain",
          scaffolding: [
            "Use the same Solidity syntax learned in pivot phase",
            "Apply similar state management patterns",
            "Extend the basic contract structure with supply chain events"
          ],
          deliverables: ["Smart contract code", "Test cases", "Documentation"],
          timeEstimate: "2-3 weeks"
        },
        moderateTransfer: {
          title: "Decentralized Voting System",
          description: "Apply blockchain principles to create a transparent, tamper-proof voting mechanism",
          challengeLevel: "Requires integration of multiple smart contracts and user interface considerations",
          deliverables: ["Multi-contract system", "Security analysis", "User interface prototype"],
          timeEstimate: "3-4 weeks"
        },
        farTransfer: {
          title: "Novel Industry Application",
          description: "Identify and solve a blockchain-appropriate problem in an unfamiliar domain",
          novelContext: "Students must research a new industry and justify blockchain appropriateness",
          deliverables: ["Industry analysis", "Technical solution", "Implementation plan", "Presentation"],
          timeEstimate: "4-5 weeks"
        }
      },
      finalProjectRequirements: {
        description: "Develop a complete blockchain solution that demonstrates mastery of core concepts in a novel application domain",
        constraints: [
          "Must include both smart contract and user interface components",
          "Solution should address a real-world problem",
          "Must include security considerations and testing strategy"
        ],
        evaluationCriteria: [
          "Technical implementation quality",
          "Appropriate use of blockchain technology",
          "Innovation and creativity",
          "Presentation and documentation quality"
        ],
        presentationFormat: "15-minute presentation with 5-minute Q&A, including live demonstration"
      }
    }
  },

  "Data Science": {
    pivotPhase: {
      learningObjectives: [
        "Apply the data science methodology to structure problem-solving approaches",
        "Distinguish between descriptive, predictive, and prescriptive analytics",
        "Evaluate data quality and identify appropriate preprocessing techniques"
      ],
      coreConceptDefinition: "Data science is the systematic extraction of actionable insights from data using computational and statistical methods, combining domain expertise with technical skills to solve complex problems.",
      constraintsAndBoundaries: "Data science approaches are most effective when sufficient quality data is available, the problem can be quantified, and stakeholders can act on the insights generated.",
      minimalWorkingExample: "A complete data analysis pipeline that loads, cleans, analyzes, and visualizes a simple dataset to answer a specific question.",
      commonMisconceptions: [
        "Data science is just running machine learning algorithms",
        "More data always leads to better insights",
        "Correlation implies causation",
        "Complex models are always better than simple ones"
      ],
      cognitiveLoadConsiderations: "Scaffold the data science process by starting with familiar datasets and clear questions before introducing complex algorithms or large datasets.",
      assessmentCriteria: [
        {
          criterion: "Methodology Application",
          description: "Student demonstrates systematic approach to data analysis",
          exemplar: "Follows structured methodology from problem definition through insight communication",
          lowPerformance: "Jumps directly to analysis without problem framing or skips validation steps",
          highPerformance: "Adapts methodology appropriately to problem context and explains reasoning"
        }
      ]
    }
  }
};