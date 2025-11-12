import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ScheduleTimeOff {
  id: string;
  staff_id: string;
  start_date: string;
  end_date: string;
  request_type: string;
  reason: string | null;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  manager_response: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimeOffFormData {
  staff_id: string;
  start_date: string;
  end_date: string;
  request_type: string;
  reason: string;
}

export interface TimeOffApprovalData {
  status: 'approved' | 'denied';
  manager_response: string;
}

export const useScheduleTimeOff = () => {
  const queryClient = useQueryClient();

  const timeOffQuery = useQuery({
    queryKey: ['schedule-time-off'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule_time_off')
        .select(`
          *,
          staff:schedule_staff(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createTimeOff = useMutation({
    mutationFn: async (data: TimeOffFormData) => {
      const { error } = await supabase
        .from('schedule_time_off')
        .insert({
          staff_id: data.staff_id,
          start_date: data.start_date,
          end_date: data.end_date,
          request_type: data.request_type,
          reason: data.reason || null,
          status: 'pending',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-time-off'] });
      toast.success('Time off request submitted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit request: ${error.message}`);
    },
  });

  const updateTimeOff = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TimeOffFormData> }) => {
      const { error } = await supabase
        .from('schedule_time_off')
        .update({
          start_date: data.start_date,
          end_date: data.end_date,
          request_type: data.request_type,
          reason: data.reason || null,
        })
        .eq('id', id)
        .eq('status', 'pending'); // Only allow updates to pending requests

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-time-off'] });
      toast.success('Request updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update request: ${error.message}`);
    },
  });

  const approveTimeOff = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TimeOffApprovalData }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('schedule_time_off')
        .update({
          status: data.status,
          manager_response: data.manager_response || null,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['schedule-time-off'] });
      toast.success(`Request ${variables.data.status}`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to process request: ${error.message}`);
    },
  });

  const deleteTimeOff = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('schedule_time_off')
        .delete()
        .eq('id', id)
        .eq('status', 'pending'); // Only allow deletion of pending requests

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-time-off'] });
      toast.success('Request deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete request: ${error.message}`);
    },
  });

  return {
    timeOff: timeOffQuery.data ?? [],
    isLoading: timeOffQuery.isLoading,
    createTimeOff,
    updateTimeOff,
    approveTimeOff,
    deleteTimeOff,
    isSubmitting: createTimeOff.isPending || updateTimeOff.isPending || approveTimeOff.isPending || deleteTimeOff.isPending,
  };
};
