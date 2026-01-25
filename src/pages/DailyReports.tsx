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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { ClipboardList, DollarSign, Plus, Save, Send, Trash2, Loader2, CheckCircle2, AlertCircle, Circle, ChevronDown, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { DynamicFormFields } from "@/components/maintenance/DynamicFormFields";
import { useDailyReportUserTabs } from "@/hooks/useDailyReportUserTabs";
import { DynamicTabContent } from "@/components/daily-reports/DynamicTabContent";
import { useTabSubmissionTracking } from "@/hooks/useTabSubmissionTracking";
import { useFormTemplates } from "@/hooks/useFormTemplates";
import { OverallProgressIndicator } from "@/components/daily-reports/TabCompletionIndicator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Financial {
  id?: string;
  transaction_type: string;
  category: string;
  amount: number;
  payment_method: string;
  description: string;
}

// Shift type options
const SHIFT_OPTIONS = [
  { value: "open", label: "Open", description: "Opening procedures" },
  { value: "during", label: "Daily Operations", description: "Mid-shift activities" },
  { value: "close", label: "Close", description: "Closing procedures" },
  { value: "handoff", label: "Shift Change", description: "Handoff procedures" },
];

export default function DailyReports() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [facilityId, setFacilityId] = useState<string>("");
  
  const [reportDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedTab, setSelectedTab] = useState<string>("");
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

  // Get the currently selected tab object
  const currentTab = tabs.find(t => t.id === selectedTab);

  // Set initial tab from URL or first available
  useEffect(() => {
    if (tabs.length > 0 && !selectedTab) {
      const tabFromUrl = searchParams.get('tab');
      const matchingTab = tabFromUrl ? tabs.find(t => t.id === tabFromUrl) : null;
      setSelectedTab(matchingTab?.id || tabs[0]?.id || "");
    }
  }, [tabs, selectedTab, searchParams]);

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

  const handleTabSelect = (tabId: string) => {
    setSelectedTab(tabId);
    // Clear shift type when switching tabs for clean state
    setShiftType("");
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

  // Show all tabs

  // Tab color classes
  const getTabColorClasses = (index: number, isActive: boolean) => {
    const colors = [
      { bg: 'bg-violet-100 dark:bg-violet-900/30', active: 'bg-violet-500 text-white', border: 'border-violet-300 dark:border-violet-700' },
      { bg: 'bg-orange-100 dark:bg-orange-900/30', active: 'bg-orange-500 text-white', border: 'border-orange-300 dark:border-orange-700' },
      { bg: 'bg-cyan-100 dark:bg-cyan-900/30', active: 'bg-cyan-500 text-white', border: 'border-cyan-300 dark:border-cyan-700' },
      { bg: 'bg-pink-100 dark:bg-pink-900/30', active: 'bg-pink-500 text-white', border: 'border-pink-300 dark:border-pink-700' },
      { bg: 'bg-amber-100 dark:bg-amber-900/30', active: 'bg-amber-500 text-white', border: 'border-amber-300 dark:border-amber-700' },
      { bg: 'bg-indigo-100 dark:bg-indigo-900/30', active: 'bg-indigo-500 text-white', border: 'border-indigo-300 dark:border-indigo-700' },
      { bg: 'bg-rose-100 dark:bg-rose-900/30', active: 'bg-rose-500 text-white', border: 'border-rose-300 dark:border-rose-700' },
      { bg: 'bg-teal-100 dark:bg-teal-900/30', active: 'bg-teal-500 text-white', border: 'border-teal-300 dark:border-teal-700' },
      { bg: 'bg-purple-100 dark:bg-purple-900/30', active: 'bg-purple-500 text-white', border: 'border-purple-300 dark:border-purple-700' },
    ];
    const colorSet = colors[index % colors.length];
    return isActive ? colorSet.active : `${colorSet.bg} ${colorSet.border} hover:opacity-80`;
  };

  return (
    <div className="container mx-auto p-6">
      <ModuleHeader
        title="Daily Reports"
        subtitle="Complete reports by work area and shift"
        icon={<ClipboardList className="h-8 w-8 text-primary" />}
      />

      {/* Loading State */}
      {tabsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading work areas...</span>
        </div>
      ) : tabs.length === 0 ? (
        <Card className="mb-6">
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Work Areas Available</h3>
            <p className="text-muted-foreground">
              {isAdmin 
                ? "Configure daily report tabs in the admin settings."
                : "No report areas are assigned to your role. Contact an administrator."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Level 1: Work Area Tabs */}
          <Card className="mb-4">
            <CardContent className="py-4">
              <Label className="text-sm font-medium text-muted-foreground mb-3 block">Select Work Area</Label>
              
              {/* Desktop: Horizontal Tabs */}
              <div className="hidden md:flex flex-wrap gap-2">
                {tabs.map((tab, index) => {
                  const status = tabStatuses.find(s => s.tabId === tab.id);
                  const isActive = selectedTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabSelect(tab.id)}
                      className={cn(
                        "px-4 py-2.5 rounded-lg border text-sm font-medium transition-all flex items-center gap-2",
                        getTabColorClasses(index, isActive)
                      )}
                    >
                      {status?.isComplete ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : status?.isRequired ? (
                        <AlertCircle className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4 opacity-50" />
                      )}
                      {tab.tab_name}
                    </button>
                  );
                })}
                
                {/* Financials Tab */}
                <button
                  onClick={() => handleTabSelect("financials")}
                  className={cn(
                    "px-4 py-2.5 rounded-lg border text-sm font-medium transition-all flex items-center gap-2",
                    selectedTab === "financials" 
                      ? "bg-teal-500 text-white" 
                      : "bg-teal-100 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700 hover:opacity-80"
                  )}
                >
                  <DollarSign className="h-4 w-4" />
                  Financials
                </button>
              </div>

              {/* Mobile: Dropdown Select */}
              <div className="md:hidden">
                <Select value={selectedTab} onValueChange={handleTabSelect}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select work area" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {tabs.map((tab) => {
                      const status = tabStatuses.find(s => s.tabId === tab.id);
                      return (
                        <SelectItem key={tab.id} value={tab.id}>
                          <div className="flex items-center gap-2">
                            {status?.isComplete ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : status?.isRequired ? (
                              <AlertCircle className="h-4 w-4 text-amber-500" />
                            ) : (
                              <Circle className="h-4 w-4 opacity-50" />
                            )}
                            {tab.tab_name}
                          </div>
                        </SelectItem>
                      );
                    })}
                    <SelectItem value="financials">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Financials
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Level 2: Shift Type Dropdown - Only shows when a work area tab is selected */}
          {selectedTab && selectedTab !== "financials" && (
            <Card className="mb-4">
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <Label className="text-sm font-medium text-muted-foreground mb-2 block">Select Shift</Label>
                    <Select value={shiftType} onValueChange={setShiftType}>
                      <SelectTrigger className="w-full sm:w-64">
                        <SelectValue placeholder="Choose shift type..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {SHIFT_OPTIONS.map((shift) => (
                          <SelectItem key={shift.value} value={shift.value}>
                            <div className="flex flex-col">
                              <span className="font-medium">{shift.label}</span>
                              <span className="text-xs text-muted-foreground">{shift.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {shiftType && currentTab && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>
                        {currentTab.tab_name} - {SHIFT_OPTIONS.find(s => s.value === shiftType)?.label}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progress Overview */}
          {tabs.length > 0 && (
            <Card className="mb-4 bg-muted/30">
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

          {/* Level 3: Form Content - Only shows when both tab and shift are selected */}
          {selectedTab === "financials" ? (
            // Financials Tab Content
            <div className="space-y-6">
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
                        <SelectContent className="bg-popover">
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
                        <SelectContent className="bg-popover">
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
            </div>
          ) : selectedTab && !shiftType ? (
            // Prompt to select shift type
            <Card>
              <CardContent className="py-12 text-center">
                <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Select Shift Type</h3>
                <p className="text-muted-foreground">
                  Choose a shift type above to view and complete the {currentTab?.tab_name} checklist.
                </p>
              </CardContent>
            </Card>
          ) : selectedTab && shiftType && currentTab ? (
            // Show the form for selected tab + shift
            <DynamicTabContent
              tab={currentTab}
              formData={tabFormData}
              onFormDataChange={handleTabFormDataChange}
              shiftType={shiftType}
            />
          ) : (
            // No tab selected
            <Card>
              <CardContent className="py-12 text-center">
                <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Work Area</h3>
                <p className="text-muted-foreground">
                  Choose a work area tab above to start completing your daily report.
                </p>
              </CardContent>
            </Card>
          )}
        </>
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
