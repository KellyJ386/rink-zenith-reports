import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotificationPayload {
  user_id?: string;
  facility_id?: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  data?: Record<string, unknown>;
  priority?: "low" | "normal" | "high" | "urgent";
  broadcast_to_facility?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authSupabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Use service role key for database operations
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: NotificationPayload = await req.json();
    console.log("Creating notification:", payload);

    const { type, title, message, link, data, priority = "normal", user_id, facility_id, broadcast_to_facility } = payload;

    if (!type || !title || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: type, title, message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const notifications = [];

    if (broadcast_to_facility && facility_id) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("facility_id", facility_id);

      if (profilesError) throw profilesError;

      for (const profile of profiles || []) {
        notifications.push({ user_id: profile.user_id, facility_id, type, title, message, link, data, priority });
      }
    } else if (user_id) {
      notifications.push({ user_id, facility_id, type, title, message, link, data, priority });
    } else {
      return new Response(
        JSON.stringify({ error: "Either user_id or broadcast_to_facility with facility_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: inserted, error } = await supabase.from("notifications").insert(notifications).select();
    if (error) throw error;

    console.log(`Created ${inserted?.length || 0} notifications`);
    return new Response(JSON.stringify({ success: true, count: inserted?.length || 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating notification:", error);
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
