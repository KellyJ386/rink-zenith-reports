-- Add new fields to profiles table for user management
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS email_notifications_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS sms_notifications_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS force_email_change boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.force_email_change IS 'When true, user will be prompted to change email on first login';