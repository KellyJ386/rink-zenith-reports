import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Eye, TrendingDown, TrendingUp, Download, Loader2 } from "lucide-react";
import { IceDepthReportExport } from "./IceDepthReportExport";
import { generatePdfFromHtml, escapeHtml } from "@/lib/pdfUtils";
import { format as dateFnsFormat } from "date-fns";
import { measurementPoints, MeasurementPoint } from "./measurementPoints";

const getDepthColor = (depthInches: number): string => {
  if (depthInches < 1.0) return "#ef4444";
  if (depthInches <= 1.75) return "#22c55e";
  if (depthInches <= 2.0) return "#3b82f6";
  return "#eab308";
};

const generateRinkSVGForExport = (measurement: any): string => {
  const measurementData = measurement.measurements || {};
  const templateType = measurement.template_type || "25-point";
  let points: MeasurementPoint[] = measurementPoints[templateType] || [];

  if (templateType === "custom" || points.length === 0) {
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

  const width = 220;
  const height = 380;
  const cornerRadius = 28;

  const pointsMarkup = points.map((point) => {
    const key = `Point ${point.id}`;
    const altKey = point.id.toString();
    const value = measurementData[key] ?? measurementData[altKey] ?? measurementData[point.name];
    if (value === undefined || value === null) return '';
    const x = (point.x / 100) * width;
    const y = (point.y / 100) * height;
    const color = getDepthColor(value);
    return `
      <circle cx="${x}" cy="${y}" r="11" fill="${color}" stroke="white" stroke-width="1.5"/>
      <text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" fill="white" font-size="7" font-weight="bold">${Number(value).toFixed(2)}</text>
    `;
  }).join('');

  return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="${width-6}" height="${height-6}" rx="${cornerRadius}" ry="${cornerRadius}" fill="#ddf0fa" stroke="#334155" stroke-width="1.5"/>
    <line x1="12" y1="32" x2="${width-12}" y2="32" stroke="#cc0000" stroke-width="1.2"/>
    <line x1="12" y1="${height-32}" x2="${width-12}" y2="${height-32}" stroke="#cc0000" stroke-width="1.2"/>
    <line x1="12" y1="${height*0.33}" x2="${width-12}" y2="${height*0.33}" stroke="#0055cc" stroke-width="2.5"/>
    <line x1="12" y1="${height*0.67}" x2="${width-12}" y2="${height*0.67}" stroke="#0055cc" stroke-width="2.5"/>
    <line x1="12" y1="${height/2}" x2="${width-12}" y2="${height/2}" stroke="#cc0000" stroke-width="1.8"/>
    <circle cx="${width/2}" cy="${height/2}" r="24" fill="none" stroke="#0055cc" stroke-width="1.2"/>
    <circle cx="${width/2}" cy="${height/2}" r="2.5" fill="#0055cc"/>
    <circle cx="${width*0.3}" cy="58" r="20" fill="none" stroke="#cc0000" stroke-width="1.2"/>
    <circle cx="${width*0.7}" cy="58" r="20" fill="none" stroke="#cc0000" stroke-width="1.2"/>
    <circle cx="${width*0.3}" cy="${height-58}" r="20" fill="none" stroke="#cc0000" stroke-width="1.2"/>
    <circle cx="${width*0.7}" cy="${height-58}" r="20" fill="none" stroke="#cc0000" stroke-width="1.2"/>
    <circle cx="${width*0.3}" cy="58" r="2.5" fill="#cc0000"/>
    <circle cx="${width*0.7}" cy="58" r="2.5" fill="#cc0000"/>
    <circle cx="${width*0.3}" cy="${height-58}" r="2.5" fill="#cc0000"/>
    <circle cx="${width*0.7}" cy="${height-58}" r="2.5" fill="#cc0000"/>
    <circle cx="${width*0.25}" cy="${height*0.4}" r="2.5" fill="#cc0000"/>
    <circle cx="${width*0.75}" cy="${height*0.4}" r="2.5" fill="#cc0000"/>
    <circle cx="${width*0.25}" cy="${height*0.6}" r="2.5" fill="#cc0000"/>
    <circle cx="${width*0.75}" cy="${height*0.6}" r="2.5" fill="#cc0000"/>
    <path d="M ${width/2-15} 32 Q ${width/2-15} 48, ${width/2} 48 Q ${width/2+15} 48, ${width/2+15} 32" fill="#bbddf5" stroke="#cc0000" stroke-width="0.8"/>
    <path d="M ${width/2-15} ${height-32} Q ${width/2-15} ${height-48}, ${width/2} ${height-48} Q ${width/2+15} ${height-48}, ${width/2+15} ${height-32}" fill="#bbddf5" stroke="#cc0000" stroke-width="0.8"/>
    ${pointsMarkup}
  </svg>`;
};

const generateQuickReportHTML = (measurement: any): string => {
  const measurementData = measurement.measurements || {};
  const rinkSVG = generateRinkSVGForExport(measurement);

  // Build two-column measurement table
  const entries = Object.entries(measurementData);
  const tableRows = [];
  for (let i = 0; i < entries.length; i += 2) {
    const [k1, v1] = entries[i];
    const pair = entries[i + 1];
    tableRows.push(`<tr>
      <td style="padding:3px 6px;border:1px solid #ddd;font-size:10px;">${escapeHtml(k1)}</td>
      <td style="padding:3px 6px;border:1px solid #ddd;text-align:right;font-size:10px;font-weight:bold;color:${getDepthColor(Number(v1))}">${Number(v1).toFixed(3)}"</td>
      ${pair ? `<td style="padding:3px 6px;border:1px solid #ddd;font-size:10px;">${escapeHtml(pair[0])}</td><td style="padding:3px 6px;border:1px solid #ddd;text-align:right;font-size:10px;font-weight:bold;color:${getDepthColor(Number(pair[1]))}">${Number(pair[1]).toFixed(3)}"</td>` : '<td style="border:1px solid #ddd;"></td><td style="border:1px solid #ddd;"></td>'}
    </tr>`);
  }

  const statusColor = measurement.status === 'good' ? '#155724' : measurement.status === 'warning' ? '#856404' : '#721c24';
  const statusBg = measurement.status === 'good' ? '#d4edda' : measurement.status === 'warning' ? '#fff3cd' : '#f8d7da';

  return `<!DOCTYPE html>
<html>
<head>
<title>Ice Depth Report</title>
<style>
  @page { size: letter portrait; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #222; margin: 0; padding: 0; }
  .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2.5px solid #0066cc; padding-bottom: 8px; margin-bottom: 10px; }
  .header-title { font-size: 18px; font-weight: bold; color: #0066cc; }
  .header-sub { font-size: 11px; color: #555; margin-top: 2px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-weight: bold; font-size: 10px; background: ${statusBg}; color: ${statusColor}; text-transform: uppercase; }
  .main { display: flex; gap: 14px; align-items: flex-start; }
  .rink-col { flex: 0 0 auto; }
  .right-col { flex: 1; display: flex; flex-direction: column; gap: 10px; }
  .info-row { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .info-item { padding: 5px 7px; background: #f4f6f8; border-radius: 4px; }
  .info-label { font-size: 8px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
  .info-value { font-size: 12px; font-weight: bold; margin-top: 1px; }
  .stats-row { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 6px; }
  .stat-box { text-align: center; padding: 6px 4px; background: #e8f4fc; border-radius: 4px; }
  .stat-value { font-size: 16px; font-weight: bold; color: #0066cc; }
  .stat-label { font-size: 8px; color: #666; margin-top: 1px; }
  .section-title { font-size: 11px; font-weight: bold; color: #333; margin-bottom: 4px; border-bottom: 1px solid #e0e0e0; padding-bottom: 2px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #0066cc; color: white; padding: 4px 6px; font-size: 9px; text-align: left; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
  .legend-item { display: flex; align-items: center; gap: 3px; font-size: 8.5px; color: #444; }
  .legend-dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
  .footer { text-align: center; margin-top: 10px; padding-top: 6px; border-top: 1px solid #ddd; font-size: 8px; color: #888; }
  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="header-title">Ice Depth Measurement Report</div>
      <div class="header-sub">${escapeHtml(measurement.facilities?.name) || "Facility"} — ${escapeHtml(measurement.rinks?.name) || "Rink"}</div>
    </div>
    <div style="text-align:right;">
      <div class="badge">${escapeHtml(measurement.status)}</div>
      <div style="font-size:9px;color:#888;margin-top:4px;">Generated ${dateFnsFormat(new Date(), "PP p")}</div>
    </div>
  </div>

  <div class="main">
    <div class="rink-col">
      ${rinkSVG}
      <div class="legend">
        <div class="legend-item"><span class="legend-dot" style="background:#ef4444;"></span>&lt;1.0" Critical</div>
        <div class="legend-item"><span class="legend-dot" style="background:#22c55e;"></span>1.0–1.75" Good</div>
        <div class="legend-item"><span class="legend-dot" style="background:#3b82f6;"></span>1.75–2.0" Monitor</div>
        <div class="legend-item"><span class="legend-dot" style="background:#eab308;"></span>&gt;2.0" Warning</div>
      </div>
    </div>

    <div class="right-col">
      <div>
        <div class="section-title">Details</div>
        <div class="info-row">
          <div class="info-item"><div class="info-label">Date</div><div class="info-value">${dateFnsFormat(new Date(measurement.measurement_date), "PP")}</div></div>
          <div class="info-item"><div class="info-label">Time</div><div class="info-value">${dateFnsFormat(new Date(measurement.measurement_date), "p")}</div></div>
          <div class="info-item"><div class="info-label">Template</div><div class="info-value">${escapeHtml(measurement.template_type)}</div></div>
          <div class="info-item"><div class="info-label">Operator</div><div class="info-value">${escapeHtml(measurement.profiles?.name) || "—"}</div></div>
        </div>
      </div>

      <div>
        <div class="section-title">Statistics</div>
        <div class="stats-row">
          <div class="stat-box"><div class="stat-value">${measurement.min_depth}"</div><div class="stat-label">Min</div></div>
          <div class="stat-box"><div class="stat-value">${measurement.max_depth}"</div><div class="stat-label">Max</div></div>
          <div class="stat-box"><div class="stat-value">${measurement.avg_depth}"</div><div class="stat-label">Avg</div></div>
          <div class="stat-box"><div class="stat-value">${measurement.std_deviation}"</div><div class="stat-label">Std Dev</div></div>
        </div>
      </div>

      <div>
        <div class="section-title">All Measurements</div>
        <table>
          <thead><tr><th>Point</th><th style="text-align:right;">Depth</th><th>Point</th><th style="text-align:right;">Depth</th></tr></thead>
          <tbody>${tableRows.join('')}</tbody>
        </table>
      </div>

      ${measurement.ai_analysis ? `
      <div>
        <div class="section-title">AI Analysis</div>
        <div style="background:#f8f9fa;padding:8px;border-radius:4px;border-left:3px solid #0066cc;font-size:10px;line-height:1.5;">${escapeHtml(measurement.ai_analysis).replace(/\n/g,'<br/>')}</div>
      </div>` : ''}
    </div>
  </div>

  <div class="footer">Ice Depth Monitoring System</div>
</body>
</html>`;
};

export const IceDepthHistory = () => {
  const { toast } = useToast();
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeasurement, setSelectedMeasurement] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMeasurements();
  }, []);

  const fetchMeasurements = async () => {
    try {
      const { data, error } = await supabase
        .from("ice_depth_measurements")
        .select(`
          *,
          rinks (name),
          facilities (name)
        `)
        .order("measurement_date", { ascending: false })
        .limit(50);

      if (error) throw error;
      setMeasurements(data || []);
    } catch (error: any) {
      console.error("Fetch error:", error);
      toast({
        title: "Error",
        description: "Failed to load measurement history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "good":
        return <Badge variant="default">Good</Badge>;
      case "warning":
        return <Badge variant="secondary">Warning</Badge>;
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleViewDetails = (measurement: any) => {
    setSelectedMeasurement(measurement);
    setShowDetails(true);
  };

  const handleExportPDF = async (measurement: any) => {
    setExportingId(measurement.id);
    try {
      const filename = `ice-depth-report-${measurement.facilities?.name || "facility"}-${dateFnsFormat(new Date(measurement.measurement_date), "yyyy-MM-dd")}.pdf`;
      await generatePdfFromHtml(generateQuickReportHTML(measurement), filename);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to generate PDF", variant: "destructive" });
    } finally {
      setExportingId(null);
    }
  };

  if (loading) {
    return (
      <Card className="shadow-[var(--shadow-ice)]">
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading measurement history...
        </CardContent>
      </Card>
    );
  }

  if (measurements.length === 0) {
    return (
      <Card className="shadow-[var(--shadow-ice)]">
        <CardContent className="py-8 text-center text-muted-foreground">
          No measurements recorded yet
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-[var(--shadow-ice)]">
        <CardHeader>
          <CardTitle>Measurement History</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {measurements.map((measurement) => (
                <Card key={measurement.id} className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {measurement.facilities?.name} - {measurement.rinks?.name}
                          </h3>
                          {getStatusBadge(measurement.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(measurement.measurement_date), "PPP p")}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <TrendingDown className="h-4 w-4 text-muted-foreground" />
                            <span>Min: {measurement.min_depth}"</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span>Max: {measurement.max_depth}"</span>
                          </div>
                          <span>Avg: {measurement.avg_depth}"</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportPDF(measurement)}
                          disabled={exportingId === measurement.id}
                        >
                          {exportingId === measurement.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4 mr-2" />
                          )}
                          Export PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(measurement)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Measurement Details</DialogTitle>
          </DialogHeader>
          {selectedMeasurement && (
            <div className="space-y-4">
              {/* Export actions */}
              <IceDepthReportExport measurement={selectedMeasurement} />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Facility</p>
                  <p className="font-medium">{selectedMeasurement.facilities?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rink</p>
                  <p className="font-medium">{selectedMeasurement.rinks?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Template</p>
                  <p className="font-medium">{selectedMeasurement.template_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedMeasurement.status)}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 pt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Min Depth</p>
                  <p className="text-xl font-bold">{selectedMeasurement.min_depth}"</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Max Depth</p>
                  <p className="text-xl font-bold">{selectedMeasurement.max_depth}"</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Depth</p>
                  <p className="text-xl font-bold">{selectedMeasurement.avg_depth}"</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Std Dev</p>
                  <p className="text-xl font-bold">{selectedMeasurement.std_deviation}"</p>
                </div>
              </div>

              {selectedMeasurement.ai_analysis && (
                <div className="pt-4">
                  <p className="text-sm text-muted-foreground mb-2">AI Analysis</p>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="whitespace-pre-wrap text-sm">{selectedMeasurement.ai_analysis}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};