import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScheduleRole } from "@/types/schedule";

export const useScheduleRoles = () => {
  return useQuery({
    queryKey: ['schedule-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule_roles')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data as ScheduleRole[];
    },
  });
};
