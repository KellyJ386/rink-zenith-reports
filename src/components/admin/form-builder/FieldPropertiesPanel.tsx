import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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
}

interface FieldPropertiesPanelProps {
  field: FormField | null;
  onUpdate: (updates: Partial<FormField>) => void;
}

export const FieldPropertiesPanel = ({ field, onUpdate }: FieldPropertiesPanelProps) => {
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState("");

  useEffect(() => {
    if (field?.field_options) {
      setOptions(field.field_options);
    } else {
      setOptions([]);
    }
  }, [field?.id]);

  if (!field) {
    return (
      <div className="w-80 border-l bg-card p-6">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">Select a field to edit its properties</p>
        </div>
      </div>
    );
  }

  const needsOptions = ["select", "radio"].includes(field.field_type);

  const handleAddOption = () => {
    if (newOption.trim()) {
      const updatedOptions = [...options, newOption.trim()];
      setOptions(updatedOptions);
      onUpdate({ field_options: updatedOptions });
      setNewOption("");
    }
  };

  const handleRemoveOption = (index: number) => {
    const updatedOptions = options.filter((_, i) => i !== index);
    setOptions(updatedOptions);
    onUpdate({ field_options: updatedOptions });
  };

  return (
    <div className="w-80 border-l bg-card">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Field Properties</h3>
      </div>
      
      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="p-4 space-y-6">
          {/* Basic Properties */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="field_label">Label *</Label>
              <Input
                id="field_label"
                value={field.field_label}
                onChange={(e) => onUpdate({ field_label: e.target.value })}
                placeholder="Field label"
              />
            </div>

            <div>
              <Label htmlFor="field_name">Field Name *</Label>
              <Input
                id="field_name"
                value={field.field_name}
                onChange={(e) => onUpdate({ field_name: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
                placeholder="field_name"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Used for data storage (no spaces)
              </p>
            </div>

            <div>
              <Label htmlFor="field_type">Field Type</Label>
              <Input
                id="field_type"
                value={field.field_type}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <Separator />

          {/* Advanced Properties */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Advanced</h4>

            <div>
              <Label htmlFor="placeholder">Placeholder Text</Label>
              <Input
                id="placeholder"
                value={field.placeholder_text || ""}
                onChange={(e) => onUpdate({ placeholder_text: e.target.value })}
                placeholder="Enter placeholder..."
              />
            </div>

            <div>
              <Label htmlFor="help_text">Help Text</Label>
              <Textarea
                id="help_text"
                value={field.help_text || ""}
                onChange={(e) => onUpdate({ help_text: e.target.value })}
                placeholder="Helpful description..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="default_value">Default Value</Label>
              <Input
                id="default_value"
                value={field.default_value || ""}
                onChange={(e) => onUpdate({ default_value: e.target.value })}
                placeholder="Default value..."
              />
            </div>

            <div>
              <Label htmlFor="field_width">Field Width</Label>
              <Select
                value={field.field_width || "full"}
                onValueChange={(value) => onUpdate({ field_width: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Width</SelectItem>
                  <SelectItem value="half">Half Width</SelectItem>
                  <SelectItem value="third">Third Width</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="required">Required Field</Label>
              <Switch
                id="required"
                checked={field.is_required}
                onCheckedChange={(checked) => onUpdate({ is_required: checked })}
              />
            </div>
          </div>

          {/* Options for Select/Radio */}
          {needsOptions && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Options</h4>
                
                <div className="space-y-2">
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input value={option} disabled className="bg-muted" />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveOption(index)}
                        className="shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddOption()}
                    placeholder="Add option..."
                  />
                  <Button size="icon" onClick={handleAddOption}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};