import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  Users,
  FileText,
  LayoutDashboard,
  Activity,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const adminSections = [
    {
      title: "Facility Settings",
      description: "Manage facility info, rinks, and equipment",
      icon: Settings,
      path: "/admin/facility",
      color: "from-primary to-accent",
    },
    {
      title: "User Management",
      description: "Add, edit, and manage user permissions",
      icon: Users,
      path: "/admin/users",
      color: "from-ice-glacier to-ice-blue",
    },
    {
      title: "Report Config",
      description: "Customize report forms and options",
      icon: FileText,
      path: "/admin/reports",
      color: "from-accent to-ice-arctic",
    },
    {
      title: "Module Admin",
      description: "Control module access and settings",
      icon: LayoutDashboard,
      path: "/admin/modules",
      color: "from-ice-blue to-primary",
    },
  ];

  const stats = [
    { label: "Total Users", value: "0", icon: Users },
    { label: "Active Modules", value: "2", icon: Activity },
    { label: "Rinks Configured", value: "0", icon: TrendingUp },
    { label: "Pending Issues", value: "0", icon: AlertCircle },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Admin Dashboard</h2>
        <p className="text-muted-foreground">
          System overview and management controls
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Admin Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminSections.map((section, index) => {
          const Icon = section.icon;
          return (
            <Card
              key={index}
              className="group hover:shadow-[var(--shadow-ice)] transition-all duration-300 cursor-pointer hover:-translate-y-1"
              onClick={() => navigate(section.path)}
            >
              <CardHeader>
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center mb-3`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                >
                  Open Section
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recent Admin Activity</CardTitle>
          <CardDescription>Latest changes and system events</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No recent activity</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
