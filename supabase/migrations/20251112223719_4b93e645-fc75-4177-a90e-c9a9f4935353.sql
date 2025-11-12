-- Create shift swap requests table
CREATE TABLE public.schedule_shift_swaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES public.schedule_shifts(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES public.schedule_staff(id) ON DELETE CASCADE,
  requested_to UUID NOT NULL REFERENCES public.schedule_staff(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'cancelled')),
  reason TEXT,
  manager_notes TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX idx_shift_swaps_shift_id ON public.schedule_shift_swaps(shift_id);
CREATE INDEX idx_shift_swaps_status ON public.schedule_shift_swaps(status);
CREATE INDEX idx_shift_swaps_requested_by ON public.schedule_shift_swaps(requested_by);
CREATE INDEX idx_shift_swaps_requested_to ON public.schedule_shift_swaps(requested_to);

-- Enable RLS
ALTER TABLE public.schedule_shift_swaps ENABLE ROW LEVEL SECURITY;

-- Policies for shift swaps
CREATE POLICY "Admins can manage all shift swaps"
  ON public.schedule_shift_swaps
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view shift swaps"
  ON public.schedule_shift_swaps
  FOR SELECT
  USING (true);

CREATE POLICY "Staff can create swap requests for their own shifts"
  ON public.schedule_shift_swaps
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.schedule_staff
      WHERE id = requested_by
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can cancel their own pending swap requests"
  ON public.schedule_shift_swaps
  FOR UPDATE
  USING (
    status = 'pending' AND
    EXISTS (
      SELECT 1 FROM public.schedule_staff
      WHERE id = requested_by
        AND user_id = auth.uid()
    )
  )
  WITH CHECK (status = 'cancelled');

-- Trigger for updated_at
CREATE TRIGGER update_shift_swaps_updated_at
  BEFORE UPDATE ON public.schedule_shift_swaps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();