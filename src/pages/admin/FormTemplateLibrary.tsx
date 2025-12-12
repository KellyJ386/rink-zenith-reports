import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
import { Library, Plus, Search, FileCode, Clock, User, Copy, Trash2, Eye, History } from "lucide-react";
import { format } from "date-fns";

interface FormTemplate {
  id: string;
  template_name: string;
  form_type: string;
  description: string | null;
  configuration: any;
  is_system_template: boolean;
  version: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface TemplateVersion {
  id: string;
  template_id: string;
  version: number;
  configuration: any;
  changed_by_name: string;
  changelog: string | null;
  created_at: string;
}

const FORM_TYPE_LABELS: Record<string, string> = {
  resurface: "Resurface",
  blade_change: "Blade Change",
  edging: "Edging",
  circle_check: "Circle Check",
  refrigeration_log: "Refrigeration Log",
  daily_report: "Daily Report",
  air_quality_log: "Air Quality Log",
  incident_report: "Incident Report",
  communication_log: "Communication Log",
};

const FormTemplateLibrary = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFormType, setFilterFormType] = useState<string>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    template_name: "",
    form_type: "",
    description: "",
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("form_templates")
        .select("*")
        .order("form_type")
        .order("template_name");

      if (error) throw error;
      setTemplates((data as FormTemplate[]) || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVersionHistory = async (templateId: string) => {
    try {
      const { data, error } = await supabase
        .from("form_template_versions")
        .select("*")
        .eq("template_id", templateId)
        .order("version", { ascending: false });

      if (error) throw error;
      setVersions((data as TemplateVersion[]) || []);
    } catch (error) {
      console.error("Error fetching versions:", error);
    }
  };

  const handleViewVersions = async (template: FormTemplate) => {
    setSelectedTemplate(template);
    await fetchVersionHistory(template.id);
    setIsVersionDialogOpen(true);
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.template_name || !newTemplate.form_type) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("form_templates")
        .insert({
          template_name: newTemplate.template_name,
          form_type: newTemplate.form_type,
          description: newTemplate.description || null,
          configuration: [],
          is_system_template: false,
          created_by: user?.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Template created successfully",
      });

      setIsCreateDialogOpen(false);
      setNewTemplate({ template_name: "", form_type: "", description: "" });
      fetchTemplates();
    } catch (error) {
      console.error("Error creating template:", error);
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateTemplate = async (template: FormTemplate) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("form_templates")
        .insert({
          template_name: `${template.template_name} (Copy)`,
          form_type: template.form_type,
          description: template.description,
          configuration: template.configuration,
          is_system_template: false,
          created_by: user?.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Template duplicated successfully",
      });

      fetchTemplates();
    } catch (error) {
      console.error("Error duplicating template:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate template",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTemplate = async (template: FormTemplate) => {
    if (template.is_system_template) {
      toast({
        title: "Error",
        description: "Cannot delete system templates",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("form_templates")
        .delete()
        .eq("id", template.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Template deleted successfully",
      });

      fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.template_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterFormType === "all" || template.form_type === filterFormType;
    return matchesSearch && matchesType;
  });

  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const type = template.form_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(template);
    return acc;
  }, {} as Record<string, FormTemplate[]>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ice-frost to-background">
        <Library className="h-12 w-12 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-frost to-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <PageHeader
            title="Form Template Library"
            subtitle="Manage reusable form templates with version control"
            icon={<Library className="h-8 w-8 text-primary" />}
          />
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterFormType} onValueChange={setFilterFormType}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(FORM_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {Object.keys(groupedTemplates).length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No Templates Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || filterFormType !== "all"
                  ? "No templates match your search criteria"
                  : "Create your first form template to get started"}
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTemplates).map(([formType, typeTemplates]) => (
              <Card key={formType}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCode className="h-5 w-5" />
                    {FORM_TYPE_LABELS[formType] || formType}
                  </CardTitle>
                  <CardDescription>
                    {typeTemplates.length} template{typeTemplates.length !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {typeTemplates.map((template) => (
                      <Card key={template.id} className="border bg-card/50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium">{template.template_name}</h4>
                              {template.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {template.description}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              {template.is_system_template && (
                                <Badge variant="secondary" className="text-xs">System</Badge>
                              )}
                              <Badge variant="outline" className="text-xs">v{template.version}</Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(template.updated_at || template.created_at), "MMM d, yyyy")}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileCode className="h-3 w-3" />
                              {Array.isArray(template.configuration) ? template.configuration.length : 0} fields
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleViewVersions(template)}
                            >
                              <History className="h-3 w-3 mr-1" />
                              History
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDuplicateTemplate(template)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            {!template.is_system_template && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteTemplate(template)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Template Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>
              Create a reusable form template for your facility
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Template Name *</Label>
              <Input
                placeholder="e.g., Standard Resurface Form"
                value={newTemplate.template_name}
                onChange={(e) => setNewTemplate({ ...newTemplate, template_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Form Type *</Label>
              <Select
                value={newTemplate.form_type}
                onValueChange={(value) => setNewTemplate({ ...newTemplate, form_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select form type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FORM_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Optional description of this template"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTemplate}>
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={isVersionDialogOpen} onOpenChange={setIsVersionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>
              {selectedTemplate?.template_name} - View previous versions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
            {versions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No version history available</p>
              </div>
            ) : (
              versions.map((version) => (
                <Card key={version.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">Version {version.version}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(version.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                        <p className="text-sm flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {version.changed_by_name}
                        </p>
                        {version.changelog && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {version.changelog}
                          </p>
                        )}
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVersionDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormTemplateLibrary;
