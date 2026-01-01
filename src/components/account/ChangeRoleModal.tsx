import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Shield, User, Users, Crown } from "lucide-react";

const ROLES = [
  { value: "staff", label: "Staff", description: "Basic access to assigned modules", icon: User },
  { value: "manager", label: "Manager", description: "Can manage team and view reports", icon: Users },
  { value: "account_owner", label: "Account Owner", description: "Full access to account management", icon: Crown },
];

interface ChangeRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  currentRole: string;
  onSaved?: () => void;
}

export const ChangeRoleModal = ({
  open,
  onOpenChange,
  userId,
  userName,
  currentRole,
  onSaved,
}: ChangeRoleModalProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState(currentRole);

  const handleSave = async () => {
    if (selectedRole === currentRole) {
      onOpenChange(false);
      return;
    }

    setSaving(true);
    try {
      // Update or insert the role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (existingRole) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role: selectedRole as "admin" | "manager" | "staff" | "account_owner" })
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({
            user_id: userId,
            role: selectedRole as "admin" | "manager" | "staff" | "account_owner",
          });

        if (error) throw error;
      }

      toast({ title: "Success", description: `${userName}'s role updated to ${selectedRole}` });
      onSaved?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update role",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Change Role
          </DialogTitle>
          <DialogDescription>
            Update role for {userName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map(role => {
                  const Icon = role.icon;
                  return (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{role.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg p-4 bg-muted/50">
            {ROLES.map(role => {
              if (role.value !== selectedRole) return null;
              const Icon = role.icon;
              return (
                <div key={role.value} className="flex items-start gap-3">
                  <Icon className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">{role.label}</p>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || selectedRole === currentRole}>
            {saving ? "Saving..." : "Update Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
