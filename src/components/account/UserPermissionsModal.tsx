import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Wand2, Shield } from "lucide-react";

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
}

interface UserPermissionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  onSaved?: () => void;
}

export const UserPermissionsModal = ({
  open,
  onOpenChange,
  userId,
  userName,
  onSaved,
}: UserPermissionsModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<PermissionTemplate[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (open && userId) {
      loadTemplates();
      loadUserPermissions();
    }
  }, [open, userId]);

  const loadTemplates = async () => {
    const { data } = await supabase
      .from("permission_templates")
      .select("*")
      .order("name");

    setTemplates((data || []).map(t => ({
      ...t,
      modules: Array.isArray(t.modules) ? t.modules as unknown as ModulePermission[] : [],
    })));
  };

  const loadUserPermissions = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("user_permissions")
        .select("module_name")
        .eq("user_id", userId)
        .eq("can_access", true);

      setPermissions(data?.map(p => p.module_name) || []);
    } catch (error) {
      console.error("Error loading permissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    // Map template modules to permission names
    const moduleNames = template.modules
      .filter(m => m.view)
      .map(m => {
        const moduleMap: Record<string, string> = {
          ice_maintenance: "Ice Maintenance Log",
          refrigeration: "Refrigeration Log",
          ice_depth: "Ice Depth Log",
          air_quality: "Air Quality Log",
          incidents: "Incident Reports",
          daily_reports: "Daily Reports",
          scheduling: "Employee Scheduling",
        };
        return moduleMap[m.module] || m.module;
      });

    setPermissions(moduleNames);
    toast({
      title: "Template Applied",
      description: `Applied "${template.name}" permissions`,
    });
  };

  const togglePermission = (moduleName: string) => {
    setPermissions(prev => 
      prev.includes(moduleName)
        ? prev.filter(p => p !== moduleName)
        : [...prev, moduleName]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete existing permissions
      await supabase
        .from("user_permissions")
        .delete()
        .eq("user_id", userId);

      // Insert new permissions
      if (permissions.length > 0) {
        const { error } = await supabase
          .from("user_permissions")
          .insert(
            permissions.map(module => ({
              user_id: userId,
              module_name: module,
              can_access: true,
            }))
          );

        if (error) throw error;
      }

      toast({ title: "Success", description: "Permissions updated successfully" });
      onSaved?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving permissions:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save permissions",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getModuleLabel = (key: string) => {
    return MODULES.find(m => m.key === key)?.label || key;
  };

  // Map between display names and keys for the checkbox
  const displayModules = MODULES.map(m => ({
    key: m.key,
    label: m.label,
    displayName: (() => {
      const moduleMap: Record<string, string> = {
        ice_maintenance: "Ice Maintenance Log",
        refrigeration: "Refrigeration Log",
        ice_depth: "Ice Depth Log",
        air_quality: "Air Quality Log",
        incidents: "Incident Reports",
        daily_reports: "Daily Reports",
        scheduling: "Employee Scheduling",
      };
      return moduleMap[m.key] || m.label;
    })(),
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Manage Permissions
          </DialogTitle>
          <DialogDescription>
            Configure module access for {userName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Apply Template (Optional)</Label>
            <div className="flex gap-2">
              <Select onValueChange={handleApplyTemplate}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <Wand2 className="h-4 w-4" />
                        {template.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Templates provide a quick way to set common permission combinations
            </p>
          </div>

          {/* Module Permissions */}
          <div className="space-y-3">
            <Label>Module Access</Label>
            <div className="border rounded-lg p-4 space-y-3">
              {loading ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Loading permissions...
                </p>
              ) : (
                displayModules.map(module => (
                  <div key={module.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={module.key}
                        checked={permissions.includes(module.displayName)}
                        onCheckedChange={() => togglePermission(module.displayName)}
                      />
                      <Label htmlFor={module.key} className="cursor-pointer">
                        {module.label}
                      </Label>
                    </div>
                    {permissions.includes(module.displayName) && (
                      <Badge variant="secondary" className="text-xs">Enabled</Badge>
                    )}
                  </div>
                ))
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {permissions.length} of {MODULES.length} modules enabled
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Permissions"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
