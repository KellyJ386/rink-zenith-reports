import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScheduleShift, ShiftFormData } from "@/types/schedule";
import { startOfWeek, endOfWeek, format } from "date-fns";

export const useScheduleShifts = (weekStart: Date) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const weekStartStr = format(startOfWeek(weekStart, { weekStartsOn: 0 }), 'yyyy-MM-dd');
  const weekEndStr = format(endOfWeek(weekStart, { weekStartsOn: 0 }), 'yyyy-MM-dd');

  // Fetch shifts for the week
  const { data: shifts = [], isLoading, error } = useQuery({
    queryKey: ['schedule-shifts', weekStartStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule_shifts')
        .select(`
          *,
          role:schedule_roles(*),
          assigned_staff:schedule_staff(*)
        `)
        .gte('date', weekStartStr)
        .lte('date', weekEndStr)
        .order('date')
        .order('start_time');

      if (error) throw error;
      return data as ScheduleShift[];
    },
  });

  // Create shift mutation
  const createShift = useMutation({
    mutationFn: async (shiftData: ShiftFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: newShift, error } = await supabase
        .from('schedule_shifts')
        .insert({
          ...shiftData,
          created_by: user.id,
          status: shiftData.assigned_staff_id ? 'assigned' : 'open',
        })
        .select(`
          *,
          role:schedule_roles(name),
          assigned_staff:schedule_staff(email, full_name)
        `)
        .single();

      if (error) throw error;

      // Send notification if staff is assigned
      if (shiftData.assigned_staff_id && newShift.assigned_staff) {
        try {
          await supabase.functions.invoke('send-shift-notification', {
            body: {
              type: 'assignment',
              staffEmail: newShift.assigned_staff.email,
              staffName: newShift.assigned_staff.full_name,
              shiftDetails: {
                date: newShift.date,
                startTime: newShift.start_time,
                endTime: newShift.end_time,
                role: newShift.role?.name || 'Unknown',
                area: newShift.area,
              },
            },
          });
        } catch (emailError) {
          console.error('Failed to send notification:', emailError);
        }
      }

      return newShift;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-shifts'] });
      toast({
        title: "Shift created",
        description: "The shift has been successfully created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating shift",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update shift mutation
  const updateShift = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ShiftFormData> }) => {
      // Get original shift to check if assignment changed
      const { data: originalShift } = await supabase
        .from('schedule_shifts')
        .select('assigned_staff_id')
        .eq('id', id)
        .single();

      const { data: updatedShift, error } = await supabase
        .from('schedule_shifts')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          role:schedule_roles(name),
          assigned_staff:schedule_staff(email, full_name)
        `)
        .single();

      if (error) throw error;

      // Send notification if assignment changed
      const assignmentChanged = originalShift?.assigned_staff_id !== updates.assigned_staff_id;
      if (assignmentChanged && updates.assigned_staff_id && updatedShift.assigned_staff) {
        try {
          await supabase.functions.invoke('send-shift-notification', {
            body: {
              type: 'assignment',
              staffEmail: updatedShift.assigned_staff.email,
              staffName: updatedShift.assigned_staff.full_name,
              shiftDetails: {
                date: updatedShift.date,
                startTime: updatedShift.start_time,
                endTime: updatedShift.end_time,
                role: updatedShift.role?.name || 'Unknown',
                area: updatedShift.area,
              },
            },
          });
        } catch (emailError) {
          console.error('Failed to send notification:', emailError);
        }
      }

      return updatedShift;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-shifts'] });
      toast({
        title: "Shift updated",
        description: "The shift has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating shift",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete shift mutation
  const deleteShift = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('schedule_shifts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-shifts'] });
      toast({
        title: "Shift deleted",
        description: "The shift has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting shift",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    shifts,
    isLoading,
    error,
    createShift,
    updateShift,
    deleteShift,
  };
};
