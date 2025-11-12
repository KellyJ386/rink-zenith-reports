import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { useScheduleRoles } from "@/hooks/useScheduleRoles";
import { useScheduleStaff } from "@/hooks/useScheduleStaff";
import { ShiftFormData, FACILITY_AREAS, TIME_SLOTS } from "@/types/schedule";
import { z } from "zod";

const shiftSchema = z.object({
  date: z.string().min(1, "Date is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  role_id: z.string().min(1, "Role is required"),
  area: z.string().min(1, "Area is required"),
  assigned_staff_id: z.string().nullable(),
  notes: z.string().max(500, "Notes must be less than 500 characters"),
}).refine((data) => {
  const start = parseInt(data.start_time.split(':')[0]);
  const end = parseInt(data.end_time.split(':')[0]);
  // Handle overnight shifts
  if (end < start) {
    return end + 24 > start;
  }
  return end > start;
}, {
  message: "End time must be after start time",
  path: ["end_time"],
}) as z.ZodType<ShiftFormData>;

interface ShiftModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ShiftFormData) => void;
  initialData?: Partial<ShiftFormData>;
  isSubmitting?: boolean;
}

export const ShiftModal = ({ open, onOpenChange, onSubmit, initialData, isSubmitting }: ShiftModalProps) => {
  const { data: roles = [] } = useScheduleRoles();
  const { data: staff = [] } = useScheduleStaff();

  const [formData, setFormData] = useState<ShiftFormData>({
    date: initialData?.date ?? new Date().toISOString().split('T')[0],
    start_time: initialData?.start_time ?? '09:00',
    end_time: initialData?.end_time ?? '17:00',
    role_id: initialData?.role_id ?? '',
    area: initialData?.area ?? '',
    assigned_staff_id: initialData?.assigned_staff_id ?? null,
    notes: initialData?.notes ?? '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        date: initialData.date ?? new Date().toISOString().split('T')[0],
        start_time: initialData.start_time ?? '09:00',
        end_time: initialData.end_time ?? '17:00',
        role_id: initialData.role_id ?? '',
        area: initialData.area ?? '',
        assigned_staff_id: initialData.assigned_staff_id ?? null,
        notes: initialData.notes ?? '',
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validated = shiftSchema.parse(formData);
      onSubmit(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Shift' : 'Create New Shift'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Update shift details below' : 'Fill in the details to create a new shift'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className={errors.date ? 'border-destructive' : ''}
              />
              {errors.date && (
                <p className="text-sm text-destructive">{errors.date}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Area *</Label>
              <Select
                value={formData.area}
                onValueChange={(value) => setFormData({ ...formData, area: value })}
              >
                <SelectTrigger className={errors.area ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  {FACILITY_AREAS.map((area) => (
                    <SelectItem key={area} value={area}>{area}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.area && (
                <p className="text-sm text-destructive">{errors.area}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time *</Label>
              <Select
                value={formData.start_time}
                onValueChange={(value) => setFormData({ ...formData, start_time: value })}
              >
                <SelectTrigger className={errors.start_time ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select start time" />
                </SelectTrigger>
                <SelectContent className="bg-background max-h-[300px]">
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot.value} value={slot.value}>
                      {slot.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.start_time && (
                <p className="text-sm text-destructive">{errors.start_time}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">End Time *</Label>
              <Select
                value={formData.end_time}
                onValueChange={(value) => setFormData({ ...formData, end_time: value })}
              >
                <SelectTrigger className={errors.end_time ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select end time" />
                </SelectTrigger>
                <SelectContent className="bg-background max-h-[300px]">
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot.value} value={slot.value}>
                      {slot.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.end_time && (
                <p className="text-sm text-destructive">{errors.end_time}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role_id">Role *</Label>
            <Select
              value={formData.role_id}
              onValueChange={(value) => setFormData({ ...formData, role_id: value })}
            >
              <SelectTrigger className={errors.role_id ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: role.color }}
                      />
                      {role.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role_id && (
              <p className="text-sm text-destructive">{errors.role_id}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_staff_id">Assign Staff (Optional)</Label>
            <Select
              value={formData.assigned_staff_id || 'unassigned'}
              onValueChange={(value) => 
                setFormData({ 
                  ...formData, 
                  assigned_staff_id: value === 'unassigned' ? null : value 
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Leave open or assign staff" />
              </SelectTrigger>
              <SelectContent className="bg-background max-h-[300px]">
                <SelectItem value="unassigned">
                  <span className="text-muted-foreground">Leave Open</span>
                </SelectItem>
                {staff.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any additional notes or instructions..."
              rows={3}
              maxLength={500}
              className={errors.notes ? 'border-destructive' : ''}
            />
            {errors.notes && (
              <p className="text-sm text-destructive">{errors.notes}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.notes.length}/500 characters
            </p>
          </div>

          {Object.keys(errors).length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please correct the errors above before submitting.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {initialData ? 'Update Shift' : 'Create Shift'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
