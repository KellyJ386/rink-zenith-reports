import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ShiftSwapFormData } from "@/hooks/useShiftSwaps";
import { ScheduleShift } from "@/types/schedule";
import { useScheduleStaff } from "@/hooks/useScheduleStaff";
import { format } from "date-fns";

const swapSchema = z.object({
  shift_id: z.string().uuid(),
  requested_by: z.string().uuid(),
  requested_to: z.string().uuid(),
  reason: z.string(),
}) as z.ZodType<ShiftSwapFormData>;

interface ShiftSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ShiftSwapFormData) => void;
  shift: ScheduleShift | null;
  currentStaffId: string;
  isSubmitting?: boolean;
}

export const ShiftSwapModal = ({
  isOpen,
  onClose,
  onSubmit,
  shift,
  currentStaffId,
  isSubmitting = false,
}: ShiftSwapModalProps) => {
  const { data: staff } = useScheduleStaff();

  const form = useForm<ShiftSwapFormData>({
    resolver: zodResolver(swapSchema),
    defaultValues: {
      shift_id: shift?.id ?? "",
      requested_by: currentStaffId,
      requested_to: "",
      reason: "",
    },
  });

  const handleSubmit = (data: ShiftSwapFormData) => {
    onSubmit(data);
    form.reset();
    onClose();
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const period = hour >= 12 ? 'PM' : 'AM';
    return `${displayHour}:${minutes} ${period}`;
  };

  // Filter out the current staff member from recipient options
  const availableStaff = staff?.filter(s => s.id !== currentStaffId) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Shift Swap</DialogTitle>
          <DialogDescription>
            Request to swap this shift with another staff member
          </DialogDescription>
        </DialogHeader>

        {shift && (
          <div className="p-4 bg-muted rounded-lg mb-4">
            <div className="text-sm font-medium mb-1">Shift Details</div>
            <div className="text-sm text-muted-foreground">
              <div>{format(new Date(shift.date), 'EEEE, MMMM d, yyyy')}</div>
              <div>{formatTime(shift.start_time)} - {formatTime(shift.end_time)}</div>
              <div>{shift.role?.name} • {shift.area}</div>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="requested_to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Swap With Staff Member</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableStaff.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No other staff available
                        </SelectItem>
                      ) : (
                        availableStaff.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.full_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain why you need to swap this shift..."
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || availableStaff.length === 0}>
                Submit Request
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
