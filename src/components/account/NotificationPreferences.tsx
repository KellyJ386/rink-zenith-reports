import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Bell, Mail, MessageSquare, Save } from "lucide-react";

interface NotificationPreference {
  notification_type: string;
  in_app: boolean;
  email: boolean;
  email_digest: string;
  push: boolean;
}

const NOTIFICATION_TYPES = [
  { key: "incident", label: "Incident Reports", description: "New incidents and follow-ups" },
  { key: "shift", label: "Shift Assignments", description: "When you're assigned to a shift" },
  { key: "time_off", label: "Time Off Requests", description: "Time off request updates" },
  { key: "swap", label: "Shift Swaps", description: "Swap requests and approvals" },
  { key: "ice_depth", label: "Ice Depth Alerts", description: "Ice depth threshold warnings" },
  { key: "billing", label: "Billing & Subscription", description: "Payment and subscription updates" },
  { key: "account", label: "Account Activity", description: "User joins, role changes, etc." },
  { key: "system", label: "System Announcements", description: "Important system updates" },
];

interface NotificationPreferencesProps {
  userId: string;
}

export const NotificationPreferences = ({ userId }: NotificationPreferencesProps) => {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<Record<string, NotificationPreference>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, [userId]);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;

      const prefsMap: Record<string, NotificationPreference> = {};

      // Initialize with defaults
      NOTIFICATION_TYPES.forEach((type) => {
        prefsMap[type.key] = {
          notification_type: type.key,
          in_app: true,
          email: true,
          email_digest: "instant",
          push: false,
        };
      });

      // Override with saved preferences
      data?.forEach((pref) => {
        prefsMap[pref.notification_type] = {
          notification_type: pref.notification_type,
          in_app: pref.in_app,
          email: pref.email,
          email_digest: pref.email_digest,
          push: pref.push,
        };
      });

      setPreferences(prefsMap);
    } catch (err) {
      console.error("Error fetching preferences:", err);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = (
    type: string,
    field: keyof NotificationPreference,
    value: boolean | string
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [type]: { ...prev[type], [field]: value },
    }));
    setHasChanges(true);
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const updates = Object.values(preferences).map((pref) => ({
        user_id: userId,
        notification_type: pref.notification_type,
        in_app: pref.in_app,
        email: pref.email,
        email_digest: pref.email_digest,
        push: pref.push,
      }));

      const { error } = await supabase
        .from("notification_preferences")
        .upsert(updates, { onConflict: "user_id,notification_type" });

      if (error) throw error;

      toast({
        title: "Preferences Saved",
        description: "Your notification preferences have been updated.",
      });
      setHasChanges(false);
    } catch (err: any) {
      console.error("Error saving preferences:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to save preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose how you want to be notified about different activities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
          <div>Notification Type</div>
          <div className="text-center">In-App</div>
          <div className="text-center">Email</div>
          <div className="text-center">Digest</div>
        </div>

        {NOTIFICATION_TYPES.map((type) => {
          const pref = preferences[type.key];
          return (
            <div key={type.key} className="grid grid-cols-4 gap-4 items-center py-2 border-b last:border-0">
              <div>
                <Label className="font-medium">{type.label}</Label>
                <p className="text-xs text-muted-foreground">{type.description}</p>
              </div>
              <div className="flex justify-center">
                <Switch
                  checked={pref?.in_app ?? true}
                  onCheckedChange={(checked) => updatePreference(type.key, "in_app", checked)}
                />
              </div>
              <div className="flex justify-center">
                <Switch
                  checked={pref?.email ?? true}
                  onCheckedChange={(checked) => updatePreference(type.key, "email", checked)}
                />
              </div>
              <div className="flex justify-center">
                <Select
                  value={pref?.email_digest ?? "instant"}
                  onValueChange={(value) => updatePreference(type.key, "email_digest", value)}
                  disabled={!pref?.email}
                >
                  <SelectTrigger className="w-24 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instant">Instant</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="off">Off</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        })}

        <div className="flex justify-end pt-4">
          <Button onClick={savePreferences} disabled={saving || !hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
