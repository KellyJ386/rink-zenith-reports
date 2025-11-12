import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StaffFormData {
  full_name: string;
  email: string;
  phone_number?: string;
  hire_date: string;
  employment_status: "active" | "inactive" | "on_leave";
  target_hours_per_week: number;
  notes?: string;
}

export const useStaffMutations = () => {
  const queryClient = useQueryClient();

  const createStaff = useMutation({
    mutationFn: async (data: StaffFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: result, error } = await supabase
        .from("schedule_staff")
        .insert({
          ...data,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-staff"] });
      toast.success("Staff member added successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to add staff member: ${error.message}`);
    },
  });

  const updateStaff = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<StaffFormData> }) => {
      const { data: result, error } = await supabase
        .from("schedule_staff")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-staff"] });
      toast.success("Staff member updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update staff member: ${error.message}`);
    },
  });

  const deleteStaff = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("schedule_staff")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-staff"] });
      toast.success("Staff member removed successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove staff member: ${error.message}`);
    },
  });

  return {
    createStaff,
    updateStaff,
    deleteStaff,
  };
};
