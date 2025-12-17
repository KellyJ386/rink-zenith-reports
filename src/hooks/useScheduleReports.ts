import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, eachDayOfInterval, format, differenceInMinutes } from "date-fns";

export interface ShiftReportData {
  staff_id: string;
  staff_name: string;
  role_name: string;
  total_hours: number;
  shift_count: number;
  areas_worked: string[];
}

export interface CoverageData {
  date: string;
  total_shifts: number;
  open_shifts: number;
  assigned_shifts: number;
  coverage_percentage: number;
}

export interface RoleDistribution {
  role_name: string;
  shift_count: number;
  total_hours: number;
  color: string;
}

export interface ShiftSummaryData {
  date: string;
  shift_count: number;
  reports_submitted: number;
  tabs_completed: number;
  total_tabs: number;
  total_revenue: number;
  total_expenses: number;
  completion_percentage: number;
}

const calculateShiftHours = (startTime: string, endTime: string): number => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  let start = startHour * 60 + startMin;
  let end = endHour * 60 + endMin;
  
  // Handle overnight shifts
  if (end < start) {
    end += 24 * 60;
  }
  
  return (end - start) / 60;
};

export const useScheduleReports = (startDate: Date, endDate: Date) => {
  const reportsQuery = useQuery({
    queryKey: ['schedule-reports', format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      // Fetch shifts
      const { data: shifts, error } = await supabase
        .from('schedule_shifts')
        .select(`
          *,
          role:schedule_roles(name, color),
          assigned_staff:schedule_staff(id, full_name)
        `)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date');

      if (error) throw error;

      // Fetch daily reports for the period
      const { data: dailyReports, error: reportsError } = await supabase
        .from('daily_reports')
        .select(`
          *,
          tab_submissions:daily_report_tab_submissions(id, tab_id, status)
        `)
        .gte('report_date', format(startDate, 'yyyy-MM-dd'))
        .lte('report_date', format(endDate, 'yyyy-MM-dd'));

      if (reportsError) throw reportsError;

      // Fetch total tabs count
      const { data: allTabs } = await supabase
        .from('daily_report_tabs')
        .select('id')
        .eq('is_active', true);

      const totalTabsCount = allTabs?.length || 0;

      // Calculate staff hours
      const staffHoursMap = new Map<string, ShiftReportData>();
      const roleDistributionMap = new Map<string, RoleDistribution>();
      const coverageByDate = new Map<string, { total: number; open: number; assigned: number }>();

      shifts?.forEach((shift: any) => {
        const hours = calculateShiftHours(shift.start_time, shift.end_time);
        const dateKey = shift.date;

        // Staff hours tracking
        if (shift.assigned_staff_id && shift.assigned_staff) {
          const staffKey = shift.assigned_staff_id;
          if (!staffHoursMap.has(staffKey)) {
            staffHoursMap.set(staffKey, {
              staff_id: staffKey,
              staff_name: shift.assigned_staff.full_name,
              role_name: shift.role?.name || 'Unknown',
              total_hours: 0,
              shift_count: 0,
              areas_worked: [],
            });
          }
          const staffData = staffHoursMap.get(staffKey)!;
          staffData.total_hours += hours;
          staffData.shift_count += 1;
          if (!staffData.areas_worked.includes(shift.area)) {
            staffData.areas_worked.push(shift.area);
          }
        }

        // Role distribution tracking
        const roleName = shift.role?.name || 'Unknown';
        if (!roleDistributionMap.has(roleName)) {
          roleDistributionMap.set(roleName, {
            role_name: roleName,
            shift_count: 0,
            total_hours: 0,
            color: shift.role?.color || '#888888',
          });
        }
        const roleData = roleDistributionMap.get(roleName)!;
        roleData.shift_count += 1;
        roleData.total_hours += hours;

        // Coverage tracking
        if (!coverageByDate.has(dateKey)) {
          coverageByDate.set(dateKey, { total: 0, open: 0, assigned: 0 });
        }
        const coverage = coverageByDate.get(dateKey)!;
        coverage.total += 1;
        if (shift.status === 'open') {
          coverage.open += 1;
        } else if (shift.assigned_staff_id) {
          coverage.assigned += 1;
        }
      });

      // Process shift summary data
      const shiftSummaryByDate = new Map<string, ShiftSummaryData>();
      
      eachDayOfInterval({ start: startDate, end: endDate }).forEach(date => {
        const dateKey = format(date, 'yyyy-MM-dd');
        const dayShifts = shifts?.filter((s: any) => s.date === dateKey) || [];
        const dayReports = dailyReports?.filter((r: any) => r.report_date === dateKey) || [];
        
        let tabsCompleted = 0;
        let totalTabs = 0;
        let totalRevenue = 0;
        let totalExpenses = 0;

        dayReports.forEach((report: any) => {
          totalRevenue += Number(report.total_revenue) || 0;
          totalExpenses += Number(report.total_expenses) || 0;
          
          const submissions = report.tab_submissions || [];
          tabsCompleted += submissions.filter((s: any) => s.status === 'submitted').length;
          totalTabs += totalTabsCount;
        });

        shiftSummaryByDate.set(dateKey, {
          date: dateKey,
          shift_count: dayShifts.length,
          reports_submitted: dayReports.filter((r: any) => r.status === 'submitted').length,
          tabs_completed: tabsCompleted,
          total_tabs: totalTabs,
          total_revenue: totalRevenue,
          total_expenses: totalExpenses,
          completion_percentage: totalTabs > 0 ? (tabsCompleted / totalTabs) * 100 : 0,
        });
      });

      // Convert to arrays
      const staffHours = Array.from(staffHoursMap.values()).sort((a, b) => b.total_hours - a.total_hours);
      const roleDistribution = Array.from(roleDistributionMap.values()).sort((a, b) => b.total_hours - a.total_hours);
      const shiftSummary = Array.from(shiftSummaryByDate.values());
      
      const dailyCoverage: CoverageData[] = eachDayOfInterval({ start: startDate, end: endDate }).map(date => {
        const dateKey = format(date, 'yyyy-MM-dd');
        const coverage = coverageByDate.get(dateKey) || { total: 0, open: 0, assigned: 0 };
        return {
          date: dateKey,
          total_shifts: coverage.total,
          open_shifts: coverage.open,
          assigned_shifts: coverage.assigned,
          coverage_percentage: coverage.total > 0 ? (coverage.assigned / coverage.total) * 100 : 0,
        };
      });

      // Calculate summary stats
      const totalShifts = shifts?.length || 0;
      const assignedShifts = shifts?.filter((s: any) => s.assigned_staff_id).length || 0;
      const openShifts = shifts?.filter((s: any) => s.status === 'open').length || 0;
      const totalHours = shifts?.reduce((sum: number, shift: any) => {
        return sum + calculateShiftHours(shift.start_time, shift.end_time);
      }, 0) || 0;

      // Shift summary totals
      const totalReportsSubmitted = dailyReports?.filter((r: any) => r.status === 'submitted').length || 0;
      const totalRevenue = dailyReports?.reduce((sum: number, r: any) => sum + (Number(r.total_revenue) || 0), 0) || 0;
      const totalExpenses = dailyReports?.reduce((sum: number, r: any) => sum + (Number(r.total_expenses) || 0), 0) || 0;

      return {
        staffHours,
        roleDistribution,
        dailyCoverage,
        shiftSummary,
        summary: {
          totalShifts,
          assignedShifts,
          openShifts,
          totalHours: Math.round(totalHours * 10) / 10,
          averageCoverage: totalShifts > 0 ? Math.round((assignedShifts / totalShifts) * 100) : 0,
          totalReportsSubmitted,
          totalRevenue,
          totalExpenses,
        },
      };
    },
  });

  return {
    data: reportsQuery.data,
    isLoading: reportsQuery.isLoading,
    error: reportsQuery.error,
  };
};
