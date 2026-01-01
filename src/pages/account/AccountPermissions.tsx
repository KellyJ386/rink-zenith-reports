import { useState, useEffect } from "react";
import { useAccountContext } from "@/hooks/useAccountContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Shield, Wand2, Users, Copy } from "lucide-react";

const MODULES = [
  { key: "ice_depth", label: "Ice Depth Log" },
  { key: "ice_maintenance", label: "Ice Maintenance Log" },
  { key: "refrigeration", label: "Refrigeration Log" },
  { key: "air_quality", label: "Air Quality Log" },
  { key: "scheduling", label: "Employee Scheduling" },
  { key: "incidents", label: "Incident Reports" },
  { key: "daily_reports", label: "Daily Reports" },
];

interface ModulePermission {
  module: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
}

interface PermissionTemplate {
  id: string;
  name: string;
  description: string | null;
  modules: ModulePermission[];
  is_system_template: boolean | null;
}

const AccountPermissions = () => {
  const { toast } = useToast();
  const { facility, isAccountOwner } = useAccountContext();
  const [templates, setTemplates] = useState<PermissionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PermissionTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    modules: MODULES.map(m => ({
      module: m.key,
      view: false,
      create: false,
      edit: false,
      delete: false,
      export: false,
    })),
  });

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("permission_templates")
        .select("*")
        .order("name");

      if (error) throw error;
      setTemplates((data || []).map(t => ({
        ...t,
        modules: Array.isArray(t.modules) ? t.modules as unknown as ModulePermission[] : [],
      })));
    } catch (error: any) {
      console.error("Error loading templates:", error);
      toast({
        title: "Error",
        description: "Failed to load permission templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      modules: MODULES.map(m => ({
        module: m.key,
        view: false,
        create: false,
        edit: false,
        delete: false,
        export: false,
      })),
    });
    setSelectedTemplate(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (template: PermissionTemplate) => {
    if (template.is_system_template) {
      toast({
        title: "Cannot Edit",
        description: "System templates cannot be edited. Create a copy instead.",
        variant: "destructive",
      });
      return;
    }
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      modules: MODULES.map(m => {
        const existing = template.modules.find(tm => tm.module === m.key);
        return existing || {
          module: m.key,
          view: false,
          create: false,
          edit: false,
          delete: false,
          export: false,
        };
      }),
    });
    setDialogOpen(true);
  };

  const handleDuplicate = (template: PermissionTemplate) => {
    setSelectedTemplate(null);
    setFormData({
      name: `${template.name} (Copy)`,
      description: template.description || "",
      modules: MODULES.map(m => {
        const existing = template.modules.find(tm => tm.module === m.key);
        return existing || {
          module: m.key,
          view: false,
          create: false,
          edit: false,
          delete: false,
          export: false,
        };
      }),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Template name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const templateData = {
        name: formData.name,
        description: formData.description || null,
        modules: formData.modules,
        is_system_template: false,
      };

      if (selectedTemplate) {
        const { error } = await supabase
          .from("permission_templates")
          .update(templateData)
          .eq("id", selectedTemplate.id);

        if (error) throw error;
        toast({ title: "Success", description: "Template updated successfully" });
      } else {
        const { error } = await supabase
          .from("permission_templates")
          .insert(templateData);

        if (error) throw error;
        toast({ title: "Success", description: "Template created successfully" });
      }

      setDialogOpen(false);
      resetForm();
      loadTemplates();
    } catch (error: any) {
      console.error("Error saving template:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save template",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;

    try {
      const { error } = await supabase
        .from("permission_templates")
        .delete()
        .eq("id", selectedTemplate.id);

      if (error) throw error;

      toast({ title: "Success", description: "Template deleted successfully" });
      setDeleteDialogOpen(false);
      setSelectedTemplate(null);
      loadTemplates();
    } catch (error: any) {
      console.error("Error deleting template:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const updateModulePermission = (moduleKey: string, permission: keyof ModulePermission, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.map(m => {
        if (m.module === moduleKey) {
          // If enabling a permission, also enable view
          const updates: Partial<ModulePermission> = { [permission]: value };
          if (value && permission !== "view") {
            updates.view = true;
          }
          // If disabling view, disable all other permissions
          if (!value && permission === "view") {
            return { ...m, view: false, create: false, edit: false, delete: false, export: false };
          }
          return { ...m, ...updates };
        }
        return m;
      }),
    }));
  };

  const toggleAllForModule = (moduleKey: string, enable: boolean) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.map(m => {
        if (m.module === moduleKey) {
          return {
            ...m,
            view: enable,
            create: enable,
            edit: enable,
            delete: enable,
            export: enable,
          };
        }
        return m;
      }),
    }));
  };

  const getModuleLabel = (key: string) => {
    return MODULES.find(m => m.key === key)?.label || key;
  };

  const countActivePermissions = (modules: ModulePermission[]) => {
    return modules.filter(m => m.view).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Permission Templates</h2>
          <p className="text-muted-foreground">
            Create and manage permission templates to quickly assign access to users
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Templates</CardTitle>
          <CardDescription>
            {templates.length} template{templates.length !== 1 ? "s" : ""} available
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No permission templates yet. Create one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Modules</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-[120px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        {template.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[300px] truncate">
                      {template.description || "--"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {countActivePermissions(template.modules)} modules
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {template.is_system_template ? (
                        <Badge variant="outline">System</Badge>
                      ) : (
                        <Badge>Custom</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDuplicate(template)}
                          title="Duplicate"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(template)}
                          disabled={template.is_system_template === true}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setDeleteDialogOpen(true);
                          }}
                          disabled={template.is_system_template === true}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!open) resetForm();
        setDialogOpen(open);
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? "Edit Template" : "Create Permission Template"}
            </DialogTitle>
            <DialogDescription>
              Define which modules users with this template can access
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Maintenance Staff"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this template"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Module Permissions</Label>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Module</TableHead>
                      <TableHead className="text-center w-20">View</TableHead>
                      <TableHead className="text-center w-20">Create</TableHead>
                      <TableHead className="text-center w-20">Edit</TableHead>
                      <TableHead className="text-center w-20">Delete</TableHead>
                      <TableHead className="text-center w-20">Export</TableHead>
                      <TableHead className="text-center w-20">All</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.modules.map((module) => (
                      <TableRow key={module.module}>
                        <TableCell className="font-medium">
                          {getModuleLabel(module.module)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={module.view}
                            onCheckedChange={(checked) => 
                              updateModulePermission(module.module, "view", !!checked)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={module.create}
                            onCheckedChange={(checked) => 
                              updateModulePermission(module.module, "create", !!checked)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={module.edit}
                            onCheckedChange={(checked) => 
                              updateModulePermission(module.module, "edit", !!checked)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={module.delete}
                            onCheckedChange={(checked) => 
                              updateModulePermission(module.module, "delete", !!checked)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={module.export}
                            onCheckedChange={(checked) => 
                              updateModulePermission(module.module, "export", !!checked)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleAllForModule(
                              module.module,
                              !(module.view && module.create && module.edit && module.delete && module.export)
                            )}
                          >
                            {module.view && module.create && module.edit && module.delete && module.export
                              ? "Clear"
                              : "All"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {selectedTemplate ? "Update Template" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedTemplate?.name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AccountPermissions;
