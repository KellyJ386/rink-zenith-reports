import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Printer, FileText, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface IceDepthReportExportProps {
  measurement: {
    id: string;
    measurement_date: string;
    template_type: string;
    status: string;
    min_depth: number;
    max_depth: number;
    avg_depth: number;
    std_deviation: number;
    measurements: Record<string, number>;
    ai_analysis?: string;
    facilities?: { name: string };
    rinks?: { name: string };
    profiles?: { name: string };
  };
}

export const IceDepthReportExport = ({ measurement }: IceDepthReportExportProps) => {
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [sending, setSending] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const generateReportHTML = () => {
    const measurementData = measurement.measurements || {};
    const pointsHtml = Object.entries(measurementData)
      .map(([key, value]) => `<tr><td style="padding: 8px; border: 1px solid #ddd;">${key}</td><td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${value.toFixed(3)}"</td></tr>`)
      .join("");

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ice Depth Measurement Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #0066cc; }
          .report-title { font-size: 20px; margin-top: 10px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .info-item { padding: 10px; background: #f5f5f5; border-radius: 4px; }
          .info-label { font-size: 12px; color: #666; text-transform: uppercase; }
          .info-value { font-size: 16px; font-weight: bold; margin-top: 4px; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
          .stat-box { text-align: center; padding: 15px; background: #e8f4fc; border-radius: 8px; }
          .stat-value { font-size: 24px; font-weight: bold; color: #0066cc; }
          .stat-label { font-size: 12px; color: #666; margin-top: 4px; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: bold; text-transform: uppercase; font-size: 12px; }
          .status-good { background: #d4edda; color: #155724; }
          .status-warning { background: #fff3cd; color: #856404; }
          .status-critical { background: #f8d7da; color: #721c24; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #0066cc; color: white; padding: 10px; text-align: left; }
          .analysis { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #0066cc; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Ice Depth Measurement Report</div>
          <div class="report-title">${measurement.facilities?.name || "Facility"} - ${measurement.rinks?.name || "Rink"}</div>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Date & Time</div>
            <div class="info-value">${format(new Date(measurement.measurement_date), "PPP p")}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Template</div>
            <div class="info-value">${measurement.template_type}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Operator</div>
            <div class="info-value">${measurement.profiles?.name || "N/A"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Status</div>
            <div class="info-value">
              <span class="status-badge status-${measurement.status}">${measurement.status}</span>
            </div>
          </div>
        </div>

        <h3>Measurement Statistics</h3>
        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-value">${measurement.min_depth}"</div>
            <div class="stat-label">Minimum Depth</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${measurement.max_depth}"</div>
            <div class="stat-label">Maximum Depth</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${measurement.avg_depth}"</div>
            <div class="stat-label">Average Depth</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${measurement.std_deviation}"</div>
            <div class="stat-label">Std Deviation</div>
          </div>
        </div>

        <h3>Individual Measurements</h3>
        <table>
          <thead>
            <tr>
              <th>Point</th>
              <th style="text-align: right;">Depth</th>
            </tr>
          </thead>
          <tbody>
            ${pointsHtml}
          </tbody>
        </table>

        ${measurement.ai_analysis ? `
          <h3>AI Analysis</h3>
          <div class="analysis">
            ${measurement.ai_analysis.replace(/\n/g, '<br/>')}
          </div>
        ` : ''}

        <div class="footer">
          <p>Generated on ${format(new Date(), "PPP p")}</p>
          <p>Ice Depth Monitoring System</p>
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
    // Create a printable HTML and use browser print-to-PDF
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Please allow popups to download the PDF");
      return;
    }
    
    const htmlContent = generateReportHTML();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    toast.info("Use your browser's 'Save as PDF' option in the print dialog");
    
    printWindow.onload = () => {
      printWindow.print();
    };
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
          subject: `Ice Depth Report - ${measurement.facilities?.name || "Facility"} - ${format(new Date(measurement.measurement_date), "PP")}`,
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
        <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Save as PDF
        </Button>
        <Button variant="outline" size="sm" onClick={() => setEmailDialogOpen(true)}>
          <Mail className="h-4 w-4 mr-2" />
          Email
        </Button>
      </div>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Ice Depth Report</DialogTitle>
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
              The complete measurement report will be sent to this email address.
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
