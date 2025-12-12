import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getRecentAuditLogs } from "@/services/auditLog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Settings,
  Users,
  FileText,
  LayoutDashboard,
  Activity,
  AlertCircle,
  TrendingUp,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  History,
  Library,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  activeModules: number;
  rinksConfigured: number;
  pendingApprovals: number;
}

interface AuditLogEntry {
  id: string;
  user_name: string;
  action: string;
  target_name: string | null;
  created_at: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeModules: 7,
    rinksConfigured: 0,
    pendingApprovals: 0,
  });
  const [recentActivity, setRecentActivity] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get total users count
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Get rinks count
      const { count: rinksCount } = await supabase
        .from("rinks")
        .select("*", { count: "exact", head: true });

      // Get pending time-off requests
      const { count: pendingTimeOff } = await supabase
        .from("schedule_time_off")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Get pending shift swaps
      const { count: pendingSwaps } = await supabase
        .from("schedule_shift_swaps")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      setStats({
        totalUsers: usersCount || 0,
        activeModules: 7,
        rinksConfigured: rinksCount || 0,
        pendingApprovals: (pendingTimeOff || 0) + (pendingSwaps || 0),
      });

      // Get recent audit logs
      const logs = await getRecentAuditLogs(10);
      setRecentActivity(logs as AuditLogEntry[]);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

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
      title: "Form Templates",
      description: "Manage reusable form templates with versioning",
      icon: Library,
      path: "/admin/form-templates",
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

  const quickActions = [
    { label: "Add User", icon: Users, action: () => navigate("/admin/users") },
    { label: "Add Rink", icon: Plus, action: () => navigate("/admin/facility") },
    { label: "Form Templates", icon: Library, action: () => navigate("/admin/form-templates") },
    { label: "View Audit Log", icon: History, action: () => navigate("/admin/audit") },
  ];

  const statsConfig = [
    { label: "Total Users", value: stats.totalUsers, icon: Users },
    { label: "Active Modules", value: stats.activeModules, icon: Activity },
    { label: "Rinks Configured", value: stats.rinksConfigured, icon: TrendingUp },
    { label: "Pending Approvals", value: stats.pendingApprovals, icon: AlertCircle },
  ];

  const getActionIcon = (action: string) => {
    if (action.includes("created") || action.includes("added")) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (action.includes("deleted") || action.includes("removed")) return <XCircle className="h-4 w-4 text-red-500" />;
    return <Clock className="h-4 w-4 text-blue-500" />;
  };

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

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
        {statsConfig.map((stat, index) => {
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

      {/* Quick Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button key={index} variant="outline" onClick={action.action}>
                  <Icon className="h-4 w-4 mr-2" />
                  {action.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Admin Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Admin Activity</CardTitle>
            <CardDescription>Latest changes and system events</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/audit")}>
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  {getActionIcon(log.action)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      <span className="text-foreground">{log.user_name}</span>
                      <span className="text-muted-foreground"> {log.action}</span>
                      {log.target_name && (
                        <span className="text-foreground"> {log.target_name}</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
