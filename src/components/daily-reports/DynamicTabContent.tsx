import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DailyReportTabWithRoles } from "@/types/dailyReport";
import { useFormTemplates, FormTemplateField } from "@/hooks/useFormTemplates";
import { Loader2 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { getFilteredChecklistForTab } from "@/data/dailyReportChecklists";
import { SectionedChecklist } from "./SectionedChecklist";
import { Progress } from "@/components/ui/progress";

interface DynamicTabContentProps {
  tab: DailyReportTabWithRoles;
  formData: Record<string, any>;
  onFormDataChange: (tabId: string, data: Record<string, any>) => void;
  shiftType: string;
}

// Map icon names to Lucide components
const getIcon = (iconName: string) => {
  const iconMap: Record<string, any> = {
    'clipboard-list': LucideIcons.ClipboardList,
    'spray-can': LucideIcons.SprayCan,
    'shopping-bag': LucideIcons.ShoppingBag,
    'utensils': LucideIcons.Utensils,
    'graduation-cap': LucideIcons.GraduationCap,
    'users': LucideIcons.Users,
    'shield-alert': LucideIcons.ShieldAlert,
    'building': LucideIcons.Building,
    'door-open': LucideIcons.DoorOpen,
    'car': LucideIcons.Car,
    'thermometer': LucideIcons.Thermometer,
    'calendar-check': LucideIcons.CalendarCheck,
    'package': LucideIcons.Package,
    'life-buoy': LucideIcons.LifeBuoy,
    'plus-circle': LucideIcons.PlusCircle,
    'clipboard': LucideIcons.Clipboard,
    'file-text': LucideIcons.FileText,
    'check-circle': LucideIcons.CheckCircle,
    'alert-circle': LucideIcons.AlertCircle,
    'settings': LucideIcons.Settings,
  };
  return iconMap[iconName] || LucideIcons.FileText;
};

// Render a single form field based on its type
const FormFieldRenderer = ({ 
  field, 
  value, 
  onChange 
}: { 
  field: FormTemplateField; 
  value: any; 
  onChange: (value: any) => void;
}) => {
  switch (field.field_type) {
    case 'text':
      return (
        <div className="space-y-2">
          <Label htmlFor={field.field_name}>
            {field.field_label}
            {field.is_required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            id={field.field_name}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder_text || ''}
          />
          {field.help_text && (
            <p className="text-xs text-muted-foreground">{field.help_text}</p>
          )}
        </div>
      );
    
    case 'number':
      return (
        <div className="space-y-2">
          <Label htmlFor={field.field_name}>
            {field.field_label}
            {field.is_required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            id={field.field_name}
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
            placeholder={field.placeholder_text || ''}
          />
          {field.help_text && (
            <p className="text-xs text-muted-foreground">{field.help_text}</p>
          )}
        </div>
      );
    
    case 'textarea':
      return (
        <div className="space-y-2">
          <Label htmlFor={field.field_name}>
            {field.field_label}
            {field.is_required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Textarea
            id={field.field_name}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder_text || ''}
            rows={3}
          />
          {field.help_text && (
            <p className="text-xs text-muted-foreground">{field.help_text}</p>
          )}
        </div>
      );
    
    case 'select':
      return (
        <div className="space-y-2">
          <Label htmlFor={field.field_name}>
            {field.field_label}
            {field.is_required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder_text || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {(field.field_options || []).map((option: any, idx: number) => (
                <SelectItem key={idx} value={typeof option === 'string' ? option : option.value}>
                  {typeof option === 'string' ? option : option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {field.help_text && (
            <p className="text-xs text-muted-foreground">{field.help_text}</p>
          )}
        </div>
      );
    
    case 'checkbox':
      return (
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <Checkbox
            id={field.field_name}
            checked={value || false}
            onCheckedChange={onChange}
          />
          <Label htmlFor={field.field_name} className="cursor-pointer flex-1">
            {field.field_label}
            {field.is_required && <span className="text-destructive ml-1">*</span>}
          </Label>
        </div>
      );
    
    default:
      return (
        <div className="space-y-2">
          <Label htmlFor={field.field_name}>{field.field_label}</Label>
          <Input
            id={field.field_name}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder_text || ''}
          />
        </div>
      );
  }
};

export function DynamicTabContent({ tab, formData, onFormDataChange, shiftType }: DynamicTabContentProps) {
  const { data: formTemplates = [], isLoading: templatesLoading } = useFormTemplates();
  
  const IconComponent = getIcon(tab.icon);
  const tabFormData = formData[tab.id] || { checklist: {}, notes: '', fields: {} };

  // Find the assigned form template
  const assignedTemplate = tab.form_template_id 
    ? formTemplates.find(t => t.id === tab.form_template_id)
    : null;

  const updateChecklist = (itemKey: string, checked: boolean) => {
    onFormDataChange(tab.id, {
      ...tabFormData,
      checklist: {
        ...tabFormData.checklist,
        [itemKey]: checked,
      },
    });
  };

  const updateNotes = (notes: string) => {
    onFormDataChange(tab.id, {
      ...tabFormData,
      notes,
    });
  };

  const updateField = (fieldName: string, value: any) => {
    onFormDataChange(tab.id, {
      ...tabFormData,
      fields: {
        ...tabFormData.fields,
        [fieldName]: value,
      },
    });
  };

  // Render form template fields
  if (tab.form_template_id && assignedTemplate) {
    const fields = assignedTemplate.configuration || [];
    const completedCount = fields.filter(f => {
      const val = tabFormData.fields?.[f.field_name];
      if (f.field_type === 'checkbox') return val === true;
      return val !== undefined && val !== '' && val !== null;
    }).length;

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <IconComponent className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{tab.tab_name}</CardTitle>
                <CardDescription>
                  {completedCount}/{fields.length} fields completed
                  {tab.is_required && (
                    <span className="ml-2 text-destructive text-xs font-medium">Required</span>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {templatesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : fields.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No fields configured for this template
              </p>
            ) : (
              <div className="space-y-4">
                {fields.map((field) => (
                  <FormFieldRenderer
                    key={field.id || field.field_name}
                    field={field}
                    value={tabFormData.fields?.[field.field_name]}
                    onChange={(value) => updateField(field.field_name, value)}
                  />
                ))}
              </div>
            )}

            <div className="pt-4 border-t">
              <Label htmlFor={`${tab.id}-notes`} className="text-sm font-medium">
                Additional Notes
              </Label>
              <Textarea
                id={`${tab.id}-notes`}
                placeholder={`Add notes for ${tab.tab_name}...`}
                value={tabFormData.notes || ''}
                onChange={(e) => updateNotes(e.target.value)}
                className="mt-2"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Comprehensive sectioned checklist rendering - filtered by shift type
  const sections = getFilteredChecklistForTab(tab.tab_key, shiftType);
  
  // Calculate overall completion based on filtered sections
  const totalItems = sections.reduce((sum, section) => sum + section.items.length, 0);
  const completedItems = sections.reduce((sum, section) => {
    return sum + section.items.filter(item => tabFormData.checklist?.[`${section.id}-${item.id}`]).length;
  }, 0);
  const completionPercent = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <IconComponent className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{tab.tab_name}</CardTitle>
              <CardDescription className="flex items-center gap-3">
                <span>{completedItems}/{totalItems} items completed</span>
                {tab.is_required && (
                  <span className="text-destructive text-xs font-medium">Required</span>
                )}
              </CardDescription>
            </div>
          </div>
          {/* Overall progress bar */}
          <div className="pt-2">
            <Progress value={completionPercent} className="h-2" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <SectionedChecklist
            sections={sections}
            checklist={tabFormData.checklist || {}}
            onChecklistChange={updateChecklist}
          />

          <div className="pt-4 border-t">
            <Label htmlFor={`${tab.id}-notes`} className="text-sm font-medium">
              Notes & Observations
            </Label>
            <Textarea
              id={`${tab.id}-notes`}
              placeholder={`Add notes for ${tab.tab_name}...`}
              value={tabFormData.notes || ''}
              onChange={(e) => updateNotes(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
