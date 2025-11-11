-- Create ice depth measurements table
CREATE TABLE public.ice_depth_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES public.facilities(id) ON DELETE CASCADE NOT NULL,
  rink_id uuid REFERENCES public.rinks(id) ON DELETE CASCADE NOT NULL,
  template_type text NOT NULL CHECK (template_type IN ('24-point', '35-point', '46-point', 'custom')),
  measurement_date timestamp with time zone NOT NULL DEFAULT now(),
  operator_id uuid NOT NULL,
  measurements jsonb NOT NULL,
  min_depth numeric(5,2),
  max_depth numeric(5,2),
  avg_depth numeric(5,2),
  std_deviation numeric(5,2),
  ai_analysis text,
  status text NOT NULL DEFAULT 'good' CHECK (status IN ('good', 'warning', 'critical')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ice_depth_measurements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view measurements"
ON public.ice_depth_measurements
FOR SELECT
USING (true);

CREATE POLICY "Staff can create measurements"
ON public.ice_depth_measurements
FOR INSERT
WITH CHECK (auth.uid() = operator_id);

CREATE POLICY "Admins can manage measurements"
ON public.ice_depth_measurements
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create update trigger
CREATE TRIGGER update_ice_depth_measurements_updated_at
BEFORE UPDATE ON public.ice_depth_measurements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_ice_depth_measurements_rink_date 
ON public.ice_depth_measurements(rink_id, measurement_date DESC);