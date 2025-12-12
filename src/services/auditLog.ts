import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface AuditLogParams {
  action: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  changes?: Record<string, unknown>;
}

export const logAuditEvent = async (params: AuditLogParams): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn("Cannot log audit event: No authenticated user");
      return;
    }

    // Get user name from profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("user_id", user.id)
      .single();

    const { error } = await supabase.from("audit_logs").insert([{
      user_id: user.id,
      user_name: profile?.name || user.email || "Unknown",
      action: params.action,
      target_type: params.targetType || null,
      target_id: params.targetId || null,
      target_name: params.targetName || null,
      changes: (params.changes as Json) || null,
      ip_address: null,
    }]);

    if (error) {
      console.error("Failed to log audit event:", error);
    }
  } catch (error) {
    console.error("Error logging audit event:", error);
  }
};

export const getRecentAuditLogs = async (limit: number = 10) => {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch audit logs:", error);
    return [];
  }

  return data || [];
};
