import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { GitCompare, Plus, Minus, Edit2, ArrowRight, RotateCcw, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface TemplateVersion {
  id: string;
  template_id: string;
  version: number;
  configuration: any[];
  changed_by_name: string;
  changelog: string | null;
  created_at: string;
}

interface VersionComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  templateName: string;
  onVersionRestored?: () => void;
}

interface FieldDiff {
  type: "added" | "removed" | "modified" | "unchanged";
  fieldName: string;
  oldField?: any;
  newField?: any;
  changes?: string[];
}

export const VersionComparisonDialog = ({
  open,
  onOpenChange,
  templateId,
  templateName,
  onVersionRestored,
}: VersionComparisonDialogProps) => {
  const { toast } = useToast();
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [version1, setVersion1] = useState<string>("");
  const [version2, setVersion2] = useState<string>("");
  const [diffs, setDiffs] = useState<FieldDiff[]>([]);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [versionToRestore, setVersionToRestore] = useState<TemplateVersion | null>(null);

  useEffect(() => {
    if (open && templateId) {
      fetchVersions();
    }
  }, [open, templateId]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("form_template_versions")
        .select("*")
        .eq("template_id", templateId)
        .order("version", { ascending: false });

      if (error) throw error;
      
      const versionData = (data || []) as TemplateVersion[];
      setVersions(versionData);
      
      // Auto-select latest two versions if available
      if (versionData.length >= 2) {
        setVersion1(versionData[1].id);
        setVersion2(versionData[0].id);
      } else if (versionData.length === 1) {
        setVersion1(versionData[0].id);
      }
    } catch (error) {
      console.error("Error fetching versions:", error);
      toast({
        title: "Error",
        description: "Failed to load version history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (version1 && version2) {
      compareVersions();
    }
  }, [version1, version2]);

  const compareVersions = () => {
    const v1 = versions.find(v => v.id === version1);
    const v2 = versions.find(v => v.id === version2);

    if (!v1 || !v2) return;

    const config1 = v1.configuration || [];
    const config2 = v2.configuration || [];

    const fieldMap1 = new Map(config1.map((f: any) => [f.field_name, f]));
    const fieldMap2 = new Map(config2.map((f: any) => [f.field_name, f]));

    const allFieldNames = new Set([...fieldMap1.keys(), ...fieldMap2.keys()]);
    const diffResults: FieldDiff[] = [];

    allFieldNames.forEach(fieldName => {
      const field1 = fieldMap1.get(fieldName);
      const field2 = fieldMap2.get(fieldName);

      if (!field1 && field2) {
        // Added in v2
        diffResults.push({
          type: "added",
          fieldName,
          newField: field2,
        });
      } else if (field1 && !field2) {
        // Removed in v2
        diffResults.push({
          type: "removed",
          fieldName,
          oldField: field1,
        });
      } else if (field1 && field2) {
        // Check for modifications
        const changes: string[] = [];
        
        if (field1.field_label !== field2.field_label) {
          changes.push(`Label: "${field1.field_label}" → "${field2.field_label}"`);
        }
        if (field1.field_type !== field2.field_type) {
          changes.push(`Type: ${field1.field_type} → ${field2.field_type}`);
        }
        if (field1.is_required !== field2.is_required) {
          changes.push(`Required: ${field1.is_required} → ${field2.is_required}`);
        }
        if (field1.field_width !== field2.field_width) {
          changes.push(`Width: ${field1.field_width} → ${field2.field_width}`);
        }
        if (JSON.stringify(field1.field_options) !== JSON.stringify(field2.field_options)) {
          changes.push("Options changed");
        }
        if (field1.placeholder_text !== field2.placeholder_text) {
          changes.push("Placeholder changed");
        }
        if (field1.help_text !== field2.help_text) {
          changes.push("Help text changed");
        }
        if (field1.default_value !== field2.default_value) {
          changes.push(`Default: "${field1.default_value || ''}" → "${field2.default_value || ''}"`);
        }

        if (changes.length > 0) {
          diffResults.push({
            type: "modified",
            fieldName,
            oldField: field1,
            newField: field2,
            changes,
          });
        } else {
          diffResults.push({
            type: "unchanged",
            fieldName,
            oldField: field1,
            newField: field2,
          });
        }
      }
    });

    setDiffs(diffResults);
  };

  const getDiffStats = () => {
    const added = diffs.filter(d => d.type === "added").length;
    const removed = diffs.filter(d => d.type === "removed").length;
    const modified = diffs.filter(d => d.type === "modified").length;
    const unchanged = diffs.filter(d => d.type === "unchanged").length;
    return { added, removed, modified, unchanged };
  };

  const v1Data = versions.find(v => v.id === version1);
  const v2Data = versions.find(v => v.id === version2);
  const stats = getDiffStats();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Compare Versions
          </DialogTitle>
          <DialogDescription>
            Compare changes between versions of "{templateName}"
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <GitCompare className="h-8 w-8 animate-pulse text-muted-foreground" />
          </div>
        ) : versions.length < 2 ? (
          <div className="text-center py-12">
            <GitCompare className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">Need at least 2 versions to compare</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">From Version</label>
                <Select value={version1} onValueChange={setVersion1}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((v) => (
                      <SelectItem key={v.id} value={v.id} disabled={v.id === version2}>
                        v{v.version} - {format(new Date(v.created_at), "MMM d, yyyy")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <ArrowRight className="h-5 w-5 text-muted-foreground mt-6" />
              
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">To Version</label>
                <Select value={version2} onValueChange={setVersion2}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((v) => (
                      <SelectItem key={v.id} value={v.id} disabled={v.id === version1}>
                        v{v.version} - {format(new Date(v.created_at), "MMM d, yyyy")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {v1Data && v2Data && (
              <div className="flex gap-4 text-sm">
                <div className="flex-1 p-3 bg-muted/30 rounded-lg">
                  <p className="font-medium">v{v1Data.version}</p>
                  <p className="text-muted-foreground text-xs">{v1Data.changed_by_name}</p>
                  {v1Data.changelog && <p className="text-xs mt-1">{v1Data.changelog}</p>}
                </div>
                <div className="flex-1 p-3 bg-muted/30 rounded-lg">
                  <p className="font-medium">v{v2Data.version}</p>
                  <p className="text-muted-foreground text-xs">{v2Data.changed_by_name}</p>
                  {v2Data.changelog && <p className="text-xs mt-1">{v2Data.changelog}</p>}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                <Plus className="h-3 w-3 mr-1" />
                {stats.added} added
              </Badge>
              <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                <Minus className="h-3 w-3 mr-1" />
                {stats.removed} removed
              </Badge>
              <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                <Edit2 className="h-3 w-3 mr-1" />
                {stats.modified} modified
              </Badge>
              <Badge variant="secondary">
                {stats.unchanged} unchanged
              </Badge>
            </div>

            <ScrollArea className="max-h-[350px]">
              <div className="space-y-2">
                {diffs.map((diff, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      diff.type === "added"
                        ? "bg-green-50 border-green-200 dark:bg-green-950/20"
                        : diff.type === "removed"
                        ? "bg-red-50 border-red-200 dark:bg-red-950/20"
                        : diff.type === "modified"
                        ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20"
                        : "bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {diff.type === "added" && <Plus className="h-4 w-4 text-green-600" />}
                      {diff.type === "removed" && <Minus className="h-4 w-4 text-red-600" />}
                      {diff.type === "modified" && <Edit2 className="h-4 w-4 text-amber-600" />}
                      <span className="font-medium">{diff.fieldName}</span>
                      <Badge variant="secondary" className="text-xs">
                        {diff.newField?.field_type || diff.oldField?.field_type}
                      </Badge>
                    </div>
                    
                    {diff.type === "added" && (
                      <p className="text-sm text-green-700 dark:text-green-400">
                        New field: "{diff.newField?.field_label}"
                      </p>
                    )}
                    
                    {diff.type === "removed" && (
                      <p className="text-sm text-red-700 dark:text-red-400">
                        Removed field: "{diff.oldField?.field_label}"
                      </p>
                    )}
                    
                    {diff.type === "modified" && diff.changes && (
                      <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-0.5">
                        {diff.changes.map((change, i) => (
                          <li key={i}>• {change}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}

        <div className="flex justify-between pt-4 border-t">
          <div>
            {version1 && (
              <Button
                variant="outline"
                onClick={() => {
                  const v = versions.find(v => v.id === version1);
                  if (v) {
                    setVersionToRestore(v);
                    setRestoreConfirmOpen(true);
                  }
                }}
                disabled={restoring}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore v{versions.find(v => v.id === version1)?.version}
              </Button>
            )}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>

      <AlertDialog open={restoreConfirmOpen} onOpenChange={setRestoreConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Version {versionToRestore?.version}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will update the template to use the configuration from version {versionToRestore?.version}. 
              A new version will be created with the restored configuration. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!versionToRestore) return;
                setRestoring(true);
                try {
                  const { data: { user } } = await supabase.auth.getUser();
                  const { data: profile } = await supabase
                    .from("profiles")
                    .select("name")
                    .eq("user_id", user?.id)
                    .single();

                  // Get current template version
                  const { data: currentTemplate } = await supabase
                    .from("form_templates")
                    .select("version")
                    .eq("id", templateId)
                    .single();

                  const newVersion = (currentTemplate?.version || 0) + 1;

                  // Update template with restored configuration
                  const { error: updateError } = await supabase
                    .from("form_templates")
                    .update({
                      configuration: versionToRestore.configuration,
                      version: newVersion,
                      changelog: `Restored from version ${versionToRestore.version}`,
                    })
                    .eq("id", templateId);

                  if (updateError) throw updateError;

                  // Create version history entry
                  await supabase.from("form_template_versions").insert({
                    template_id: templateId,
                    version: newVersion,
                    configuration: versionToRestore.configuration,
                    changed_by: user?.id,
                    changed_by_name: profile?.name || user?.email || "Unknown",
                    changelog: `Restored from version ${versionToRestore.version}`,
                  });

                  toast({
                    title: "Version Restored",
                    description: `Successfully restored to version ${versionToRestore.version}`,
                  });

                  setRestoreConfirmOpen(false);
                  onOpenChange(false);
                  onVersionRestored?.();
                } catch (error) {
                  console.error("Error restoring version:", error);
                  toast({
                    title: "Error",
                    description: "Failed to restore version",
                    variant: "destructive",
                  });
                } finally {
                  setRestoring(false);
                }
              }}
              disabled={restoring}
            >
              {restoring ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                "Restore Version"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};
