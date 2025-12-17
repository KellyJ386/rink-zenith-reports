import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DailyReportTabWithRoles } from "@/types/dailyReport";

export const useDailyReportUserTabs = (facilityId?: string, userId?: string) => {
  // Fetch user's schedule roles
  const userRolesQuery = useQuery({
    queryKey: ['user-schedule-roles', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      // First find user's schedule_staff record
      const { data: staff } = await supabase
        .from('schedule_staff')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      if (!staff) return [];
      
      // Then get their roles
      const { data: staffRoles, error } = await supabase
        .from('schedule_staff_roles')
        .select('role_id')
        .eq('staff_id', staff.id);
      
      if (error) throw error;
      return staffRoles?.map(r => r.role_id) ?? [];
    },
    enabled: !!userId,
  });

  // Fetch user's app role to check if admin or manager
  const appRoleQuery = useQuery({
    queryKey: ['user-app-role', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (error && error.code !== 'PGRST116') throw error;
      // Return highest role (admin > manager > staff)
      if (data?.some(r => r.role === 'admin')) return 'admin';
      if (data?.some(r => r.role === 'manager')) return 'manager';
      return data?.[0]?.role ?? null;
    },
    enabled: !!userId,
  });

  // Fetch all tabs for facility
  const tabsQuery = useQuery({
    queryKey: ['daily-report-tabs-user', facilityId],
    queryFn: async () => {
      if (!facilityId) return [];
      
      const { data, error } = await supabase
        .from('daily_report_tabs')
        .select(`
          *,
          roles:daily_report_tab_roles(
            id,
            role_id,
            role:schedule_roles(id, name, color)
          )
        `)
        .eq('facility_id', facilityId)
        .eq('is_active', true)
        .order('display_order');
      
      if (error) throw error;
      return data as DailyReportTabWithRoles[];
    },
    enabled: !!facilityId,
  });

  // Filter tabs based on user's roles
  const filteredTabs = (() => {
    if (!tabsQuery.data) return [];
    
    const isAdmin = appRoleQuery.data === 'admin';
    const isManager = appRoleQuery.data === 'manager';
    const userRoleIds = userRolesQuery.data ?? [];
    
    // Admins and managers see all active tabs
    if (isAdmin || isManager) return tabsQuery.data;
    
    // Filter tabs based on role assignments
    return tabsQuery.data.filter(tab => {
      // If tab has no role restrictions, everyone can see it
      if (!tab.roles || tab.roles.length === 0) return true;
      
      // Check if user has any of the assigned roles
      return tab.roles.some(r => userRoleIds.includes(r.role_id));
    });
  })();

  return {
    tabs: filteredTabs,
    allTabs: tabsQuery.data ?? [],
    userRoles: userRolesQuery.data ?? [],
    isAdmin: appRoleQuery.data === 'admin',
    isManager: appRoleQuery.data === 'manager',
    canViewAllTabs: appRoleQuery.data === 'admin' || appRoleQuery.data === 'manager',
    isLoading: tabsQuery.isLoading || userRolesQuery.isLoading || appRoleQuery.isLoading,
    error: tabsQuery.error || userRolesQuery.error || appRoleQuery.error,
  };
};
