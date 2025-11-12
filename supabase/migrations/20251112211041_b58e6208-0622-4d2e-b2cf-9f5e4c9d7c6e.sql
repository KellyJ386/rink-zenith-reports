-- Fix function search path
DROP FUNCTION IF EXISTS generate_incident_number();

CREATE OR REPLACE FUNCTION generate_incident_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN 'IR-' || CAST(EXTRACT(EPOCH FROM NOW()) * 1000 AS BIGINT);
END;
$$;