import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, UnderlineType, BorderStyle } from 'docx';
import { ProfessionalTemplate, enhancedTemplateData } from './professional-template-structure';

interface BasicTemplate {
  id: number;
  name: string;
  description: string;
  discipline: string;
  category: string;
  template: {
    phases?: string[];
    deliverables?: string[];
    tools?: string[];
  };
  estimatedDuration?: string;
  difficultyLevel?: string;
  icon?: string;
  color?: string;
}

export class DocxExportService {
  
  async generateProfessionalGuide(templates: BasicTemplate[]): Promise<Buffer> {
    const allContent: (Paragraph | Table)[] = [];
    
    for (const template of templates) {
      const templateContent = this.createTemplateSection(template);
      for (const item of templateContent) {
        if (Array.isArray(item)) {
          allContent.push(...item);
        } else if (item) {
          allContent.push(item);
        }
      }
    }
    
    const doc = new Document({
      sections: [{
        properties: {},
        children: allContent
      }]
    });

    return await Packer.toBuffer(doc);
  }

  private createTemplateSection(template: BasicTemplate) {
    const enhancedData = enhancedTemplateData[template.name] || {};
    
    return [
      // Title Page for Template
      new Paragraph({
        children: [
          new TextRun({
            text: template.name,
            bold: true,
            size: 32,
            color: "2E3440"
          })
        ],
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "Pivot-and-Launch Project-Based Learning Guide",
            size: 18,
            color: "5E6470"
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 }
      }),

      // Template Overview
      new Paragraph({
        children: [
          new TextRun({
            text: "Template Overview",
            bold: true,
            size: 20,
            color: "2E3440"
          })
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: `Discipline: `,
            bold: true
          }),
          new TextRun({
            text: template.discipline
          })
        ],
        spacing: { after: 120 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: `Category: `,
            bold: true
          }),
          new TextRun({
            text: template.category
          })
        ],
        spacing: { after: 120 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: `Duration: `,
            bold: true
          }),
          new TextRun({
            text: template.estimatedDuration || "Not specified"
          })
        ],
        spacing: { after: 120 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: `Difficulty Level: `,
            bold: true
          }),
          new TextRun({
            text: template.difficultyLevel || "Intermediate"
          })
        ],
        spacing: { after: 300 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "Description: ",
            bold: true
          }),
          new TextRun({
            text: template.description
          })
        ],
        spacing: { after: 400 }
      }),

      // Pivot Phase Section
      this.createPivotPhaseSection(enhancedData.pivotPhase),

      // Launch Phase Section  
      this.createLaunchPhaseSection(enhancedData.launchPhase),

      // Project Phases
      this.createProjectPhasesSection(template),

      // Assessment Framework
      this.createAssessmentSection(enhancedData.pivotPhase?.assessmentCriteria),

      // Instructor Resources
      this.createInstructorResourcesSection(),

      // Student Templates
      this.createStudentTemplatesSection(),

      // Appendices
      this.createAppendicesSection(template),

      // Page Break before next template
      new Paragraph({
        children: [new TextRun({ text: "", break: 2 })],
        pageBreakBefore: true
      })
    ].filter(Boolean);
  }

  private createPivotPhaseSection(pivotPhase?: ProfessionalTemplate['pivotPhase']) {
    if (!pivotPhase) return null;

    return [
      new Paragraph({
        children: [
          new TextRun({
            text: "PIVOT PHASE: Core Knowledge Anchoring",
            bold: true,
            size: 18,
            color: "D73502"
          })
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "Learning Objectives",
            bold: true,
            size: 16,
            underline: { type: UnderlineType.SINGLE }
          })
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 120 }
      }),

      ...pivotPhase.learningObjectives.map(objective => 
        new Paragraph({
          children: [
            new TextRun({
              text: `• ${objective}`
            })
          ],
          spacing: { after: 80 },
          indent: { left: 360 }
        })
      ),

      new Paragraph({
        children: [
          new TextRun({
            text: "Core Concept Definition",
            bold: true,
            size: 16,
            underline: { type: UnderlineType.SINGLE }
          })
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 120 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: pivotPhase.coreConceptDefinition
          })
        ],
        spacing: { after: 200 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "Constraints and Boundaries",
            bold: true,
            size: 16,
            underline: { type: UnderlineType.SINGLE }
          })
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 120 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: pivotPhase.constraintsAndBoundaries
          })
        ],
        spacing: { after: 200 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "Minimal Working Example",
            bold: true,
            size: 16,
            underline: { type: UnderlineType.SINGLE }
          })
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 120 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: pivotPhase.minimalWorkingExample,
            italics: true
          })
        ],
        spacing: { after: 200 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "Common Student Misconceptions",
            bold: true,
            size: 16,
            underline: { type: UnderlineType.SINGLE }
          })
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 120 }
      }),

      ...pivotPhase.commonMisconceptions.map(misconception => 
        new Paragraph({
          children: [
            new TextRun({
              text: `• ${misconception}`,
              color: "8B5A2B"
            })
          ],
          spacing: { after: 80 },
          indent: { left: 360 }
        })
      ),

      new Paragraph({
        children: [
          new TextRun({
            text: "Cognitive Load Management",
            bold: true,
            size: 16,
            underline: { type: UnderlineType.SINGLE }
          })
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 120 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "[INSTRUCTOR TIP] ",
            bold: true,
            color: "0066CC"
          }),
          new TextRun({
            text: pivotPhase.cognitiveLoadConsiderations
          })
        ],
        spacing: { after: 300 }
      })
    ];
  }

  private createLaunchPhaseSection(launchPhase?: ProfessionalTemplate['launchPhase']) {
    if (!launchPhase) return null;

    return [
      new Paragraph({
        children: [
          new TextRun({
            text: "LAUNCH PHASE: Application Development",
            bold: true,
            size: 18,
            color: "0066CC"
          })
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "Progressive Transfer Activities",
            bold: true,
            size: 16,
            underline: { type: UnderlineType.SINGLE }
          })
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 120 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "Near Transfer: ",
            bold: true,
            color: "0066CC"
          }),
          new TextRun({
            text: launchPhase.transferActivities.nearTransfer.title
          })
        ],
        spacing: { after: 120 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: launchPhase.transferActivities.nearTransfer.description
          })
        ],
        spacing: { after: 200 },
        indent: { left: 360 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "Moderate Transfer: ",
            bold: true,
            color: "0066CC"
          }),
          new TextRun({
            text: launchPhase.transferActivities.moderateTransfer.title
          })
        ],
        spacing: { after: 120 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: launchPhase.transferActivities.moderateTransfer.description
          })
        ],
        spacing: { after: 200 },
        indent: { left: 360 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "Far Transfer: ",
            bold: true,
            color: "0066CC"
          }),
          new TextRun({
            text: launchPhase.transferActivities.farTransfer.title
          })
        ],
        spacing: { after: 120 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: launchPhase.transferActivities.farTransfer.description
          })
        ],
        spacing: { after: 300 },
        indent: { left: 360 }
      })
    ];
  }

  private createProjectPhasesSection(template: BasicTemplate) {
    return [
      new Paragraph({
        children: [
          new TextRun({
            text: "Project Implementation Phases",
            bold: true,
            size: 18,
            color: "2E3440"
          })
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),

      ...(template.template.phases || []).map((phase, index) => [
        new Paragraph({
          children: [
            new TextRun({
              text: `Phase ${index + 1}: ${phase}`,
              bold: true,
              size: 14
            })
          ],
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 120 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Key Activities: ",
              bold: true
            }),
            new TextRun({
              text: this.getPhaseActivities(phase)
            })
          ],
          spacing: { after: 120 },
          indent: { left: 360 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Deliverables: ",
              bold: true
            }),
            new TextRun({
              text: this.getPhaseDeliverables(phase, template.template.deliverables || [])
            })
          ],
          spacing: { after: 120 },
          indent: { left: 360 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Estimated Duration: ",
              bold: true
            }),
            new TextRun({
              text: this.getPhaseDuration(phase)
            })
          ],
          spacing: { after: 200 },
          indent: { left: 360 }
        })
      ]).flat()
    ];
  }

  private createAssessmentSection(assessmentCriteria?: ProfessionalTemplate['pivotPhase']['assessmentCriteria']) {
    if (!assessmentCriteria) return null;

    return [
      new Paragraph({
        children: [
          new TextRun({
            text: "Assessment Framework",
            bold: true,
            size: 18,
            color: "2E3440"
          })
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),

      new Table({
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Criterion", bold: true })] })],
                width: { size: 20, type: WidthType.PERCENTAGE }
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Description", bold: true })] })],
                width: { size: 30, type: WidthType.PERCENTAGE }
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Low Performance", bold: true })] })],
                width: { size: 25, type: WidthType.PERCENTAGE }
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "High Performance", bold: true })] })],
                width: { size: 25, type: WidthType.PERCENTAGE }
              })
            ]
          }),
          ...assessmentCriteria.map(criterion => 
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: criterion.criterion })] })]
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: criterion.description })] })]
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: criterion.lowPerformance })] })]
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: criterion.highPerformance })] })]
                })
              ]
            })
          )
        ],
        width: { size: 100, type: WidthType.PERCENTAGE }
      })
    ];
  }

  private createInstructorResourcesSection() {
    return [
      new Paragraph({
        children: [
          new TextRun({
            text: "Instructor Resources",
            bold: true,
            size: 18,
            color: "2E3440"
          })
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "Facilitation Tips",
            bold: true,
            size: 16,
            underline: { type: UnderlineType.SINGLE }
          })
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 120 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "• Start each session with a brief review of core concepts from the pivot phase"
          })
        ],
        spacing: { after: 80 },
        indent: { left: 360 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "• Use think-pair-share activities to encourage peer learning and reduce cognitive load"
          })
        ],
        spacing: { after: 80 },
        indent: { left: 360 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "• Provide regular checkpoints to assess understanding before moving to next transfer level"
          })
        ],
        spacing: { after: 80 },
        indent: { left: 360 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "• Encourage reflection journals to help students connect concepts across contexts"
          })
        ],
        spacing: { after: 300 },
        indent: { left: 360 }
      })
    ];
  }

  private createStudentTemplatesSection() {
    return [
      new Paragraph({
        children: [
          new TextRun({
            text: "Student Templates and Materials",
            bold: true,
            size: 18,
            color: "2E3440"
          })
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "Project Planning Template",
            bold: true,
            size: 16,
            underline: { type: UnderlineType.SINGLE }
          })
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 120 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "1. Problem Statement: [What specific problem are you solving?]"
          })
        ],
        spacing: { after: 120 },
        indent: { left: 360 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "2. Core Concepts Applied: [Which pivot concepts will you use?]"
          })
        ],
        spacing: { after: 120 },
        indent: { left: 360 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "3. Success Criteria: [How will you know if your solution works?]"
          })
        ],
        spacing: { after: 120 },
        indent: { left: 360 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "4. Timeline and Milestones: [When will you complete each phase?]"
          })
        ],
        spacing: { after: 120 },
        indent: { left: 360 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "5. Resources Needed: [What tools, data, or support do you need?]"
          })
        ],
        spacing: { after: 300 },
        indent: { left: 360 }
      })
    ];
  }

  private createAppendicesSection(template: BasicTemplate) {
    return [
      new Paragraph({
        children: [
          new TextRun({
            text: "Appendices",
            bold: true,
            size: 18,
            color: "2E3440"
          })
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "Required Tools and Technologies",
            bold: true,
            size: 16,
            underline: { type: UnderlineType.SINGLE }
          })
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 120 }
      }),

      ...(template.template.tools || []).map(tool => 
        new Paragraph({
          children: [
            new TextRun({
              text: `• ${tool}`,
              bold: true
            }),
            new TextRun({
              text: ` - ${this.getToolDescription(tool)}`
            })
          ],
          spacing: { after: 120 },
          indent: { left: 360 }
        })
      ),

      new Paragraph({
        children: [
          new TextRun({
            text: "Expected Deliverables",
            bold: true,
            size: 16,
            underline: { type: UnderlineType.SINGLE }
          })
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 120 }
      }),

      ...(template.template.deliverables || []).map(deliverable => 
        new Paragraph({
          children: [
            new TextRun({
              text: `• ${deliverable}`,
              bold: true
            })
          ],
          spacing: { after: 120 },
          indent: { left: 360 }
        })
      )
    ];
  }

  // Helper methods
  private getPhaseActivities(phase: string): string {
    const activities = {
      'Research': 'Literature review, problem identification, background analysis',
      'Design': 'Solution architecture, wireframes, technical specifications',
      'Development': 'Implementation, coding, prototyping, iterative building',
      'Testing': 'Unit testing, integration testing, user acceptance testing',
      'Deployment': 'Production setup, documentation, final presentation',
      'Data Collection': 'Gathering datasets, defining data requirements, data quality assessment',
      'Exploration': 'Exploratory data analysis, visualization, pattern identification',
      'Modeling': 'Algorithm selection, model training, parameter tuning',
      'Validation': 'Model evaluation, cross-validation, performance metrics',
      'Presentation': 'Results communication, visualization, stakeholder reporting'
    };
    return activities[phase as keyof typeof activities] || 'Phase-specific activities and learning tasks';
  }

  private getPhaseDeliverables(phase: string, allDeliverables: string[]): string {
    if (allDeliverables.length > 0) {
      return allDeliverables.join(', ');
    }
    return 'Phase-specific deliverables and documentation';
  }

  private getPhaseDuration(phase: string): string {
    const durations = {
      'Research': '1-2 weeks',
      'Design': '1-2 weeks', 
      'Development': '3-4 weeks',
      'Testing': '1-2 weeks',
      'Deployment': '1 week',
      'Data Collection': '1-2 weeks',
      'Exploration': '2-3 weeks',
      'Modeling': '2-3 weeks',
      'Validation': '1-2 weeks',
      'Presentation': '1 week'
    };
    return durations[phase as keyof typeof durations] || '1-2 weeks';
  }

  private getToolDescription(tool: string): string {
    const descriptions = {
      'Solidity': 'Smart contract programming language for Ethereum blockchain',
      'Remix': 'Web-based IDE for smart contract development and testing',
      'Web3': 'JavaScript library for interacting with blockchain networks',
      'Python': 'Programming language for data analysis and machine learning',
      'Jupyter': 'Interactive notebook environment for data science',
      'Pandas': 'Data manipulation and analysis library for Python',
      'Scikit-learn': 'Machine learning library for Python'
    };
    return descriptions[tool as keyof typeof descriptions] || 'Professional development tool';
  }
}