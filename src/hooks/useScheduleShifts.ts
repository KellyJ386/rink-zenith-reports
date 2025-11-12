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

      const { data, error } = await supabase
        .from('schedule_shifts')
        .insert({
          ...shiftData,
          created_by: user.id,
          status: shiftData.assigned_staff_id ? 'assigned' : 'open',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
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
      const { data, error } = await supabase
        .from('schedule_shifts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
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
