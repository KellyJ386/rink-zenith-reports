-- Create table for notification recipients
CREATE TABLE public.notification_recipients (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT at_least_one_contact CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- Enable RLS
ALTER TABLE public.notification_recipients ENABLE ROW LEVEL SECURITY;

-- Admins can manage recipients
CREATE POLICY "Admins can manage recipients"
ON public.notification_recipients
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can view recipients
CREATE POLICY "Authenticated users can view recipients"
ON public.notification_recipients
FOR SELECT
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_notification_recipients_updated_at
BEFORE UPDATE ON public.notification_recipients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();