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

  // === Exact constants mirrored from USAHockeyRink.tsx ===
  const scale = 4;
  const rinkLength = 200 * scale;   // 800
  const rinkWidth = 85 * scale;     // 340
  const cornerRadius = 28 * scale;  // 112

  const goalLineFromBoards = 11 * scale; // 44
  const blueLineFromGoal = 64 * scale;   // 256
  const centerX = rinkLength / 2;        // 400
  const centerY = rinkWidth / 2;         // 170

  const faceoffFromCenter = 22 * scale;          // 88
  const neutralFaceoffFromBlue = 5 * scale;      // 20
  const endFaceoffFromGoal = 20 * scale;          // 80
  const faceoffCircleRadius = 15 * scale;         // 60

  const thinLine = 2;
  const thickLine = scale; // 4

  const redLine = '#c8102e';
  const blueLine = '#003087';
  const creaseBlue = '#a8d4f0';

  // Goal line Y intersect with rounded corners (same math as USAHockeyRink.tsx)
  const goalLineOffset = cornerRadius - goalLineFromBoards;
  const goalLineIntersectOffset = Math.sqrt(cornerRadius * cornerRadius - goalLineOffset * goalLineOffset);
  const goalLineYTop = cornerRadius - goalLineIntersectOffset;
  const goalLineYBottom = rinkWidth - cornerRadius + goalLineIntersectOffset;

  const leftGoalLine = goalLineFromBoards;
  const rightGoalLine = rinkLength - goalLineFromBoards;
  const leftBlueLine = goalLineFromBoards + blueLineFromGoal;
  const rightBlueLine = rinkLength - goalLineFromBoards - blueLineFromGoal;

  const neutralFaceoffX_left = leftBlueLine + neutralFaceoffFromBlue;
  const neutralFaceoffX_right = rightBlueLine - neutralFaceoffFromBlue;
  const endFaceoffX_left = leftGoalLine + endFaceoffFromGoal;
  const endFaceoffX_right = rightGoalLine - endFaceoffFromGoal;
  const faceoffY_top = centerY - faceoffFromCenter;
  const faceoffY_bottom = centerY + faceoffFromCenter;

  // Rink outline path (identical bezier corners)
  const rinkPath = `M ${cornerRadius} 0 L ${rinkLength - cornerRadius} 0 Q ${rinkLength} 0 ${rinkLength} ${cornerRadius} L ${rinkLength} ${rinkWidth - cornerRadius} Q ${rinkLength} ${rinkWidth} ${rinkLength - cornerRadius} ${rinkWidth} L ${cornerRadius} ${rinkWidth} Q 0 ${rinkWidth} 0 ${rinkWidth - cornerRadius} L 0 ${cornerRadius} Q 0 0 ${cornerRadius} 0 Z`;

  // Goal crease helper (same arc math)
  const goalCreaseSVG = (x: number, direction: 'left' | 'right'): string => {
    const creaseRadius = 6 * scale;
    const creaseHalfWidth = 4 * scale;
    const dir = direction === 'left' ? 1 : -1;
    const sideLen = Math.sqrt(creaseRadius * creaseRadius - creaseHalfWidth * creaseHalfWidth);
    const sweep = direction === 'left' ? 1 : 0;
    return `
      <path d="M ${x} ${centerY - creaseHalfWidth} L ${x + dir * sideLen} ${centerY - creaseHalfWidth} A ${creaseRadius} ${creaseRadius} 0 0 ${sweep} ${x + dir * sideLen} ${centerY + creaseHalfWidth} L ${x} ${centerY + creaseHalfWidth} Z" fill="${creaseBlue}" opacity="0.7"/>
      <line x1="${x}" y1="${centerY - creaseHalfWidth}" x2="${x + dir * sideLen}" y2="${centerY - creaseHalfWidth}" stroke="${redLine}" stroke-width="${thinLine}"/>
      <line x1="${x}" y1="${centerY + creaseHalfWidth}" x2="${x + dir * sideLen}" y2="${centerY + creaseHalfWidth}" stroke="${redLine}" stroke-width="${thinLine}"/>
      <path d="M ${x + dir * sideLen} ${centerY - creaseHalfWidth} A ${creaseRadius} ${creaseRadius} 0 0 ${sweep} ${x + dir * sideLen} ${centerY + creaseHalfWidth}" fill="none" stroke="${redLine}" stroke-width="${thinLine}"/>
    `;
  };

  // End zone faceoff circle helper
  const endZoneCircleSVG = (cx: number, cy: number): string => {
    const hashLen = 2 * scale;
    const hashDist = 2 * scale;
    const lLen = 4 * scale;
    const lW = 3 * scale;
    return `
      <circle cx="${cx}" cy="${cy}" r="${faceoffCircleRadius}" fill="none" stroke="${redLine}" stroke-width="${thinLine}"/>
      <circle cx="${cx}" cy="${cy}" r="${scale}" fill="${redLine}"/>
      <line x1="${cx - hashDist}" y1="${cy + (faceoffCircleRadius + 1)}" x2="${cx - hashDist}" y2="${cy + (faceoffCircleRadius + hashLen + 1)}" stroke="${redLine}" stroke-width="${thinLine}"/>
      <line x1="${cx + hashDist}" y1="${cy + (faceoffCircleRadius + 1)}" x2="${cx + hashDist}" y2="${cy + (faceoffCircleRadius + hashLen + 1)}" stroke="${redLine}" stroke-width="${thinLine}"/>
      <line x1="${cx - hashDist}" y1="${cy - (faceoffCircleRadius + 1)}" x2="${cx - hashDist}" y2="${cy - (faceoffCircleRadius + hashLen + 1)}" stroke="${redLine}" stroke-width="${thinLine}"/>
      <line x1="${cx + hashDist}" y1="${cy - (faceoffCircleRadius + 1)}" x2="${cx + hashDist}" y2="${cy - (faceoffCircleRadius + hashLen + 1)}" stroke="${redLine}" stroke-width="${thinLine}"/>
      <line x1="${cx - 4}" y1="${cy + 8}" x2="${cx - 4 - lW}" y2="${cy + 8}" stroke="${redLine}" stroke-width="${thinLine}"/>
      <line x1="${cx - 4}" y1="${cy + 8}" x2="${cx - 4}" y2="${cy + 8 + lLen}" stroke="${redLine}" stroke-width="${thinLine}"/>
      <line x1="${cx + 4}" y1="${cy + 8}" x2="${cx + 4 + lW}" y2="${cy + 8}" stroke="${redLine}" stroke-width="${thinLine}"/>
      <line x1="${cx + 4}" y1="${cy + 8}" x2="${cx + 4}" y2="${cy + 8 + lLen}" stroke="${redLine}" stroke-width="${thinLine}"/>
      <line x1="${cx - 4}" y1="${cy - 8}" x2="${cx - 4 - lW}" y2="${cy - 8}" stroke="${redLine}" stroke-width="${thinLine}"/>
      <line x1="${cx - 4}" y1="${cy - 8}" x2="${cx - 4}" y2="${cy - 8 - lLen}" stroke="${redLine}" stroke-width="${thinLine}"/>
      <line x1="${cx + 4}" y1="${cy - 8}" x2="${cx + 4 + lW}" y2="${cy - 8}" stroke="${redLine}" stroke-width="${thinLine}"/>
      <line x1="${cx + 4}" y1="${cy - 8}" x2="${cx + 4}" y2="${cy - 8 - lLen}" stroke="${redLine}" stroke-width="${thinLine}"/>
    `;
  };

  // Neutral zone faceoff spot
  const neutralSpotSVG = (cx: number, cy: number): string => `
    <circle cx="${cx}" cy="${cy}" r="${scale}" fill="${redLine}"/>
    <circle cx="${cx}" cy="${cy}" r="${scale * 1.5}" fill="none" stroke="${redLine}" stroke-width="${thinLine}"/>
  `;

  // Measurement points — same coordinate mapping as USAHockeyRink.tsx
  const pointsMarkup = points.map((point) => {
    const key = `Point ${point.id}`;
    const altKey = point.id.toString();
    const value = measurementData[key] ?? measurementData[altKey] ?? measurementData[point.name];
    if (value === undefined || value === null) return '';
    const svgX = (point.x / 100) * rinkLength;
    const svgY = (point.y / 100) * rinkWidth;
    const color = getDepthColor(value);
    const label = Number(value).toFixed(2);
    return `
      <circle cx="${svgX}" cy="${svgY}" r="14" fill="${color}" stroke="white" stroke-width="2"/>
      <text x="${svgX}" y="${svgY}" text-anchor="middle" dominant-baseline="central" fill="white" font-size="9" font-weight="bold" transform="rotate(-90,${svgX},${svgY})">${label}</text>
    `;
  }).join('');

  // viewBox matches React component: "-10 -10 {rinkWidth+20} {rinkLength+20}" = "-10 -10 360 820"
  // The rink group is rotated 90° clockwise around (rinkWidth/2, rinkWidth/2) = (170, 170)
  return `<svg viewBox="-10 -10 360 820" width="340" height="800" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;">
    <defs>
      <linearGradient id="iceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f0f7fc"/>
        <stop offset="50%" stop-color="#e8f4fc"/>
        <stop offset="100%" stop-color="#dceef8"/>
      </linearGradient>
    </defs>
    <g transform="rotate(90,170,170)">
      <path d="${rinkPath}" fill="url(#iceGrad)"/>
      <path d="${rinkPath}" fill="none" stroke="#000000" stroke-width="6"/>
      <line x1="${leftGoalLine}" y1="${goalLineYTop}" x2="${leftGoalLine}" y2="${goalLineYBottom}" stroke="${redLine}" stroke-width="${thinLine}"/>
      <line x1="${rightGoalLine}" y1="${goalLineYTop}" x2="${rightGoalLine}" y2="${goalLineYBottom}" stroke="${redLine}" stroke-width="${thinLine}"/>
      <rect x="${leftBlueLine - thickLine / 2}" y="0" width="${thickLine}" height="${rinkWidth}" fill="${blueLine}"/>
      <rect x="${rightBlueLine - thickLine / 2}" y="0" width="${thickLine}" height="${rinkWidth}" fill="${blueLine}"/>
      <rect x="${centerX - thickLine / 2}" y="0" width="${thickLine}" height="${rinkWidth}" fill="${redLine}"/>
      <circle cx="${centerX}" cy="${centerY}" r="${faceoffCircleRadius}" fill="none" stroke="${blueLine}" stroke-width="${thinLine}"/>
      <circle cx="${centerX}" cy="${centerY}" r="${scale / 2}" fill="${blueLine}"/>
      ${goalCreaseSVG(leftGoalLine, 'left')}
      ${goalCreaseSVG(rightGoalLine, 'right')}
      <circle cx="${leftGoalLine}" cy="${centerY - 3 * scale}" r="2" fill="${redLine}"/>
      <circle cx="${leftGoalLine}" cy="${centerY + 3 * scale}" r="2" fill="${redLine}"/>
      <circle cx="${rightGoalLine}" cy="${centerY - 3 * scale}" r="2" fill="${redLine}"/>
      <circle cx="${rightGoalLine}" cy="${centerY + 3 * scale}" r="2" fill="${redLine}"/>
      ${endZoneCircleSVG(endFaceoffX_left, faceoffY_top)}
      ${endZoneCircleSVG(endFaceoffX_left, faceoffY_bottom)}
      ${endZoneCircleSVG(endFaceoffX_right, faceoffY_top)}
      ${endZoneCircleSVG(endFaceoffX_right, faceoffY_bottom)}
      ${neutralSpotSVG(neutralFaceoffX_left, faceoffY_top)}
      ${neutralSpotSVG(neutralFaceoffX_left, faceoffY_bottom)}
      ${neutralSpotSVG(neutralFaceoffX_right, faceoffY_top)}
      ${neutralSpotSVG(neutralFaceoffX_right, faceoffY_bottom)}
      ${pointsMarkup}
    </g>
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
  @page { size: letter portrait; margin: 6mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 10px; color: #222; margin: 0; padding: 0; height: 100%; }
  .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2.5px solid #0066cc; padding-bottom: 5px; margin-bottom: 6px; }
  .header-title { font-size: 15px; font-weight: bold; color: #0066cc; }
  .header-sub { font-size: 9px; color: #555; margin-top: 2px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-weight: bold; font-size: 10px; background: ${statusBg}; color: ${statusColor}; text-transform: uppercase; }
  .split { display: flex; gap: 8px; align-items: flex-start; }
  .left-col { flex: 0 0 48%; display: flex; flex-direction: column; align-items: center; }
  .right-col { flex: 1; display: flex; flex-direction: column; gap: 5px; }
  .rink-wrap { width: 100%; text-align: center; }
  .rink-wrap svg { display: block; margin: 0 auto; width: 100%; height: auto; }
  .legend { display: flex; flex-wrap: wrap; gap: 5px; justify-content: center; margin-top: 5px; }
  .legend-item { display: flex; align-items: center; gap: 3px; font-size: 8px; color: #444; }
  .legend-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
  .stats-row { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 4px; }
  .stat-box { text-align: center; padding: 4px 2px; background: #e8f4fc; border-radius: 4px; }
  .stat-value { font-size: 13px; font-weight: bold; color: #0066cc; }
  .stat-label { font-size: 7px; color: #666; margin-top: 1px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
  .info-item { padding: 3px 5px; background: #f4f6f8; border-radius: 4px; }
  .info-label { font-size: 7px; color: #888; text-transform: uppercase; letter-spacing: 0.4px; }
  .info-value { font-size: 10px; font-weight: bold; margin-top: 1px; }
  .section-title { font-size: 9px; font-weight: bold; color: #333; margin-bottom: 2px; border-bottom: 1px solid #e0e0e0; padding-bottom: 2px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #0066cc; color: white; padding: 3px 4px; font-size: 8px; text-align: left; }
  td { padding: 2px 4px; border: 1px solid #ddd; font-size: 9px; }
  .footer { text-align: center; margin-top: 5px; padding-top: 3px; border-top: 1px solid #ddd; font-size: 7px; color: #888; }
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
      <div style="font-size:8px;color:#888;margin-top:3px;">Generated ${dateFnsFormat(new Date(), "PP p")}</div>
    </div>
  </div>

  <div class="split">
    <!-- LEFT: Rink Diagram -->
    <div class="left-col">
      <div class="rink-wrap">
        ${rinkSVG}
      </div>
      <div class="legend">
        <div class="legend-item"><span class="legend-dot" style="background:#ef4444;"></span>&lt;1.0" Critical</div>
        <div class="legend-item"><span class="legend-dot" style="background:#22c55e;"></span>1.0–1.75" Good</div>
        <div class="legend-item"><span class="legend-dot" style="background:#3b82f6;"></span>1.75–2.0" Monitor</div>
        <div class="legend-item"><span class="legend-dot" style="background:#eab308;"></span>&gt;2.0" Warning</div>
      </div>
    </div>

    <!-- RIGHT: Stats + Info + Measurements -->
    <div class="right-col">
      <div class="stats-row">
        <div class="stat-box"><div class="stat-value">${measurement.min_depth}"</div><div class="stat-label">Min</div></div>
        <div class="stat-box"><div class="stat-value">${measurement.max_depth}"</div><div class="stat-label">Max</div></div>
        <div class="stat-box"><div class="stat-value">${measurement.avg_depth}"</div><div class="stat-label">Avg</div></div>
        <div class="stat-box"><div class="stat-value">${measurement.std_deviation}"</div><div class="stat-label">Std Dev</div></div>
      </div>

      <div class="info-grid">
        <div class="info-item"><div class="info-label">Date</div><div class="info-value">${dateFnsFormat(new Date(measurement.measurement_date), "PP")}</div></div>
        <div class="info-item"><div class="info-label">Time</div><div class="info-value">${dateFnsFormat(new Date(measurement.measurement_date), "p")}</div></div>
        <div class="info-item"><div class="info-label">Template</div><div class="info-value">${escapeHtml(measurement.template_type)}</div></div>
        <div class="info-item"><div class="info-label">Operator</div><div class="info-value">${escapeHtml(measurement.profiles?.name) || "—"}</div></div>
      </div>

      <div>
        <div class="section-title">All Measurements</div>
        <table>
          <thead><tr><th>Point</th><th style="text-align:right;">Depth</th><th>Point</th><th style="text-align:right;">Depth</th></tr></thead>
          <tbody>${(() => {
            const entries = Object.entries(measurementData);
            const rows = [];
            for (let i = 0; i < entries.length; i += 2) {
              const [k1, v1] = entries[i];
              const p2 = entries[i + 1];
              rows.push(`<tr>
                <td>${escapeHtml(k1)}</td>
                <td style="text-align:right;font-weight:bold;color:${getDepthColor(Number(v1))}">${Number(v1).toFixed(3)}"</td>
                ${p2 ? `<td>${escapeHtml(p2[0])}</td><td style="text-align:right;font-weight:bold;color:${getDepthColor(Number(p2[1]))}">${Number(p2[1]).toFixed(3)}"</td>` : '<td></td><td></td>'}
              </tr>`);
            }
            return rows.join('');
          })()}</tbody>
        </table>
      </div>

      ${measurement.ai_analysis ? `
      <div>
        <div class="section-title">AI Analysis</div>
        <div style="background:#f8f9fa;padding:5px;border-radius:4px;border-left:3px solid #0066cc;font-size:8px;line-height:1.5;">${escapeHtml(measurement.ai_analysis).replace(/\n/g,'<br/>')}</div>
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