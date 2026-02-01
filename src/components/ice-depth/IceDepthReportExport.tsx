import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Printer, FileText, Mail, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { generatePdfFromHtml, escapeHtml } from "@/lib/pdfUtils";
import { measurementPoints, MeasurementPoint } from "./measurementPoints";

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

// Color logic for depth values (in inches)
const getDepthColor = (depthInches: number): string => {
  if (depthInches < 1.0) return "#ef4444"; // Red - too thin
  if (depthInches <= 1.75) return "#22c55e"; // Green - optimal
  if (depthInches <= 2.0) return "#3b82f6"; // Blue - slightly thick
  return "#eab308"; // Yellow - too thick
};

export const IceDepthReportExport = ({ measurement }: IceDepthReportExportProps) => {
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [sending, setSending] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const generateRinkSVG = () => {
    const measurementData = measurement.measurements || {};
    const templateType = measurement.template_type || "25-point";
    
    // Get the points for this template type
    let points: MeasurementPoint[] = measurementPoints[templateType] || [];
    
    // For custom templates, create points from the measurement data
    if (templateType === "custom" || points.length === 0) {
      // Create a grid-like arrangement for custom points
      const keys = Object.keys(measurementData);
      const numPoints = keys.length;
      const cols = Math.ceil(Math.sqrt(numPoints));
      const rows = Math.ceil(numPoints / cols);
      
      points = keys.map((key, index) => ({
        id: index + 1,
        x: 15 + ((index % cols) * (70 / Math.max(cols - 1, 1))),
        y: 10 + (Math.floor(index / cols) * (80 / Math.max(rows - 1, 1))),
        name: key,
        row: Math.floor(index / cols) + 1,
      }));
    }

    // SVG dimensions
    const width = 400;
    const height = 600;
    const cornerRadius = 50;

    // Generate measurement point circles
    const pointsMarkup = points.map((point) => {
      const key = `Point ${point.id}`;
      const altKey = point.id.toString();
      const value = measurementData[key] ?? measurementData[altKey] ?? measurementData[point.name];
      
      if (value === undefined || value === null) return '';
      
      const x = (point.x / 100) * width;
      const y = (point.y / 100) * height;
      const color = getDepthColor(value);
      
      return `
        <circle cx="${x}" cy="${y}" r="16" fill="${color}" stroke="white" stroke-width="2"/>
        <text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" fill="white" font-size="9" font-weight="bold">${value.toFixed(2)}</text>
      `;
    }).join('');

    return `
      <svg viewBox="0 0 ${width} ${height}" style="width: 100%; max-width: 400px; height: auto;">
        <!-- Ice surface -->
        <rect x="5" y="5" width="${width - 10}" height="${height - 10}" rx="${cornerRadius}" ry="${cornerRadius}" fill="#e8f4fc" stroke="#333" stroke-width="2"/>
        
        <!-- Goal lines -->
        <line x1="20" y1="50" x2="${width - 20}" y2="50" stroke="#cc0000" stroke-width="2"/>
        <line x1="20" y1="${height - 50}" x2="${width - 20}" y2="${height - 50}" stroke="#cc0000" stroke-width="2"/>
        
        <!-- Blue lines -->
        <line x1="20" y1="${height * 0.33}" x2="${width - 20}" y2="${height * 0.33}" stroke="#0066cc" stroke-width="4"/>
        <line x1="20" y1="${height * 0.67}" x2="${width - 20}" y2="${height * 0.67}" stroke="#0066cc" stroke-width="4"/>
        
        <!-- Center red line -->
        <line x1="20" y1="${height / 2}" x2="${width - 20}" y2="${height / 2}" stroke="#cc0000" stroke-width="3"/>
        
        <!-- Center circle -->
        <circle cx="${width / 2}" cy="${height / 2}" r="40" fill="none" stroke="#0066cc" stroke-width="2"/>
        <circle cx="${width / 2}" cy="${height / 2}" r="4" fill="#0066cc"/>
        
        <!-- End zone face-off circles -->
        <circle cx="${width * 0.3}" cy="100" r="35" fill="none" stroke="#cc0000" stroke-width="2"/>
        <circle cx="${width * 0.7}" cy="100" r="35" fill="none" stroke="#cc0000" stroke-width="2"/>
        <circle cx="${width * 0.3}" cy="${height - 100}" r="35" fill="none" stroke="#cc0000" stroke-width="2"/>
        <circle cx="${width * 0.7}" cy="${height - 100}" r="35" fill="none" stroke="#cc0000" stroke-width="2"/>
        
        <!-- Face-off dots -->
        <circle cx="${width * 0.3}" cy="100" r="4" fill="#cc0000"/>
        <circle cx="${width * 0.7}" cy="100" r="4" fill="#cc0000"/>
        <circle cx="${width * 0.3}" cy="${height - 100}" r="4" fill="#cc0000"/>
        <circle cx="${width * 0.7}" cy="${height - 100}" r="4" fill="#cc0000"/>
        
        <!-- Neutral zone face-off dots -->
        <circle cx="${width * 0.25}" cy="${height * 0.4}" r="4" fill="#cc0000"/>
        <circle cx="${width * 0.75}" cy="${height * 0.4}" r="4" fill="#cc0000"/>
        <circle cx="${width * 0.25}" cy="${height * 0.6}" r="4" fill="#cc0000"/>
        <circle cx="${width * 0.75}" cy="${height * 0.6}" r="4" fill="#cc0000"/>
        
        <!-- Goal creases -->
        <path d="M ${width / 2 - 25} 50 Q ${width / 2 - 25} 75, ${width / 2} 75 Q ${width / 2 + 25} 75, ${width / 2 + 25} 50" fill="#cce5ff" stroke="#cc0000" stroke-width="1"/>
        <path d="M ${width / 2 - 25} ${height - 50} Q ${width / 2 - 25} ${height - 75}, ${width / 2} ${height - 75} Q ${width / 2 + 25} ${height - 75}, ${width / 2 + 25} ${height - 50}" fill="#cce5ff" stroke="#cc0000" stroke-width="1"/>
        
        <!-- Measurement points overlay -->
        ${pointsMarkup}
      </svg>
    `;
  };

  const generateReportHTML = () => {
    const measurementData = measurement.measurements || {};
    // Escape all user-controlled data to prevent XSS
    const pointsHtml = Object.entries(measurementData)
      .map(([key, value]) => `<tr><td style="padding: 6px 8px; border: 1px solid #ddd;">${escapeHtml(key)}</td><td style="padding: 6px 8px; border: 1px solid #ddd; text-align: right;">${value.toFixed(3)}"</td></tr>`)
      .join("");

    const rinkSVG = generateRinkSVG();

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ice Depth Measurement Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
          .logo { font-size: 22px; font-weight: bold; color: #0066cc; }
          .report-title { font-size: 16px; margin-top: 8px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px; }
          .info-item { padding: 8px; background: #f5f5f5; border-radius: 4px; }
          .info-label { font-size: 10px; color: #666; text-transform: uppercase; }
          .info-value { font-size: 14px; font-weight: bold; margin-top: 2px; }
          .content-layout { display: flex; gap: 20px; margin-bottom: 20px; }
          .rink-container { flex: 0 0 auto; text-align: center; }
          .rink-diagram { max-width: 280px; margin: 0 auto; }
          .legend { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 10px; }
          .legend-item { display: flex; align-items: center; gap: 4px; font-size: 10px; }
          .legend-dot { width: 12px; height: 12px; border-radius: 50%; }
          .stats-table { flex: 1; }
          .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          .stat-box { text-align: center; padding: 12px; background: #e8f4fc; border-radius: 6px; }
          .stat-value { font-size: 20px; font-weight: bold; color: #0066cc; }
          .stat-label { font-size: 10px; color: #666; margin-top: 2px; }
          .status-badge { display: inline-block; padding: 3px 10px; border-radius: 15px; font-weight: bold; text-transform: uppercase; font-size: 11px; }
          .status-good { background: #d4edda; color: #155724; }
          .status-warning { background: #fff3cd; color: #856404; }
          .status-critical { background: #f8d7da; color: #721c24; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th { background: #0066cc; color: white; padding: 8px; text-align: left; }
          .measurements-section { margin-top: 15px; }
          .measurements-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; }
          .analysis { background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 3px solid #0066cc; margin-top: 15px; font-size: 12px; }
          .footer { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 10px; color: #666; }
          @media print {
            body { padding: 10px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Ice Depth Measurement Report</div>
          <div class="report-title">${escapeHtml(measurement.facilities?.name) || "Facility"} - ${escapeHtml(measurement.rinks?.name) || "Rink"}</div>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Date</div>
            <div class="info-value">${format(new Date(measurement.measurement_date), "PP")}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Time</div>
            <div class="info-value">${format(new Date(measurement.measurement_date), "p")}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Template</div>
            <div class="info-value">${measurement.template_type}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Status</div>
            <div class="info-value">
              <span class="status-badge status-${measurement.status}">${measurement.status}</span>
            </div>
          </div>
        </div>

        <div class="content-layout">
          <div class="rink-container">
            <div class="rink-diagram">
              ${rinkSVG}
            </div>
            <div class="legend">
              <div class="legend-item">
                <div class="legend-dot" style="background: #ef4444;"></div>
                <span>&lt; 1.0" (Critical)</span>
              </div>
              <div class="legend-item">
                <div class="legend-dot" style="background: #22c55e;"></div>
                <span>1.0-1.75" (Good)</span>
              </div>
              <div class="legend-item">
                <div class="legend-dot" style="background: #3b82f6;"></div>
                <span>1.75-2.0" (Monitor)</span>
              </div>
              <div class="legend-item">
                <div class="legend-dot" style="background: #eab308;"></div>
                <span>&gt; 2.0" (Warning)</span>
              </div>
            </div>
          </div>
          
          <div class="stats-table">
            <h4 style="margin: 0 0 10px 0; font-size: 14px;">Statistics</h4>
            <div class="stats-grid">
              <div class="stat-box">
                <div class="stat-value">${measurement.min_depth}"</div>
                <div class="stat-label">Minimum</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">${measurement.max_depth}"</div>
                <div class="stat-label">Maximum</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">${measurement.avg_depth}"</div>
                <div class="stat-label">Average</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">${measurement.std_deviation}"</div>
                <div class="stat-label">Std Dev</div>
              </div>
            </div>
            
            ${measurement.profiles?.name ? `
              <div class="info-item" style="margin-top: 10px;">
                <div class="info-label">Operator</div>
                <div class="info-value">${escapeHtml(measurement.profiles.name)}</div>
              </div>
            ` : ''}
          </div>
        </div>

        ${measurement.ai_analysis ? `
          <div class="analysis">
            <strong style="display: block; margin-bottom: 8px;">AI Analysis</strong>
            ${escapeHtml(measurement.ai_analysis).replace(/\n/g, '<br/>')}
          </div>
        ` : ''}

        <div class="measurements-section">
          <h4 style="margin: 0 0 10px 0; font-size: 14px;">All Measurements</h4>
          <table>
            <thead>
              <tr>
                <th>Point</th>
                <th style="text-align: right;">Depth</th>
                <th>Point</th>
                <th style="text-align: right;">Depth</th>
              </tr>
            </thead>
            <tbody>
              ${(() => {
                const entries = Object.entries(measurementData);
                const rows = [];
                for (let i = 0; i < entries.length; i += 2) {
                  const [key1, val1] = entries[i];
                  const [key2, val2] = entries[i + 1] || ['', null];
                  rows.push(`
                    <tr>
                      <td style="padding: 4px 8px; border: 1px solid #ddd;">${escapeHtml(key1)}</td>
                      <td style="padding: 4px 8px; border: 1px solid #ddd; text-align: right;">${val1.toFixed(3)}"</td>
                      ${val2 !== null ? `
                        <td style="padding: 4px 8px; border: 1px solid #ddd;">${escapeHtml(key2)}</td>
                        <td style="padding: 4px 8px; border: 1px solid #ddd; text-align: right;">${val2.toFixed(3)}"</td>
                      ` : '<td style="border: 1px solid #ddd;"></td><td style="border: 1px solid #ddd;"></td>'}
                    </tr>
                  `);
                }
                return rows.join('');
              })()}
            </tbody>
          </table>
        </div>

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
    setGeneratingPdf(true);
    try {
      const filename = `ice-depth-report-${escapeHtml(measurement.facilities?.name) || 'facility'}-${format(new Date(measurement.measurement_date), "yyyy-MM-dd")}.pdf`;
      await generatePdfFromHtml(generateReportHTML(), filename);
      toast.success("PDF download initiated - use 'Save as PDF' in the print dialog");
    } catch (error: any) {
      console.error("PDF generation error:", error);
      toast.error(error.message || "Failed to generate PDF");
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
              The complete measurement report with rink diagram will be sent to this email address.
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
