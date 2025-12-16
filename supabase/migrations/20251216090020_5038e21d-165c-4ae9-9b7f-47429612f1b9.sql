-- Add columns to custom_templates for preset overrides
ALTER TABLE custom_templates ADD COLUMN IF NOT EXISTS is_preset_override boolean DEFAULT false;
ALTER TABLE custom_templates ADD COLUMN IF NOT EXISTS preset_template_key text;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_custom_templates_preset_override 
ON custom_templates (facility_id, preset_template_key) 
WHERE is_preset_override = true;