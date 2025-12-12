-- Add category and tags columns to form_templates table
ALTER TABLE public.form_templates 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create index for faster tag searches
CREATE INDEX IF NOT EXISTS idx_form_templates_tags ON public.form_templates USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_form_templates_category ON public.form_templates(category);