-- Phase 2: Form Templates and Versioning System

-- Table for storing reusable form templates (already exists from types but needs population check)
-- The form_templates table already exists in schema, let's add version tracking
ALTER TABLE form_templates 
ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS parent_template_id UUID REFERENCES form_templates(id),
ADD COLUMN IF NOT EXISTS is_latest BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS changelog TEXT;

-- Table for tracking form template change history
CREATE TABLE IF NOT EXISTS form_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES form_templates(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  configuration JSONB NOT NULL DEFAULT '[]'::jsonb,
  changed_by UUID NOT NULL,
  changed_by_name TEXT NOT NULL,
  changelog TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on form_template_versions
ALTER TABLE form_template_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for form_template_versions
CREATE POLICY "Authenticated users can view template versions" 
ON form_template_versions 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage template versions" 
ON form_template_versions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_form_template_versions_template_id ON form_template_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_form_templates_form_type ON form_templates(form_type);