import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ClipboardList, DollarSign, FileText, Plus, Save, Send, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { DynamicFormFields } from "@/components/maintenance/DynamicFormFields";

interface WorkArea {
  id: string;
  name: string;
  description: string;
}

interface TaskCategory {
  id: string;
  name: string;
  icon: string;
  work_area_id: string;
}

interface ReportTask {
  id?: string;
  work_area_id: string;
  category_id: string;
  task_name: string;
  description: string;
  status: string;
  notes: string;
}

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
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [facilityId, setFacilityId] = useState<string>("");
  
  const [workAreas, setWorkAreas] = useState<WorkArea[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  
  const [reportDate, setReportDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [shiftType, setShiftType] = useState("morning");
  const [dutyType, setDutyType] = useState("");
  const [notes, setNotes] = useState("");
  
  const [tasks, setTasks] = useState<ReportTask[]>([]);
  const [financials, setFinancials] = useState<Financial[]>([]);
  
  const [newFinancial, setNewFinancial] = useState<Financial>({
    transaction_type: "revenue",
    category: "",
    amount: 0,
    payment_method: "cash",
    description: ""
  });

  const [customFields, setCustomFields] = useState<Record<string, any>>({});

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
        await loadData(profile.facility_id);
      }
    } catch (error) {
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async (facilityId: string) => {
    const [areasResult, categoriesResult] = await Promise.all([
      supabase.from("work_areas").select("*").eq("facility_id", facilityId).eq("is_active", true).order("display_order"),
      supabase.from("task_categories").select("*").eq("facility_id", facilityId).eq("is_active", true).order("display_order")
    ]);

    if (areasResult.data) setWorkAreas(areasResult.data);
    if (categoriesResult.data) setCategories(categoriesResult.data);
  };

  const addTask = (workAreaId: string, categoryId: string, taskName: string) => {
    setTasks([...tasks, {
      work_area_id: workAreaId,
      category_id: categoryId,
      task_name: taskName,
      description: "",
      status: "pending",
      notes: ""
    }]);
  };

  const updateTask = (index: number, field: string, value: any) => {
    const updated = [...tasks];
    updated[index] = { ...updated[index], [field]: value };
    setTasks(updated);
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
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
    
    setSaving(true);
    try {
      const totals = calculateTotals();
      
      const { data: report, error: reportError } = await supabase
        .from("daily_reports")
        .insert({
          facility_id: facilityId,
          report_date: reportDate,
          shift_type: shiftType,
          duty_type: dutyType,
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

      if (tasks.length > 0) {
        const { error: tasksError } = await supabase
          .from("daily_report_tasks")
          .insert(tasks.map(t => ({ ...t, report_id: report.id })));
        if (tasksError) throw tasksError;
      }

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
      setTasks([]);
      setFinancials([]);
      setNotes("");
      setDutyType("");
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
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const totals = calculateTotals();

  return (
    <div className="container mx-auto p-6">
      <ModuleHeader
        title="Daily Reports"
        subtitle="Comprehensive daily task and financial reporting"
        icon={<ClipboardList className="h-8 w-8 text-primary" />}
      />

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Report Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Shift Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={shiftType} onValueChange={setShiftType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning</SelectItem>
                <SelectItem value="afternoon">Afternoon</SelectItem>
                <SelectItem value="evening">Evening</SelectItem>
                <SelectItem value="overnight">Overnight</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Duty Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="e.g., Manager, Ice Tech, Front Desk"
              value={dutyType}
              onChange={(e) => setDutyType(e.target.value)}
            />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tasks">Task Management</TabsTrigger>
          <TabsTrigger value="financials">Financial Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          {workAreas.map(area => {
            const areaCategories = categories.filter(c => c.work_area_id === area.id);
            const areaTasks = tasks.filter(t => t.work_area_id === area.id);

            return (
              <Card key={area.id}>
                <CardHeader>
                  <CardTitle>{area.name}</CardTitle>
                  <CardDescription>{area.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {areaCategories.map(cat => (
                      <Button
                        key={cat.id}
                        variant="outline"
                        size="sm"
                        onClick={() => addTask(area.id, cat.id, cat.name)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add {cat.name}
                      </Button>
                    ))}
                  </div>

                  {areaTasks.length > 0 && (
                    <div className="space-y-3">
                      {areaTasks.map((task, index) => {
                        const taskIndex = tasks.findIndex(t => t === task);
                        return (
                          <div key={taskIndex} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={task.status === "completed"}
                                  onCheckedChange={(checked) => 
                                    updateTask(taskIndex, "status", checked ? "completed" : "pending")
                                  }
                                />
                                <Label className="font-medium">{task.task_name}</Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <Select
                                  value={task.status}
                                  onValueChange={(value) => updateTask(taskIndex, "status", value)}
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="skipped">Skipped</SelectItem>
                                    <SelectItem value="not_applicable">N/A</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeTask(taskIndex)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                            <Textarea
                              placeholder="Task notes..."
                              value={task.notes}
                              onChange={(e) => updateTask(taskIndex, "notes", e.target.value)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

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

      {facilityId && (
        <DynamicFormFields
          facilityId={facilityId}
          formType="daily_report"
          values={customFields}
          onChange={setCustomFields}
        />
      )}

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
