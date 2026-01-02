import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAccountContext } from "@/hooks/useAccountContext";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Snowflake, Users, Settings, LayoutDashboard, ArrowLeft, Building2, Shield, CreditCard, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import maxFacilityLogo from "@/assets/max-facility-logo.png";

const Account = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, isAccountOwner, isAdmin, facility, error } = useAccountContext();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!loading && !isAccountOwner && !isAdmin) {
      navigate("/dashboard");
    }
  }, [loading, isAccountOwner, isAdmin, navigate]);

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

  if (error || (!isAccountOwner && !isAdmin)) {
    return null;
  }

  const navItems = [
    { label: "Dashboard", path: "/account", icon: LayoutDashboard },
    { label: "Users", path: "/account/users", icon: Users },
    { label: "Permissions", path: "/account/permissions", icon: Shield },
    { label: "Billing", path: "/account/billing", icon: CreditCard },
    { label: "Notifications", path: "/account/notifications", icon: Bell },
    { label: "Settings", path: "/account/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-seahawks-light to-background">
      <header className="border-b border-border/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-3">
                <img src={maxFacilityLogo} alt="Logo" className="h-10 object-contain" />
                <div>
                  <h1 className="font-bebas text-xl text-seahawks-navy dark:text-white">
                    Account Management
                  </h1>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {facility?.name || "No Facility"}
                  </p>
                </div>
              </div>
            </div>
            <ThemeToggle />
          </div>

          <nav className="flex gap-1 mt-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path !== "/account" && location.pathname.startsWith(item.path));
              const Icon = item.icon;
              
              return (
                <Button
                  key={item.path}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "gap-2",
                    isActive && "bg-primary text-primary-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Account;
