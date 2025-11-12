-- Create work areas table
CREATE TABLE public.work_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create task categories table
CREATE TABLE public.task_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID NOT NULL,
  work_area_id UUID REFERENCES public.work_areas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create task subcategories table
CREATE TABLE public.task_subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.task_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily reports table
CREATE TABLE public.daily_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID NOT NULL,
  report_date DATE NOT NULL,
  shift_type TEXT NOT NULL,
  duty_type TEXT,
  submitted_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  total_revenue NUMERIC(10,2) DEFAULT 0,
  total_expenses NUMERIC(10,2) DEFAULT 0,
  petty_cash_balance NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT daily_reports_shift_type_check CHECK (shift_type IN ('morning', 'afternoon', 'evening', 'overnight')),
  CONSTRAINT daily_reports_status_check CHECK (status IN ('draft', 'submitted', 'approved', 'rejected'))
);

-- Create daily report tasks table
CREATE TABLE public.daily_report_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.daily_reports(id) ON DELETE CASCADE,
  work_area_id UUID REFERENCES public.work_areas(id),
  category_id UUID REFERENCES public.task_categories(id),
  subcategory_id UUID REFERENCES public.task_subcategories(id),
  task_name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT daily_report_tasks_status_check CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'not_applicable'))
);

-- Create daily report financials table
CREATE TABLE public.daily_report_financials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.daily_reports(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT,
  description TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT daily_report_financials_type_check CHECK (transaction_type IN ('revenue', 'expense', 'petty_cash')),
  CONSTRAINT daily_report_financials_payment_check CHECK (payment_method IN ('cash', 'credit_card', 'debit_card', 'check', 'other'))
);

-- Create report templates table
CREATE TABLE public.report_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID NOT NULL,
  template_name TEXT NOT NULL,
  duty_type TEXT,
  shift_type TEXT,
  template_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.work_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_report_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_report_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view work areas" ON public.work_areas FOR SELECT USING (true);
CREATE POLICY "Admins can manage work areas" ON public.work_areas FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view task categories" ON public.task_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage task categories" ON public.task_categories FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view task subcategories" ON public.task_subcategories FOR SELECT USING (true);
CREATE POLICY "Admins can manage task subcategories" ON public.task_subcategories FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view daily reports" ON public.daily_reports FOR SELECT USING (true);
CREATE POLICY "Staff can create daily reports" ON public.daily_reports FOR INSERT WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY "Staff can update their own draft reports" ON public.daily_reports FOR UPDATE USING (auth.uid() = submitted_by AND status = 'draft');
CREATE POLICY "Admins can manage all daily reports" ON public.daily_reports FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view report tasks" ON public.daily_report_tasks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.daily_reports WHERE id = daily_report_tasks.report_id)
);
CREATE POLICY "Staff can manage tasks in their reports" ON public.daily_report_tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM public.daily_reports WHERE id = daily_report_tasks.report_id AND submitted_by = auth.uid())
);

CREATE POLICY "Users can view report financials" ON public.daily_report_financials FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.daily_reports WHERE id = daily_report_financials.report_id)
);
CREATE POLICY "Staff can manage financials in their reports" ON public.daily_report_financials FOR ALL USING (
  EXISTS (SELECT 1 FROM public.daily_reports WHERE id = daily_report_financials.report_id AND submitted_by = auth.uid())
);

CREATE POLICY "Authenticated users can view templates" ON public.report_templates FOR SELECT USING (true);
CREATE POLICY "Admins can manage templates" ON public.report_templates FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create indexes
CREATE INDEX idx_work_areas_facility ON public.work_areas(facility_id);
CREATE INDEX idx_task_categories_facility ON public.task_categories(facility_id);
CREATE INDEX idx_task_categories_work_area ON public.task_categories(work_area_id);
CREATE INDEX idx_daily_reports_facility_date ON public.daily_reports(facility_id, report_date DESC);
CREATE INDEX idx_daily_report_tasks_report ON public.daily_report_tasks(report_id);
CREATE INDEX idx_daily_report_financials_report ON public.daily_report_financials(report_id);

-- Create triggers for updated_at
CREATE TRIGGER update_work_areas_updated_at BEFORE UPDATE ON public.work_areas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_categories_updated_at BEFORE UPDATE ON public.task_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_reports_updated_at BEFORE UPDATE ON public.daily_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_report_templates_updated_at BEFORE UPDATE ON public.report_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default work areas
INSERT INTO public.work_areas (facility_id, name, description, display_order) 
SELECT id, 'Front Desk', 'Customer service, registration, and administrative tasks', 1 FROM public.facilities LIMIT 1;

INSERT INTO public.work_areas (facility_id, name, description, display_order)
SELECT id, 'Ice Maintenance', 'Resurfacing, ice depth, and rink operations', 2 FROM public.facilities LIMIT 1;

INSERT INTO public.work_areas (facility_id, name, description, display_order)
SELECT id, 'Facility Maintenance', 'Building maintenance, repairs, and safety', 3 FROM public.facilities LIMIT 1;

INSERT INTO public.work_areas (facility_id, name, description, display_order)
SELECT id, 'Programs', 'Hockey, skating programs, and events support', 4 FROM public.facilities LIMIT 1;