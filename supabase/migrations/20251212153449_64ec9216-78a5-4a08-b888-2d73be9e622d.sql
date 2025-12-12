-- Add enabled_templates column to facilities table
ALTER TABLE public.facilities 
ADD COLUMN IF NOT EXISTS enabled_templates JSONB DEFAULT '{
  "24-point": true,
  "35-point": true,
  "47-point": true,
  "custom_1": false,
  "custom_2": false,
  "custom_3": false
}'::jsonb;

-- Add slot_number column to custom_templates table
ALTER TABLE public.custom_templates 
ADD COLUMN IF NOT EXISTS slot_number INTEGER;

-- Add constraint for slot_number (1-3)
ALTER TABLE public.custom_templates 
ADD CONSTRAINT custom_templates_slot_number_check CHECK (slot_number >= 1 AND slot_number <= 3);

-- Add unique constraint for facility_id + slot_number combination
ALTER TABLE public.custom_templates 
ADD CONSTRAINT custom_templates_facility_slot_unique UNIQUE (facility_id, slot_number);

-- Add constraint for point_count (max 60)
ALTER TABLE public.custom_templates 
ADD CONSTRAINT custom_templates_point_count_check CHECK (point_count <= 60);