import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import maxFacilityLogo from "@/assets/max-facility-logo.png";
import {
  Snowflake,
  ClipboardList,
  Wrench,
  Thermometer,
  Wind,
  Calendar,
  AlertCircle,
  MessageSquare,
  Shield,
  LogOut,
  Settings,
  FileText,
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  const modules = [
    {
      title: "Ice Depth Log",
      description: "Track ice measurements with AI analysis",
      icon: Snowflake,
      bgColor: "bg-violet-500 dark:bg-violet-600",
      path: "/ice-depth",
    },
    {
      title: "Ice Maintenance",
      description: "Resurface logs and equipment checks",
      icon: Wrench,
      bgColor: "bg-orange-500 dark:bg-orange-600",
      path: "/ice-maintenance",
    },
    {
      title: "Refrigeration Log",
      description: "Monitor compressor and condenser data",
      icon: Thermometer,
      bgColor: "bg-cyan-500 dark:bg-cyan-600",
      path: "/refrigeration-log",
    },
    {
      title: "Daily Reports",
      description: "Task management and financial tracking",
      icon: FileText,
      bgColor: "bg-pink-500 dark:bg-pink-600",
      path: "/daily-reports-dashboard",
    },
    {
      title: "Air Quality",
      description: "Track CO and NO2 levels",
      icon: Wind,
      bgColor: "bg-amber-500 dark:bg-amber-600",
      path: "/air-quality",
    },
    {
      title: "Scheduling",
      description: "Manage employee shifts and hours",
      icon: Calendar,
      bgColor: "bg-indigo-500 dark:bg-indigo-600",
      path: "/schedule/calendar",
    },
    {
      title: "Incident Reports",
      description: "Document and track incidents",
      icon: AlertCircle,
      bgColor: "bg-rose-500 dark:bg-rose-600",
      path: "/incident-report",
    },
    {
      title: "Communications",
      description: "Team messaging and announcements",
      icon: MessageSquare,
      bgColor: "bg-teal-500 dark:bg-teal-600",
      path: null,
    },
    {
      title: "Safety Center",
      description: "Compliance tracking and resources",
      icon: Shield,
      bgColor: "bg-purple-500 dark:bg-purple-600",
      path: null,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Snowflake className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-seahawks-light to-background">
      <header className="border-b border-border/30">
        <div className="container mx-auto px-4 py-4">
          {/* Logo centered at top */}
          <div className="flex justify-center mb-4">
            <img 
              src={maxFacilityLogo} 
              alt="Max Facility" 
              className="h-20 md:h-28 object-contain"
            />
          </div>
          
          {/* Navigation row */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Welcome back, {user?.user_metadata?.name || user?.email}
            </p>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="outline" onClick={() => navigate("/admin")}>
                <Settings className="h-4 w-4 mr-2" />
                Admin
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
          <p className="text-muted-foreground">
            Your comprehensive ice rink facility management system
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {modules.map((module, index) => {
            const Icon = module.icon;
            return (
              <Card
                key={index}
                className={`group ${module.bgColor} text-white hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 border-0`}
                onClick={() => module.path && navigate(module.path)}
              >
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl text-white">{module.title}</CardTitle>
                  <CardDescription className="text-white/80">{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="secondary" 
                    className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
                    disabled={!module.path}
                  >
                    {module.path ? "Open Module" : "Coming Soon"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Today's Activities</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Open Incidents</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Staff Scheduled</span>
                  <span className="font-semibold">0</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No recent activities</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No new notifications</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
