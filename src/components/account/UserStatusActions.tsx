import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MoreHorizontal, Pencil, Shield, UserCheck, UserX, Ban, RotateCcw } from "lucide-react";

interface UserStatusActionsProps {
  user: {
    id: string;
    user_id: string;
    name: string;
    account_status: string | null;
    role?: string;
  };
  currentUserId: string;
  onEdit: () => void;
  onChangeRole: () => void;
  onStatusChanged: () => void;
}

export const UserStatusActions = ({
  user,
  currentUserId,
  onEdit,
  onChangeRole,
  onStatusChanged,
}: UserStatusActionsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: "suspend" | "activate" | "terminate" | "reactivate" | null;
  }>({ open: false, action: null });

  const isCurrentUser = user.user_id === currentUserId;
  const isActive = user.account_status === "active";
  const isSuspended = user.account_status === "suspended";
  const isTerminated = user.account_status === "terminated";

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ account_status: newStatus })
        .eq("id", user.id);

      if (error) throw error;

      const actionMap: Record<string, string> = {
        active: "activated",
        suspended: "suspended",
        terminated: "terminated",
      };

      toast({
        title: "Status Updated",
        description: `${user.name} has been ${actionMap[newStatus] || newStatus}.`,
      });

      onStatusChanged();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setConfirmDialog({ open: false, action: null });
    }
  };

  const getDialogContent = () => {
    switch (confirmDialog.action) {
      case "suspend":
        return {
          title: "Suspend User",
          description: `Are you sure you want to suspend ${user.name}? They will not be able to access the system until reactivated.`,
          action: () => handleStatusChange("suspended"),
          buttonText: "Suspend User",
          variant: "destructive" as const,
        };
      case "activate":
        return {
          title: "Activate User",
          description: `Are you sure you want to activate ${user.name}? They will regain access to the system.`,
          action: () => handleStatusChange("active"),
          buttonText: "Activate User",
          variant: "default" as const,
        };
      case "terminate":
        return {
          title: "Terminate User",
          description: `Are you sure you want to terminate ${user.name}? This will remove their access and they will no longer count toward your user limit.`,
          action: () => handleStatusChange("terminated"),
          buttonText: "Terminate User",
          variant: "destructive" as const,
        };
      case "reactivate":
        return {
          title: "Reactivate User",
          description: `Are you sure you want to reactivate ${user.name}? They will regain access and count toward your user limit.`,
          action: () => handleStatusChange("active"),
          buttonText: "Reactivate User",
          variant: "default" as const,
        };
      default:
        return null;
    }
  };

  const dialogContent = getDialogContent();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={loading}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onChangeRole} disabled={isCurrentUser}>
            <Shield className="h-4 w-4 mr-2" />
            Change Role
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {isActive && !isCurrentUser && (
            <DropdownMenuItem
              onClick={() => setConfirmDialog({ open: true, action: "suspend" })}
            >
              <Ban className="h-4 w-4 mr-2" />
              Suspend User
            </DropdownMenuItem>
          )}
          
          {isSuspended && (
            <DropdownMenuItem
              onClick={() => setConfirmDialog({ open: true, action: "activate" })}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Activate User
            </DropdownMenuItem>
          )}
          
          {isTerminated && (
            <DropdownMenuItem
              onClick={() => setConfirmDialog({ open: true, action: "reactivate" })}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reactivate User
            </DropdownMenuItem>
          )}
          
          {!isTerminated && !isCurrentUser && (
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setConfirmDialog({ open: true, action: "terminate" })}
            >
              <UserX className="h-4 w-4 mr-2" />
              Terminate User
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {dialogContent && (
        <AlertDialog
          open={confirmDialog.open}
          onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
              <AlertDialogDescription>{dialogContent.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={dialogContent.action}
                disabled={loading}
                className={dialogContent.variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
              >
                {loading ? "Processing..." : dialogContent.buttonText}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};
