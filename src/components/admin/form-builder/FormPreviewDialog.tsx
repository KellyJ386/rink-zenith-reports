import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, Calendar, Clock, Hash, Mail, Phone, Link, FileText } from "lucide-react";

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

interface FormPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: FormField[];
  formType: string;
}

const FORM_TYPE_LABELS: Record<string, string> = {
  resurface: "Resurface Form",
  blade_change: "Blade Change Form",
  edging: "Edging Form",
  circle_check: "Circle Check Form",
  refrigeration_log: "Refrigeration Log",
  daily_report: "Daily Report",
  air_quality_log: "Air Quality Log",
  incident_report: "Incident Report",
  communication_log: "Communication Log",
};

export const FormPreviewDialog = ({
  open,
  onOpenChange,
  fields,
  formType,
}: FormPreviewDialogProps) => {
  const renderField = (field: FormField) => {
    const widthClass = field.field_width === "half" ? "w-1/2" : "w-full";
    
    const renderInput = () => {
      switch (field.field_type) {
        case "text":
          return (
            <Input
              placeholder={field.placeholder_text || `Enter ${field.field_label.toLowerCase()}`}
              defaultValue={field.default_value}
              disabled
            />
          );

        case "email":
          return (
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder={field.placeholder_text || "email@example.com"}
                className="pl-10"
                disabled
              />
            </div>
          );

        case "phone":
          return (
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="tel"
                placeholder={field.placeholder_text || "(555) 555-5555"}
                className="pl-10"
                disabled
              />
            </div>
          );

        case "number":
          return (
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder={field.placeholder_text || "0"}
                className="pl-10"
                disabled
              />
            </div>
          );

        case "url":
          return (
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="url"
                placeholder={field.placeholder_text || "https://"}
                className="pl-10"
                disabled
              />
            </div>
          );

        case "textarea":
          return (
            <Textarea
              placeholder={field.placeholder_text || `Enter ${field.field_label.toLowerCase()}`}
              defaultValue={field.default_value}
              rows={4}
              disabled
            />
          );

        case "select":
          return (
            <Select disabled>
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder_text || "Select an option"} />
              </SelectTrigger>
              <SelectContent>
                {(field.field_options || []).map((option, i) => (
                  <SelectItem key={i} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          );

        case "radio":
          return (
            <RadioGroup disabled defaultValue={field.default_value}>
              {(field.field_options || []).map((option, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${field.id}-${i}`} />
                  <Label htmlFor={`${field.id}-${i}`} className="font-normal">{option}</Label>
                </div>
              ))}
            </RadioGroup>
          );

        case "checkbox":
          return (
            <div className="flex items-center space-x-2">
              <Checkbox id={field.id} disabled defaultChecked={field.default_value === "true"} />
              <Label htmlFor={field.id} className="font-normal">
                {field.placeholder_text || field.field_label}
              </Label>
            </div>
          );

        case "switch":
          return (
            <div className="flex items-center space-x-2">
              <Switch id={field.id} disabled defaultChecked={field.default_value === "true"} />
              <Label htmlFor={field.id} className="font-normal">
                {field.placeholder_text || field.field_label}
              </Label>
            </div>
          );

        case "date":
          return (
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                className="pl-10"
                disabled
              />
            </div>
          );

        case "time":
          return (
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="time"
                className="pl-10"
                disabled
              />
            </div>
          );

        case "datetime":
          return (
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="datetime-local"
                className="pl-10"
                disabled
              />
            </div>
          );

        case "file":
          return (
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {field.placeholder_text || "Click to upload or drag and drop"}
              </p>
            </div>
          );

        case "header":
          return (
            <h3 className="text-lg font-semibold border-b pb-2">
              {field.field_label}
            </h3>
          );

        case "divider":
          return <hr className="border-border" />;

        case "paragraph":
          return (
            <p className="text-muted-foreground">
              {field.default_value || field.placeholder_text || "Paragraph text goes here"}
            </p>
          );

        default:
          return (
            <Input
              placeholder={field.placeholder_text}
              defaultValue={field.default_value}
              disabled
            />
          );
      }
    };

    // Skip label for certain field types
    const skipLabel = ["header", "divider", "paragraph", "checkbox", "switch"].includes(field.field_type);

    return (
      <div key={field.id} className={`${widthClass} space-y-2`}>
        {!skipLabel && (
          <Label className="flex items-center gap-1">
            {field.field_label}
            {field.is_required && <span className="text-destructive">*</span>}
          </Label>
        )}
        {renderInput()}
        {field.help_text && (
          <p className="text-xs text-muted-foreground">{field.help_text}</p>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Form Preview
          </DialogTitle>
          <DialogDescription>
            Preview how the {FORM_TYPE_LABELS[formType] || formType} will appear to users
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-6 bg-background border rounded-lg">
            <h2 className="text-xl font-semibold mb-6">
              {FORM_TYPE_LABELS[formType] || formType}
            </h2>

            {fields.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No fields added yet</p>
                <p className="text-sm">Add fields to see the preview</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4">
                {fields
                  .sort((a, b) => a.display_order - b.display_order)
                  .map(renderField)}
              </div>
            )}

            {fields.length > 0 && (
              <div className="flex justify-end gap-2 mt-8 pt-4 border-t">
                <Button variant="outline" disabled>Cancel</Button>
                <Button disabled>Submit</Button>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {fields.length} field{fields.length !== 1 ? "s" : ""} • Preview mode (inputs are disabled)
          </p>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close Preview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
