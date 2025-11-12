import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { format, subDays } from "date-fns";
import PageHeader from "@/components/PageHeader";
import { Download, AlertCircle, CheckCircle, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface LogEntry {
  id: string;
  log_date: string;
  reading_number: number;
  temperature_unit: string;
  suction_pressure: number | null;
  discharge_pressure: number | null;
  oil_pressure: number | null;
  compressor_amps: number | null;
  oil_temperature: number | null;
  condenser_fan_status: string | null;
  ambient_temperature: number | null;
  condenser_pressure: number | null;
  water_temp_in: number | null;
  water_temp_out: number | null;
  evaporator_pressure: number | null;
  brine_temp_supply: number | null;
  brine_temp_return: number | null;
  brine_flow_rate: number | null;
  ice_surface_temp: number | null;
  notes: string | null;
}

interface ChartData {
  date: string;
  suctionPressure: number | null;
  dischargePressure: number | null;
  oilTemp: number | null;
  brineSupply: number | null;
}

export default function RefrigerationDashboard() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
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

      if (logsData) {
        setLogs(logsData);
        prepareChartData(logsData);
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
    const data: ChartData[] = logsData.map(log => ({
      date: format(new Date(log.log_date), "MMM dd HH:mm"),
      suctionPressure: log.suction_pressure,
      dischargePressure: log.discharge_pressure,
      oilTemp: log.oil_temperature,
      brineSupply: log.brine_temp_supply
    }));

    setChartData(data.reverse());
  };

  const exportToCSV = () => {
    if (logs.length === 0) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }

    const headers = ["Date", "Reading #", "Suction PSI", "Discharge PSI", "Oil PSI", "Amps", "Oil Temp", "Brine Supply", "Notes"];
    const rows: string[][] = logs.map(log => [
      format(new Date(log.log_date), "yyyy-MM-dd HH:mm"),
      log.reading_number.toString(),
      log.suction_pressure?.toString() || "",
      log.discharge_pressure?.toString() || "",
      log.oil_pressure?.toString() || "",
      log.compressor_amps?.toString() || "",
      log.oil_temperature?.toString() || "",
      log.brine_temp_supply?.toString() || "",
      log.notes || ""
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `refrigeration-logs-${startDate}-to-${endDate}.csv`;
    a.click();
  };

  const getStatusBadge = (log: LogEntry) => {
    const issues: string[] = [];

    if (log.suction_pressure && (log.suction_pressure < 15 || log.suction_pressure > 35)) {
      issues.push("suction");
    }
    if (log.discharge_pressure && (log.discharge_pressure < 180 || log.discharge_pressure > 220)) {
      issues.push("discharge");
    }
    if (log.condenser_fan_status === "all_off") {
      issues.push("fans");
    }

    if (issues.length > 2) {
      return <Badge variant="destructive">Critical</Badge>;
    } else if (issues.length > 0) {
      return <Badge variant="outline">Warning</Badge>;
    } else {
      return <Badge className="bg-green-500">Normal</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Refrigeration Dashboard"
        subtitle="Historical equipment data and trends"
        icon={<BarChart3 className="h-8 w-8 text-primary" />}
        actions={
          <Button onClick={() => navigate("/refrigeration-log")}>
            New Log Entry
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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
            <CardTitle>Pressure & Temperature Trends</CardTitle>
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
                <Line type="monotone" dataKey="oilTemp" stroke="#ffc658" name="Oil Temp" />
                <Line type="monotone" dataKey="brineSupply" stroke="#ff7300" name="Brine Supply Temp" />
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
                    <TableHead>Reading #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Suction (PSI)</TableHead>
                    <TableHead>Discharge (PSI)</TableHead>
                    <TableHead>Oil Temp</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell>{format(new Date(log.log_date), "MMM dd, yyyy HH:mm")}</TableCell>
                      <TableCell>{log.reading_number}</TableCell>
                      <TableCell>{getStatusBadge(log)}</TableCell>
                      <TableCell>
                        {log.suction_pressure ? (
                          <div className="flex items-center gap-1">
                            {log.suction_pressure < 15 || log.suction_pressure > 35 ? (
                              <AlertCircle className="h-3 w-3 text-destructive" />
                            ) : (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            )}
                            {log.suction_pressure}
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        {log.discharge_pressure ? (
                          <div className="flex items-center gap-1">
                            {log.discharge_pressure < 180 || log.discharge_pressure > 220 ? (
                              <AlertCircle className="h-3 w-3 text-destructive" />
                            ) : (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            )}
                            {log.discharge_pressure}
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell>{log.oil_temperature || "-"}</TableCell>
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
