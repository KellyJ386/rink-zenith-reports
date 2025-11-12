import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Users, MapPin, Building } from "lucide-react";

const ScheduleReports = () => {
  const reportTypes = [
    {
      title: "Individual Staff Report",
      description: "Detailed activity report for a single staff member",
      icon: Users,
      color: "from-primary to-accent",
    },
    {
      title: "Area Report",
      description: "Coverage analysis by facility area",
      icon: MapPin,
      color: "from-ice-blue to-primary",
    },
    {
      title: "Facility Report",
      description: "Comprehensive facility-wide operations report",
      icon: Building,
      color: "from-ice-glacier to-accent",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Scheduling Reports</h2>
        <p className="text-muted-foreground">Generate insights and analytics</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {reportTypes.map((report, index) => {
          const Icon = report.icon;
          return (
            <Card key={index} className="hover:shadow-[var(--shadow-ice)] transition-all duration-300">
              <CardHeader>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${report.color} flex items-center justify-center mb-3`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">{report.title}</CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>Previously generated reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">Reporting features coming in Phase 6</p>
            <p className="text-sm">Staff, area, and facility reports will be available here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduleReports;
