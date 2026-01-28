-- Fix schedule_staff RLS policy to restrict access to facility-scoped users only
-- This prevents PII exposure (email, phone) across facilities

-- First, create a security definer function to get user's facility safely
CREATE OR REPLACE FUNCTION public.get_user_facility_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT facility_id
  FROM public.profiles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view active staff" ON public.schedule_staff;

-- Create a new facility-scoped policy for viewing staff
-- Users can only see staff members who share their facility through the profiles table
CREATE POLICY "Users can view staff at their facility"
  ON public.schedule_staff FOR SELECT
  USING (
    -- User can see their own record
    user_id = auth.uid()
    OR
    -- User can see staff that are linked to users in their facility
    user_id IN (
      SELECT p2.user_id 
      FROM public.profiles p1
      JOIN public.profiles p2 ON p1.facility_id = p2.facility_id
      WHERE p1.user_id = auth.uid()
        AND p1.facility_id IS NOT NULL
    )
  );