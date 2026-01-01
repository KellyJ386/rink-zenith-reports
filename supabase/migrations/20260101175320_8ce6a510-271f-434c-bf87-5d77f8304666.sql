-- Add account owner columns to facilities table
ALTER TABLE public.facilities 
ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 200,
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'standard';

-- Add account_owner to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'account_owner';

-- Update has_role function to support the new role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is account owner of a facility
CREATE OR REPLACE FUNCTION public.is_facility_owner(_user_id uuid, _facility_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.facilities
    WHERE id = _facility_id
      AND owner_user_id = _user_id
  )
$$;

-- Create trigger function to enforce user limits per facility
CREATE OR REPLACE FUNCTION public.check_facility_user_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Count existing users in the facility
  SELECT COUNT(*) INTO current_count
  FROM public.profiles
  WHERE facility_id = NEW.facility_id;
  
  -- Get max users allowed for the facility
  SELECT COALESCE(max_users, 200) INTO max_allowed
  FROM public.facilities
  WHERE id = NEW.facility_id;
  
  -- Check if adding this user would exceed the limit
  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'Facility has reached maximum user limit of %', max_allowed;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on profiles table to enforce limit on INSERT
DROP TRIGGER IF EXISTS enforce_facility_user_limit ON public.profiles;
CREATE TRIGGER enforce_facility_user_limit
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_facility_user_limit();

-- Add RLS policy for account owners to manage their facility's profiles
CREATE POLICY "Account owners can manage facility profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (
  public.is_facility_owner(auth.uid(), facility_id)
  OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  public.is_facility_owner(auth.uid(), facility_id)
  OR public.has_role(auth.uid(), 'admin')
);

-- Add RLS policy for account owners to view their facility
CREATE POLICY "Account owners can view their facility"
ON public.facilities
FOR SELECT
TO authenticated
USING (
  owner_user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
);

-- Add RLS policy for account owners to update their facility settings
CREATE POLICY "Account owners can update their facility"
ON public.facilities
FOR UPDATE
TO authenticated
USING (
  owner_user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  owner_user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
);