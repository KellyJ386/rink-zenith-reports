import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DailyReportTab, DailyReportTabWithRoles } from "@/types/dailyReport";
import { toast } from "sonner";

export const useDailyReportTabs = (facilityId?: string) => {
  const queryClient = useQueryClient();

  const tabsQuery = useQuery({
    queryKey: ['daily-report-tabs', facilityId],
    queryFn: async () => {
      let query = supabase
        .from('daily_report_tabs')
        .select(`
          *,
          roles:daily_report_tab_roles(
            id,
            role_id,
            role:schedule_roles(id, name, color)
          )
        `)
        .order('display_order');

      if (facilityId) {
        query = query.eq('facility_id', facilityId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DailyReportTabWithRoles[];
    },
    enabled: !!facilityId,
  });

  const createTab = useMutation({
    mutationFn: async (tab: Omit<DailyReportTab, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('daily_report_tabs')
        .insert(tab)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-report-tabs'] });
      toast.success("Tab created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create tab: ${error.message}`);
    },
  });

  const updateTab = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DailyReportTab> & { id: string }) => {
      const { data, error } = await supabase
        .from('daily_report_tabs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-report-tabs'] });
      toast.success("Tab updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update tab: ${error.message}`);
    },
  });

  const deleteTab = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('daily_report_tabs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-report-tabs'] });
      toast.success("Tab deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete tab: ${error.message}`);
    },
  });

  const reorderTabs = useMutation({
    mutationFn: async (tabs: { id: string; display_order: number }[]) => {
      const updates = tabs.map(({ id, display_order }) =>
        supabase
          .from('daily_report_tabs')
          .update({ display_order })
          .eq('id', id)
      );

      const results = await Promise.all(updates);
      const error = results.find(r => r.error)?.error;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-report-tabs'] });
    },
    onError: (error) => {
      toast.error(`Failed to reorder tabs: ${error.message}`);
    },
  });

  const assignRole = useMutation({
    mutationFn: async ({ tabId, roleId }: { tabId: string; roleId: string }) => {
      const { error } = await supabase
        .from('daily_report_tab_roles')
        .insert({ tab_id: tabId, role_id: roleId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-report-tabs'] });
      toast.success("Role assigned successfully");
    },
    onError: (error) => {
      toast.error(`Failed to assign role: ${error.message}`);
    },
  });

  const removeRole = useMutation({
    mutationFn: async ({ tabId, roleId }: { tabId: string; roleId: string }) => {
      const { error } = await supabase
        .from('daily_report_tab_roles')
        .delete()
        .eq('tab_id', tabId)
        .eq('role_id', roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-report-tabs'] });
      toast.success("Role removed successfully");
    },
    onError: (error) => {
      toast.error(`Failed to remove role: ${error.message}`);
    },
  });

  return {
    tabs: tabsQuery.data ?? [],
    isLoading: tabsQuery.isLoading,
    error: tabsQuery.error,
    createTab,
    updateTab,
    deleteTab,
    reorderTabs,
    assignRole,
    removeRole,
    isSubmitting: createTab.isPending || updateTab.isPending || deleteTab.isPending,
  };
};
