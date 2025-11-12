import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Plus, Download, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";

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
}

export default function DailyReportsDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [stats, setStats] = useState({
    totalReports: 0,
    completedTasks: 0,
    totalRevenue: 0,
    totalExpenses: 0
  });

  useEffect(() => {
    loadReports();
  }, []);

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

      const { data: reportsData, error } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("facility_id", profile.facility_id)
        .order("report_date", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Get submitter names
      const userIds = reportsData?.map(r => r.submitted_by) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name")
        .in("user_id", userIds);

      // Map profiles to reports
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]));
      const enrichedReports = reportsData?.map(r => ({
        ...r,
        profiles: { name: profileMap.get(r.submitted_by) || "Unknown" }
      })) || [];

      setReports(enrichedReports);
      
      const totalRevenue = enrichedReports.reduce((sum, r) => sum + (r.total_revenue || 0), 0);
      const totalExpenses = enrichedReports.reduce((sum, r) => sum + (r.total_expenses || 0), 0);
      
      setStats({
        totalReports: enrichedReports.length,
        completedTasks: 0, // Would need to query tasks separately
        totalRevenue,
        totalExpenses
      });
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
    const headers = ["Date", "Shift", "Duty Type", "Status", "Revenue", "Expenses", "Submitted By"];
    const rows = reports.map(r => [
      format(new Date(r.report_date), "yyyy-MM-dd"),
      r.shift_type,
      r.duty_type || "-",
      r.status,
      r.total_revenue?.toFixed(2) || "0.00",
      r.total_expenses?.toFixed(2) || "0.00",
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

      <div className="grid gap-6 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
            <p className="text-xs text-muted-foreground mt-1">Last 20 reports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div className="text-2xl font-bold">{stats.completedTasks}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all reports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${stats.totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Recent period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${stats.totalExpenses.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Recent period</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>View and export daily operational reports</CardDescription>
            </div>
            <Button variant="outline" onClick={exportToCSV}>
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
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead>Submitted By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No reports found. Create your first daily report!
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      {format(new Date(report.report_date), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="capitalize">{report.shift_type}</TableCell>
                    <TableCell>{report.duty_type || "-"}</TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      ${report.total_revenue?.toFixed(2) || "0.00"}
                    </TableCell>
                    <TableCell className="text-right text-red-600 font-medium">
                      ${report.total_expenses?.toFixed(2) || "0.00"}
                    </TableCell>
                    <TableCell>{report.profiles?.name || "Unknown"}</TableCell>
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
