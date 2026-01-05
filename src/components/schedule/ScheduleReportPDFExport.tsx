import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Printer, Mail, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import html2pdf from "html2pdf.js";

interface ScheduleReportData {
  staffHours?: Array<{
    staff_name: string;
    role_name: string;
    total_hours: number;
    shift_count: number;
    areas_worked: string[];
  }>;
  dailyCoverage?: Array<{
    date: string;
    total_shifts: number;
    assigned_shifts: number;
    open_shifts: number;
    coverage_percentage: number;
  }>;
  roleDistribution?: Array<{
    role_name: string;
    shift_count: number;
    total_hours: number;
    color: string;
  }>;
  shiftSummary?: Array<{
    date: string;
    shift_count: number;
    reports_submitted: number;
    tabs_completed: number;
    total_tabs: number;
    total_revenue: number;
    total_expenses: number;
  }>;
  summary: {
    totalShifts: number;
    assignedShifts: number;
    openShifts: number;
    totalHours: number;
    averageCoverage: number;
    totalReportsSubmitted?: number;
    totalRevenue?: number;
    totalExpenses?: number;
  };
}

interface ScheduleReportPDFExportProps {
  data: ScheduleReportData;
  startDate: Date;
  endDate: Date;
  facilityName?: string;
}

export const ScheduleReportPDFExport = ({ data, startDate, endDate, facilityName = "Facility" }: ScheduleReportPDFExportProps) => {
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [sending, setSending] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const generateReportHTML = () => {
    const dateRange = `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;
    
    // Staff Hours Table
    const staffHoursRows = data.staffHours?.map(staff => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${staff.staff_name}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${staff.role_name}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${staff.total_hours.toFixed(1)}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${staff.shift_count}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${staff.areas_worked.join(', ')}</td>
      </tr>
    `).join('') || '';

    // Daily Coverage Table
    const coverageRows = data.dailyCoverage?.map(day => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${format(new Date(day.date), 'EEE, MMM d')}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${day.total_shifts}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: #16a34a;">${day.assigned_shifts}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: #ca8a04;">${day.open_shifts}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${day.coverage_percentage.toFixed(1)}%</td>
      </tr>
    `).join('') || '';

    // Role Distribution Table
    const roleRows = data.roleDistribution?.map(role => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">
          <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: ${role.color}; margin-right: 8px;"></span>
          ${role.role_name}
        </td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${role.shift_count}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${role.total_hours.toFixed(1)}</td>
      </tr>
    `).join('') || '';

    // Shift Summary Table
    const summaryRows = data.shiftSummary?.map(day => {
      const net = day.total_revenue - day.total_expenses;
      return `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${format(new Date(day.date), 'EEE, MMM d')}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${day.shift_count}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${day.reports_submitted}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${day.total_tabs > 0 ? `${day.tabs_completed}/${day.total_tabs}` : '-'}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: #16a34a;">${day.total_revenue > 0 ? formatCurrency(day.total_revenue) : '-'}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: #dc2626;">${day.total_expenses > 0 ? formatCurrency(day.total_expenses) : '-'}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold; color: ${net >= 0 ? '#16a34a' : '#dc2626'};">${(day.total_revenue > 0 || day.total_expenses > 0) ? formatCurrency(net) : '-'}</td>
        </tr>
      `;
    }).join('') || '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Schedule Report - ${facilityName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; font-size: 12px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #0066cc; }
          .report-title { font-size: 16px; margin-top: 10px; color: #666; }
          .stats-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin-bottom: 30px; }
          .stat-box { text-align: center; padding: 15px; background: #f0f9ff; border-radius: 8px; border: 1px solid #e0e7ff; }
          .stat-value { font-size: 24px; font-weight: bold; color: #0066cc; }
          .stat-label { font-size: 11px; color: #666; margin-top: 4px; text-transform: uppercase; }
          .section { margin-bottom: 30px; page-break-inside: avoid; }
          .section-title { font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #333; border-bottom: 1px solid #eee; padding-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #0066cc; color: white; padding: 10px 8px; text-align: left; font-size: 11px; }
          th.right { text-align: right; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 11px; color: #666; }
          @media print {
            body { padding: 20px; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Schedule Report</div>
          <div class="report-title">${facilityName} • ${dateRange}</div>
        </div>

        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-value">${data.summary.totalShifts}</div>
            <div class="stat-label">Total Shifts</div>
          </div>
          <div class="stat-box">
            <div class="stat-value" style="color: #16a34a;">${data.summary.assignedShifts}</div>
            <div class="stat-label">Assigned</div>
          </div>
          <div class="stat-box">
            <div class="stat-value" style="color: #ca8a04;">${data.summary.openShifts}</div>
            <div class="stat-label">Open</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${data.summary.totalHours}</div>
            <div class="stat-label">Total Hours</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${data.summary.averageCoverage}%</div>
            <div class="stat-label">Coverage</div>
          </div>
        </div>

        ${data.shiftSummary && data.shiftSummary.length > 0 ? `
          <div class="section">
            <div class="section-title">Shift Summary</div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th class="right">Shifts</th>
                  <th class="right">Reports</th>
                  <th class="right">Tab Completion</th>
                  <th class="right">Revenue</th>
                  <th class="right">Expenses</th>
                  <th class="right">Net</th>
                </tr>
              </thead>
              <tbody>
                ${summaryRows}
              </tbody>
            </table>
          </div>
        ` : ''}

        ${data.staffHours && data.staffHours.length > 0 ? `
          <div class="section">
            <div class="section-title">Staff Hours</div>
            <table>
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Role</th>
                  <th class="right">Hours</th>
                  <th class="right">Shifts</th>
                  <th>Areas Worked</th>
                </tr>
              </thead>
              <tbody>
                ${staffHoursRows}
              </tbody>
            </table>
          </div>
        ` : ''}

        ${data.dailyCoverage && data.dailyCoverage.length > 0 ? `
          <div class="section">
            <div class="section-title">Daily Coverage</div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th class="right">Total</th>
                  <th class="right">Assigned</th>
                  <th class="right">Open</th>
                  <th class="right">Coverage</th>
                </tr>
              </thead>
              <tbody>
                ${coverageRows}
              </tbody>
            </table>
          </div>
        ` : ''}

        ${data.roleDistribution && data.roleDistribution.length > 0 ? `
          <div class="section">
            <div class="section-title">Role Distribution</div>
            <table>
              <thead>
                <tr>
                  <th>Role</th>
                  <th class="right">Shifts</th>
                  <th class="right">Hours</th>
                </tr>
              </thead>
              <tbody>
                ${roleRows}
              </tbody>
            </table>
          </div>
        ` : ''}

        <div class="footer">
          <p>Generated on ${format(new Date(), "PPP 'at' p")}</p>
          <p>Schedule Management System</p>
        </div>
      </body>
      </html>
    `;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Please allow popups to print the report");
      return;
    }
    
    printWindow.document.write(generateReportHTML());
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const handleDownloadPDF = async () => {
    setGeneratingPdf(true);
    try {
      const container = document.createElement('div');
      container.innerHTML = generateReportHTML();
      document.body.appendChild(container);

      const filename = `schedule-report-${format(startDate, 'yyyy-MM-dd')}-to-${format(endDate, 'yyyy-MM-dd')}.pdf`;

      await html2pdf()
        .set({
          margin: 10,
          filename: filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        })
        .from(container.querySelector('body') || container)
        .save();

      document.body.removeChild(container);
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailAddress.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-ice-depth-report", {
        body: {
          email: emailAddress,
          reportHtml: generateReportHTML(),
          subject: `Schedule Report - ${facilityName} - ${format(startDate, 'MMM d')} to ${format(endDate, 'MMM d, yyyy')}`,
        },
      });

      if (error) throw error;

      toast.success(`Report sent to ${emailAddress}`);
      setEmailDialogOpen(false);
      setEmailAddress("");
    } catch (error: any) {
      console.error("Email error:", error);
      toast.error(error.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={generatingPdf}>
          {generatingPdf ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </>
          )}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setEmailDialogOpen(true)}>
          <Mail className="h-4 w-4 mr-2" />
          Email
        </Button>
      </div>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Schedule Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Recipient Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              The complete schedule report will be sent to this email address.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={sending}>
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Report
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
