import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Library, FileCode, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface FormTemplate {
  id: string;
  template_name: string;
  form_type: string;
  description: string | null;
  configuration: any;
  version: number;
  updated_at: string;
}

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

interface ApplyTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formType: string;
  currentFieldCount: number;
  onApplyTemplate: (fields: FormField[]) => void;
}

export const ApplyTemplateDialog = ({
  open,
  onOpenChange,
  formType,
  currentFieldCount,
  onApplyTemplate,
}: ApplyTemplateDialogProps) => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open, formType]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("form_templates")
        .select("*")
        .eq("form_type", formType)
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

  const handleApply = () => {
    if (!selectedTemplate) return;

    const configuration = selectedTemplate.configuration as any[];
    const fields: FormField[] = configuration.map((field, index) => ({
      id: crypto.randomUUID(),
      field_name: field.field_name,
      field_label: field.field_label,
      field_type: field.field_type,
      field_options: field.field_options || [],
      is_required: field.is_required || false,
      placeholder_text: field.placeholder_text || "",
      help_text: field.help_text || "",
      field_width: field.field_width || "full",
      default_value: field.default_value || "",
      display_order: index,
    }));

    onApplyTemplate(fields);
    onOpenChange(false);
    setSelectedTemplate(null);

    toast({
      title: "Template Applied",
      description: `Applied "${selectedTemplate.template_name}" with ${fields.length} fields. Click "Save Form" to persist changes.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Library className="h-5 w-5" />
            Apply Template
          </DialogTitle>
          <DialogDescription>
            Select a template to apply to the form builder. This will replace all current fields.
          </DialogDescription>
        </DialogHeader>

        {currentFieldCount > 0 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <p className="text-sm">
              Applying a template will replace your current {currentFieldCount} field{currentFieldCount !== 1 ? "s" : ""}. 
              Make sure to save or export them first if needed.
            </p>
          </div>
        )}

        <ScrollArea className="max-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Library className="h-8 w-8 animate-pulse text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <FileCode className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No templates found for this form type</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create a template first in the Template Library
              </p>
            </div>
          ) : (
            <div className="space-y-2 pr-4">
              {templates.map((template) => {
                const fieldCount = Array.isArray(template.configuration) 
                  ? template.configuration.length 
                  : 0;
                
                return (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{template.template_name}</h4>
                        {template.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {template.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline">v{template.version}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileCode className="h-3 w-3" />
                        {fieldCount} field{fieldCount !== 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(template.updated_at), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={!selectedTemplate}>
            Apply Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
