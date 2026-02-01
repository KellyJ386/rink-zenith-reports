import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
import IncidentPDFExport from "@/components/incident/IncidentPDFExport";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, Plus, Download, Filter, Search, FileText, Printer, Mail } from "lucide-react";
import { format } from "date-fns";
import { generatePdfFromHtml, escapeHtml } from "@/lib/pdfUtils";

interface Incident {
  id: string;
  incident_number: string;
  incident_date: string;
  incident_time: string;
  location: string;
  incident_type: string;
  severity_level: string;
  injured_person_name: string;
  status: string;
  staff_name: string;
  created_at: string;
}

export default function IncidentHistory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [showPDFDialog, setShowPDFDialog] = useState(false);

  useEffect(() => {
    loadIncidents();
  }, []);

  useEffect(() => {
    filterIncidents();
  }, [searchTerm, filterType, filterSeverity, incidents]);

  const loadIncidents = async () => {
    try {
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

      if (!profile?.facility_id) return;

      const { data, error } = await supabase
        .from("incidents")
        .select("*")
        .eq("facility_id", profile.facility_id)
        .order("incident_date", { ascending: false })
        .order("incident_time", { ascending: false });

      if (error) throw error;
      if (data) {
        setIncidents(data);
        setFilteredIncidents(data);
      }
    } catch (error) {
      console.error("Error loading incidents:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterIncidents = () => {
    let filtered = [...incidents];

    if (searchTerm) {
      filtered = filtered.filter(
        (incident) =>
          incident.incident_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          incident.injured_person_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          incident.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter((incident) => incident.incident_type === filterType);
    }

    if (filterSeverity !== "all") {
      filtered = filtered.filter((incident) => incident.severity_level === filterSeverity);
    }

    setFilteredIncidents(filtered);
  };

  const exportToCSV = () => {
    const headers = [
      "Incident Number",
      "Date",
      "Time",
      "Location",
      "Type",
      "Severity",
      "Injured Person",
      "Status",
      "Reported By"
    ];
    const rows = filteredIncidents.map((inc) => [
      inc.incident_number,
      format(new Date(inc.incident_date), "yyyy-MM-dd"),
      inc.incident_time,
      inc.location,
      inc.incident_type,
      inc.severity_level,
      inc.injured_person_name,
      inc.status,
      inc.staff_name
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `incidents-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const viewIncidentPDF = async (incidentId: string) => {
    const { data } = await supabase
      .from("incidents")
      .select("*, facilities(name)")
      .eq("id", incidentId)
      .single();

    if (data) {
      const facilityData = data.facilities as any;
      setSelectedIncident({
        ...data,
        facility_name: facilityData?.name || "Main Arena"
      });
      setShowPDFDialog(true);
    }
  };

  const printPDF = () => {
    window.print();
  };

  const downloadPDF = async () => {
    const element = document.getElementById("incident-pdf-content");
    if (!element || !selectedIncident) return;

    try {
      // Clone the element and generate a complete HTML document
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Incident Report - ${escapeHtml(selectedIncident.incident_number)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            @media print {
              @page { size: A4; margin: 1cm; }
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${element.outerHTML}
        </body>
        </html>
      `;
      
      await generatePdfFromHtml(htmlContent, `incident-${selectedIncident.incident_number}.pdf`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  const emailPDF = async () => {
    if (!selectedIncident) return;
    
    // For now, just use the existing notification function
    try {
      const { error } = await supabase.functions.invoke("send-incident-notification", {
        body: {
          incidentNumber: selectedIncident.incident_number,
          incidentDate: selectedIncident.incident_date,
          incidentTime: selectedIncident.incident_time,
          location: selectedIncident.location,
          incidentType: selectedIncident.incident_type,
          severityLevel: selectedIncident.severity_level,
          injuredPersonName: selectedIncident.injured_person_name,
          incidentDescription: selectedIncident.incident_description,
          staffName: selectedIncident.staff_name,
          facilityName: selectedIncident.facility_name,
          recipientEmails: [selectedIncident.staff_email].filter(Boolean)
        }
      });

      if (error) throw error;
      
      toast({
        title: "Email Sent",
        description: "Incident report notification has been sent",
      });
    } catch (error: any) {
      console.error("Email error:", error);
      toast({
        title: "Error",
        description: "Failed to send email notification",
        variant: "destructive",
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, "default" | "secondary" | "destructive"> = {
      minor: "secondary",
      moderate: "default",
      serious: "destructive",
      critical: "destructive"
    };
    return colors[severity] || "default";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, "default" | "secondary" | "destructive"> = {
      submitted: "default",
      under_review: "secondary",
      closed: "secondary"
    };
    return colors[status] || "default";
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <PageHeader
        title="Incident History"
        subtitle="View and manage all incident reports"
        icon={<AlertCircle className="h-8 w-8 text-destructive" />}
        actions={
          <Button onClick={() => navigate("/incident-report")}>
            <Plus className="h-4 w-4 mr-2" />
            Report Incident
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incidents.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Critical/Serious</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {incidents.filter((i) => i.severity_level === "critical" || i.severity_level === "serious").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Under Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {incidents.filter((i) => i.status === "under_review").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                incidents.filter(
                  (i) =>
                    new Date(i.incident_date).getMonth() === new Date().getMonth() &&
                    new Date(i.incident_date).getFullYear() === new Date().getFullYear()
                ).length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Incidents</CardTitle>
              <CardDescription>Search and filter incident reports</CardDescription>
            </div>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search incidents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="slip_fall">Slip/Fall</SelectItem>
                <SelectItem value="collision">Collision</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="medical_emergency">Medical Emergency</SelectItem>
                <SelectItem value="property_damage">Property Damage</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="minor">Minor</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="serious">Serious</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Incident #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Injured Person</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reported By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIncidents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    No incidents found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredIncidents.map((incident) => (
                  <TableRow key={incident.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{incident.incident_number}</TableCell>
                    <TableCell>{format(new Date(incident.incident_date), "MMM dd, yyyy")}</TableCell>
                    <TableCell>{incident.incident_time}</TableCell>
                    <TableCell className="capitalize">{incident.location.replace(/_/g, " ")}</TableCell>
                    <TableCell className="capitalize">{incident.incident_type.replace(/_/g, " ")}</TableCell>
                    <TableCell>
                      <Badge variant={getSeverityColor(incident.severity_level)} className="capitalize">
                        {incident.severity_level}
                      </Badge>
                    </TableCell>
                    <TableCell>{incident.injured_person_name}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(incident.status)} className="capitalize">
                        {incident.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{incident.staff_name}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewIncidentPDF(incident.id)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* PDF Export Dialog */}
      <Dialog open={showPDFDialog} onOpenChange={setShowPDFDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Incident Report - PDF View</span>
              <div className="flex gap-2">
                <Button onClick={printPDF} variant="outline" size="sm">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button onClick={downloadPDF} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button onClick={emailPDF} variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedIncident && <IncidentPDFExport incident={selectedIncident} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
