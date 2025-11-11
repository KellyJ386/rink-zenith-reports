-- Create maintenance activities table
CREATE TABLE public.maintenance_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES public.facilities(id) ON DELETE CASCADE NOT NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('resurface', 'blade_change', 'edging', 'circle_check')),
  rink_id uuid REFERENCES public.rinks(id) ON DELETE CASCADE,
  machine_id uuid REFERENCES public.resurfacing_machines(id) ON DELETE SET NULL,
  operator_id uuid NOT NULL,
  activity_datetime timestamp with time zone NOT NULL DEFAULT now(),
  water_used numeric(10,2),
  machine_hours numeric(10,2),
  old_blade_hours numeric(10,2),
  new_blade_id text,
  edging_type text,
  notes text,
  custom_fields jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create circle checks table
CREATE TABLE public.circle_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid REFERENCES public.maintenance_activities(id) ON DELETE CASCADE NOT NULL,
  check_item text NOT NULL,
  status text NOT NULL CHECK (status IN ('ok', 'needs_attention', 'critical')),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create form configuration table for admin customization
CREATE TABLE public.form_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES public.facilities(id) ON DELETE CASCADE NOT NULL,
  form_type text NOT NULL CHECK (form_type IN ('resurface', 'blade_change', 'edging', 'circle_check')),
  field_name text NOT NULL,
  field_type text NOT NULL CHECK (field_type IN ('text', 'number', 'textarea', 'select', 'checkbox')),
  field_label text NOT NULL,
  field_options jsonb DEFAULT '[]'::jsonb,
  is_required boolean DEFAULT false,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(facility_id, form_type, field_name)
);

-- Enable RLS
ALTER TABLE public.maintenance_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_configurations ENABLE ROW LEVEL SECURITY;

-- Policies for maintenance_activities
CREATE POLICY "Authenticated users can view activities"
ON public.maintenance_activities
FOR SELECT
USING (true);

CREATE POLICY "Staff can create activities"
ON public.maintenance_activities
FOR INSERT
WITH CHECK (auth.uid() = operator_id);

CREATE POLICY "Admins can manage activities"
ON public.maintenance_activities
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies for circle_checks
CREATE POLICY "Authenticated users can view circle checks"
ON public.circle_checks
FOR SELECT
USING (true);

CREATE POLICY "Staff can create circle checks"
ON public.circle_checks
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.maintenance_activities
    WHERE id = circle_checks.activity_id
    AND operator_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage circle checks"
ON public.circle_checks
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies for form_configurations
CREATE POLICY "Authenticated users can view form configs"
ON public.form_configurations
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage form configs"
ON public.form_configurations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create triggers
CREATE TRIGGER update_maintenance_activities_updated_at
BEFORE UPDATE ON public.maintenance_activities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_form_configurations_updated_at
BEFORE UPDATE ON public.form_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_maintenance_activities_datetime 
ON public.maintenance_activities(activity_datetime DESC);

CREATE INDEX idx_maintenance_activities_facility_type 
ON public.maintenance_activities(facility_id, activity_type);

CREATE INDEX idx_circle_checks_activity 
ON public.circle_checks(activity_id);