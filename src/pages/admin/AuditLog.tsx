import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import { FileText, Search, Download, Filter } from "lucide-react";
import { format } from "date-fns";

interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  target_name: string | null;
  changes: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

const AuditLog = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>("all");

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error("Error loading audit logs:", error);
    } else {
      setLogs((data || []) as AuditLog[]);
    }
    setLoading(false);
  };

  const getActionColor = (action: string) => {
    if (action.includes("created") || action.includes("added")) return "bg-green-500/10 text-green-600";
    if (action.includes("updated") || action.includes("modified")) return "bg-blue-500/10 text-blue-600";
    if (action.includes("deleted") || action.includes("removed")) return "bg-red-500/10 text-red-600";
    return "bg-muted text-muted-foreground";
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchTerm === "" ||
      log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === "all" || log.action.includes(actionFilter);
    const matchesTargetType = targetTypeFilter === "all" || log.target_type === targetTypeFilter;

    return matchesSearch && matchesAction && matchesTargetType;
  });

  const uniqueActions = [...new Set(logs.map((l) => l.action.split(" ")[0]))];
  const uniqueTargetTypes = [...new Set(logs.map((l) => l.target_type).filter(Boolean))];

  const exportToCSV = () => {
    const headers = ["Timestamp", "User", "Action", "Target Type", "Target Name", "Changes"];
    const rows = filteredLogs.map((log) => [
      format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
      log.user_name,
      log.action,
      log.target_type || "",
      log.target_name || "",
      log.changes ? JSON.stringify(log.changes) : "",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        subtitle="Complete history of all administrative actions"
        icon={<FileText className="h-8 w-8 text-primary" />}
        actions={
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>Search and filter audit log entries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user, action, or target..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Action Type</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {uniqueActions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target Type</Label>
              <Select value={targetTypeFilter} onValueChange={setTargetTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueTargetTypes.map((type) => (
                    <SelectItem key={type} value={type!}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity History</CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} of {logs.length} entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No audit log entries found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {format(new Date(log.created_at), "MMM d, yyyy")}
                      <br />
                      <span className="text-muted-foreground">
                        {format(new Date(log.created_at), "h:mm a")}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{log.user_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getActionColor(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.target_type && (
                        <span className="text-xs text-muted-foreground">{log.target_type}: </span>
                      )}
                      {log.target_name || "-"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {log.changes ? JSON.stringify(log.changes).slice(0, 50) + "..." : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLog;
