-- Drop old tables and restructure for new equipment logbook
DROP TABLE IF EXISTS public.compressor_readings CASCADE;
DROP TABLE IF EXISTS public.condenser_readings CASCADE;
DROP TABLE IF EXISTS public.plant_checklist CASCADE;

-- Update refrigeration_logs table with new columns
ALTER TABLE public.refrigeration_logs 
  DROP COLUMN IF EXISTS notes,
  ADD COLUMN reading_number INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN temperature_unit TEXT NOT NULL DEFAULT 'fahrenheit' CHECK (temperature_unit IN ('fahrenheit', 'celsius')),
  
  -- Compressor section
  ADD COLUMN suction_pressure NUMERIC,
  ADD COLUMN discharge_pressure NUMERIC,
  ADD COLUMN oil_pressure NUMERIC,
  ADD COLUMN compressor_amps NUMERIC,
  ADD COLUMN oil_temperature NUMERIC,
  
  -- Condenser section
  ADD COLUMN condenser_fan_status TEXT,
  ADD COLUMN ambient_temperature NUMERIC,
  ADD COLUMN condenser_pressure NUMERIC,
  ADD COLUMN water_temp_in NUMERIC,
  ADD COLUMN water_temp_out NUMERIC,
  
  -- Evaporator section
  ADD COLUMN evaporator_pressure NUMERIC,
  ADD COLUMN brine_temp_supply NUMERIC,
  ADD COLUMN brine_temp_return NUMERIC,
  ADD COLUMN brine_flow_rate NUMERIC,
  ADD COLUMN ice_surface_temp NUMERIC,
  
  -- Notes
  ADD COLUMN notes TEXT;

-- Create index on reading_number for better query performance
CREATE INDEX idx_refrigeration_logs_reading_number ON public.refrigeration_logs(facility_id, reading_number DESC);