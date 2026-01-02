import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionPlan {
  id: string;
  plan_key: string;
  name: string;
  description: string | null;
  max_users: number;
  monthly_price_cents: number | null;
  annual_price_cents: number | null;
  features: string[];
  is_active: boolean;
  display_order: number;
}

interface FacilitySubscription {
  id: string;
  facility_id: string;
  plan_type: string;
  status: string;
  billing_cycle: string;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_ends_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Invoice {
  id: string;
  facility_id: string;
  subscription_id: string | null;
  amount_cents: number;
  currency: string;
  status: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  paid_at: string | null;
  description: string | null;
  created_at: string;
}

interface UseSubscriptionReturn {
  subscription: FacilitySubscription | null;
  plans: SubscriptionPlan[];
  invoices: Invoice[];
  currentPlan: SubscriptionPlan | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useSubscription = (facilityId: string | null): UseSubscriptionReturn => {
  const [subscription, setSubscription] = useState<FacilitySubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!facilityId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [plansResult, subscriptionResult, invoicesResult] = await Promise.all([
        supabase
          .from("subscription_plans")
          .select("*")
          .eq("is_active", true)
          .order("display_order"),
        supabase
          .from("facility_subscriptions")
          .select("*")
          .eq("facility_id", facilityId)
          .maybeSingle(),
        supabase
          .from("subscription_invoices")
          .select("*")
          .eq("facility_id", facilityId)
          .order("invoice_date", { ascending: false })
          .limit(10),
      ]);

      if (plansResult.error) throw plansResult.error;
      if (subscriptionResult.error) throw subscriptionResult.error;
      if (invoicesResult.error) throw invoicesResult.error;

      // Parse features from JSON and cast to proper types
      const parsedPlans: SubscriptionPlan[] = (plansResult.data || []).map((plan) => ({
        id: plan.id,
        plan_key: plan.plan_key,
        name: plan.name,
        description: plan.description,
        max_users: plan.max_users,
        monthly_price_cents: plan.monthly_price_cents,
        annual_price_cents: plan.annual_price_cents,
        features: Array.isArray(plan.features) 
          ? plan.features.filter((f): f is string => typeof f === "string")
          : [],
        is_active: plan.is_active,
        display_order: plan.display_order,
      }));

      setPlans(parsedPlans);
      setSubscription(subscriptionResult.data as FacilitySubscription | null);
      setInvoices(invoicesResult.data || []);
    } catch (err: any) {
      console.error("Error fetching subscription data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [facilityId]);

  const currentPlan = plans.find(
    (p) => p.plan_key === (subscription?.plan_type || "standard")
  ) || null;

  return {
    subscription,
    plans,
    invoices,
    currentPlan,
    loading,
    error,
    refetch: fetchData,
  };
};
