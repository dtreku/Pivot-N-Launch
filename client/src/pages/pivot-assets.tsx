import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Anchor, 
  BookOpen, 
  Brain, 
  CheckCircle, 
  Clock, 
  Plus, 
  Search,
  Target,
  Lightbulb,
  FileText,
  Timer,
  AlertCircle
} from "lucide-react";

// Sample data based on the research report structure
const PIVOT_CARDS = [
  {
    id: 1,
    title: "Blockchain Consensus Mechanisms",
    discipline: "fintech",
    definition: "Protocols that achieve agreement on a single data value among distributed processes or systems",
    constraints: "Byzantine fault tolerance, energy efficiency, decentralization trade-offs",
    minimalExample: "Proof of Work: Miners compete to solve cryptographic puzzles",
    counterExample: "Simple voting without Byzantine fault tolerance",
    misconceptions: ["All consensus mechanisms are equally secure", "Proof of Stake eliminates all centralization"],
    createdAt: "2025-01-20",
    retrievalCount: 15,
    masteryLevel: 0.85
  },
  {
    id: 2,
    title: "Database Normalization",
    discipline: "information-systems",
    definition: "Process of organizing data to reduce redundancy and improve data integrity",
    constraints: "Must preserve functional dependencies, may impact query performance",
    minimalExample: "1NF: Eliminate repeating groups in columns",
    counterExample: "Storing multiple phone numbers in a single column",
    misconceptions: ["Higher normal forms are always better", "Denormalization is always bad"],
    createdAt: "2025-01-18",
    retrievalCount: 8,
    masteryLevel: 0.72
  },
  {
    id: 3,
    title: "Statistical Significance vs Practical Significance",
    discipline: "data-science",
    definition: "Statistical significance indicates unlikely chance occurrence; practical significance indicates meaningful real-world impact",
    constraints: "Sample size affects statistical significance; effect size determines practical significance",
    minimalExample: "Large study finds 0.1% improvement with p<0.001 - statistically but not practically significant",
    counterExample: "Assuming statistical significance always means practical importance",
    misconceptions: ["Significant p-value means large effect", "Non-significant results are worthless"],
    createdAt: "2025-01-22",
    retrievalCount: 12,
    masteryLevel: 0.68
  }
];

const WORKED_EXAMPLES = [
  {
    id: 1,
    pivotCardId: 1,
    title: "Designing a Consensus Protocol for Supply Chain",
    steps: [
      "Identify stakeholders and trust requirements",
      "Analyze Byzantine fault tolerance needs",
      "Select appropriate consensus mechanism",
      "Design incentive structure",
      "Implement validation rules"
    ],
    selfExplanationPrompts: [
      "Why is Byzantine fault tolerance critical in this context?",
      "What are the trade-offs between PoW and PoS here?",
      "How do economic incentives align with security goals?"
    ],
    completionProblem: "Design a consensus protocol for a healthcare data sharing network"
  },
  {
    id: 2,
    pivotCardId: 2,
    title: "Normalizing a Customer Order Database",
    steps: [
      "Identify functional dependencies",
      "Check for 1NF violations",
      "Decompose to achieve 2NF",
      "Verify 3NF compliance",
      "Validate with sample queries"
    ],
    selfExplanationPrompts: [
      "What problems would arise without normalization?",
      "Why might we sometimes accept lower normal forms?",
      "How does this impact application design?"
    ],
    completionProblem: "Normalize a university course enrollment database"
  }
];

const RETRIEVAL_ACTIVITIES = [
  {
    id: 1,
    pivotCardId: 1,
    type: "flashcard",
    question: "What is the key difference between Proof of Work and Proof of Stake?",
    answer: "PoW requires computational work to validate; PoS requires economic stake and selection algorithm",
    difficulty: "basic",
    lastShown: "2025-09-23",
    nextDue: "2025-09-25"
  },
  {
    id: 2,
    pivotCardId: 2,
    type: "concept-check",
    question: "A table has repeating groups in columns. What normal form violation is this?",
    options: ["1NF", "2NF", "3NF", "BCNF"],
    correct: 0,
    difficulty: "basic",
    lastShown: "2025-09-22",
    nextDue: "2025-09-24"
  }
];

export default function PivotAssets() {
  const [activeTab, setActiveTab] = useState("cards");
  const [selectedDiscipline, setSelectedDiscipline] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  const filteredCards = PIVOT_CARDS.filter(card => {
    const matchesDiscipline = selectedDiscipline === "all" || card.discipline === selectedDiscipline;
    const matchesSearch = !searchQuery || 
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.definition.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDiscipline && matchesSearch;
  });

  return (
    <div className="anti-overload-container">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Pivot Assets - Core Knowledge Anchors
        </h1>
        <p className="text-gray-600 text-lg">
          Build robust mental reference frames through structured core concept mastery
        </p>
      </div>

      {/* Research-Based Design Principles */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-8">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
            <Anchor className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Research-Grounded Pivot Design</h3>
            <p className="text-blue-800 leading-relaxed mb-3">
              Based on cognitive load theory and schema formation research, Pivot assets establish stable mental anchors before contextual application. Each asset reduces extraneous cognitive load while building durable conceptual foundations.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-sm">
                <strong className="text-blue-900">Anchor Before Apply:</strong>
                <br />Establish robust schemas before Launch phases
              </div>
              <div className="text-sm">
                <strong className="text-blue-900">Load-Aware Design:</strong>
                <br />Minimize extraneous load, optimize intrinsic processing
              </div>
              <div className="text-sm">
                <strong className="text-blue-900">Retrieval Practice:</strong>
                <br />Spaced repetition strengthens knowledge retention
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search pivot cards and concepts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by discipline" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Disciplines</SelectItem>
            <SelectItem value="fintech">Fintech</SelectItem>
            <SelectItem value="information-systems">Information Systems</SelectItem>
            <SelectItem value="data-science">Data Science</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cards" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Pivot Cards
          </TabsTrigger>
          <TabsTrigger value="examples" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Worked Examples
          </TabsTrigger>
          <TabsTrigger value="retrieval" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Retrieval Practice
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Mastery Analytics
          </TabsTrigger>
        </TabsList>

        {/* Pivot Cards Tab */}
        <TabsContent value="cards" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-800">Core Concept Cards</h2>
            <Button className="pbl-button">
              <Plus className="w-4 h-4 mr-2" />
              Create New Card
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCards.map(card => (
              <Card key={card.id} className="hover:shadow-lg transition-shadow cursor-pointer" 
                    onClick={() => setSelectedCard(card.id)}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {card.discipline.replace('-', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {card.definition}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Mastery Level</span>
                      <span className="font-medium">{Math.round(card.masteryLevel * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${card.masteryLevel * 100}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {card.retrievalCount} retrievals
                      </div>
                      <span>{card.createdAt}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Worked Examples Tab */}
        <TabsContent value="examples" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-800">Worked Examples Library</h2>
            <Button className="pbl-button">
              <Plus className="w-4 h-4 mr-2" />
              Create Example
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {WORKED_EXAMPLES.map(example => (
              <Card key={example.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{example.title}</CardTitle>
                  <p className="text-sm text-gray-500">
                    Links to: {PIVOT_CARDS.find(c => c.id === example.pivotCardId)?.title}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Step-by-Step Process:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      {example.steps.map((step, index) => (
                        <li key={index} className="text-gray-600">{step}</li>
                      ))}
                    </ol>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Self-Explanation Prompts:</h4>
                    <ul className="space-y-1 text-sm">
                      {example.selfExplanationPrompts.map((prompt, index) => (
                        <li key={index} className="text-gray-600 flex items-start">
                          <span className="text-blue-600 mr-2">?</span>
                          {prompt}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded p-3">
                    <h4 className="font-medium text-amber-900 mb-1">Completion Problem:</h4>
                    <p className="text-sm text-amber-800">{example.completionProblem}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Retrieval Practice Tab */}
        <TabsContent value="retrieval" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-800">Micro-Retrieval Bank</h2>
            <Button 
              className="pbl-button"
              onClick={() => {
                // TODO: Implement add retrieval item functionality
                alert('Add Retrieval Item feature coming soon! This will open a form to create new flashcards, concept checks, or application exercises.');
              }}
              data-testid="button-add-retrieval"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Retrieval Item
            </Button>
          </div>

          {/* Retrieval Schedule Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Timer className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold">Due Today</h3>
                  <p className="text-2xl font-bold text-blue-600">5</p>
                  <p className="text-sm text-gray-500">Retrieval items</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-semibold">Completed</h3>
                  <p className="text-2xl font-bold text-green-600">23</p>
                  <p className="text-sm text-gray-500">This week</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                  <h3 className="font-semibold">Overdue</h3>
                  <p className="text-2xl font-bold text-amber-600">2</p>
                  <p className="text-sm text-gray-500">Need attention</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Retrieval Activities */}
          <div className="space-y-4">
            {RETRIEVAL_ACTIVITIES.map(activity => (
              <Card key={activity.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <Badge variant="outline" className="mb-2">
                        {activity.type.replace('-', ' ')}
                      </Badge>
                      <h4 className="font-medium mb-2">{activity.question}</h4>
                      {activity.type === 'flashcard' && (
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          <strong>Answer:</strong> {activity.answer}
                        </p>
                      )}
                      {activity.options && (
                        <div className="space-y-1">
                          {activity.options.map((option, index) => (
                            <div key={index} className={`text-sm p-2 rounded ${
                              index === activity.correct ? 'bg-green-50 text-green-800' : 'bg-gray-50'
                            }`}>
                              {option}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-500 ml-4">
                      <p>Last shown: {activity.lastShown}</p>
                      <p>Next due: {activity.nextDue}</p>
                      <Badge variant={activity.nextDue <= "2025-09-24" ? "destructive" : "secondary"}>
                        {activity.difficulty}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Mastery Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800">Cognitive Load & Mastery Analytics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <h3 className="font-semibold mb-2">Average Mastery</h3>
                <p className="text-3xl font-bold text-blue-600">75%</p>
                <p className="text-sm text-gray-500">Across all concepts</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 text-center">
                <h3 className="font-semibold mb-2">Retrieval Adherence</h3>
                <p className="text-3xl font-bold text-green-600">92%</p>
                <p className="text-sm text-gray-500">On-time completion</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 text-center">
                <h3 className="font-semibold mb-2">Cognitive Load</h3>
                <p className="text-3xl font-bold text-amber-600">6.2</p>
                <p className="text-sm text-gray-500">Avg mental effort (1-9)</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 text-center">
                <h3 className="font-semibold mb-2">At-Risk Concepts</h3>
                <p className="text-3xl font-bold text-red-600">3</p>
                <p className="text-sm text-gray-500">Below 60% mastery</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Concept Mastery Progression</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {PIVOT_CARDS.map(card => (
                  <div key={card.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{card.title}</span>
                      <span className="text-sm text-gray-500">{Math.round(card.masteryLevel * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          card.masteryLevel >= 0.8 ? 'bg-green-600' : 
                          card.masteryLevel >= 0.6 ? 'bg-amber-600' : 'bg-red-600'
                        }`}
                        style={{ width: `${card.masteryLevel * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}