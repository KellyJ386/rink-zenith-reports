import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AccountContext {
  user: any | null;
  profile: {
    id: string;
    name: string;
    facility_id: string | null;
  } | null;
  facility: {
    id: string;
    name: string;
    owner_user_id: string | null;
    max_users: number;
    plan_type: string | null;
    address: string | null;
  } | null;
  role: "admin" | "account_owner" | "manager" | "staff" | null;
  isAccountOwner: boolean;
  isAdmin: boolean;
  userCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useAccountContext = () => {
  const [context, setContext] = useState<AccountContext>({
    user: null,
    profile: null,
    facility: null,
    role: null,
    isAccountOwner: false,
    isAdmin: false,
    userCount: 0,
    loading: true,
    error: null,
    refetch: async () => {},
  });

  const fetchAccountContext = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setContext(prev => ({ ...prev, loading: false, error: "Not authenticated" }));
        return;
      }

      // Fetch profile with facility info
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(`
          id,
          name,
          facility_id,
          facilities:facility_id (
            id,
            name,
            owner_user_id,
            max_users,
            plan_type,
            address
          )
        `)
        .eq("user_id", user.id)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
      }

      // Fetch user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      const facility = profileData?.facilities as unknown as {
        id: string;
        name: string;
        owner_user_id: string | null;
        max_users: number;
        plan_type: string | null;
        address: string | null;
      } | null;

      // Get user count for the facility
      let userCount = 0;
      if (profileData?.facility_id) {
        const { count } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("facility_id", profileData.facility_id);
        userCount = count || 0;
      }

      const role = (roleData?.role as "admin" | "account_owner" | "manager" | "staff") || "staff";
      const isAccountOwner = role === "account_owner" || facility?.owner_user_id === user.id;
      const isAdmin = role === "admin";

      setContext({
        user,
        profile: profileData ? {
          id: profileData.id,
          name: profileData.name,
          facility_id: profileData.facility_id,
        } : null,
        facility: facility || null,
        role,
        isAccountOwner,
        isAdmin,
        userCount,
        loading: false,
        error: null,
        refetch: fetchAccountContext,
      });
    } catch (error: any) {
      console.error("Account context error:", error);
      setContext(prev => ({ ...prev, loading: false, error: error.message }));
    }
  };

  useEffect(() => {
    fetchAccountContext();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchAccountContext();
      } else {
        setContext({
          user: null,
          profile: null,
          facility: null,
          role: null,
          isAccountOwner: false,
          isAdmin: false,
          userCount: 0,
          loading: false,
          error: null,
          refetch: fetchAccountContext,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return context;
};
