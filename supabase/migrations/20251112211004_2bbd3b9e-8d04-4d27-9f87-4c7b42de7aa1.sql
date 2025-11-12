-- Create incidents table
CREATE TABLE public.incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_number TEXT NOT NULL UNIQUE,
  facility_id UUID NOT NULL,
  report_date DATE NOT NULL,
  report_time TIME NOT NULL,
  incident_date DATE NOT NULL,
  incident_time TIME NOT NULL,
  location TEXT NOT NULL,
  activity_at_time TEXT NOT NULL,
  incident_type TEXT NOT NULL,
  severity_level TEXT NOT NULL,
  injured_person_name TEXT NOT NULL,
  injured_person_age INTEGER,
  injured_person_gender TEXT,
  injured_person_phone TEXT,
  injured_person_email TEXT,
  injured_person_address TEXT,
  injury_locations JSONB DEFAULT '[]',
  additional_injury_details TEXT,
  incident_description TEXT NOT NULL,
  immediate_action_taken TEXT NOT NULL,
  witness_name TEXT,
  witness_phone TEXT,
  witness_email TEXT,
  medical_attention_required TEXT,
  medical_facility_name TEXT,
  ambulance_called BOOLEAN DEFAULT false,
  staff_name TEXT NOT NULL,
  staff_position TEXT NOT NULL,
  staff_phone TEXT,
  staff_email TEXT,
  staff_id UUID NOT NULL,
  additional_notes TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT incidents_type_check CHECK (incident_type IN ('slip_fall', 'collision', 'equipment', 'medical_emergency', 'property_damage', 'other')),
  CONSTRAINT incidents_severity_check CHECK (severity_level IN ('minor', 'moderate', 'serious', 'critical')),
  CONSTRAINT incidents_status_check CHECK (status IN ('submitted', 'under_review', 'closed'))
);

-- Create incident follow-ups table
CREATE TABLE public.incident_follow_ups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  follow_up_date DATE NOT NULL,
  follow_up_by TEXT NOT NULL,
  follow_up_notes TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_follow_ups ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view incidents" ON public.incidents FOR SELECT USING (true);
CREATE POLICY "Staff can create incidents" ON public.incidents FOR INSERT WITH CHECK (auth.uid() = staff_id);
CREATE POLICY "Staff can update their own incidents" ON public.incidents FOR UPDATE USING (auth.uid() = staff_id);
CREATE POLICY "Admins can manage all incidents" ON public.incidents FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view follow-ups" ON public.incident_follow_ups FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.incidents WHERE id = incident_follow_ups.incident_id)
);
CREATE POLICY "Admins can manage follow-ups" ON public.incident_follow_ups FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create indexes
CREATE INDEX idx_incidents_facility_date ON public.incidents(facility_id, incident_date DESC);
CREATE INDEX idx_incidents_number ON public.incidents(incident_number);
CREATE INDEX idx_incidents_status ON public.incidents(status);
CREATE INDEX idx_incident_follow_ups_incident ON public.incident_follow_ups(incident_id);

-- Create trigger for updated_at
CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate incident numbers
CREATE OR REPLACE FUNCTION generate_incident_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'IR-' || CAST(EXTRACT(EPOCH FROM NOW()) * 1000 AS BIGINT);
END;
$$ LANGUAGE plpgsql;