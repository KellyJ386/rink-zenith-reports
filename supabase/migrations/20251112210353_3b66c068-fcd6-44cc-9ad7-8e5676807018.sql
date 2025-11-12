-- Create air quality logs table
CREATE TABLE public.air_quality_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID NOT NULL,
  log_date DATE NOT NULL,
  log_time TIME NOT NULL,
  submitted_by UUID NOT NULL,
  tester_name TEXT,
  tester_certification TEXT,
  co_monitor_type TEXT,
  co_monitor_model TEXT,
  co_monitor_calibration_date DATE,
  no2_monitor_type TEXT,
  no2_monitor_model TEXT,
  no2_monitor_calibration_date DATE,
  ventilation_last_inspection DATE,
  arena_status TEXT,
  ventilation_status TEXT,
  resurfacer_last_maintenance TEXT,
  ventilation_last_maintenance TEXT,
  other_equipment_last_maintenance TEXT,
  electric_equipment_consideration TEXT,
  staff_trained BOOLEAN DEFAULT false,
  public_signage_present BOOLEAN DEFAULT false,
  unusual_observations TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT air_quality_logs_status_check CHECK (status IN ('draft', 'submitted', 'approved'))
);

-- Create ice resurfacers table for air quality tracking
CREATE TABLE public.air_quality_resurfacers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  log_id UUID NOT NULL REFERENCES public.air_quality_logs(id) ON DELETE CASCADE,
  unit_number INTEGER NOT NULL,
  make_model TEXT,
  fuel_type TEXT,
  CONSTRAINT air_quality_resurfacers_fuel_check CHECK (fuel_type IN ('electric', 'propane', 'natural_gas', 'gasoline'))
);

-- Create other equipment table
CREATE TABLE public.air_quality_equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  log_id UUID NOT NULL REFERENCES public.air_quality_logs(id) ON DELETE CASCADE,
  equipment_name TEXT NOT NULL,
  fuel_type TEXT,
  notes TEXT
);

-- Create routine measurements table
CREATE TABLE public.air_quality_measurements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  log_id UUID NOT NULL REFERENCES public.air_quality_logs(id) ON DELETE CASCADE,
  measurement_type TEXT NOT NULL DEFAULT 'routine',
  measurement_time TIME NOT NULL,
  location TEXT NOT NULL,
  co_instant NUMERIC(6,2),
  co_one_hour_avg NUMERIC(6,2),
  no2_instant NUMERIC(6,2),
  no2_one_hour_avg NUMERIC(6,2),
  notes TEXT,
  actions_taken TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT air_quality_measurements_type_check CHECK (measurement_type IN ('routine', 'post_edging'))
);

-- Create action records table
CREATE TABLE public.air_quality_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  log_id UUID NOT NULL REFERENCES public.air_quality_logs(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  exceedance_time TIME NOT NULL,
  co_concentration NUMERIC(6,2),
  no2_concentration NUMERIC(6,2),
  health_authority_name TEXT,
  health_authority_notified_time TIME,
  reentry_authorized_datetime TIMESTAMP WITH TIME ZONE,
  reentry_authority TEXT,
  acceptable_levels_restored_time TIME,
  cause_and_measures TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT air_quality_actions_type_check CHECK (action_type IN ('immediate', 'corrective'))
);

-- Enable RLS
ALTER TABLE public.air_quality_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.air_quality_resurfacers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.air_quality_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.air_quality_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.air_quality_actions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view air quality logs" ON public.air_quality_logs FOR SELECT USING (true);
CREATE POLICY "Staff can create air quality logs" ON public.air_quality_logs FOR INSERT WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY "Staff can update their own draft logs" ON public.air_quality_logs FOR UPDATE USING (auth.uid() = submitted_by AND status = 'draft');
CREATE POLICY "Admins can manage all air quality logs" ON public.air_quality_logs FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view resurfacers in logs" ON public.air_quality_resurfacers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.air_quality_logs WHERE id = air_quality_resurfacers.log_id)
);
CREATE POLICY "Staff can manage resurfacers in their logs" ON public.air_quality_resurfacers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.air_quality_logs WHERE id = air_quality_resurfacers.log_id AND submitted_by = auth.uid())
);

CREATE POLICY "Users can view equipment in logs" ON public.air_quality_equipment FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.air_quality_logs WHERE id = air_quality_equipment.log_id)
);
CREATE POLICY "Staff can manage equipment in their logs" ON public.air_quality_equipment FOR ALL USING (
  EXISTS (SELECT 1 FROM public.air_quality_logs WHERE id = air_quality_equipment.log_id AND submitted_by = auth.uid())
);

CREATE POLICY "Users can view measurements" ON public.air_quality_measurements FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.air_quality_logs WHERE id = air_quality_measurements.log_id)
);
CREATE POLICY "Staff can manage measurements in their logs" ON public.air_quality_measurements FOR ALL USING (
  EXISTS (SELECT 1 FROM public.air_quality_logs WHERE id = air_quality_measurements.log_id AND submitted_by = auth.uid())
);

CREATE POLICY "Users can view actions" ON public.air_quality_actions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.air_quality_logs WHERE id = air_quality_actions.log_id)
);
CREATE POLICY "Staff can manage actions in their logs" ON public.air_quality_actions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.air_quality_logs WHERE id = air_quality_actions.log_id AND submitted_by = auth.uid())
);

-- Create indexes
CREATE INDEX idx_air_quality_logs_facility_date ON public.air_quality_logs(facility_id, log_date DESC);
CREATE INDEX idx_air_quality_resurfacers_log ON public.air_quality_resurfacers(log_id);
CREATE INDEX idx_air_quality_equipment_log ON public.air_quality_equipment(log_id);
CREATE INDEX idx_air_quality_measurements_log ON public.air_quality_measurements(log_id);
CREATE INDEX idx_air_quality_actions_log ON public.air_quality_actions(log_id);

-- Create trigger for updated_at
CREATE TRIGGER update_air_quality_logs_updated_at BEFORE UPDATE ON public.air_quality_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();