import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationCenter } from "@/components/dashboard/NotificationCenter";
import { DashboardAnalytics } from "@/components/dashboard/DashboardAnalytics";
import { useAccountContext } from "@/hooks/useAccountContext";
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
  BarChart3,
  LayoutDashboard,
  Building2,
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("modules");
  const { isAccountOwner, isAdmin } = useAccountContext();

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
      path: "/daily-reports",
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
    <div className="min-h-screen bg-gradient-to-br from-background via-seahawks-light/50 to-background">
      <header className="border-b border-border/20 bg-background/60 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          {/* Logo centered at top */}
          <div className="flex flex-col items-center mb-4">
            <img 
              src={maxFacilityLogo} 
              alt="Max Facility" 
              className="h-20 md:h-28 object-contain drop-shadow-sm"
            />
            <h1 className="font-bebas font-bold text-3xl md:text-5xl text-seahawks-navy dark:text-white tracking-wider mt-1">
              RINK REPORTS
            </h1>
          </div>
          
          {/* Navigation row */}
          <div className="flex justify-between items-center pt-2 border-t border-border/20">
            <p className="text-sm text-muted-foreground font-medium">
              Welcome back, <span className="text-foreground">{user?.user_metadata?.name || user?.email}</span>
            </p>
            <div className="flex items-center gap-2">
              <NotificationCenter />
              <ThemeToggle />
              <div className="w-px h-6 bg-border/40 mx-1" />
              {(isAccountOwner || isAdmin) && (
                <Button variant="outline" onClick={() => navigate("/account")}>
                  <Building2 className="h-4 w-4 mr-2" />
                  My Account
                </Button>
              )}
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
              <p className="text-muted-foreground">
                Your comprehensive ice rink facility management system
              </p>
            </div>
            <TabsList>
              <TabsTrigger value="modules" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Modules
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="modules" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {modules.map((module, index) => {
                const Icon = module.icon;
                return (
                  <Card
                    key={index}
                    className={`group ${module.bgColor} text-white hover:shadow-elevation-4 transition-all duration-300 cursor-pointer hover:-translate-y-1.5 border-0 overflow-hidden relative`}
                    onClick={() => module.path && navigate(module.path)}
                  >
                    {/* Subtle shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="relative">
                      <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 border border-white/10 shadow-inner-light group-hover:scale-105 transition-transform duration-300">
                        <Icon className="h-6 w-6 text-white drop-shadow-sm" />
                      </div>
                      <CardTitle className="text-xl text-white font-bold">{module.title}</CardTitle>
                      <CardDescription className="text-white/85 font-medium">{module.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="relative">
                      <Button 
                        variant="secondary" 
                        className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/10 backdrop-blur-sm font-semibold shadow-sm"
                        disabled={!module.path}
                      >
                        {module.path ? "Open Module" : "Coming Soon"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-0">
            <DashboardAnalytics />
          </TabsContent>
        </Tabs>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="group hover:border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <span className="text-sm text-muted-foreground">Today's Activities</span>
                  <span className="font-bold text-lg text-primary">0</span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <span className="text-sm text-muted-foreground">Open Incidents</span>
                  <span className="font-bold text-lg text-primary">0</span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <span className="text-sm text-muted-foreground">Staff Scheduled</span>
                  <span className="font-bold text-lg text-primary">0</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ClipboardList className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No recent activities</p>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Notifications</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No new notifications</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
