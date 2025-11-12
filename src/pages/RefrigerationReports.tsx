import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { format, subDays } from "date-fns";
import { Calendar, Download, ArrowLeft } from "lucide-react";

interface LogEntry {
  id: string;
  log_date: string;
  readings: any;
  checklist_items: any;
  notes: string;
  profiles: { name: string };
}

export default function RefrigerationReports() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
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
      const { data, error } = await supabase
        .from("refrigeration_logs")
        .select("*")
        .eq("facility_id", facilityId)
        .gte("log_date", startDate)
        .lte("log_date", endDate + "T23:59:59")
        .order("log_date", { ascending: false });

      if (data) {
        const operatorIds = [...new Set(data.map(log => log.operator_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, name")
          .in("user_id", operatorIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);
        const logsWithProfiles = data.map(log => ({
          ...log,
          profiles: { name: profileMap.get(log.operator_id) || "Unknown" }
        }));
        setLogs(logsWithProfiles);
      }

      if (error) throw error;
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast({ title: "Error loading reports", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (logs.length === 0) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }

    const headers = ["Date", "Operator", "Notes"];
    const rows = logs.map(log => [
      format(new Date(log.log_date), "yyyy-MM-dd HH:mm"),
      log.profiles?.name || "Unknown",
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Refrigeration Reports</h1>
          <p className="text-muted-foreground">View historical refrigeration log data</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/refrigeration-log")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Log
        </Button>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Date Range
        </h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate}
            />
          </div>
          <div className="flex-1">
            <Label>End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              max={format(new Date(), "yyyy-MM-dd")}
            />
          </div>
          <Button onClick={fetchLogs} disabled={loading}>
            {loading ? "Loading..." : "Generate Report"}
          </Button>
          <Button variant="outline" onClick={exportToCSV} disabled={logs.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </Card>

      {logs.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Log Entries ({logs.length})</h2>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Equipment Readings</TableHead>
                  <TableHead>Checklist Complete</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell>{format(new Date(log.log_date), "MMM dd, yyyy HH:mm")}</TableCell>
                    <TableCell>{log.profiles?.name || "Unknown"}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {Object.keys(log.readings || {}).length} equipment entries
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {Object.values(log.checklist_items || {}).filter(Boolean).length} / {Object.keys(log.checklist_items || {}).length} items
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{log.notes || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
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
