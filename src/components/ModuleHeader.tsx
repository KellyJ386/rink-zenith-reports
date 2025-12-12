import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useUserContext } from "@/hooks/useUserContext";
import { format } from "date-fns";
import { Home, ArrowLeft, User, Building2, Calendar, Clock, Thermometer, Loader2 } from "lucide-react";

interface ModuleHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  showBack?: boolean;
}

const ModuleHeader = ({ title, subtitle, icon, actions, showBack = true }: ModuleHeaderProps) => {
  const navigate = useNavigate();
  const { user, profile, facility, loading: contextLoading } = useUserContext();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState<{ temperatureF: number; description: string } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch weather when facility changes
  useEffect(() => {
    const fetchWeather = async () => {
      if (!facility?.address) return;
      
      setWeatherLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("get-weather", {
          body: { address: facility.address },
        });

        if (error) {
          console.error("Weather fetch error:", error);
          return;
        }

        setWeather(data);
      } catch (error) {
        console.error("Weather error:", error);
      } finally {
        setWeatherLoading(false);
      }
    };

    fetchWeather();
    // Refresh weather every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [facility?.address]);

  return (
    <div className="mb-6">
      {/* Main header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2 bg-primary/10 rounded-lg">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {showBack && (
            <>
              <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
                <Home className="h-4 w-4 mr-1" />
                Dashboard
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Context bar */}
      <div className="bg-muted/50 border rounded-lg px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          {/* User */}
          <div className="flex items-center gap-2 text-foreground">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {contextLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                profile?.name || user?.email || "Unknown User"
              )}
            </span>
          </div>

          {/* Facility */}
          <div className="flex items-center gap-2 text-foreground">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {contextLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                facility?.name || "No Facility Assigned"
              )}
            </span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 text-foreground">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(currentTime, "EEEE, MMMM d, yyyy")}</span>
          </div>

          {/* Time */}
          <div className="flex items-center gap-2 text-foreground">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{format(currentTime, "h:mm a")}</span>
          </div>

          {/* Temperature */}
          <div className="flex items-center gap-2 text-foreground">
            <Thermometer className="h-4 w-4 text-muted-foreground" />
            {weatherLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : weather ? (
              <span>{weather.temperatureF}°F</span>
            ) : (
              <span className="text-muted-foreground">--°F</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleHeader;
