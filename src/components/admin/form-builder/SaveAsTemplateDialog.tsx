import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save } from "lucide-react";

interface FormField {
  id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  field_options?: string[];
  is_required: boolean;
  placeholder_text?: string;
  help_text?: string;
  field_width?: string;
  default_value?: string;
  display_order: number;
}

interface SaveAsTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: FormField[];
  formType: string;
}

export const SaveAsTemplateDialog = ({
  open,
  onOpenChange,
  fields,
  formType,
}: SaveAsTemplateDialogProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [templateData, setTemplateData] = useState({
    template_name: "",
    description: "",
    changelog: "",
  });

  const handleSaveTemplate = async () => {
    if (!templateData.template_name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a template name",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("user_id", user?.id)
        .single();

      // Create the configuration from fields
      const configuration = fields.map(({ id, ...field }) => field);

      // Insert the template
      const { data: template, error: templateError } = await supabase
        .from("form_templates")
        .insert({
          template_name: templateData.template_name,
          form_type: formType,
          description: templateData.description || null,
          configuration,
          is_system_template: false,
          version: 1,
          is_latest: true,
          changelog: templateData.changelog || null,
          created_by: user?.id,
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Create initial version record
      const { error: versionError } = await supabase
        .from("form_template_versions")
        .insert({
          template_id: template.id,
          version: 1,
          configuration,
          changed_by: user?.id || "",
          changed_by_name: profile?.name || "Unknown",
          changelog: templateData.changelog || "Initial version",
        });

      if (versionError) throw versionError;

      toast({
        title: "Success",
        description: `Template "${templateData.template_name}" saved with ${fields.length} fields`,
      });

      setTemplateData({ template_name: "", description: "", changelog: "" });
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>
            Save the current form configuration as a reusable template with version control
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Template Name *</Label>
            <Input
              placeholder="e.g., Standard Resurface Form"
              value={templateData.template_name}
              onChange={(e) => setTemplateData({ ...templateData, template_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Describe what this template is for..."
              value={templateData.description}
              onChange={(e) => setTemplateData({ ...templateData, description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Version Notes</Label>
            <Input
              placeholder="e.g., Initial version"
              value={templateData.changelog}
              onChange={(e) => setTemplateData({ ...templateData, changelog: e.target.value })}
            />
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-sm">
            <p className="font-medium mb-1">Template will include:</p>
            <ul className="text-muted-foreground space-y-1">
              <li>• {fields.length} field{fields.length !== 1 ? "s" : ""}</li>
              <li>• Form type: {formType}</li>
              <li>• All field properties and settings</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveTemplate} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
