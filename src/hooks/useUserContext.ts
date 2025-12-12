import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserContext {
  user: any | null;
  profile: {
    id: string;
    name: string;
    facility_id: string | null;
  } | null;
  facility: {
    id: string;
    name: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
  role: "admin" | "manager" | "staff" | null;
  loading: boolean;
  error: string | null;
}

export const useUserContext = () => {
  const [context, setContext] = useState<UserContext>({
    user: null,
    profile: null,
    facility: null,
    role: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchUserContext = async () => {
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
              address,
              latitude,
              longitude
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

        const facility = profileData?.facilities as unknown as { id: string; name: string; address: string | null; latitude: number | null; longitude: number | null } | null;

        setContext({
          user,
          profile: profileData ? {
            id: profileData.id,
            name: profileData.name,
            facility_id: profileData.facility_id,
          } : null,
          facility: facility || null,
          role: (roleData?.role as "admin" | "manager" | "staff") || "staff",
          loading: false,
          error: null,
        });
      } catch (error: any) {
        console.error("User context error:", error);
        setContext(prev => ({ ...prev, loading: false, error: error.message }));
      }
    };

    fetchUserContext();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserContext();
      } else {
        setContext({
          user: null,
          profile: null,
          facility: null,
          role: null,
          loading: false,
          error: null,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return context;
};
