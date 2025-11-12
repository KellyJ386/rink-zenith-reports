import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShiftSwapApprovalData } from "@/hooks/useShiftSwaps";
import { format } from "date-fns";
import { ArrowRightLeft } from "lucide-react";

interface ShiftSwapApprovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (data: ShiftSwapApprovalData) => void;
  onDeny: (data: ShiftSwapApprovalData) => void;
  swap: any;
  isSubmitting?: boolean;
}

export const ShiftSwapApprovalDialog = ({
  isOpen,
  onClose,
  onApprove,
  onDeny,
  swap,
  isSubmitting = false,
}: ShiftSwapApprovalDialogProps) => {
  const [notes, setNotes] = useState("");

  const handleApprove = () => {
    onApprove({ status: 'approved', manager_notes: notes });
    setNotes("");
    onClose();
  };

  const handleDeny = () => {
    onDeny({ status: 'denied', manager_notes: notes });
    setNotes("");
    onClose();
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const period = hour >= 12 ? 'PM' : 'AM';
    return `${displayHour}:${minutes} ${period}`;
  };

  if (!swap) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Review Shift Swap Request</DialogTitle>
          <DialogDescription>
            Approve or deny this shift swap request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Shift Details */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm font-medium mb-2">Shift Details</div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>{format(new Date(swap.shift.date), 'EEEE, MMMM d, yyyy')}</div>
              <div>{formatTime(swap.shift.start_time)} - {formatTime(swap.shift.end_time)}</div>
              <div className="flex items-center gap-2">
                <Badge style={{ backgroundColor: swap.shift.role?.color }}>
                  {swap.shift.role?.name}
                </Badge>
                <span>•</span>
                <span>{swap.shift.area}</span>
              </div>
            </div>
          </div>

          {/* Swap Participants */}
          <div className="p-4 border rounded-lg">
            <div className="text-sm font-medium mb-3">Swap Participants</div>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-sm font-medium">{swap.requester?.full_name}</div>
                <div className="text-xs text-muted-foreground">Current Assignment</div>
              </div>
              <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
              <div className="text-center">
                <div className="text-sm font-medium">{swap.recipient?.full_name}</div>
                <div className="text-xs text-muted-foreground">Requested Swap</div>
              </div>
            </div>
          </div>

          {/* Reason */}
          {swap.reason && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-1">Reason</div>
              <div className="text-sm text-muted-foreground">{swap.reason}</div>
            </div>
          )}

          {/* Manager Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Manager Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this decision..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeny}
              disabled={isSubmitting}
            >
              Deny Request
            </Button>
            <Button
              type="button"
              onClick={handleApprove}
              disabled={isSubmitting}
            >
              Approve Swap
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
