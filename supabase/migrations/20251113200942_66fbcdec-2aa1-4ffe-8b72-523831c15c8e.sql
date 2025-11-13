-- Add custom_fields column to relevant tables for form builder integration

-- Refrigeration logs
ALTER TABLE refrigeration_logs 
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- Air quality logs
ALTER TABLE air_quality_logs 
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- Daily reports
ALTER TABLE daily_reports 
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- Incidents (check if exists first)
ALTER TABLE incidents 
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- Add GIN indexes for efficient JSON queries
CREATE INDEX IF NOT EXISTS idx_refrigeration_logs_custom_fields 
  ON refrigeration_logs USING GIN (custom_fields);
  
CREATE INDEX IF NOT EXISTS idx_air_quality_logs_custom_fields 
  ON air_quality_logs USING GIN (custom_fields);
  
CREATE INDEX IF NOT EXISTS idx_daily_reports_custom_fields 
  ON daily_reports USING GIN (custom_fields);
  
CREATE INDEX IF NOT EXISTS idx_incidents_custom_fields 
  ON incidents USING GIN (custom_fields);

-- Add comment for documentation
COMMENT ON COLUMN refrigeration_logs.custom_fields IS 'Facility-specific custom form fields configured via form builder';
COMMENT ON COLUMN air_quality_logs.custom_fields IS 'Facility-specific custom form fields configured via form builder';
COMMENT ON COLUMN daily_reports.custom_fields IS 'Facility-specific custom form fields configured via form builder';
COMMENT ON COLUMN incidents.custom_fields IS 'Facility-specific custom form fields configured via form builder';