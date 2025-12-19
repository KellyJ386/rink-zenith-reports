-- Create custom_ice_templates table with 8 templates per facility/rink
CREATE TABLE public.custom_ice_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  rink_id UUID NOT NULL REFERENCES public.rinks(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  template_name TEXT NOT NULL,
  template_number INTEGER NOT NULL CHECK (template_number >= 1 AND template_number <= 8),
  point_count INTEGER NOT NULL DEFAULT 0,
  points JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (facility_id, rink_id, template_number)
);

-- Add constraint to limit 8 templates per facility/rink
CREATE OR REPLACE FUNCTION check_template_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.custom_ice_templates 
      WHERE facility_id = NEW.facility_id AND rink_id = NEW.rink_id) >= 8 THEN
    RAISE EXCEPTION 'Maximum of 8 templates per facility/rink combination allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_template_limit
  BEFORE INSERT ON public.custom_ice_templates
  FOR EACH ROW
  EXECUTE FUNCTION check_template_limit();

-- Add custom_template_id to ice_depth_measurements if not exists
ALTER TABLE public.ice_depth_measurements 
  ADD COLUMN IF NOT EXISTS custom_template_id UUID REFERENCES public.custom_ice_templates(id);

-- Enable RLS on custom_ice_templates
ALTER TABLE public.custom_ice_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_ice_templates
CREATE POLICY "Admins can manage custom ice templates"
  ON public.custom_ice_templates
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Facility users can view custom ice templates"
  ON public.custom_ice_templates
  FOR SELECT
  USING (true);

CREATE POLICY "Staff can create custom ice templates"
  ON public.custom_ice_templates
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Create updated_at trigger
CREATE TRIGGER update_custom_ice_templates_updated_at
  BEFORE UPDATE ON public.custom_ice_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();