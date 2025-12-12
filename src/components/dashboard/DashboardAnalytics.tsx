import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { 
  TrendingUp, Activity, Snowflake, AlertTriangle, Users, 
  Calendar, Thermometer, Loader2 
} from "lucide-react";

interface AnalyticsData {
  maintenanceByDay: { date: string; count: number; type: string }[];
  incidentsBySeverity: { name: string; value: number; color: string }[];
  iceDepthTrend: { date: string; avg: number; min: number; max: number }[];
  shiftsThisWeek: { day: string; scheduled: number; filled: number }[];
  activitySummary: {
    totalMaintenance: number;
    totalIncidents: number;
    avgIceDepth: number;
    scheduledHours: number;
  };
}

const COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  accent: "hsl(var(--accent))",
  muted: "hsl(var(--muted))",
  destructive: "hsl(var(--destructive))",
};

const SEVERITY_COLORS = {
  minor: "#22c55e",
  moderate: "#f59e0b",
  major: "#ef4444",
  critical: "#7f1d1d",
};

export const DashboardAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [dateRange] = useState(7); // Last 7 days

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const startDate = subDays(new Date(), dateRange);
      
      const [maintenanceRes, incidentsRes, iceDepthRes, shiftsRes] = await Promise.all([
        supabase
          .from("maintenance_activities")
          .select("activity_type, activity_datetime")
          .gte("activity_datetime", startDate.toISOString())
          .order("activity_datetime", { ascending: true }),
        supabase
          .from("incidents")
          .select("severity_level, created_at")
          .gte("created_at", startDate.toISOString()),
        supabase
          .from("ice_depth_measurements")
          .select("measurement_date, avg_depth, min_depth, max_depth")
          .gte("measurement_date", startDate.toISOString())
          .order("measurement_date", { ascending: true }),
        supabase
          .from("schedule_shifts")
          .select("date, status, assigned_staff_id")
          .gte("date", startDate.toISOString().split("T")[0])
          .lte("date", new Date().toISOString().split("T")[0]),
      ]);

      // Process maintenance by day
      const maintenanceByDay = processMaintenanceByDay(maintenanceRes.data || [], dateRange);

      // Process incidents by severity
      const incidentsBySeverity = processIncidentsBySeverity(incidentsRes.data || []);

      // Process ice depth trend
      const iceDepthTrend = processIceDepthTrend(iceDepthRes.data || []);

      // Process shifts this week
      const shiftsThisWeek = processShiftsThisWeek(shiftsRes.data || []);

      // Calculate summary
      const activitySummary = {
        totalMaintenance: maintenanceRes.data?.length || 0,
        totalIncidents: incidentsRes.data?.length || 0,
        avgIceDepth: iceDepthRes.data?.length 
          ? iceDepthRes.data.reduce((acc, d) => acc + (Number(d.avg_depth) || 0), 0) / iceDepthRes.data.length 
          : 0,
        scheduledHours: (shiftsRes.data?.length || 0) * 8, // Assuming 8-hour shifts
      };

      setData({
        maintenanceByDay,
        incidentsBySeverity,
        iceDepthTrend,
        shiftsThisWeek,
        activitySummary,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const processMaintenanceByDay = (activities: any[], days: number) => {
    const result: { date: string; count: number; type: string }[] = [];
    
    for (let i = days; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "MMM d");
      const dayActivities = activities.filter(a => 
        format(new Date(a.activity_datetime), "MMM d") === dateStr
      );
      
      result.push({
        date: dateStr,
        count: dayActivities.length,
        type: "All",
      });
    }
    
    return result;
  };

  const processIncidentsBySeverity = (incidents: any[]) => {
    const counts: Record<string, number> = { minor: 0, moderate: 0, major: 0, critical: 0 };
    
    incidents.forEach(i => {
      const severity = i.severity_level?.toLowerCase() || "minor";
      if (counts[severity] !== undefined) {
        counts[severity]++;
      }
    });
    
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: SEVERITY_COLORS[name as keyof typeof SEVERITY_COLORS] || "#888",
    }));
  };

  const processIceDepthTrend = (measurements: any[]) => {
    return measurements.map(m => ({
      date: format(new Date(m.measurement_date), "MMM d"),
      avg: Number(m.avg_depth) || 0,
      min: Number(m.min_depth) || 0,
      max: Number(m.max_depth) || 0,
    }));
  };

  const processShiftsThisWeek = (shifts: any[]) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const result: { day: string; scheduled: number; filled: number }[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = subDays(new Date(), 6 - i);
      const dayShifts = shifts.filter(s => s.date === format(date, "yyyy-MM-dd"));
      
      result.push({
        day: days[date.getDay()],
        scheduled: dayShifts.length,
        filled: dayShifts.filter(s => s.assigned_staff_id).length,
      });
    }
    
    return result;
  };

  if (loading) {
    return (
      <Card className="col-span-full">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Maintenance</p>
                <p className="text-2xl font-bold">{data.activitySummary.totalMaintenance}</p>
              </div>
              <Activity className="h-8 w-8 text-primary opacity-80" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Incidents</p>
                <p className="text-2xl font-bold">{data.activitySummary.totalIncidents}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive opacity-80" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Ice Depth</p>
                <p className="text-2xl font-bold">{data.activitySummary.avgIceDepth.toFixed(2)}"</p>
              </div>
              <Snowflake className="h-8 w-8 text-cyan-500 opacity-80" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Current average</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Scheduled Hours</p>
                <p className="text-2xl font-bold">{data.activitySummary.scheduledHours}</p>
              </div>
              <Calendar className="h-8 w-8 text-indigo-500 opacity-80" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Maintenance Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Maintenance Activity
            </CardTitle>
            <CardDescription>Daily maintenance activities over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.maintenanceByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary) / 0.2)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Incidents by Severity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Incidents by Severity
            </CardTitle>
            <CardDescription>Distribution of incidents over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {data.incidentsBySeverity.every(d => d.value === 0) ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No incidents in the past 7 days
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.incidentsBySeverity.filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.incidentsBySeverity.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ice Depth Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Snowflake className="h-4 w-4" />
              Ice Depth Trend
            </CardTitle>
            <CardDescription>Average ice depth measurements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {data.iceDepthTrend.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No ice depth measurements recorded
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.iceDepthTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis domain={[0, 2]} className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="avg" 
                      stroke="#06b6d4" 
                      fill="#06b6d4" 
                      fillOpacity={0.2}
                      name="Avg Depth"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Shift Coverage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Shift Coverage
            </CardTitle>
            <CardDescription>Scheduled vs filled shifts this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.shiftsThisWeek}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }} 
                  />
                  <Bar dataKey="scheduled" fill="hsl(var(--muted))" name="Scheduled" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="filled" fill="hsl(var(--primary))" name="Filled" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
