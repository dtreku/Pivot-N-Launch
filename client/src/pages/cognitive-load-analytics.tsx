import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  Zap,
  Target,
  Activity,
  BarChart3,
  Users,
  Shield
} from "lucide-react";

// Research-based cognitive load data following the report's methodology
const COGNITIVE_LOAD_DATA = {
  currentAverages: {
    mentalEffort: 6.2, // Paas scale 1-9
    intrinsicLoad: 5.8,
    extraneousLoad: 4.1, // Target: reduce this
    germaneLoad: 6.5, // Target: optimize this
    technostress: 3.4, // 1-7 scale
    interruptionCount: 8.3, // Per hour
    timeToRefocus: 2.8 // Minutes
  },
  trends: {
    mentalEffort: -0.3, // Improving
    extraneousLoad: -0.8, // Significantly improving
    germaneLoad: +0.4, // Increasing (good)
    technostress: -0.5,
    interruptionCount: -1.2
  },
  overloadIndicators: [
    { indicator: "High task switching", frequency: 23, severity: "high" },
    { indicator: "Information search delays", frequency: 18, severity: "medium" },
    { indicator: "Decision paralysis", frequency: 12, severity: "medium" },
    { indicator: "Attention fragmentation", frequency: 15, severity: "high" },
    { indicator: "Cognitive strain reports", frequency: 8, severity: "low" }
  ],
  contextualBreakdown: {
    pivot: { mentalEffort: 5.1, extraneousLoad: 3.2, germaneLoad: 7.1 },
    launch: { mentalEffort: 6.8, extraneousLoad: 4.9, germaneLoad: 6.2 },
    assessment: { mentalEffort: 7.2, extraneousLoad: 5.1, germaneLoad: 5.8 }
  }
};

export default function CognitiveLoadAnalytics() {
  const [selectedTimeframe, setSelectedTimeframe] = useState("30d");
  const [selectedContext, setSelectedContext] = useState("all");

  const getLoadColor = (value: number, type: 'effort' | 'extraneous' | 'germane') => {
    if (type === 'extraneous') {
      return value <= 3 ? 'text-green-600' : value <= 5 ? 'text-amber-600' : 'text-red-600';
    } else if (type === 'germane') {
      return value >= 6 ? 'text-green-600' : value >= 4 ? 'text-amber-600' : 'text-red-600';
    } else {
      return value <= 5 ? 'text-green-600' : value <= 7 ? 'text-amber-600' : 'text-red-600';
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0.2) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend < -0.2) return <TrendingUp className="w-4 h-4 text-red-600 transform rotate-180" />;
    return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
  };

  return (
    <div className="anti-overload-container">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Cognitive Load Analytics
        </h1>
        <p className="text-gray-600 text-lg">
          Research-based monitoring of mental effort and information overload patterns
        </p>
      </div>

      {/* Research Foundation */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6 mb-8">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-900 mb-3">Cognitive Load Theory Application</h3>
            <p className="text-purple-800 leading-relaxed mb-3">
              Based on Sweller's cognitive load theory and research by Paas, Leppink, and others. We measure intrinsic load (essential complexity), extraneous load (poor design), and germane load (schema construction) to optimize learning conditions.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong className="text-purple-900">Intrinsic Load:</strong>
                <br />Essential task complexity
              </div>
              <div>
                <strong className="text-purple-900">Extraneous Load:</strong>
                <br />Poor design/irrelevant processing
              </div>
              <div>
                <strong className="text-purple-900">Germane Load:</strong>
                <br />Schema construction effort
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="semester">Current semester</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={selectedContext} onValueChange={setSelectedContext}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Learning context" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All contexts</SelectItem>
            <SelectItem value="pivot">Pivot phase</SelectItem>
            <SelectItem value="launch">Launch phase</SelectItem>
            <SelectItem value="assessment">Assessment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Metrics</TabsTrigger>
          <TabsTrigger value="overload">Overload Patterns</TabsTrigger>
          <TabsTrigger value="interventions">Interventions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Mental Effort</p>
                    <p className={`text-2xl font-bold ${getLoadColor(COGNITIVE_LOAD_DATA.currentAverages.mentalEffort, 'effort')}`}>
                      {COGNITIVE_LOAD_DATA.currentAverages.mentalEffort}
                    </p>
                    <p className="text-xs text-gray-500">Paas scale (1-9)</p>
                  </div>
                  <div className="flex items-center">
                    {getTrendIcon(COGNITIVE_LOAD_DATA.trends.mentalEffort)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Extraneous Load</p>
                    <p className={`text-2xl font-bold ${getLoadColor(COGNITIVE_LOAD_DATA.currentAverages.extraneousLoad, 'extraneous')}`}>
                      {COGNITIVE_LOAD_DATA.currentAverages.extraneousLoad}
                    </p>
                    <p className="text-xs text-gray-500">Target: ≤ 3.0</p>
                  </div>
                  <div className="flex items-center">
                    {getTrendIcon(COGNITIVE_LOAD_DATA.trends.extraneousLoad)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Germane Load</p>
                    <p className={`text-2xl font-bold ${getLoadColor(COGNITIVE_LOAD_DATA.currentAverages.germaneLoad, 'germane')}`}>
                      {COGNITIVE_LOAD_DATA.currentAverages.germaneLoad}
                    </p>
                    <p className="text-xs text-gray-500">Target: ≥ 6.0</p>
                  </div>
                  <div className="flex items-center">
                    {getTrendIcon(COGNITIVE_LOAD_DATA.trends.germaneLoad)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Technostress</p>
                    <p className={`text-2xl font-bold ${COGNITIVE_LOAD_DATA.currentAverages.technostress <= 3 ? 'text-green-600' : 'text-amber-600'}`}>
                      {COGNITIVE_LOAD_DATA.currentAverages.technostress}
                    </p>
                    <p className="text-xs text-gray-500">Scale (1-7)</p>
                  </div>
                  <div className="flex items-center">
                    {getTrendIcon(COGNITIVE_LOAD_DATA.trends.technostress)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Context Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Load Distribution by Learning Context
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(COGNITIVE_LOAD_DATA.contextualBreakdown).map(([context, data]) => (
                  <div key={context} className="space-y-3">
                    <h4 className="font-semibold capitalize">{context} Phase</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Mental Effort:</span>
                        <span className={`font-medium ${getLoadColor(data.mentalEffort, 'effort')}`}>
                          {data.mentalEffort}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Extraneous:</span>
                        <span className={`font-medium ${getLoadColor(data.extraneousLoad, 'extraneous')}`}>
                          {data.extraneousLoad}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Germane:</span>
                        <span className={`font-medium ${getLoadColor(data.germaneLoad, 'germane')}`}>
                          {data.germaneLoad}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Detailed Metrics Tab */}
        <TabsContent value="detailed" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Attention & Interruption Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Interruptions per hour:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{COGNITIVE_LOAD_DATA.currentAverages.interruptionCount}</span>
                    {getTrendIcon(COGNITIVE_LOAD_DATA.trends.interruptionCount)}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Time to refocus:</span>
                  <span className="font-bold text-lg">{COGNITIVE_LOAD_DATA.currentAverages.timeToRefocus} min</span>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded p-3">
                  <p className="text-sm text-amber-800">
                    <strong>Research Insight:</strong> Frequent interruptions (&gt;6/hour) significantly impact learning. 
                    Current level suggests implementing interruption shields during focus periods.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Load Component Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Intrinsic Load</span>
                      <span className="text-sm font-medium">{COGNITIVE_LOAD_DATA.currentAverages.intrinsicLoad}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(COGNITIVE_LOAD_DATA.currentAverages.intrinsicLoad / 9) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Extraneous Load</span>
                      <span className="text-sm font-medium">{COGNITIVE_LOAD_DATA.currentAverages.extraneousLoad}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full" 
                        style={{ width: `${(COGNITIVE_LOAD_DATA.currentAverages.extraneousLoad / 9) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Germane Load</span>
                      <span className="text-sm font-medium">{COGNITIVE_LOAD_DATA.currentAverages.germaneLoad}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(COGNITIVE_LOAD_DATA.currentAverages.germaneLoad / 9) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Overload Patterns Tab */}
        <TabsContent value="overload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Information Overload Indicators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {COGNITIVE_LOAD_DATA.overloadIndicators.map((indicator, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={indicator.severity === 'high' ? 'destructive' : indicator.severity === 'medium' ? 'default' : 'secondary'}>
                        {indicator.severity}
                      </Badge>
                      <span className="font-medium">{indicator.indicator}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {indicator.frequency} occurrences
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Risk Factors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>High concurrent tasks</span>
                  <Badge variant="destructive">Critical</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Information source overload</span>
                  <Badge variant="default">Moderate</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Decision complexity peaks</span>
                  <Badge variant="default">Moderate</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Time pressure spikes</span>
                  <Badge variant="secondary">Low</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Protective Factors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Clear learning objectives</span>
                  <Badge variant="outline" className="text-green-600 border-green-600">Strong</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Structured guidance</span>
                  <Badge variant="outline" className="text-green-600 border-green-600">Strong</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Retrieval practice routine</span>
                  <Badge variant="outline" className="text-amber-600 border-amber-600">Moderate</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Attention management tools</span>
                  <Badge variant="outline" className="text-amber-600 border-amber-600">Developing</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Interventions Tab */}
        <TabsContent value="interventions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Recommended Interventions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 mb-2">High Priority</h4>
                <ul className="space-y-2 text-sm text-red-800">
                  <li>&bull; Implement 15-minute interruption moratoria during focus sprints</li>
                  <li>&bull; Reduce extraneous load in Launch phase materials</li>
                  <li>&bull; Add information triage checklists for external sources</li>
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-semibold text-amber-900 mb-2">Medium Priority</h4>
                <ul className="space-y-2 text-sm text-amber-800">
                  <li>&bull; Increase retrieval practice frequency for struggling concepts</li>
                  <li>&bull; Optimize scaffold fading in Launch transitions</li>
                  <li>&bull; Enhance signaling in multimedia materials</li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">Maintain Current Practices</h4>
                <ul className="space-y-2 text-sm text-green-800">
                  <li>&bull; Pivot Card structure effectively reduces intrinsic load</li>
                  <li>&bull; Worked examples are well-calibrated for cognitive capacity</li>
                  <li>&bull; Progressive guidance fading shows positive trends</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}