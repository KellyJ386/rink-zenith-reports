-- Add center ice logo URL to rinks table
ALTER TABLE public.rinks 
ADD COLUMN center_ice_logo_url TEXT DEFAULT NULL;

-- Create storage bucket for rink logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('rink-logos', 'rink-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for rink logos
CREATE POLICY "Anyone can view rink logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'rink-logos');

CREATE POLICY "Admins and managers can upload rink logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'rink-logos' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
);

CREATE POLICY "Admins and managers can update rink logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'rink-logos' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
);

CREATE POLICY "Admins and managers can delete rink logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'rink-logos' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
);