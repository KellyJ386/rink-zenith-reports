-- Fix function search_path for check_template_limit
CREATE OR REPLACE FUNCTION check_template_limit()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.custom_ice_templates 
      WHERE facility_id = NEW.facility_id AND rink_id = NEW.rink_id) >= 8 THEN
    RAISE EXCEPTION 'Maximum of 8 templates per facility/rink combination allowed';
  END IF;
  RETURN NEW;
END;
$$;