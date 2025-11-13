-- Add manager role to app_role enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role' AND typcategory = 'E') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
  
  -- Add manager to the enum if it doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'public.app_role'::regtype 
    AND enumlabel = 'manager'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'manager';
  END IF;
END $$;

-- Update custom_templates RLS policies for admin and manager access
DROP POLICY IF EXISTS "Admins can manage all templates" ON public.custom_templates;
DROP POLICY IF EXISTS "Users can create their own templates" ON public.custom_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON public.custom_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON public.custom_templates;
DROP POLICY IF EXISTS "Users can view their own templates" ON public.custom_templates;

-- Admins and managers can manage all templates
CREATE POLICY "Admins and managers can manage all templates"
ON public.custom_templates
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- Regular users can view templates from their facility
CREATE POLICY "Users can view templates"
ON public.custom_templates
FOR SELECT
USING (true);

-- Add facility_id to custom_templates if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'custom_templates' 
    AND column_name = 'facility_id'
  ) THEN
    ALTER TABLE public.custom_templates 
    ADD COLUMN facility_id uuid REFERENCES public.facilities(id);
  END IF;
END $$;