-- Phase 1: Database Schema Enhancement

-- 1.1 Extend form_configurations table
ALTER TABLE form_configurations 
ADD COLUMN IF NOT EXISTS placeholder_text text,
ADD COLUMN IF NOT EXISTS help_text text,
ADD COLUMN IF NOT EXISTS validation_rules jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS default_value text,
ADD COLUMN IF NOT EXISTS section_id uuid,
ADD COLUMN IF NOT EXISTS field_width text DEFAULT 'full' CHECK (field_width IN ('full', 'half', 'third')),
ADD COLUMN IF NOT EXISTS conditional_logic jsonb DEFAULT '{}'::jsonb;

-- 1.2 Create form_sections table
CREATE TABLE IF NOT EXISTS form_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE NOT NULL,
  form_type text NOT NULL,
  section_name text NOT NULL,
  section_description text,
  display_order integer DEFAULT 0,
  is_collapsible boolean DEFAULT true,
  is_collapsed_by_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on form_sections
ALTER TABLE form_sections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for form_sections
CREATE POLICY "Admins can manage form sections"
ON form_sections
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view form sections"
ON form_sections
FOR SELECT
TO authenticated
USING (true);

-- 1.3 Create form_templates table
CREATE TABLE IF NOT EXISTS form_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text NOT NULL,
  form_type text NOT NULL,
  description text,
  is_system_template boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on form_templates
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for form_templates
CREATE POLICY "Admins can manage form templates"
ON form_templates
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view form templates"
ON form_templates
FOR SELECT
TO authenticated
USING (true);

-- Add update trigger for form_sections
CREATE TRIGGER update_form_sections_updated_at
BEFORE UPDATE ON form_sections
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add update trigger for form_templates
CREATE TRIGGER update_form_templates_updated_at
BEFORE UPDATE ON form_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();