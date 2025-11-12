import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export const EmailChangePrompt = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkForceEmailChange();
  }, []);

  const checkForceEmailChange = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("force_email_change")
      .eq("user_id", user.id)
      .single();

    if (profile?.force_email_change) {
      setOpen(true);
    }
  };

  const handleEmailChange = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update email in auth
      const { error: authError } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (authError) throw authError;

      // Clear the force_email_change flag
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ force_email_change: false })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      toast({
        title: "Success",
        description: "Email updated successfully. Please check your new email for confirmation.",
      });
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Your Email</DialogTitle>
          <DialogDescription>
            Please update your email address to continue using the system.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-email">New Email Address</Label>
            <Input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter your new email"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleEmailChange} disabled={loading || !newEmail}>
            {loading ? "Updating..." : "Update Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
