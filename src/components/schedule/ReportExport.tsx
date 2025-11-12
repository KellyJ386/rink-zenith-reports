import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface ReportExportProps {
  data: any;
  startDate: Date;
  endDate: Date;
  reportType: string;
}

export const ReportExport = ({ data, startDate, endDate, reportType }: ReportExportProps) => {
  const exportToCSV = () => {
    if (!data) {
      toast.error("No data to export");
      return;
    }

    try {
      let csvContent = "";
      const dateRange = `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;

      if (reportType === 'staff-hours' && data.staffHours) {
        csvContent = "Staff Hours Report\n";
        csvContent += `Period: ${dateRange}\n\n`;
        csvContent += "Staff Name,Role,Total Hours,Shift Count,Areas Worked\n";
        data.staffHours.forEach((staff: any) => {
          csvContent += `"${staff.staff_name}","${staff.role_name}",${staff.total_hours},${staff.shift_count},"${staff.areas_worked.join(', ')}"\n`;
        });
      } else if (reportType === 'coverage' && data.dailyCoverage) {
        csvContent = "Daily Coverage Report\n";
        csvContent += `Period: ${dateRange}\n\n`;
        csvContent += "Date,Total Shifts,Assigned,Open,Coverage %\n";
        data.dailyCoverage.forEach((day: any) => {
          csvContent += `${format(new Date(day.date), 'MMM d, yyyy')},${day.total_shifts},${day.assigned_shifts},${day.open_shifts},${day.coverage_percentage.toFixed(1)}%\n`;
        });
      } else if (reportType === 'roles' && data.roleDistribution) {
        csvContent = "Role Distribution Report\n";
        csvContent += `Period: ${dateRange}\n\n`;
        csvContent += "Role,Shift Count,Total Hours\n";
        data.roleDistribution.forEach((role: any) => {
          csvContent += `"${role.role_name}",${role.shift_count},${role.total_hours.toFixed(1)}\n`;
        });
      } else {
        // Summary report
        csvContent = "Schedule Summary Report\n";
        csvContent += `Period: ${dateRange}\n\n`;
        csvContent += "Metric,Value\n";
        csvContent += `Total Shifts,${data.summary?.totalShifts || 0}\n`;
        csvContent += `Assigned Shifts,${data.summary?.assignedShifts || 0}\n`;
        csvContent += `Open Shifts,${data.summary?.openShifts || 0}\n`;
        csvContent += `Total Hours,${data.summary?.totalHours || 0}\n`;
        csvContent += `Average Coverage,${data.summary?.averageCoverage || 0}%\n`;
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `schedule-report-${reportType}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Report exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export report");
    }
  };

  return (
    <Button onClick={exportToCSV} variant="outline" size="sm">
      <FileSpreadsheet className="h-4 w-4 mr-2" />
      Export CSV
    </Button>
  );
};
