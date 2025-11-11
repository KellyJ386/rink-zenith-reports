import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Wrench, Scissors, Grid3x3, CheckCircle, Search } from "lucide-react";

interface ActivityFeedProps {
  refreshTrigger: number;
}

export const ActivityFeed = ({ refreshTrigger }: ActivityFeedProps) => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchActivities();
  }, [refreshTrigger]);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from("maintenance_activities")
        .select(`
          *,
          rinks (name),
          facilities (name),
          resurfacing_machines (name, model)
        `)
        .order("activity_datetime", { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "resurface":
        return <Wrench className="h-4 w-4" />;
      case "blade_change":
        return <Scissors className="h-4 w-4" />;
      case "edging":
        return <Grid3x3 className="h-4 w-4" />;
      case "circle_check":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case "resurface":
        return "Resurface";
      case "blade_change":
        return "Blade Change";
      case "edging":
        return "Edging";
      case "circle_check":
        return "Circle Check";
      default:
        return type;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "resurface":
        return "bg-primary/10 text-primary";
      case "blade_change":
        return "bg-accent/10 text-accent";
      case "edging":
        return "bg-secondary/10 text-secondary";
      case "circle_check":
        return "bg-green-500/10 text-green-600";
      default:
        return "bg-muted/10 text-muted-foreground";
    }
  };

  const filteredActivities = activities.filter((activity) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      activity.facilities?.name.toLowerCase().includes(query) ||
      activity.rinks?.name.toLowerCase().includes(query) ||
      activity.resurfacing_machines?.name.toLowerCase().includes(query) ||
      getActivityLabel(activity.activity_type).toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <Card className="shadow-[var(--shadow-ice)] sticky top-6">
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading activities...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-[var(--shadow-ice)] sticky top-6">
      <CardHeader>
        <CardTitle className="text-lg">Activity Feed</CardTitle>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {filteredActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {searchQuery ? "No activities match your search" : "No activities yet"}
            </p>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity) => (
                <Card key={activity.id} className="border-border/50">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getActivityColor(activity.activity_type)}`}>
                        {getActivityIcon(activity.activity_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {getActivityLabel(activity.activity_type)}
                          </Badge>
                        </div>
                        <p className="font-medium text-sm truncate">
                          {activity.facilities?.name}
                        </p>
                        {activity.rinks && (
                          <p className="text-xs text-muted-foreground">
                            {activity.rinks.name}
                          </p>
                        )}
                        {activity.resurfacing_machines && (
                          <p className="text-xs text-muted-foreground">
                            {activity.resurfacing_machines.name}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(activity.activity_datetime), "PPp")}
                        </p>
                        {activity.notes && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {activity.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};