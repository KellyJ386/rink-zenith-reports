import { useState, useEffect } from "react";
import { DndContext, DragEndEvent, DragOverlay, closestCenter, DragStartEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext } from "@dnd-kit/sortable";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FieldPalette } from "./FieldPalette";
import { FormCanvas } from "./FormCanvas";
import { FieldPropertiesPanel } from "./FieldPropertiesPanel";
import { Button } from "@/components/ui/button";
import { Save, Eye } from "lucide-react";

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

interface FormBuilderEditorProps {
  facilityId: string;
  formType: string;
}

export const FormBuilderEditor = ({ facilityId, formType }: FormBuilderEditorProps) => {
  const { toast } = useToast();
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFields();
  }, [facilityId, formType]);

  const fetchFields = async () => {
    try {
      const { data, error } = await supabase
        .from("form_configurations")
        .select("*")
        .eq("facility_id", facilityId)
        .eq("form_type", formType)
        .order("display_order");

      if (error) throw error;
      
      const mappedFields: FormField[] = (data || []).map(field => {
        const fieldAny = field as any; // Type assertion needed until types are regenerated
        return {
          id: field.id,
          field_name: field.field_name,
          field_label: field.field_label,
          field_type: field.field_type,
          field_options: (field.field_options as string[]) || [],
          is_required: field.is_required || false,
          placeholder_text: fieldAny.placeholder_text || "",
          help_text: fieldAny.help_text || "",
          field_width: fieldAny.field_width || "full",
          default_value: fieldAny.default_value || "",
          display_order: field.display_order || 0,
        };
      });
      
      setFields(mappedFields);
    } catch (error) {
      console.error("Error fetching fields:", error);
      toast({
        title: "Error",
        description: "Failed to load form fields",
        variant: "destructive",
      });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Handle new field from palette
    if (active.id.toString().startsWith("palette-")) {
      const fieldType = active.data.current?.type;
      const fieldLabel = active.data.current?.label;
      
      const newField: FormField = {
        id: crypto.randomUUID(),
        field_name: `field_${Date.now()}`,
        field_label: fieldLabel || "New Field",
        field_type: fieldType,
        is_required: false,
        field_width: "full",
        display_order: fields.length,
      };

      setFields([...fields, newField]);
      setSelectedFieldId(newField.id);
      return;
    }

    // Handle reordering
    if (active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);

      const reordered = arrayMove(fields, oldIndex, newIndex).map((field, index) => ({
        ...field,
        display_order: index,
      }));

      setFields(reordered);
    }
  };

  const handleUpdateField = (updates: Partial<FormField>) => {
    if (!selectedFieldId) return;

    setFields(fields.map(field => 
      field.id === selectedFieldId 
        ? { ...field, ...updates }
        : field
    ));
  };

  const handleDeleteField = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId));
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  };

  const handleDuplicateField = (field: FormField) => {
    const newField = {
      ...field,
      id: crypto.randomUUID(),
      field_name: `${field.field_name}_copy`,
      field_label: `${field.field_label} (Copy)`,
      display_order: fields.length,
    };
    setFields([...fields, newField]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete existing fields for this form
      await supabase
        .from("form_configurations")
        .delete()
        .eq("facility_id", facilityId)
        .eq("form_type", formType);

      // Insert new fields
      const fieldsToInsert = fields.map(field => ({
        facility_id: facilityId,
        form_type: formType,
        field_name: field.field_name,
        field_label: field.field_label,
        field_type: field.field_type,
        field_options: field.field_options || [],
        is_required: field.is_required,
        placeholder_text: field.placeholder_text,
        help_text: field.help_text,
        field_width: field.field_width || "full",
        default_value: field.default_value,
        display_order: field.display_order,
        is_active: true,
      }));

      const { error } = await supabase
        .from("form_configurations")
        .insert(fieldsToInsert);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Form configuration saved successfully",
      });
    } catch (error) {
      console.error("Error saving fields:", error);
      toast({
        title: "Error",
        description: "Failed to save form configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedField = fields.find(f => f.id === selectedFieldId) || null;

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div className="flex items-center justify-between px-6 py-3 border-b bg-card">
        <div>
          <h2 className="text-lg font-semibold">Form Builder</h2>
          <p className="text-sm text-muted-foreground">{fields.length} fields</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={saving} size="sm">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Form"}
          </Button>
        </div>
      </div>

      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 overflow-hidden">
          <FieldPalette />
          
          <FormCanvas
            fields={fields}
            selectedFieldId={selectedFieldId}
            onSelectField={setSelectedFieldId}
            onDeleteField={handleDeleteField}
            onDuplicateField={handleDuplicateField}
          />

          <FieldPropertiesPanel
            field={selectedField}
            onUpdate={handleUpdateField}
          />
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="p-4 rounded-lg border bg-card shadow-lg">
              Dragging field...
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};