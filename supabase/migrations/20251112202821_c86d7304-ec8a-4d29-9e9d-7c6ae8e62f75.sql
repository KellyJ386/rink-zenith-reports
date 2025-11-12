-- Drop existing tables to restructure
DROP TABLE IF EXISTS public.refrigeration_equipment CASCADE;
DROP TABLE IF EXISTS public.refrigeration_logs CASCADE;
DROP TABLE IF EXISTS public.refrigeration_checklist_template CASCADE;

-- Create main refrigeration logs table
CREATE TABLE public.refrigeration_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID NOT NULL REFERENCES public.facilities(id),
  log_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  shift TEXT NOT NULL, -- 'morning', 'afternoon', 'evening', 'overnight'
  operator_id UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create compressor readings table
CREATE TABLE public.compressor_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  log_id UUID NOT NULL REFERENCES public.refrigeration_logs(id) ON DELETE CASCADE,
  compressor_name TEXT NOT NULL,
  suction_pressure NUMERIC,
  discharge_pressure NUMERIC,
  oil_level TEXT NOT NULL, -- 'ok', 'low', 'critical'
  temperature NUMERIC,
  running_hours NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create condenser readings table
CREATE TABLE public.condenser_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  log_id UUID NOT NULL REFERENCES public.refrigeration_logs(id) ON DELETE CASCADE,
  temperature NUMERIC,
  ambient_temp NUMERIC,
  fan_status TEXT NOT NULL, -- 'all_running', 'some_off', 'all_off'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create plant checklist table
CREATE TABLE public.plant_checklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  log_id UUID NOT NULL REFERENCES public.refrigeration_logs(id) ON DELETE CASCADE,
  checklist_item TEXT NOT NULL,
  status BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.refrigeration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compressor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.condenser_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plant_checklist ENABLE ROW LEVEL SECURITY;

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

-- RLS Policies for compressor_readings
CREATE POLICY "Authenticated users can view compressor readings"
  ON public.compressor_readings FOR SELECT
  USING (true);

CREATE POLICY "Users can insert compressor readings for their logs"
  ON public.compressor_readings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.refrigeration_logs
      WHERE id = compressor_readings.log_id
      AND operator_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage compressor readings"
  ON public.compressor_readings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for condenser_readings
CREATE POLICY "Authenticated users can view condenser readings"
  ON public.condenser_readings FOR SELECT
  USING (true);

CREATE POLICY "Users can insert condenser readings for their logs"
  ON public.condenser_readings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.refrigeration_logs
      WHERE id = condenser_readings.log_id
      AND operator_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage condenser readings"
  ON public.condenser_readings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for plant_checklist
CREATE POLICY "Authenticated users can view checklist"
  ON public.plant_checklist FOR SELECT
  USING (true);

CREATE POLICY "Users can insert checklist for their logs"
  ON public.plant_checklist FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.refrigeration_logs
      WHERE id = plant_checklist.log_id
      AND operator_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage checklist"
  ON public.plant_checklist FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indices for better query performance
CREATE INDEX idx_refrigeration_logs_facility_date ON public.refrigeration_logs(facility_id, log_date);
CREATE INDEX idx_compressor_readings_log_id ON public.compressor_readings(log_id);
CREATE INDEX idx_condenser_readings_log_id ON public.condenser_readings(log_id);
CREATE INDEX idx_plant_checklist_log_id ON public.plant_checklist(log_id);