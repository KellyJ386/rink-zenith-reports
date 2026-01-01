import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, UserPlus } from "lucide-react";

interface InviteUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  facilityName: string;
  currentUserCount: number;
  maxUsers: number;
  onUserAdded: () => void;
}

export const InviteUserModal = ({
  open,
  onOpenChange,
  facilityId,
  facilityName,
  currentUserCount,
  maxUsers,
  onUserAdded,
}: InviteUserModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    role: "staff" as "manager" | "staff",
    jobTitle: "",
    notes: "",
  });

  const canAddUser = currentUserCount < maxUsers;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canAddUser) {
      toast({
        title: "User Limit Reached",
        description: `Your facility has reached the maximum of ${maxUsers} users.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // For now, we'll create a placeholder profile that will be linked when the user signs up
      // In a production app, you'd send an invitation email here
      const { error } = await supabase.from("profiles").insert({
        id: crypto.randomUUID(),
        user_id: crypto.randomUUID(), // Placeholder - will be updated when user accepts invite
        name: formData.name,
        facility_id: facilityId,
        job_title: formData.jobTitle || null,
        account_status: "invited",
      });

      if (error) throw error;

      toast({
        title: "User Invited",
        description: `Invitation sent to ${formData.email}. They will receive an email to complete their registration.`,
      });

      setFormData({ email: "", name: "", role: "staff", jobTitle: "", notes: "" });
      onUserAdded();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error inviting user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to invite user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite New User
          </DialogTitle>
          <DialogDescription>
            Add a new team member to {facilityName}. They will receive an email invitation.
          </DialogDescription>
        </DialogHeader>

        {!canAddUser ? (
          <div className="py-6 text-center">
            <p className="text-destructive font-medium">User limit reached</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your facility has {currentUserCount} of {maxUsers} users. Contact support to upgrade your plan.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="employee@example.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="John Smith"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "manager" | "staff") => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  placeholder="Ice Technician"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
