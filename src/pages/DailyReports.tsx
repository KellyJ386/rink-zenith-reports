import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ModuleHeader from "@/components/ModuleHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import { ClipboardList, DollarSign, Plus, Save, Send, Trash2, Loader2, CheckCircle2, AlertCircle, Circle } from "lucide-react";
import { format } from "date-fns";
import { DynamicFormFields } from "@/components/maintenance/DynamicFormFields";
import { useDailyReportUserTabs } from "@/hooks/useDailyReportUserTabs";
import { DynamicTabContent } from "@/components/daily-reports/DynamicTabContent";
import { useTabSubmissionTracking } from "@/hooks/useTabSubmissionTracking";
import { useFormTemplates } from "@/hooks/useFormTemplates";
import { TabCompletionIndicator, OverallProgressIndicator } from "@/components/daily-reports/TabCompletionIndicator";


interface Financial {
  id?: string;
  transaction_type: string;
  category: string;
  amount: number;
  payment_method: string;
  description: string;
}

export default function DailyReports() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [facilityId, setFacilityId] = useState<string>("");
  
  const [reportDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [shiftType, setShiftType] = useState<string>("");
  const [notes, setNotes] = useState("");
  
  const [financials, setFinancials] = useState<Financial[]>([]);
  const [tabFormData, setTabFormData] = useState<Record<string, any>>({});
  
  const [newFinancial, setNewFinancial] = useState<Financial>({
    transaction_type: "revenue",
    category: "",
    amount: 0,
    payment_method: "cash",
    description: ""
  });

  const [customFields, setCustomFields] = useState<Record<string, any>>({});

  // Use the dynamic tabs hook
  const { tabs, isLoading: tabsLoading, isAdmin } = useDailyReportUserTabs(facilityId, user?.id);
  
  // Get form templates for tracking
  const { data: formTemplates = [] } = useFormTemplates();
  
  // Tab completion tracking
  const { 
    tabStatuses, 
    overallProgress, 
    requiredTabsComplete, 
    incompleteRequiredTabs 
  } = useTabSubmissionTracking(tabs, tabFormData, formTemplates);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);

      const { data: profile } = await supabase
        .from("profiles")
        .select("facility_id")
        .eq("user_id", user.id)
        .single();

      if (profile?.facility_id) {
        setFacilityId(profile.facility_id);
      }
    } catch (error) {
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabFormDataChange = (tabId: string, data: Record<string, any>) => {
    setTabFormData(prev => ({
      ...prev,
      [tabId]: data,
    }));
  };

  const addFinancial = () => {
    if (!newFinancial.category || newFinancial.amount <= 0) {
      toast({ title: "Invalid Entry", description: "Please fill all financial fields", variant: "destructive" });
      return;
    }
    setFinancials([...financials, { ...newFinancial }]);
    setNewFinancial({
      transaction_type: "revenue",
      category: "",
      amount: 0,
      payment_method: "cash",
      description: ""
    });
  };

  const removeFinancial = (index: number) => {
    setFinancials(financials.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const revenue = financials.filter(f => f.transaction_type === "revenue").reduce((sum, f) => sum + f.amount, 0);
    const expenses = financials.filter(f => f.transaction_type === "expense").reduce((sum, f) => sum + f.amount, 0);
    const pettyCash = financials.filter(f => f.transaction_type === "petty_cash").reduce((sum, f) => sum + f.amount, 0);
    return { revenue, expenses, pettyCash };
  };

  const saveReport = async (status: string) => {
    if (!user || !facilityId) return;
    
    // Validate required tabs on submit (not drafts)
    if (status === 'submitted' && !requiredTabsComplete) {
      const tabNames = incompleteRequiredTabs.map(t => t.tabName).join(', ');
      toast({
        title: "Required Tabs Incomplete",
        description: `Please complete the following required tabs: ${tabNames}`,
        variant: "destructive"
      });
      return;
    }
    
    setSaving(true);
    try {
      const totals = calculateTotals();
      
      // Create the main report
      const { data: report, error: reportError } = await supabase
        .from("daily_reports")
        .insert({
          facility_id: facilityId,
          report_date: reportDate,
          shift_type: shiftType,
          duty_type: "",
          submitted_by: user.id,
          status,
          total_revenue: totals.revenue,
          total_expenses: totals.expenses,
          petty_cash_balance: totals.pettyCash,
          notes,
          custom_fields: customFields
        })
        .select()
        .single();

      if (reportError) throw reportError;

      // Save tab submissions
      const tabSubmissions = Object.entries(tabFormData).map(([tabId, data]) => ({
        report_id: report.id,
        tab_id: tabId,
        submitted_by: user.id,
        form_data: data,
        status,
      }));

      if (tabSubmissions.length > 0) {
        const { error: submissionsError } = await supabase
          .from("daily_report_tab_submissions")
          .insert(tabSubmissions);
        if (submissionsError) throw submissionsError;
      }

      // Save financials
      if (financials.length > 0) {
        const { error: financialsError } = await supabase
          .from("daily_report_financials")
          .insert(financials.map(f => ({ ...f, report_id: report.id })));
        if (financialsError) throw financialsError;
      }

      toast({
        title: status === "draft" ? "Draft Saved" : "Report Submitted",
        description: `Report ${status === "draft" ? "saved as draft" : "submitted successfully"}`
      });

      // Reset form
      setTabFormData({});
      setFinancials([]);
      setNotes("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totals = calculateTotals();
  const tabFromUrl = searchParams.get('tab');
  const defaultTab = tabFromUrl || (tabs.length > 0 ? tabs[0].id : 'financials');

  return (
    <div className="container mx-auto p-6">
      <ModuleHeader
        title="Daily Reports"
        subtitle="Comprehensive daily task and financial reporting"
        icon={<ClipboardList className="h-8 w-8 text-primary" />}
      />

      {/* Shift Type Selector */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label className="text-sm font-medium whitespace-nowrap">Shift Type</Label>
            <Select value={shiftType} onValueChange={setShiftType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select shift type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="during">During</SelectItem>
                <SelectItem value="close">Close</SelectItem>
                <SelectItem value="handoff">Shift Handoff</SelectItem>
              </SelectContent>
            </Select>
            {!shiftType && (
              <span className="text-sm text-muted-foreground">Select a shift type to view checklists</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Tabs - Only show when shift type is selected */}
      {!shiftType ? (
        <Card className="mb-6">
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Select Shift Type</h3>
            <p className="text-muted-foreground">
              Choose a shift type above to view and complete checklists.
            </p>
          </CardContent>
        </Card>
      ) : tabsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading tabs...</span>
        </div>
      ) : tabs.length === 0 ? (
        <Card className="mb-6">
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Tabs Available</h3>
            <p className="text-muted-foreground">
              {isAdmin 
                ? "Configure daily report tabs in the admin settings."
                : "No report tabs are assigned to your role. Contact an administrator."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
            {tabs.map((tab, index) => {
              const status = tabStatuses.find(s => s.tabId === tab.id);
              // Dashboard-matching colors
              const tabColors = [
                'bg-violet-200 border-violet-400 text-violet-800 data-[state=active]:bg-violet-500 data-[state=active]:text-white data-[state=active]:border-violet-500',
                'bg-orange-200 border-orange-400 text-orange-800 data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:border-orange-500',
                'bg-cyan-200 border-cyan-400 text-cyan-800 data-[state=active]:bg-cyan-500 data-[state=active]:text-white data-[state=active]:border-cyan-500',
                'bg-pink-200 border-pink-400 text-pink-800 data-[state=active]:bg-pink-500 data-[state=active]:text-white data-[state=active]:border-pink-500',
                'bg-amber-200 border-amber-400 text-amber-800 data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:border-amber-500',
                'bg-indigo-200 border-indigo-400 text-indigo-800 data-[state=active]:bg-indigo-500 data-[state=active]:text-white data-[state=active]:border-indigo-500',
                'bg-rose-200 border-rose-400 text-rose-800 data-[state=active]:bg-rose-500 data-[state=active]:text-white data-[state=active]:border-rose-500',
                'bg-teal-200 border-teal-400 text-teal-800 data-[state=active]:bg-teal-500 data-[state=active]:text-white data-[state=active]:border-teal-500',
                'bg-purple-200 border-purple-400 text-purple-800 data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:border-purple-500',
              ];
              const colorClass = tabColors[index % tabColors.length];
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={`px-4 py-2 text-sm font-medium gap-2 rounded-t-lg border-2 border-b-0 transition-all ${colorClass}`}
                >
                  {status?.isComplete ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : status?.isRequired ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <Circle className="h-4 w-4 opacity-50" />
                  )}
                  {tab.tab_name}
                </TabsTrigger>
              );
            })}
            <TabsTrigger 
              value="financials" 
              className="px-4 py-2 text-sm font-medium rounded-t-lg border-2 border-b-0 transition-all bg-teal-200 border-teal-400 text-teal-800 data-[state=active]:bg-teal-500 data-[state=active]:text-white data-[state=active]:border-teal-500"
            >
              <DollarSign className="h-4 w-4 mr-1" />
              Financials
            </TabsTrigger>
          </TabsList>
          
          {/* Progress Overview */}
          {tabs.length > 0 && (
            <Card className="bg-muted/30">
              <CardContent className="py-4">
                <OverallProgressIndicator
                  completed={overallProgress.completed}
                  total={overallProgress.total}
                  percent={overallProgress.percent}
                  requiredComplete={requiredTabsComplete}
                />
              </CardContent>
            </Card>
          )}

          {/* Dynamic Tab Contents */}
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              <DynamicTabContent
                tab={tab}
                formData={tabFormData}
                onFormDataChange={handleTabFormDataChange}
              />
            </TabsContent>
          ))}

          {/* Financials Tab */}
          <TabsContent value="financials" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">${totals.revenue.toFixed(2)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">${totals.expenses.toFixed(2)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Petty Cash Balance</p>
                    <p className="text-2xl font-bold text-blue-600">${totals.pettyCash.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add Financial Entry</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={newFinancial.transaction_type}
                      onValueChange={(value) => setNewFinancial({ ...newFinancial, transaction_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="revenue">Revenue</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="petty_cash">Petty Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Input
                      placeholder="e.g., Ice Time, Supplies"
                      value={newFinancial.category}
                      onChange={(e) => setNewFinancial({ ...newFinancial, category: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newFinancial.amount || ""}
                      onChange={(e) => setNewFinancial({ ...newFinancial, amount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select
                      value={newFinancial.payment_method}
                      onValueChange={(value) => setNewFinancial({ ...newFinancial, payment_method: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="debit_card">Debit Card</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="Transaction description"
                      value={newFinancial.description}
                      onChange={(e) => setNewFinancial({ ...newFinancial, description: e.target.value })}
                    />
                  </div>
                </div>

                <Button onClick={addFinancial} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry
                </Button>
              </CardContent>
            </Card>

            {financials.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Financial Entries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {financials.map((entry, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1 grid grid-cols-5 gap-4">
                          <Badge variant={entry.transaction_type === "revenue" ? "default" : "secondary"}>
                            {entry.transaction_type}
                          </Badge>
                          <span className="font-medium">{entry.category}</span>
                          <span className="text-right font-bold">${entry.amount.toFixed(2)}</span>
                          <span className="text-muted-foreground">{entry.payment_method}</span>
                          <span className="text-muted-foreground text-sm">{entry.description}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFinancial(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Additional Notes */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Overall observations, issues, or important information..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Dynamic Custom Fields */}
      {facilityId && (
        <DynamicFormFields
          facilityId={facilityId}
          formType="daily_report"
          values={customFields}
          onChange={setCustomFields}
        />
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 mt-6">
        <Button
          variant="outline"
          onClick={() => saveReport("draft")}
          disabled={saving}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Draft
        </Button>
        <Button
          onClick={() => saveReport("submitted")}
          disabled={saving}
        >
          <Send className="h-4 w-4 mr-2" />
          Submit Report
        </Button>
      </div>
    </div>
  );
}
