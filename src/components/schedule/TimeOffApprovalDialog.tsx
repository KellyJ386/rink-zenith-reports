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
import { TimeOffApprovalData } from "@/hooks/useScheduleTimeOff";

interface TimeOffApprovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (data: TimeOffApprovalData) => void;
  onDeny: (data: TimeOffApprovalData) => void;
  isSubmitting?: boolean;
}

export const TimeOffApprovalDialog = ({
  isOpen,
  onClose,
  onApprove,
  onDeny,
  isSubmitting = false,
}: TimeOffApprovalDialogProps) => {
  const [response, setResponse] = useState("");

  const handleApprove = () => {
    onApprove({ status: 'approved', manager_response: response });
    setResponse("");
    onClose();
  };

  const handleDeny = () => {
    onDeny({ status: 'denied', manager_response: response });
    setResponse("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Review Time Off Request</DialogTitle>
          <DialogDescription>
            Approve or deny this time off request with an optional message
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="response">Manager Response (Optional)</Label>
            <Textarea
              id="response"
              placeholder="Add a note for the staff member..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={4}
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
              Approve Request
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
