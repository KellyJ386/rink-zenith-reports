import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { GripVertical, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
}

interface SortableFieldProps {
  field: FormField;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const fieldTypeLabels: Record<string, string> = {
  text: "Text",
  email: "Email",
  number: "Number",
  phone: "Phone",
  url: "URL",
  textarea: "Textarea",
  select: "Dropdown",
  radio: "Radio Group",
  checkbox: "Checkbox",
  toggle: "Toggle",
  date: "Date",
  time: "Time",
  file: "File Upload",
  slider: "Slider",
  section: "Section Header",
  divider: "Divider",
};

export const SortableField = ({ field, isSelected, onSelect, onDelete, onDuplicate }: SortableFieldProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={cn(
        "group relative p-4 rounded-lg border bg-card cursor-pointer transition-all",
        isSelected && "border-primary ring-2 ring-primary/20",
        isDragging && "opacity-50",
        !isSelected && "hover:border-primary/50"
      )}
    >
      <div className="flex items-start gap-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground mt-1"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">{field.field_label}</span>
            {field.is_required && (
              <Badge variant="secondary" className="text-xs">Required</Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {fieldTypeLabels[field.field_type] || field.field_type}
            </Badge>
          </div>
          
          {field.placeholder_text && (
            <p className="text-sm text-muted-foreground">
              Placeholder: {field.placeholder_text}
            </p>
          )}
          
          {field.help_text && (
            <p className="text-sm text-muted-foreground">
              Help: {field.help_text}
            </p>
          )}
          
          {field.field_options && field.field_options.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              Options: {field.field_options.join(", ")}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="h-8 w-8"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};