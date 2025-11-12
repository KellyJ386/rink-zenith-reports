-- Create refrigeration equipment table
CREATE TABLE public.refrigeration_equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID NOT NULL REFERENCES public.facilities(id),
  equipment_type TEXT NOT NULL, -- 'compressor', 'pump', 'condenser', etc.
  equipment_name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create refrigeration logs table
CREATE TABLE public.refrigeration_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID NOT NULL REFERENCES public.facilities(id),
  log_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  operator_id UUID NOT NULL,
  readings JSONB NOT NULL DEFAULT '{}', -- stores all equipment readings
  checklist_items JSONB NOT NULL DEFAULT '{}', -- stores checklist responses
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create refrigeration checklist template table
CREATE TABLE public.refrigeration_checklist_template (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID NOT NULL REFERENCES public.facilities(id),
  item_text TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.refrigeration_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refrigeration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refrigeration_checklist_template ENABLE ROW LEVEL SECURITY;

-- RLS Policies for refrigeration_equipment
CREATE POLICY "Authenticated users can view equipment"
  ON public.refrigeration_equipment FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage equipment"
  ON public.refrigeration_equipment FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for refrigeration_logs
CREATE POLICY "Authenticated users can view logs"
  ON public.refrigeration_logs FOR SELECT
  USING (true);

CREATE POLICY "Staff can create logs"
  ON public.refrigeration_logs FOR INSERT
  WITH CHECK (auth.uid() = operator_id);

CREATE POLICY "Admins can manage logs"
  ON public.refrigeration_logs FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for refrigeration_checklist_template
CREATE POLICY "Authenticated users can view checklist template"
  ON public.refrigeration_checklist_template FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage checklist template"
  ON public.refrigeration_checklist_template FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_refrigeration_equipment_updated_at
  BEFORE UPDATE ON public.refrigeration_equipment
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_refrigeration_logs_updated_at
  BEFORE UPDATE ON public.refrigeration_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_refrigeration_checklist_template_updated_at
  BEFORE UPDATE ON public.refrigeration_checklist_template
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();