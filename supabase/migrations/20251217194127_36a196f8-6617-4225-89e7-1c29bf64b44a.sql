-- Create daily_report_tabs table for admin-configurable tabs
CREATE TABLE public.daily_report_tabs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID NOT NULL,
  tab_name TEXT NOT NULL,
  tab_key TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_required BOOLEAN NOT NULL DEFAULT false,
  form_template_id UUID REFERENCES public.report_templates(id) ON DELETE SET NULL,
  icon TEXT DEFAULT 'clipboard',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(facility_id, tab_key)
);

-- Create daily_report_tab_roles table for role-based visibility
CREATE TABLE public.daily_report_tab_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tab_id UUID NOT NULL REFERENCES public.daily_report_tabs(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.schedule_roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tab_id, role_id)
);

-- Create daily_report_tab_submissions table for per-tab tracking
CREATE TABLE public.daily_report_tab_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.daily_reports(id) ON DELETE CASCADE,
  tab_id UUID NOT NULL REFERENCES public.daily_report_tabs(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(report_id, tab_id)
);

-- Enable RLS on all tables
ALTER TABLE public.daily_report_tabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_report_tab_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_report_tab_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_report_tabs
CREATE POLICY "Admins can manage all tabs"
ON public.daily_report_tabs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view active tabs"
ON public.daily_report_tabs
FOR SELECT
USING (is_active = true);

-- RLS Policies for daily_report_tab_roles
CREATE POLICY "Admins can manage tab roles"
ON public.daily_report_tab_roles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view tab roles"
ON public.daily_report_tab_roles
FOR SELECT
USING (true);

-- RLS Policies for daily_report_tab_submissions
CREATE POLICY "Admins can manage all submissions"
ON public.daily_report_tab_submissions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view submissions for their reports"
ON public.daily_report_tab_submissions
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM daily_reports
  WHERE daily_reports.id = daily_report_tab_submissions.report_id
));

CREATE POLICY "Staff can create submissions"
ON public.daily_report_tab_submissions
FOR INSERT
WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Staff can update their own submissions"
ON public.daily_report_tab_submissions
FOR UPDATE
USING (auth.uid() = submitted_by AND status = 'draft');

-- Create trigger for updated_at on daily_report_tabs
CREATE TRIGGER update_daily_report_tabs_updated_at
BEFORE UPDATE ON public.daily_report_tabs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on daily_report_tab_submissions
CREATE TRIGGER update_daily_report_tab_submissions_updated_at
BEFORE UPDATE ON public.daily_report_tab_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();