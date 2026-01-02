-- Subscription Plans reference table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  max_users INTEGER NOT NULL,
  monthly_price_cents INTEGER,
  annual_price_cents INTEGER,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Facility Subscriptions table
CREATE TABLE public.facility_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'standard',
  status TEXT NOT NULL DEFAULT 'active',
  billing_cycle TEXT DEFAULT 'monthly',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(facility_id)
);

-- Subscription Invoices table
CREATE TABLE public.subscription_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.facility_subscriptions(id),
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  description TEXT,
  stripe_invoice_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  facility_id UUID REFERENCES public.facilities(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  data JSONB,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  priority TEXT DEFAULT 'normal',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notification Preferences table
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  facility_id UUID REFERENCES public.facilities(id),
  notification_type TEXT NOT NULL,
  in_app BOOLEAN DEFAULT true,
  email BOOLEAN DEFAULT true,
  email_digest TEXT DEFAULT 'instant',
  push BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, notification_type)
);

-- Enable RLS on all tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans (publicly readable)
CREATE POLICY "Anyone can view active subscription plans"
ON public.subscription_plans FOR SELECT
USING (is_active = true);

-- RLS Policies for facility_subscriptions
CREATE POLICY "Users can view their facility subscription"
ON public.facility_subscriptions FOR SELECT
USING (
  facility_id IN (
    SELECT facility_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Account owners can update their facility subscription"
ON public.facility_subscriptions FOR UPDATE
USING (
  facility_id IN (
    SELECT f.id FROM public.facilities f
    JOIN public.profiles p ON p.facility_id = f.id
    WHERE p.user_id = auth.uid() AND f.owner_user_id = auth.uid()
  )
);

-- RLS Policies for subscription_invoices
CREATE POLICY "Users can view their facility invoices"
ON public.subscription_invoices FOR SELECT
USING (
  facility_id IN (
    SELECT facility_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- RLS Policies for notification_preferences
CREATE POLICY "Users can view their own preferences"
ON public.notification_preferences FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own preferences"
ON public.notification_preferences FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences"
ON public.notification_preferences FOR UPDATE
USING (user_id = auth.uid());

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create triggers for updated_at
CREATE TRIGGER update_facility_subscriptions_updated_at
BEFORE UPDATE ON public.facility_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed subscription plans
INSERT INTO public.subscription_plans (plan_key, name, description, max_users, monthly_price_cents, annual_price_cents, features, display_order)
VALUES 
  ('starter', 'Starter', 'Perfect for small facilities just getting started', 5, 4900, 47000, '["Up to 5 users", "Basic ice maintenance logging", "Incident reports", "Email support"]', 1),
  ('standard', 'Standard', 'Great for growing facilities with more staff', 15, 9900, 95000, '["Up to 15 users", "All Starter features", "Staff scheduling", "Daily reports", "Refrigeration logging", "Priority support"]', 2),
  ('professional', 'Professional', 'For established facilities with advanced needs', 50, 19900, 191000, '["Up to 50 users", "All Standard features", "Advanced analytics", "Custom form builder", "Ice depth analysis with AI", "API access", "Phone support"]', 3),
  ('enterprise', 'Enterprise', 'Custom solutions for multi-facility operations', 200, NULL, NULL, '["Unlimited users", "All Professional features", "Multi-facility management", "White-label options", "Dedicated account manager", "Custom integrations", "SLA guarantee"]', 4);