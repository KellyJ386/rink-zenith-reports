
-- 1. facilities: remove overly-permissive SELECT
DROP POLICY IF EXISTS "Authenticated users can view facilities" ON public.facilities;

CREATE POLICY "Members can view their facility"
  ON public.facilities FOR SELECT
  TO authenticated
  USING (
    id = public.get_user_facility_id(auth.uid())
    OR owner_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- 2. schedule_shifts: restrict SELECT to same-facility members (facility inferred from creator)
DROP POLICY IF EXISTS "Authenticated users can view shifts" ON public.schedule_shifts;

CREATE POLICY "Facility members can view shifts"
  ON public.schedule_shifts FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM public.profiles p_creator
      JOIN public.profiles p_viewer ON p_viewer.facility_id = p_creator.facility_id
      WHERE p_creator.user_id = schedule_shifts.created_by
        AND p_viewer.user_id = auth.uid()
        AND p_viewer.facility_id IS NOT NULL
    )
  );

-- 3. notifications: remove USING(true)/WITH CHECK(true) INSERT policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Users can insert their own notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 4. pending_invitations table
CREATE TABLE IF NOT EXISTS public.pending_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  name text NOT NULL,
  job_title text,
  role text NOT NULL DEFAULT 'staff',
  notes text,
  invited_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (facility_id, email)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pending_invitations TO authenticated;
GRANT ALL ON public.pending_invitations TO service_role;

ALTER TABLE public.pending_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Facility owners and admins can manage invitations"
  ON public.pending_invitations FOR ALL
  TO authenticated
  USING (
    public.is_facility_owner(auth.uid(), facility_id)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    public.is_facility_owner(auth.uid(), facility_id)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE TRIGGER update_pending_invitations_updated_at
  BEFORE UPDATE ON public.pending_invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
