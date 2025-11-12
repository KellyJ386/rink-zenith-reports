-- Ice Rink Scheduling Module - Database Schema
-- Phase 1: Foundation Tables

-- Table: schedule_staff
CREATE TABLE public.schedule_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT,
  employment_status TEXT NOT NULL DEFAULT 'active' CHECK (employment_status IN ('active', 'inactive')),
  target_hours_per_week INTEGER NOT NULL DEFAULT 0 CHECK (target_hours_per_week >= 0 AND target_hours_per_week <= 168),
  hire_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: schedule_roles
CREATE TABLE public.schedule_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL,
  required_certification TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: schedule_staff_roles (many-to-many relationship)
CREATE TABLE public.schedule_staff_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.schedule_staff(id) ON DELETE CASCADE NOT NULL,
  role_id UUID REFERENCES public.schedule_roles(id) ON DELETE CASCADE NOT NULL,
  certified_date DATE,
  certification_expires DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(staff_id, role_id)
);

-- Table: schedule_shifts
CREATE TABLE public.schedule_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  role_id UUID REFERENCES public.schedule_roles(id) NOT NULL,
  assigned_staff_id UUID REFERENCES public.schedule_staff(id) ON DELETE SET NULL,
  area TEXT NOT NULL CHECK (area IN ('Main Rink', 'Studio Rink', 'Front Desk', 'Zamboni Bay', 'Pro Shop', 'Other')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'accepted', 'declined', 'completed')),
  notes TEXT,
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: schedule_availability
CREATE TABLE public.schedule_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.schedule_staff(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: schedule_shift_responses
CREATE TABLE public.schedule_shift_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID REFERENCES public.schedule_shifts(id) ON DELETE CASCADE NOT NULL,
  staff_id UUID REFERENCES public.schedule_staff(id) ON DELETE CASCADE NOT NULL,
  response TEXT NOT NULL DEFAULT 'pending' CHECK (response IN ('pending', 'accepted', 'declined', 'reassigned', 'cancelled')),
  response_date TIMESTAMP WITH TIME ZONE,
  decline_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: schedule_time_off
CREATE TABLE public.schedule_time_off (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.schedule_staff(id) ON DELETE CASCADE NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('vacation', 'sick', 'personal', 'unpaid', 'other')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'cancelled')),
  reason TEXT,
  manager_response TEXT,
  approved_by UUID REFERENCES auth.users,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_schedule_shifts_date_time ON public.schedule_shifts(date, start_time);
CREATE INDEX idx_schedule_shifts_assigned_staff ON public.schedule_shifts(assigned_staff_id);
CREATE INDEX idx_schedule_shifts_status ON public.schedule_shifts(status);
CREATE INDEX idx_schedule_availability_staff_day ON public.schedule_availability(staff_id, day_of_week);
CREATE INDEX idx_schedule_staff_roles_staff ON public.schedule_staff_roles(staff_id);
CREATE INDEX idx_schedule_staff_roles_role ON public.schedule_staff_roles(role_id);
CREATE INDEX idx_schedule_time_off_staff_dates ON public.schedule_time_off(staff_id, start_date, end_date);

-- Enable Row Level Security
ALTER TABLE public.schedule_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_staff_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_shift_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_time_off ENABLE ROW LEVEL SECURITY;

-- RLS Policies for schedule_staff
CREATE POLICY "Admins can manage all staff"
  ON public.schedule_staff
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view their own record"
  ON public.schedule_staff
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view active staff"
  ON public.schedule_staff
  FOR SELECT
  USING (employment_status = 'active');

-- RLS Policies for schedule_roles
CREATE POLICY "Admins can manage roles"
  ON public.schedule_roles
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view active roles"
  ON public.schedule_roles
  FOR SELECT
  USING (is_active = true);

-- RLS Policies for schedule_staff_roles
CREATE POLICY "Admins can manage staff roles"
  ON public.schedule_staff_roles
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view staff roles"
  ON public.schedule_staff_roles
  FOR SELECT
  USING (true);

-- RLS Policies for schedule_shifts
CREATE POLICY "Admins can manage all shifts"
  ON public.schedule_shifts
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view shifts"
  ON public.schedule_shifts
  FOR SELECT
  USING (true);

CREATE POLICY "Staff can create shifts"
  ON public.schedule_shifts
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- RLS Policies for schedule_availability
CREATE POLICY "Admins can manage all availability"
  ON public.schedule_availability
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can manage their own availability"
  ON public.schedule_availability
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.schedule_staff
      WHERE schedule_staff.id = schedule_availability.staff_id
      AND schedule_staff.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can view availability"
  ON public.schedule_availability
  FOR SELECT
  USING (true);

-- RLS Policies for schedule_shift_responses
CREATE POLICY "Admins can manage all responses"
  ON public.schedule_shift_responses
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can manage their own responses"
  ON public.schedule_shift_responses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.schedule_staff
      WHERE schedule_staff.id = schedule_shift_responses.staff_id
      AND schedule_staff.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can view responses"
  ON public.schedule_shift_responses
  FOR SELECT
  USING (true);

-- RLS Policies for schedule_time_off
CREATE POLICY "Admins can manage all time off"
  ON public.schedule_time_off
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can manage their own time off requests"
  ON public.schedule_time_off
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.schedule_staff
      WHERE schedule_staff.id = schedule_time_off.staff_id
      AND schedule_staff.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can view time off"
  ON public.schedule_time_off
  FOR SELECT
  USING (true);

-- Trigger for updated_at columns
CREATE TRIGGER update_schedule_staff_updated_at
  BEFORE UPDATE ON public.schedule_staff
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedule_shifts_updated_at
  BEFORE UPDATE ON public.schedule_shifts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedule_availability_updated_at
  BEFORE UPDATE ON public.schedule_availability
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedule_time_off_updated_at
  BEFORE UPDATE ON public.schedule_time_off
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default roles
INSERT INTO public.schedule_roles (name, description, color, sort_order) VALUES
  ('Rink Guard', 'Ice rink supervision and safety', '#3B82F6', 1),
  ('Zamboni Operator', 'Ice resurfacing operations', '#10B981', 2),
  ('Front Desk', 'Customer service and reception', '#8B5CF6', 3),
  ('Ice Monitor', 'Ice condition monitoring', '#06B6D4', 4),
  ('Manager', 'Facility management and supervision', '#6B7280', 5),
  ('Maintenance', 'Facility maintenance and repairs', '#F59E0B', 6);