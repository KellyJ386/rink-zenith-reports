import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { FormConfigEditor } from "@/components/admin/FormConfigEditor";
import PageHeader from "@/components/PageHeader";
import { Settings, Plus } from "lucide-react";

const AdminFormConfig = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customFormTypes, setCustomFormTypes] = useState<string[]>([]);
  const [newFormType, setNewFormType] = useState("");
  const [newFormName, setNewFormName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchCustomFormTypes();
    }
  }, [isAdmin]);

  const fetchCustomFormTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("form_configurations")
        .select("form_type")
        .not("form_type", "in", "(resurface,blade_change,edging,circle_check,refrigeration_log,daily_report,air_quality_log,incident_report,communication_log)")
        .order("form_type");

      if (error) throw error;
      
      const uniqueTypes = [...new Set(data?.map(d => d.form_type) || [])];
      setCustomFormTypes(uniqueTypes);
    } catch (error) {
      console.error("Error fetching custom form types:", error);
    }
  };

  const handleCreateCustomForm = () => {
    if (!newFormType.trim() || !newFormName.trim()) {
      toast({
        title: "Error",
        description: "Please provide both a form type ID and display name",
        variant: "destructive",
      });
      return;
    }

    const formTypeId = newFormType.toLowerCase().replace(/\s+/g, "_");
    
    if (customFormTypes.includes(formTypeId)) {
      toast({
        title: "Error",
        description: "This form type already exists",
        variant: "destructive",
      });
      return;
    }

    setCustomFormTypes([...customFormTypes, formTypeId]);
    setIsDialogOpen(false);
    setNewFormType("");
    setNewFormName("");
    
    toast({
      title: "Success",
      description: "Custom form type created. You can now add fields to it.",
    });
  };

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleData?.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "Only administrators can access this page",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    setUser(user);
    setIsAdmin(true);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ice-frost to-background">
        <div className="text-center">
          <Settings className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-frost to-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <PageHeader
            title="Form Configuration"
            subtitle="Add, remove, or customize form fields for all modules"
            icon={<Settings className="h-8 w-8 text-primary" />}
          />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Custom Form
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Custom Form Type</DialogTitle>
                <DialogDescription>
                  Create a new custom form type for your facility needs
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="formName">Form Display Name</Label>
                  <Input
                    id="formName"
                    placeholder="e.g., Equipment Inspection"
                    value={newFormName}
                    onChange={(e) => setNewFormName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="formType">Form Type ID (no spaces)</Label>
                  <Input
                    id="formType"
                    placeholder="e.g., equipment_inspection"
                    value={newFormType}
                    onChange={(e) => setNewFormType(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCustomForm}>
                  Create Form
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="ice_maintenance" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="ice_maintenance">Ice Maintenance</TabsTrigger>
            <TabsTrigger value="refrigeration">Refrigeration</TabsTrigger>
            <TabsTrigger value="daily_reports">Daily Reports</TabsTrigger>
            <TabsTrigger value="air_quality">Air Quality</TabsTrigger>
            <TabsTrigger value="incidents">Incidents</TabsTrigger>
            <TabsTrigger value="communications">Communications</TabsTrigger>
          </TabsList>

          <TabsContent value="ice_maintenance">
            <Tabs defaultValue="resurface" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="resurface">Resurface</TabsTrigger>
                <TabsTrigger value="blade_change">Blade Change</TabsTrigger>
                <TabsTrigger value="edging">Edging</TabsTrigger>
                <TabsTrigger value="circle_check">Circle Check</TabsTrigger>
              </TabsList>

              <TabsContent value="resurface">
                <FormConfigEditor formType="resurface" />
              </TabsContent>

              <TabsContent value="blade_change">
                <FormConfigEditor formType="blade_change" />
              </TabsContent>

              <TabsContent value="edging">
                <FormConfigEditor formType="edging" />
              </TabsContent>

              <TabsContent value="circle_check">
                <FormConfigEditor formType="circle_check" />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="refrigeration">
            <FormConfigEditor formType="refrigeration_log" />
          </TabsContent>

          <TabsContent value="daily_reports">
            <FormConfigEditor formType="daily_report" />
          </TabsContent>

          <TabsContent value="air_quality">
            <FormConfigEditor formType="air_quality_log" />
          </TabsContent>

          <TabsContent value="incidents">
            <FormConfigEditor formType="incident_report" />
          </TabsContent>

          <TabsContent value="communications">
            <FormConfigEditor formType="communication_log" />
          </TabsContent>
        </Tabs>

        {customFormTypes.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Custom Form Types</CardTitle>
              <CardDescription>
                Your facility-specific custom forms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={customFormTypes[0]} className="w-full">
                <TabsList className="grid w-full mb-4" style={{ gridTemplateColumns: `repeat(${customFormTypes.length}, 1fr)` }}>
                  {customFormTypes.map((formType) => (
                    <TabsTrigger key={formType} value={formType}>
                      {formType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {customFormTypes.map((formType) => (
                  <TabsContent key={formType} value={formType}>
                    <FormConfigEditor formType={formType} />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminFormConfig;