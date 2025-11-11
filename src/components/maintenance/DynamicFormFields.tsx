import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface DynamicFormFieldsProps {
  facilityId: string;
  formType: string;
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
}

export const DynamicFormFields = ({
  facilityId,
  formType,
  values,
  onChange,
}: DynamicFormFieldsProps) => {
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (facilityId && formType) {
      fetchCustomFields();
    }
  }, [facilityId, formType]);

  const fetchCustomFields = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("form_configurations")
        .select("*")
        .eq("facility_id", facilityId)
        .eq("form_type", formType)
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      setFields(data || []);
    } catch (error) {
      console.error("Error fetching custom fields:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    onChange({
      ...values,
      [fieldName]: value,
    });
  };

  if (loading || fields.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 border-t pt-4">
      <Label className="text-lg font-semibold">Custom Fields</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.field_label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>

            {field.field_type === "text" && (
              <Input
                value={values[field.field_name] || ""}
                onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
                required={field.is_required}
              />
            )}

            {field.field_type === "number" && (
              <Input
                type="number"
                value={values[field.field_name] || ""}
                onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
                required={field.is_required}
              />
            )}

            {field.field_type === "textarea" && (
              <Textarea
                value={values[field.field_name] || ""}
                onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
                required={field.is_required}
                rows={3}
              />
            )}

            {field.field_type === "select" && (
              <Select
                value={values[field.field_name] || ""}
                onValueChange={(value) => handleFieldChange(field.field_name, value)}
                required={field.is_required}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  {(field.field_options as string[])?.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {field.field_type === "checkbox" && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={values[field.field_name] || false}
                  onCheckedChange={(checked) => handleFieldChange(field.field_name, checked)}
                  required={field.is_required}
                />
                <Label className="font-normal cursor-pointer">
                  {field.field_label}
                </Label>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};