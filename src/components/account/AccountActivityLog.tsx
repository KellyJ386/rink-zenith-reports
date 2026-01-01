import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { UserPlus, UserMinus, Shield, Settings, FileText, Activity } from "lucide-react";

interface ActivityLog {
  id: string;
  action: string;
  user_name: string;
  target_type: string | null;
  target_name: string | null;
  created_at: string;
}

interface AccountActivityLogProps {
  facilityId: string;
  limit?: number;
}

export const AccountActivityLog = ({ facilityId, limit = 10 }: AccountActivityLogProps) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivities = async () => {
      if (!facilityId) return;

      try {
        const { data, error } = await supabase
          .from("audit_logs")
          .select("id, action, user_name, target_type, target_name, created_at")
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) throw error;
        setActivities(data || []);
      } catch (error) {
        console.error("Error loading activities:", error);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, [facilityId, limit]);

  const getActionIcon = (action: string) => {
    if (action.includes("user") && action.includes("add")) return <UserPlus className="h-4 w-4 text-green-500" />;
    if (action.includes("user") && (action.includes("remove") || action.includes("delete"))) return <UserMinus className="h-4 w-4 text-destructive" />;
    if (action.includes("role") || action.includes("permission")) return <Shield className="h-4 w-4 text-primary" />;
    if (action.includes("setting")) return <Settings className="h-4 w-4 text-muted-foreground" />;
    if (action.includes("report") || action.includes("log")) return <FileText className="h-4 w-4 text-blue-500" />;
    return <Activity className="h-4 w-4 text-muted-foreground" />;
  };

  const getActionBadge = (action: string) => {
    if (action.includes("create") || action.includes("add")) {
      return <Badge variant="default" className="bg-green-500 text-xs">Created</Badge>;
    }
    if (action.includes("update") || action.includes("change")) {
      return <Badge variant="secondary" className="text-xs">Updated</Badge>;
    }
    if (action.includes("delete") || action.includes("remove")) {
      return <Badge variant="destructive" className="text-xs">Removed</Badge>;
    }
    return <Badge variant="outline" className="text-xs">{action}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>Latest actions in your account</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">No recent activity</p>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="mt-0.5">{getActionIcon(activity.action)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{activity.user_name}</span>
                      {getActionBadge(activity.action)}
                    </div>
                    {activity.target_name && (
                      <p className="text-sm text-muted-foreground truncate">
                        {activity.target_type}: {activity.target_name}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(activity.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
