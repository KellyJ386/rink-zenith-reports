import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableField } from "./SortableField";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

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
  display_order: number;
}

interface FormCanvasProps {
  fields: FormField[];
  selectedFieldId: string | null;
  onSelectField: (id: string) => void;
  onDeleteField: (id: string) => void;
  onDuplicateField: (field: FormField) => void;
}

export const FormCanvas = ({ 
  fields, 
  selectedFieldId, 
  onSelectField, 
  onDeleteField,
  onDuplicateField 
}: FormCanvasProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: "form-canvas",
  });

  return (
    <div className="flex-1 p-6 bg-muted/30">
      <div className="max-w-3xl mx-auto">
        <div
          ref={setNodeRef}
          className={cn(
            "min-h-[600px] bg-background rounded-lg border-2 border-dashed p-6 transition-colors",
            isOver && "border-primary bg-primary/5",
            fields.length === 0 && "flex items-center justify-center"
          )}
        >
          {fields.length === 0 ? (
            <div className="text-center text-muted-foreground">
              <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No fields yet</p>
              <p className="text-sm">Drag fields from the left panel to start building your form</p>
            </div>
          ) : (
            <SortableContext 
              items={fields.map(f => f.id)} 
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {fields.map((field) => (
                  <SortableField
                    key={field.id}
                    field={field}
                    isSelected={selectedFieldId === field.id}
                    onSelect={() => onSelectField(field.id)}
                    onDelete={() => onDeleteField(field.id)}
                    onDuplicate={() => onDuplicateField(field)}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      </div>
    </div>
  );
};