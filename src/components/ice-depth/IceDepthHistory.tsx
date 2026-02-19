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

const generateQuickReportHTML = (measurement: any): string => {
  const measurementData = measurement.measurements || {};
  const pointsHtml = Object.entries(measurementData)
    .map(([key, value]: [string, any]) => `<tr><td style="padding:4px 8px;border:1px solid #ddd;">${escapeHtml(key)}</td><td style="padding:4px 8px;border:1px solid #ddd;text-align:right;">${Number(value).toFixed(3)}"</td></tr>`)
    .join("");
  return `<!DOCTYPE html><html><head><title>Ice Depth Report</title>
    <style>body{font-family:Arial,sans-serif;padding:20px;max-width:800px;margin:0 auto;}
    .header{text-align:center;border-bottom:2px solid #333;padding-bottom:15px;margin-bottom:20px;}
    .logo{font-size:22px;font-weight:bold;color:#0066cc;}
    .info-grid{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:20px;}
    .info-item{padding:8px;background:#f5f5f5;border-radius:4px;}
    .info-label{font-size:10px;color:#666;text-transform:uppercase;}
    .info-value{font-size:14px;font-weight:bold;margin-top:2px;}
    .stats-grid{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-bottom:20px;}
    .stat-box{text-align:center;padding:12px;background:#e8f4fc;border-radius:6px;}
    .stat-value{font-size:20px;font-weight:bold;color:#0066cc;}
    .stat-label{font-size:10px;color:#666;margin-top:2px;}
    table{width:100%;border-collapse:collapse;font-size:11px;}
    th{background:#0066cc;color:white;padding:8px;text-align:left;}
    .footer{text-align:center;margin-top:20px;padding-top:15px;border-top:1px solid #ddd;font-size:10px;color:#666;}
    </style></head><body>
    <div class="header">
      <div class="logo">Ice Depth Measurement Report</div>
      <div>${escapeHtml(measurement.facilities?.name) || "Facility"} - ${escapeHtml(measurement.rinks?.name) || "Rink"}</div>
    </div>
    <div class="info-grid">
      <div class="info-item"><div class="info-label">Date</div><div class="info-value">${dateFnsFormat(new Date(measurement.measurement_date), "PP")}</div></div>
      <div class="info-item"><div class="info-label">Time</div><div class="info-value">${dateFnsFormat(new Date(measurement.measurement_date), "p")}</div></div>
      <div class="info-item"><div class="info-label">Template</div><div class="info-value">${escapeHtml(measurement.template_type)}</div></div>
      <div class="info-item"><div class="info-label">Status</div><div class="info-value">${escapeHtml(measurement.status)}</div></div>
    </div>
    <div class="stats-grid">
      <div class="stat-box"><div class="stat-value">${measurement.min_depth}"</div><div class="stat-label">Minimum</div></div>
      <div class="stat-box"><div class="stat-value">${measurement.max_depth}"</div><div class="stat-label">Maximum</div></div>
      <div class="stat-box"><div class="stat-value">${measurement.avg_depth}"</div><div class="stat-label">Average</div></div>
      <div class="stat-box"><div class="stat-value">${measurement.std_deviation}"</div><div class="stat-label">Std Dev</div></div>
    </div>
    <table><thead><tr><th>Point</th><th>Depth</th></tr></thead><tbody>${pointsHtml}</tbody></table>
    <div class="footer"><p>Generated on ${dateFnsFormat(new Date(), "PPP p")}</p><p>Ice Depth Monitoring System</p></div>
    </body></html>`;
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