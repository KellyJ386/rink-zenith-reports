import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { format, subDays } from "date-fns";
import { ArrowLeft, Download, AlertCircle, CheckCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface LogEntry {
  id: string;
  log_date: string;
  shift: string;
  notes: string;
  operator_id: string;
  compressor_readings: any[];
  condenser_readings: any[];
  plant_checklist: any[];
}

interface ChartData {
  date: string;
  [key: string]: any;
}

export default function RefrigerationDashboard() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedCompressor, setSelectedCompressor] = useState<string>("all");
  const [compressorNames, setCompressorNames] = useState<string[]>([]);
  const [facilityId, setFacilityId] = useState<string>("");

  useEffect(() => {
    initializeFacility();
  }, []);

  const initializeFacility = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("facility_id")
      .eq("user_id", user.id)
      .single();

    if (profile?.facility_id) {
      setFacilityId(profile.facility_id);
      fetchCompressorNames(profile.facility_id);
    }
  };

  const fetchCompressorNames = async (fId: string) => {
    const { data } = await supabase
      .from("compressor_readings")
      .select("compressor_name")
      .limit(100);

    if (data) {
      const uniqueNames = [...new Set(data.map(d => d.compressor_name))];
      setCompressorNames(uniqueNames);
    }
  };

  const fetchLogs = async () => {
    if (!facilityId) return;

    setLoading(true);
    try {
      const { data: logsData, error: logsError } = await supabase
        .from("refrigeration_logs")
        .select("*")
        .eq("facility_id", facilityId)
        .gte("log_date", startDate)
        .lte("log_date", endDate + "T23:59:59")
        .order("log_date", { ascending: false });

      if (logsError) throw logsError;

      if (logsData && logsData.length > 0) {
        const logIds = logsData.map(log => log.id);

        const [compressors, condensers, checklists] = await Promise.all([
          supabase.from("compressor_readings").select("*").in("log_id", logIds),
          supabase.from("condenser_readings").select("*").in("log_id", logIds),
          supabase.from("plant_checklist").select("*").in("log_id", logIds)
        ]);

        const enrichedLogs = logsData.map(log => ({
          ...log,
          compressor_readings: compressors.data?.filter(c => c.log_id === log.id) || [],
          condenser_readings: condensers.data?.filter(c => c.log_id === log.id) || [],
          plant_checklist: checklists.data?.filter(c => c.log_id === log.id) || []
        }));

        setLogs(enrichedLogs);
        prepareChartData(enrichedLogs);
      } else {
        setLogs([]);
        setChartData([]);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast({ title: "Error loading data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = (logsData: LogEntry[]) => {
    const data: ChartData[] = [];

    logsData.forEach(log => {
      const dateStr = format(new Date(log.log_date), "MMM dd HH:mm");
      
      const compReadings = log.compressor_readings || [];
      const condReadings = log.condenser_readings || [];

      if (selectedCompressor === "all") {
        compReadings.forEach((comp, idx) => {
          data.push({
            date: dateStr + ` (${comp.compressor_name})`,
            suctionPressure: comp.suction_pressure,
            dischargePressure: comp.discharge_pressure,
            temperature: comp.temperature,
            condenserTemp: condReadings[0]?.temperature || null
          });
        });
      } else {
        const filtered = compReadings.filter(c => c.compressor_name === selectedCompressor);
        filtered.forEach(comp => {
          data.push({
            date: dateStr,
            suctionPressure: comp.suction_pressure,
            dischargePressure: comp.discharge_pressure,
            temperature: comp.temperature,
            condenserTemp: condReadings[0]?.temperature || null
          });
        });
      }
    });

    setChartData(data.reverse());
  };

  useEffect(() => {
    if (logs.length > 0) {
      prepareChartData(logs);
    }
  }, [selectedCompressor]);

  const exportToCSV = () => {
    if (logs.length === 0) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }

    const headers = ["Date", "Shift", "Compressor", "Suction PSI", "Discharge PSI", "Oil Level", "Temp", "Notes"];
    const rows: string[][] = [];

    logs.forEach(log => {
      log.compressor_readings?.forEach(comp => {
        rows.push([
          format(new Date(log.log_date), "yyyy-MM-dd HH:mm"),
          log.shift,
          comp.compressor_name,
          comp.suction_pressure?.toString() || "",
          comp.discharge_pressure?.toString() || "",
          comp.oil_level,
          comp.temperature?.toString() || "",
          log.notes || ""
        ]);
      });
    });

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `refrigeration-logs-${startDate}-to-${endDate}.csv`;
    a.click();
  };

  const getStatusBadge = (log: LogEntry) => {
    const failedChecks = log.plant_checklist?.filter(c => !c.status).length || 0;
    const criticalOil = log.compressor_readings?.some(c => c.oil_level === "critical");

    if (criticalOil || failedChecks > 2) {
      return <Badge variant="destructive">Critical</Badge>;
    } else if (failedChecks > 0) {
      return <Badge variant="outline">Warning</Badge>;
    } else {
      return <Badge className="bg-green-500">Good</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Refrigeration Dashboard</h1>
          <p className="text-muted-foreground">Historical data and trends</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/refrigeration-log")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Log
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={format(new Date(), "yyyy-MM-dd")}
              />
            </div>
            <div>
              <Label>Compressor</Label>
              <Select value={selectedCompressor} onValueChange={setSelectedCompressor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Compressors</SelectItem>
                  {compressorNames.map(name => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchLogs} disabled={loading}>
                {loading ? "Loading..." : "Generate Report"}
              </Button>
              <Button variant="outline" onClick={exportToCSV} disabled={logs.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Temperature & Pressure Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="suctionPressure" stroke="#8884d8" name="Suction Pressure (PSI)" />
                <Line type="monotone" dataKey="dischargePressure" stroke="#82ca9d" name="Discharge Pressure (PSI)" />
                <Line type="monotone" dataKey="temperature" stroke="#ffc658" name="Compressor Temp (°F)" />
                <Line type="monotone" dataKey="condenserTemp" stroke="#ff7300" name="Condenser Temp (°F)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Log Entries ({logs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Compressors</TableHead>
                    <TableHead>Checklist</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell>{format(new Date(log.log_date), "MMM dd, yyyy HH:mm")}</TableCell>
                      <TableCell className="capitalize">{log.shift}</TableCell>
                      <TableCell>{getStatusBadge(log)}</TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          {log.compressor_readings?.map((comp, idx) => (
                            <div key={idx} className="flex items-center gap-1">
                              {comp.oil_level === "critical" ? (
                                <AlertCircle className="h-3 w-3 text-destructive" />
                              ) : (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              )}
                              <span>{comp.compressor_name}</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.plant_checklist?.filter(c => c.status).length}/{log.plant_checklist?.length || 0} passed
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{log.notes || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {logs.length === 0 && !loading && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No log entries found for the selected date range</p>
        </Card>
      )}
    </div>
  );
}
