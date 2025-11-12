import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ShiftSwap {
  id: string;
  shift_id: string;
  requested_by: string;
  requested_to: string;
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  reason: string | null;
  manager_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShiftSwapFormData {
  shift_id: string;
  requested_by: string;
  requested_to: string;
  reason: string;
}

export interface ShiftSwapApprovalData {
  status: 'approved' | 'denied';
  manager_notes: string;
}

export const useShiftSwaps = () => {
  const queryClient = useQueryClient();

  const swapsQuery = useQuery({
    queryKey: ['shift-swaps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule_shift_swaps')
        .select(`
          *,
          shift:schedule_shifts(
            *,
            role:schedule_roles(name, color)
          ),
          requester:schedule_staff!schedule_shift_swaps_requested_by_fkey(full_name, email),
          recipient:schedule_staff!schedule_shift_swaps_requested_to_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createSwapRequest = useMutation({
    mutationFn: async (data: ShiftSwapFormData) => {
      const { error } = await supabase
        .from('schedule_shift_swaps')
        .insert({
          shift_id: data.shift_id,
          requested_by: data.requested_by,
          requested_to: data.requested_to,
          reason: data.reason || null,
          status: 'pending',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-swaps'] });
      toast.success('Shift swap request submitted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create swap request: ${error.message}`);
    },
  });

  const approveSwapRequest = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ShiftSwapApprovalData }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('schedule_shift_swaps')
        .update({
          status: data.status,
          manager_notes: data.manager_notes || null,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      // If approved, update the shift assignment
      if (data.status === 'approved') {
        const { data: swapData } = await supabase
          .from('schedule_shift_swaps')
          .select('shift_id, requested_to')
          .eq('id', id)
          .single();

        if (swapData) {
          const { error: shiftError } = await supabase
            .from('schedule_shifts')
            .update({
              assigned_staff_id: swapData.requested_to,
              status: 'assigned',
            })
            .eq('id', swapData.shift_id);

          if (shiftError) throw shiftError;
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shift-swaps'] });
      queryClient.invalidateQueries({ queryKey: ['schedule-shifts'] });
      toast.success(`Swap request ${variables.data.status}`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to process swap request: ${error.message}`);
    },
  });

  const cancelSwapRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('schedule_shift_swaps')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .eq('status', 'pending');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-swaps'] });
      toast.success('Swap request cancelled');
    },
    onError: (error: Error) => {
      toast.error(`Failed to cancel swap request: ${error.message}`);
    },
  });

  return {
    swaps: swapsQuery.data ?? [],
    isLoading: swapsQuery.isLoading,
    createSwapRequest,
    approveSwapRequest,
    cancelSwapRequest,
    isSubmitting: createSwapRequest.isPending || approveSwapRequest.isPending || cancelSwapRequest.isPending,
  };
};
