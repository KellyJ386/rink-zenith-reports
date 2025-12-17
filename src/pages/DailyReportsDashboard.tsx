import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Download, TrendingUp, CheckCircle2, Clock, AlertCircle, Calendar, Filter, Eye, BarChart3 } from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface DailyReport {
  id: string;
  report_date: string;
  shift_type: string;
  duty_type: string;
  status: string;
  total_revenue: number;
  total_expenses: number;
  petty_cash_balance: number;
  submitted_by: string;
  profiles: { name: string };
  tabsCompleted?: number;
  tabsTotal?: number;
}

type DatePreset = 'today' | 'week' | 'month' | 'custom';

export default function DailyReportsDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [facilityId, setFacilityId] = useState<string | null>(null);
  
  // Filters
  const [datePreset, setDatePreset] = useState<DatePreset>('month');
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [shiftFilter, setShiftFilter] = useState<string>('all');
  
  const [stats, setStats] = useState({
    totalReports: 0,
    completedTabs: 0,
    totalTabs: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    submittedCount: 0,
    draftCount: 0,
    avgCompletion: 0
  });
  
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    loadReports();
  }, [startDate, endDate, statusFilter, shiftFilter]);

  useEffect(() => {
    handleDatePresetChange(datePreset);
  }, []);

  const handleDatePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    const today = new Date();
    
    switch (preset) {
      case 'today':
        setStartDate(format(today, "yyyy-MM-dd"));
        setEndDate(format(today, "yyyy-MM-dd"));
        break;
      case 'week':
        setStartDate(format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"));
        setEndDate(format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"));
        break;
      case 'month':
        setStartDate(format(startOfMonth(today), "yyyy-MM-dd"));
        setEndDate(format(endOfMonth(today), "yyyy-MM-dd"));
        break;
      case 'custom':
        // Keep current dates
        break;
    }
  };

  const loadReports = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("facility_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.facility_id) return;
      setFacilityId(profile.facility_id);

      let query = supabase
        .from("daily_reports")
        .select("*")
        .eq("facility_id", profile.facility_id)
        .gte("report_date", startDate)
        .lte("report_date", endDate)
        .order("report_date", { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq("status", statusFilter);
      }
      if (shiftFilter !== 'all') {
        query = query.eq("shift_type", shiftFilter);
      }

      const { data: reportsData, error } = await query;

      if (error) throw error;

      // Get submitter names
      const userIds = reportsData?.map(r => r.submitted_by) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name")
        .in("user_id", userIds);

      // Get tab submission counts per report
      const reportIds = reportsData?.map(r => r.id) || [];
      const { data: submissions } = await supabase
        .from("daily_report_tab_submissions")
        .select("report_id, tab_id")
        .in("report_id", reportIds);

      // Get total tabs count for facility
      const { data: totalTabsData } = await supabase
        .from("daily_report_tabs")
        .select("id")
        .eq("facility_id", profile.facility_id)
        .eq("is_active", true);
      
      const totalTabCount = totalTabsData?.length || 0;

      // Map profiles and submission counts to reports
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]));
      const submissionsByReport = new Map<string, number>();
      submissions?.forEach(s => {
        submissionsByReport.set(s.report_id, (submissionsByReport.get(s.report_id) || 0) + 1);
      });

      const enrichedReports = reportsData?.map(r => ({
        ...r,
        profiles: { name: profileMap.get(r.submitted_by) || "Unknown" },
        tabsCompleted: submissionsByReport.get(r.id) || 0,
        tabsTotal: totalTabCount,
      })) || [];

      setReports(enrichedReports);
      
      const totalRevenue = enrichedReports.reduce((sum, r) => sum + (r.total_revenue || 0), 0);
      const totalExpenses = enrichedReports.reduce((sum, r) => sum + (r.total_expenses || 0), 0);
      const completedTabs = enrichedReports.reduce((sum, r) => sum + (r.tabsCompleted || 0), 0);
      const totalTabs = enrichedReports.reduce((sum, r) => sum + (r.tabsTotal || 0), 0);
      const submittedCount = enrichedReports.filter(r => r.status === 'submitted').length;
      const draftCount = enrichedReports.filter(r => r.status === 'draft').length;
      const avgCompletion = totalTabs > 0 ? Math.round((completedTabs / totalTabs) * 100) : 0;
      
      setStats({
        totalReports: enrichedReports.length,
        completedTabs,
        totalTabs,
        totalRevenue,
        totalExpenses,
        submittedCount,
        draftCount,
        avgCompletion
      });

      // Build chart data - aggregate by date
      const chartMap = new Map<string, { date: string; revenue: number; expenses: number; reports: number }>();
      enrichedReports.forEach(r => {
        const dateKey = r.report_date;
        const existing = chartMap.get(dateKey) || { date: dateKey, revenue: 0, expenses: 0, reports: 0 };
        existing.revenue += r.total_revenue || 0;
        existing.expenses += r.total_expenses || 0;
        existing.reports += 1;
        chartMap.set(dateKey, existing);
      });
      
      const sortedChartData = Array.from(chartMap.values())
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(d => ({
          ...d,
          date: format(new Date(d.date), "MMM dd")
        }));
      setChartData(sortedChartData);

    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "secondary",
      submitted: "default",
      approved: "default",
      rejected: "destructive"
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const exportToCSV = () => {
    const headers = ["Date", "Shift", "Duty Type", "Status", "Revenue", "Expenses", "Tabs Completed", "Submitted By"];
    const rows = reports.map(r => [
      format(new Date(r.report_date), "yyyy-MM-dd"),
      r.shift_type,
      r.duty_type || "-",
      r.status,
      r.total_revenue?.toFixed(2) || "0.00",
      r.total_expenses?.toFixed(2) || "0.00",
      `${r.tabsCompleted}/${r.tabsTotal}`,
      r.profiles?.name || "Unknown"
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily-reports-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <PageHeader
        title="Daily Reports Dashboard"
        subtitle="View and manage all daily operational reports"
        icon={<FileText className="h-8 w-8 text-primary" />}
        actions={
          <Button onClick={() => navigate("/daily-reports")}>
            <Plus className="h-4 w-4 mr-2" />
            New Report
          </Button>
        }
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex gap-2">
              <Button
                variant={datePreset === 'today' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDatePresetChange('today')}
              >
                Today
              </Button>
              <Button
                variant={datePreset === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDatePresetChange('week')}
              >
                This Week
              </Button>
              <Button
                variant={datePreset === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDatePresetChange('month')}
              >
                This Month
              </Button>
              <Button
                variant={datePreset === 'custom' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDatePreset('custom')}
              >
                Custom
              </Button>
            </div>
            
            {datePreset === 'custom' && (
              <div className="flex gap-2 items-center">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-auto"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-auto"
                />
              </div>
            )}
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={shiftFilter} onValueChange={setShiftFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Shift" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shifts</SelectItem>
                <SelectItem value="morning">Morning</SelectItem>
                <SelectItem value="afternoon">Afternoon</SelectItem>
                <SelectItem value="evening">Evening</SelectItem>
                <SelectItem value="overnight">Overnight</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
            <div className="flex gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">{stats.submittedCount} submitted</Badge>
              <Badge variant="outline" className="text-xs">{stats.draftCount} drafts</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tab Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div className="text-2xl font-bold">{stats.avgCompletion}%</div>
            </div>
            <Progress value={stats.avgCompletion} className="h-1.5 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">{stats.completedTabs}/{stats.totalTabs} tabs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">For selected period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${stats.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Net: ${(stats.totalRevenue - stats.totalExpenses).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Revenue & Expenses Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                  />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Reports</CardTitle>
              <CardDescription>
                {reports.length} report{reports.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            <Button variant="outline" onClick={exportToCSV} disabled={reports.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Duty Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tabs</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No reports found for the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {format(new Date(report.report_date), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="capitalize">{report.shift_type}</TableCell>
                    <TableCell>{report.duty_type || "-"}</TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {report.tabsTotal && report.tabsTotal > 0 ? (
                          <>
                            {report.tabsCompleted === report.tabsTotal ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-amber-500" />
                            )}
                            <span className="text-sm">
                              {report.tabsCompleted}/{report.tabsTotal}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      ${report.total_revenue?.toFixed(2) || "0.00"}
                    </TableCell>
                    <TableCell className="text-right text-red-600 font-medium">
                      ${report.total_expenses?.toFixed(2) || "0.00"}
                    </TableCell>
                    <TableCell>{report.profiles?.name || "Unknown"}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/daily-reports/${report.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
