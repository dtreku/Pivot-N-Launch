import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDefaultFaculty } from "@/hooks/use-faculty";
import { useDashboardStats } from "@/hooks/use-projects";
import { analyticsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import StatsCard from "@/components/ui/stats-card";
import {
  BarChart3,
  TrendingUp,
  Users,
  BookOpen,
  Target,
  Download,
  Calendar,
  Filter,
  Activity,
  Zap,
  Award,
  Clock,
} from "lucide-react";

const TIME_RANGES = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "1y", label: "Last year" },
];

const EVENT_TYPES = [
  { value: "all", label: "All Events" },
  { value: "project_created", label: "Project Created" },
  { value: "project_updated", label: "Project Updated" },
  { value: "objective_converted", label: "Objective Converted" },
  { value: "template_used", label: "Template Used" },
  { value: "collaboration_added", label: "Student Contribution" },
];

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("30d");
  const [eventType, setEventType] = useState("all");

  const { data: faculty } = useDefaultFaculty();
  const { data: dashboardStats } = useDashboardStats(faculty?.id);

  const { data: analyticsEvents = [], isLoading } = useQuery({
    queryKey: ["/api/analytics/faculty", faculty?.id, eventType],
    queryFn: () => analyticsApi.getByFaculty(faculty!.id, eventType === "all" ? undefined : eventType),
    enabled: !!faculty?.id,
  });

  // Calculate engagement metrics
  const calculateMetrics = () => {
    const now = new Date();
    const timeRangeMs = {
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
      "1y": 365 * 24 * 60 * 60 * 1000,
    };

    const cutoffDate = new Date(now.getTime() - timeRangeMs[timeRange]);
    const recentEvents = analyticsEvents.filter(
      event => new Date(event.createdAt) >= cutoffDate
    );

    const eventCounts = recentEvents.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dailyActivity = recentEvents.reduce((acc, event) => {
      const date = new Date(event.createdAt).toDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEvents: recentEvents.length,
      eventCounts,
      dailyActivity,
      avgDailyActivity: Object.values(dailyActivity).reduce((a, b) => a + b, 0) / Object.keys(dailyActivity).length || 0,
      peakDay: Object.entries(dailyActivity).sort(([,a], [,b]) => b - a)[0]?.[0],
      growth: recentEvents.length > 0 ? ((recentEvents.length / timeRangeMs[timeRange]) * 1000 * 60 * 60 * 24 * 30) : 0, // Monthly growth rate
    };
  };

  const metrics = calculateMetrics();

  const handleExportReport = () => {
    // This would generate and download a comprehensive analytics report
    console.log("Exporting analytics report...");
  };

  if (isLoading) {
    return (
      <div className="anti-overload-container">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-12 w-12 rounded-lg mb-4" />
              <Skeleton className="h-6 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="anti-overload-container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Analytics & Insights
        </h1>
        <p className="text-gray-600 text-lg">
          Track usage, effectiveness, and engagement across your PBL implementation
        </p>
      </div>

      {/* Controls */}
      <Card className="focus-card p-0 mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_RANGES.map(range => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter events" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleExportReport} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Active Projects"
          value={dashboardStats?.activeProjects || 0}
          subtitle="Current Projects"
          icon={BookOpen}
          iconColor="crimson"
        />
        <StatsCard
          title="Student Engagement"
          value={dashboardStats?.studentsEngaged || 0}
          subtitle="Participating Students"
          icon={Users}
          iconColor="blue"
        />
        <StatsCard
          title="Completion Rate"
          value={`${dashboardStats?.completionRate || 0}%`}
          subtitle="Project Success"
          icon={Target}
          iconColor="green"
        />
        <StatsCard
          title="Activity Score"
          value={Math.round(metrics.avgDailyActivity * 10) / 10}
          subtitle="Daily Average"
          icon={Activity}
          iconColor="amber"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-auto grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="methodology">Methodology</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Trend */}
            <Card className="focus-card p-0">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                  Activity Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Total Events ({timeRange}):</span>
                    <Badge variant="outline">{metrics.totalEvents}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Average Daily Activity:</span>
                    <Badge variant="outline">{Math.round(metrics.avgDailyActivity * 10) / 10}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Most Active Day:</span>
                    <Badge variant="outline">
                      {metrics.peakDay ? new Date(metrics.peakDay).toLocaleDateString() : "N/A"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Growth Rate:</span>
                    <Badge className={metrics.growth > 0 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                      {metrics.growth > 0 ? "+" : ""}{Math.round(metrics.growth)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Event Distribution */}
            <Card className="focus-card p-0">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                  Event Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(metrics.eventCounts).map(([eventType, count]) => (
                    <div key={eventType} className="flex items-center justify-between">
                      <span className="text-sm capitalize">
                        {eventType.replace(/_/g, " ")}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{
                              width: `${(count / metrics.totalEvents) * 100}%`
                            }}
                          />
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {count}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="focus-card p-0">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-amber-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsEvents.slice(0, 10).map(event => (
                  <div key={event.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      <span className="text-sm capitalize">
                        {event.eventType.replace(/_/g, " ")}
                      </span>
                      {event.eventData && (
                        <Badge variant="secondary" className="text-xs">
                          {JSON.stringify(event.eventData).slice(0, 30)}...
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(event.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="focus-card p-0">
              <CardHeader>
                <CardTitle>Student Participation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {dashboardStats?.studentsEngaged || 0}
                    </div>
                    <p className="text-sm text-gray-600">Active Students</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Engagement Rate:</span>
                      <span className="font-medium">
                        {dashboardStats?.studentsEngaged && dashboardStats?.activeProjects
                          ? Math.round((dashboardStats.studentsEngaged / (dashboardStats.activeProjects * 25)) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Avg. per Project:</span>
                      <span className="font-medium">
                        {dashboardStats?.studentsEngaged && dashboardStats?.activeProjects
                          ? Math.round(dashboardStats.studentsEngaged / dashboardStats.activeProjects)
                          : 0}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="focus-card p-0">
              <CardHeader>
                <CardTitle>Learning Outcomes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {dashboardStats?.avgRating || 0}
                    </div>
                    <p className="text-sm text-gray-600">Average Rating</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Completion Rate:</span>
                      <span className="font-medium">{dashboardStats?.completionRate || 0}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Success Indicator:</span>
                      <Badge className={
                        (dashboardStats?.completionRate || 0) > 80 
                          ? "bg-green-100 text-green-800" 
                          : "bg-yellow-100 text-yellow-800"
                      }>
                        {(dashboardStats?.completionRate || 0) > 80 ? "Excellent" : "Good"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <Card className="focus-card p-0">
            <CardHeader>
              <CardTitle>Project Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">Project Analytics</h3>
                <p className="text-gray-600">
                  Detailed project performance metrics will be displayed here as more data becomes available.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="methodology" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="focus-card p-0">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-red-600" />
                  Pivot Effectiveness
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600 mb-2">
                      {metrics.eventCounts.objective_converted || 0}
                    </div>
                    <p className="text-sm text-gray-600">Objectives Converted</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-sm text-red-700">
                      Core concept strengthening through focused learning objectives conversion.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="focus-card p-0">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="w-5 h-5 mr-2 text-blue-600" />
                  Launch Success
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {metrics.eventCounts.project_created || 0}
                    </div>
                    <p className="text-sm text-gray-600">Projects Launched</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-700">
                      Knowledge application through diverse, challenging project contexts.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Anti-Overload Metrics */}
          <Card className="focus-card p-0">
            <CardHeader>
              <CardTitle>Anti-Overload Effectiveness</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-800 mb-2">
                    {Math.round((dashboardStats?.completionRate || 0) / 10)}
                  </div>
                  <p className="text-sm text-gray-600">Focus Score</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Based on completion rates
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-800 mb-2">
                    {dashboardStats?.avgRating || 0}
                  </div>
                  <p className="text-sm text-gray-600">Clarity Rating</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Student feedback average
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-800 mb-2">
                    {metrics.totalEvents > 50 ? "High" : metrics.totalEvents > 20 ? "Medium" : "Low"}
                  </div>
                  <p className="text-sm text-gray-600">Engagement Level</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Based on activity frequency
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
