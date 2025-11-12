import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ScheduleAvailability {
  id: string;
  staff_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  notes: string | null;
}

export interface AvailabilityFormData {
  staff_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  notes: string;
}

export const useScheduleAvailability = (staffId?: string) => {
  const queryClient = useQueryClient();

  const availabilityQuery = useQuery({
    queryKey: ['schedule-availability', staffId],
    queryFn: async () => {
      let query = supabase
        .from('schedule_availability')
        .select('*')
        .order('day_of_week')
        .order('start_time');

      if (staffId) {
        query = query.eq('staff_id', staffId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ScheduleAvailability[];
    },
  });

  const createAvailability = useMutation({
    mutationFn: async (data: AvailabilityFormData) => {
      const { error } = await supabase
        .from('schedule_availability')
        .insert({
          staff_id: data.staff_id,
          day_of_week: data.day_of_week,
          start_time: data.start_time,
          end_time: data.end_time,
          is_available: data.is_available,
          notes: data.notes || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-availability'] });
      toast.success('Availability added');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add availability: ${error.message}`);
    },
  });

  const updateAvailability = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AvailabilityFormData> }) => {
      const { error } = await supabase
        .from('schedule_availability')
        .update({
          start_time: data.start_time,
          end_time: data.end_time,
          is_available: data.is_available,
          notes: data.notes || null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-availability'] });
      toast.success('Availability updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update availability: ${error.message}`);
    },
  });

  const deleteAvailability = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('schedule_availability')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-availability'] });
      toast.success('Availability deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete availability: ${error.message}`);
    },
  });

  return {
    availability: availabilityQuery.data ?? [],
    isLoading: availabilityQuery.isLoading,
    createAvailability,
    updateAvailability,
    deleteAvailability,
    isSubmitting: createAvailability.isPending || updateAvailability.isPending || deleteAvailability.isPending,
  };
};
