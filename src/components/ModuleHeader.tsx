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

  // Fetch weather when facility changes - use stored coordinates if available
  useEffect(() => {
    const fetchWeather = async () => {
      // Need either coordinates or address
      if (!facility?.latitude && !facility?.longitude && !facility?.address) return;
      
      setWeatherLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("get-weather", {
          body: { 
            address: facility.address,
            latitude: facility.latitude,
            longitude: facility.longitude,
            facilityId: facility.id
          },
        });

        if (error) {
          console.error("Weather fetch error:", error);
          return;
        }

        setWeather(data);
        
        // If coordinates were geocoded and saved, update local facility state
        if (data?.coordinatesSaved && !facility.latitude && !facility.longitude) {
          console.log("Facility coordinates updated from geocoding");
        }
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
  }, [facility?.id, facility?.latitude, facility?.longitude, facility?.address]);

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
      <div className="bg-muted/30 backdrop-blur-sm border border-border/40 rounded-xl px-5 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-1 gap-y-2 text-sm">
          {/* User */}
          <div className="flex items-center gap-2.5 text-foreground px-3 py-1.5 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="font-medium">
              {contextLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                profile?.name || user?.email || "Unknown User"
              )}
            </span>
          </div>

          <div className="w-px h-6 bg-border/60 mx-1 hidden sm:block" />

          {/* Facility */}
          <div className="flex items-center gap-2.5 text-foreground px-3 py-1.5 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="font-medium">
              {contextLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                facility?.name || "No Facility Assigned"
              )}
            </span>
          </div>

          <div className="w-px h-6 bg-border/60 mx-1 hidden sm:block" />

          {/* Date */}
          <div className="flex items-center gap-2.5 text-foreground px-3 py-1.5 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <span>{format(currentTime, "EEEE, MMMM d, yyyy")}</span>
          </div>

          <div className="w-px h-6 bg-border/60 mx-1 hidden sm:block" />

          {/* Time */}
          <div className="flex items-center gap-2.5 text-foreground px-3 py-1.5 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <span>{format(currentTime, "h:mm a")}</span>
          </div>

          <div className="w-px h-6 bg-border/60 mx-1 hidden sm:block" />

          {/* Temperature */}
          <div className="flex items-center gap-2.5 text-foreground px-3 py-1.5 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
              <Thermometer className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            {weatherLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : weather ? (
              <span className="font-medium">{weather.temperatureF}°F</span>
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
