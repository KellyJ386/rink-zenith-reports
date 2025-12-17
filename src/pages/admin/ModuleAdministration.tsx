import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Snowflake,
  Wrench,
  Thermometer,
  Wind,
  Calendar,
  AlertCircle,
  MessageSquare,
  Shield,
  ExternalLink,
} from "lucide-react";

const ModuleAdministration = () => {
  const navigate = useNavigate();

  const modules = [
    {
      title: "Ice Depth Log",
      icon: Snowflake,
      color: "from-ice-glacier to-ice-blue",
      path: "/ice-depth",
      implemented: true,
      hasFormBuilder: false,
    },
    {
      title: "Ice Maintenance",
      icon: Wrench,
      color: "from-primary to-ice-glacier",
      path: "/ice-maintenance",
      implemented: true,
      hasFormBuilder: true,
    },
    {
      title: "Refrigeration Log",
      icon: Thermometer,
      color: "from-accent to-ice-arctic",
      path: "/refrigeration-log",
      implemented: true,
      hasFormBuilder: true,
    },
    {
      title: "Air Quality",
      icon: Wind,
      color: "from-ice-arctic to-secondary",
      path: "/air-quality",
      implemented: true,
      hasFormBuilder: true,
    },
    {
      title: "Employee Scheduling",
      icon: Calendar,
      color: "from-ice-blue to-primary",
      path: "/schedule/calendar",
      implemented: true,
      hasFormBuilder: false,
    },
    {
      title: "Incident Reports",
      icon: AlertCircle,
      color: "from-destructive/80 to-destructive/60",
      path: "/incident-report",
      implemented: true,
      hasFormBuilder: true,
    },
    {
      title: "Daily Reports",
      icon: MessageSquare,
      color: "from-primary to-accent",
      path: "/daily-reports",
      implemented: true,
      hasFormBuilder: true,
    },
    {
      title: "Communications Log",
      icon: MessageSquare,
      color: "from-primary to-accent",
      path: null,
      implemented: false,
      hasFormBuilder: false,
    },
    {
      title: "Safety & Compliance",
      icon: Shield,
      color: "from-ice-glacier to-accent",
      path: null,
      implemented: false,
      hasFormBuilder: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Module Administration</h2>
        <p className="text-muted-foreground">
          Access and manage all system modules from one central location
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {modules.map((module, index) => {
          const Icon = module.icon;
          return (
            <Card
              key={index}
              className="group hover:shadow-[var(--shadow-ice)] transition-all duration-300 hover:-translate-y-1"
            >
              <CardHeader>
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center mb-3`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">{module.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {module.hasFormBuilder && module.implemented && (
                  <div className="flex items-center gap-2 mb-2 px-2 py-1 bg-primary/10 rounded-md">
                    <span className="text-xs font-medium text-primary">✨ Customizable Forms</span>
                  </div>
                )}
                <Button
                  variant="outline"
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  disabled={!module.implemented}
                  onClick={() => module.path && navigate(module.path)}
                >
                  {module.implemented ? (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Access Module
                    </>
                  ) : (
                    "Coming Soon"
                  )}
                </Button>
                {module.hasFormBuilder && module.implemented && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => navigate("/admin/form-config")}
                  >
                    Configure Form
                  </Button>
                )}
                <div className="text-xs text-center text-muted-foreground">
                  Status: {module.implemented ? "Active" : "Planned"}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Module Overview</CardTitle>
          <CardDescription>Quick statistics and information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {modules.filter((m) => m.implemented).length}
              </div>
              <div className="text-sm text-muted-foreground">Active Modules</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-muted-foreground">
                {modules.filter((m) => !m.implemented).length}
              </div>
              <div className="text-sm text-muted-foreground">In Development</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-accent">{modules.length}</div>
              <div className="text-sm text-muted-foreground">Total Modules</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModuleAdministration;
