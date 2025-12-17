import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FormTemplateField {
  id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  field_options?: any[];
  is_required?: boolean;
  placeholder_text?: string;
  help_text?: string;
  default_value?: string;
}

export interface FormTemplate {
  id: string;
  template_name: string;
  form_type: string;
  description: string | null;
  category: string | null;
  configuration: FormTemplateField[];
  is_system_template: boolean;
  created_at: string;
}

export const useFormTemplates = () => {
  return useQuery({
    queryKey: ['form-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_templates')
        .select('*')
        .eq('is_latest', true)
        .order('template_name');

      if (error) throw error;
      
      return (data || []).map((template) => ({
        id: template.id,
        template_name: template.template_name,
        form_type: template.form_type,
        description: template.description,
        category: template.category,
        configuration: (template.configuration as unknown as FormTemplateField[]) || [],
        is_system_template: template.is_system_template ?? false,
        created_at: template.created_at ?? '',
      })) as FormTemplate[];
    },
  });
};
