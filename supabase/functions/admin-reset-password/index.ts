import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SHARED_SECRET = "one-shot-reset-9f2a";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { email, newPassword, secret } = await req.json();
    if (secret !== SHARED_SECRET) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    let userId: string | null = null;
    for (let page = 1; page <= 20 && !userId; page++) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      const found = data.users.find((u) => (u.email ?? "").toLowerCase() === email.toLowerCase());
      if (found) userId = found.id;
      if (data.users.length < 200) break;
    }
    if (!userId) return new Response(JSON.stringify({ error: "user not found" }), { status: 404, headers: corsHeaders });
    const { error: updErr } = await supabase.auth.admin.updateUserById(userId, { password: newPassword });
    if (updErr) throw updErr;
    return new Response(JSON.stringify({ ok: true, email, userId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
