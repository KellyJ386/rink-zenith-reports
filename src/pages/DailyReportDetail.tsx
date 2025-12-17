import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
  FileText, ArrowLeft, Save, CheckCircle2, AlertCircle, Circle, 
  DollarSign, User, Calendar, Clock, Loader2, Edit2
} from "lucide-react";
import { format } from "date-fns";
import { Json } from "@/integrations/supabase/types";

interface TabSubmission {
  id: string;
  tab_id: string;
  form_data: Json;
  status: string;
  submitted_at: string;
  submitted_by: string;
  tab: {
    tab_name: string;
    tab_key: string;
    icon: string | null;
    is_required: boolean;
    form_template_id: string | null;
  };
  submitter?: { name: string };
}

interface Financial {
  id: string;
  transaction_type: string;
  category: string;
  amount: number;
  payment_method: string;
  description: string;
}

interface DailyReport {
  id: string;
  report_date: string;
  shift_type: string;
  duty_type: string;
  status: string;
  total_revenue: number;
  total_expenses: number;
  petty_cash_balance: number;
  notes: string;
  submitted_by: string;
  created_at: string;
  updated_at: string;
  custom_fields: Json;
  facility_id: string;
}

export default function DailyReportDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [submissions, setSubmissions] = useState<TabSubmission[]>([]);
  const [financials, setFinancials] = useState<Financial[]>([]);
  const [submitterName, setSubmitterName] = useState<string>("Unknown");
  const [allTabs, setAllTabs] = useState<any[]>([]);
  const [notes, setNotes] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (id) {
      loadReport();
    }
  }, [id]);

  const loadReport = async () => {
    try {
      // Fetch main report
      const { data: reportData, error: reportError } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (reportError) throw reportError;
      if (!reportData) {
        toast({ title: "Report not found", variant: "destructive" });
        navigate("/daily-reports");
        return;
      }

      setReport(reportData);
      setNotes(reportData.notes || "");

      // Fetch submitter name
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("user_id", reportData.submitted_by)
        .maybeSingle();
      
      if (profile) setSubmitterName(profile.name);

      // Fetch tab submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from("daily_report_tab_submissions")
        .select(`
          id,
          tab_id,
          form_data,
          status,
          submitted_at,
          submitted_by
        `)
        .eq("report_id", id);

      if (submissionsError) throw submissionsError;

      // Fetch all tabs for this facility
      const { data: tabsData } = await supabase
        .from("daily_report_tabs")
        .select("id, tab_name, tab_key, icon, is_required, form_template_id")
        .eq("facility_id", reportData.facility_id)
        .eq("is_active", true)
        .order("display_order");

      setAllTabs(tabsData || []);

      // Map tabs to submissions
      const tabMap = new Map(tabsData?.map(t => [t.id, t]));
      const enrichedSubmissions: TabSubmission[] = (submissionsData || []).map(s => ({
        ...s,
        tab: tabMap.get(s.tab_id) || { tab_name: "Unknown Tab", tab_key: "", icon: null, is_required: false, form_template_id: null }
      }));

      // Get submitter names for submissions
      const submitterIds = [...new Set(submissionsData?.map(s => s.submitted_by) || [])];
      const { data: submitterProfiles } = await supabase
        .from("profiles")
        .select("user_id, name")
        .in("user_id", submitterIds);

      const submitterMap = new Map(submitterProfiles?.map(p => [p.user_id, p.name]));
      enrichedSubmissions.forEach(s => {
        (s as TabSubmission).submitter = { name: submitterMap.get(s.submitted_by) || "Unknown" };
      });

      setSubmissions(enrichedSubmissions);

      // Fetch financials
      const { data: financialsData } = await supabase
        .from("daily_report_financials")
        .select("*")
        .eq("report_id", id);

      setFinancials(financialsData || []);

    } catch (error: any) {
      console.error("Error loading report:", error);
      toast({ title: "Error loading report", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveNotes = async () => {
    if (!report) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("daily_reports")
        .update({ notes })
        .eq("id", report.id);

      if (error) throw error;
      toast({ title: "Notes saved" });
      setIsEditing(false);
    } catch (error: any) {
      toast({ title: "Error saving notes", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      draft: { variant: "secondary", label: "Draft" },
      submitted: { variant: "default", label: "Submitted" },
      approved: { variant: "default", label: "Approved" },
      rejected: { variant: "destructive", label: "Rejected" }
    };
    const { variant, label } = config[status] || { variant: "outline", label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getTransactionBadge = (type: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      revenue: { variant: "default", label: "Revenue" },
      expense: { variant: "destructive", label: "Expense" },
      petty_cash: { variant: "secondary", label: "Petty Cash" }
    };
    const { variant, label } = config[type] || { variant: "outline", label: type };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const renderFormData = (data: Json) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return <p className="text-muted-foreground text-sm">No data submitted</p>;
    }

    const entries = Object.entries(data as Record<string, unknown>);
    if (entries.length === 0) {
      return <p className="text-muted-foreground text-sm">No data submitted</p>;
    }

    return (
      <div className="space-y-2">
        {entries.map(([key, value]) => (
          <div key={key} className="flex justify-between py-1 border-b border-border/50 last:border-0">
            <span className="text-sm font-medium text-muted-foreground capitalize">
              {key.replace(/_/g, ' ')}
            </span>
            <span className="text-sm">
              {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value || '-')}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!report) {
    return null;
  }

  const submittedTabIds = new Set(submissions.map(s => s.tab_id));
  const completedCount = submissions.length;
  const totalCount = allTabs.length;

  return (
    <div className="container mx-auto p-6">
      <PageHeader
        title="Report Details"
        subtitle={`Daily Report for ${format(new Date(report.report_date), "MMMM dd, yyyy")}`}
        icon={<FileText className="h-8 w-8 text-primary" />}
        actions={
          <Button variant="outline" onClick={() => navigate("/daily-reports")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Daily Reports
          </Button>
        }
      />

      {/* Report Overview */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{format(new Date(report.report_date), "MMM dd, yyyy")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Shift</p>
                <p className="font-medium capitalize">{report.shift_type}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Submitted By</p>
                <p className="font-medium">{submitterName}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1">{getStatusBadge(report.status)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Completion Summary */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Tab Completion</CardTitle>
          <CardDescription>
            {completedCount} of {totalCount} tabs completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {allTabs.map((tab) => {
              const isCompleted = submittedTabIds.has(tab.id);
              return (
                <Badge
                  key={tab.id}
                  variant={isCompleted ? "default" : "outline"}
                  className="gap-1"
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : tab.is_required ? (
                    <AlertCircle className="h-3 w-3" />
                  ) : (
                    <Circle className="h-3 w-3" />
                  )}
                  {tab.tab_name}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tab Submissions */}
      <Tabs defaultValue={submissions[0]?.tab_id || "financials"} className="space-y-6">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex h-auto p-1 gap-1">
            {submissions.map((submission) => (
              <TabsTrigger
                key={submission.tab_id}
                value={submission.tab_id}
                className="px-4 py-2 whitespace-nowrap gap-2"
              >
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                {submission.tab.tab_name}
              </TabsTrigger>
            ))}
            <TabsTrigger value="financials" className="px-4 py-2 whitespace-nowrap">
              <DollarSign className="h-4 w-4 mr-1" />
              Financials
            </TabsTrigger>
            <TabsTrigger value="notes" className="px-4 py-2 whitespace-nowrap">
              <Edit2 className="h-4 w-4 mr-1" />
              Notes
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Tab Submission Contents */}
        {submissions.map((submission) => (
          <TabsContent key={submission.tab_id} value={submission.tab_id}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{submission.tab.tab_name}</CardTitle>
                    <CardDescription>
                      Submitted by {submission.submitter?.name} on {format(new Date(submission.submitted_at), "MMM dd, yyyy 'at' h:mm a")}
                    </CardDescription>
                  </div>
                  <Badge variant={submission.status === 'submitted' ? 'default' : 'secondary'}>
                    {submission.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {renderFormData(submission.form_data as Record<string, any>)}
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        {/* Financials Tab */}
        <TabsContent value="financials">
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">${report.total_revenue?.toFixed(2) || "0.00"}</p>
                </div>
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">${report.total_expenses?.toFixed(2) || "0.00"}</p>
                </div>
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm text-muted-foreground">Petty Cash Balance</p>
                  <p className="text-2xl font-bold text-blue-600">${report.petty_cash_balance?.toFixed(2) || "0.00"}</p>
                </div>
              </div>

              {financials.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {financials.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{getTransactionBadge(entry.transaction_type)}</TableCell>
                        <TableCell>{entry.category}</TableCell>
                        <TableCell className="capitalize">{entry.payment_method?.replace('_', ' ')}</TableCell>
                        <TableCell>{entry.description || "-"}</TableCell>
                        <TableCell className={`text-right font-medium ${
                          entry.transaction_type === 'revenue' ? 'text-green-600' : 
                          entry.transaction_type === 'expense' ? 'text-red-600' : ''
                        }`}>
                          ${entry.amount?.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">No financial entries recorded</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Report Notes</CardTitle>
                {!isEditing && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this report..."
                    rows={6}
                  />
                  <div className="flex gap-2">
                    <Button onClick={saveNotes} disabled={saving}>
                      {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <Save className="h-4 w-4 mr-2" />
                      Save Notes
                    </Button>
                    <Button variant="outline" onClick={() => { setNotes(report.notes || ""); setIsEditing(false); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">
                  {report.notes || <span className="text-muted-foreground">No notes added</span>}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}