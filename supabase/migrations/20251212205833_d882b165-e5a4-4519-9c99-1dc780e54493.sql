-- Phase 1: Admin Panel Database Enhancements

-- 1.1 Expand facilities table
ALTER TABLE public.facilities
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS season_start DATE,
ADD COLUMN IF NOT EXISTS season_end DATE,
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- 1.2 Expand rinks table
ALTER TABLE public.rinks
ADD COLUMN IF NOT EXISTS length_feet NUMERIC,
ADD COLUMN IF NOT EXISTS width_feet NUMERIC,
ADD COLUMN IF NOT EXISTS target_depth_min NUMERIC DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS target_depth_max NUMERIC DEFAULT 1.75,
ADD COLUMN IF NOT EXISTS target_depth_ideal NUMERIC DEFAULT 1.25,
ADD COLUMN IF NOT EXISTS primary_use TEXT DEFAULT 'multi-purpose',
ADD COLUMN IF NOT EXISTS measurement_grid TEXT DEFAULT '35-point',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 1.3 Expand resurfacing_machines table
ALTER TABLE public.resurfacing_machines
ADD COLUMN IF NOT EXISTS year INTEGER,
ADD COLUMN IF NOT EXISTS serial_number TEXT,
ADD COLUMN IF NOT EXISTS blade_tracking TEXT DEFAULT 'hours',
ADD COLUMN IF NOT EXISTS expected_blade_life_hours INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS expected_blade_life_makes INTEGER DEFAULT 500,
ADD COLUMN IF NOT EXISTS current_blade_hours NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_blade_makes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_blade_change TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 1.4 Expand profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

-- 1.5 Create permission_templates table
CREATE TABLE IF NOT EXISTS public.permission_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  modules JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system_template BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on permission_templates
ALTER TABLE public.permission_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for permission_templates
CREATE POLICY "Admins can manage permission templates"
ON public.permission_templates FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view permission templates"
ON public.permission_templates FOR SELECT
USING (true);

-- 1.6 Create audit_logs table (permanent, never deleted)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  target_name TEXT,
  changes JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can create audit logs
CREATE POLICY "Admins can create audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Staff can create audit logs for their own actions
CREATE POLICY "Users can create their own audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Insert default permission templates
INSERT INTO public.permission_templates (name, description, modules, is_system_template) VALUES
('Facility Manager', 'Full access to all modules and administrative functions', 
 '[{"module": "ice_maintenance", "view": true, "create": true, "edit": true, "delete": true, "export": true},
   {"module": "refrigeration", "view": true, "create": true, "edit": true, "delete": true, "export": true},
   {"module": "ice_depth", "view": true, "create": true, "edit": true, "delete": true, "export": true},
   {"module": "air_quality", "view": true, "create": true, "edit": true, "delete": true, "export": true},
   {"module": "incidents", "view": true, "create": true, "edit": true, "delete": true, "export": true},
   {"module": "daily_reports", "view": true, "create": true, "edit": true, "delete": true, "export": true},
   {"module": "scheduling", "view": true, "create": true, "edit": true, "delete": true, "export": true}]'::jsonb, true),
('Supervisor', 'View and manage operations across all modules', 
 '[{"module": "ice_maintenance", "view": true, "create": true, "edit": true, "delete": false, "export": true},
   {"module": "refrigeration", "view": true, "create": true, "edit": true, "delete": false, "export": true},
   {"module": "ice_depth", "view": true, "create": true, "edit": true, "delete": false, "export": true},
   {"module": "air_quality", "view": true, "create": true, "edit": true, "delete": false, "export": true},
   {"module": "incidents", "view": true, "create": true, "edit": true, "delete": false, "export": true},
   {"module": "daily_reports", "view": true, "create": true, "edit": true, "delete": false, "export": true},
   {"module": "scheduling", "view": true, "create": true, "edit": true, "delete": false, "export": true}]'::jsonb, true),
('Zamboni Driver', 'Ice maintenance, resurfacing, and refrigeration operations', 
 '[{"module": "ice_maintenance", "view": true, "create": true, "edit": true, "delete": false, "export": false},
   {"module": "refrigeration", "view": true, "create": true, "edit": false, "delete": false, "export": false},
   {"module": "ice_depth", "view": true, "create": true, "edit": false, "delete": false, "export": false}]'::jsonb, true),
('Front Desk Staff', 'Incident reports, communications, and daily reports', 
 '[{"module": "incidents", "view": true, "create": true, "edit": false, "delete": false, "export": false},
   {"module": "daily_reports", "view": true, "create": true, "edit": true, "delete": false, "export": false}]'::jsonb, true),
('Rink Attendant', 'Basic ice maintenance and incident reporting', 
 '[{"module": "ice_maintenance", "view": true, "create": true, "edit": false, "delete": false, "export": false},
   {"module": "incidents", "view": true, "create": true, "edit": false, "delete": false, "export": false}]'::jsonb, true),
('Part-Time Staff', 'View-only access to assigned modules', 
 '[{"module": "ice_maintenance", "view": true, "create": false, "edit": false, "delete": false, "export": false},
   {"module": "incidents", "view": true, "create": true, "edit": false, "delete": false, "export": false}]'::jsonb, true)
ON CONFLICT DO NOTHING;