import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScheduleStaff } from "@/types/schedule";

export const useScheduleStaff = () => {
  return useQuery({
    queryKey: ['schedule-staff'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule_staff')
        .select('*')
        .eq('employment_status', 'active')
        .order('full_name');

      if (error) throw error;
      return data as ScheduleStaff[];
    },
  });
};
