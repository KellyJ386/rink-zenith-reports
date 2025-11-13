import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { 
  Type, Mail, Hash, Phone, Link, Calendar, Clock, 
  AlignLeft, CheckSquare, ToggleLeft, List, Radio,
  Upload, Heading, Minus, Sliders
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface FieldType {
  id: string;
  type: string;
  label: string;
  icon: React.ReactNode;
  category: string;
}

const fieldTypes: FieldType[] = [
  // Text Fields
  { id: "text", type: "text", label: "Text", icon: <Type className="h-4 w-4" />, category: "Text Fields" },
  { id: "email", type: "email", label: "Email", icon: <Mail className="h-4 w-4" />, category: "Text Fields" },
  { id: "number", type: "number", label: "Number", icon: <Hash className="h-4 w-4" />, category: "Text Fields" },
  { id: "phone", type: "phone", label: "Phone", icon: <Phone className="h-4 w-4" />, category: "Text Fields" },
  { id: "url", type: "url", label: "URL", icon: <Link className="h-4 w-4" />, category: "Text Fields" },
  { id: "textarea", type: "textarea", label: "Textarea", icon: <AlignLeft className="h-4 w-4" />, category: "Text Fields" },
  
  // Selection Fields
  { id: "select", type: "select", label: "Dropdown", icon: <List className="h-4 w-4" />, category: "Selection" },
  { id: "radio", type: "radio", label: "Radio Group", icon: <Radio className="h-4 w-4" />, category: "Selection" },
  { id: "checkbox", type: "checkbox", label: "Checkbox", icon: <CheckSquare className="h-4 w-4" />, category: "Selection" },
  { id: "toggle", type: "toggle", label: "Toggle", icon: <ToggleLeft className="h-4 w-4" />, category: "Selection" },
  
  // Date/Time
  { id: "date", type: "date", label: "Date Picker", icon: <Calendar className="h-4 w-4" />, category: "Date/Time" },
  { id: "time", type: "time", label: "Time Picker", icon: <Clock className="h-4 w-4" />, category: "Date/Time" },
  
  // Advanced
  { id: "file", type: "file", label: "File Upload", icon: <Upload className="h-4 w-4" />, category: "Advanced" },
  { id: "slider", type: "slider", label: "Slider", icon: <Sliders className="h-4 w-4" />, category: "Advanced" },
  
  // Layout
  { id: "section", type: "section", label: "Section Header", icon: <Heading className="h-4 w-4" />, category: "Layout" },
  { id: "divider", type: "divider", label: "Divider", icon: <Minus className="h-4 w-4" />, category: "Layout" },
];

interface DraggableFieldProps {
  field: FieldType;
}

const DraggableField = ({ field }: DraggableFieldProps) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${field.id}`,
    data: { type: field.type, label: field.label },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent hover:border-primary cursor-grab transition-colors",
        isDragging && "opacity-50 cursor-grabbing"
      )}
    >
      <div className="text-muted-foreground">{field.icon}</div>
      <span className="text-sm font-medium">{field.label}</span>
    </div>
  );
};

export const FieldPalette = () => {
  const categories = [...new Set(fieldTypes.map(f => f.category))];

  return (
    <div className="w-64 border-r bg-card p-4">
      <h3 className="font-semibold mb-4">Field Types</h3>
      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category}>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                {category}
              </h4>
              <div className="space-y-2">
                {fieldTypes
                  .filter(f => f.category === category)
                  .map(field => (
                    <DraggableField key={field.id} field={field} />
                  ))}
              </div>
              <Separator className="mt-4" />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};