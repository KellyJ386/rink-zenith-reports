import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MeasurementData {
  date: string;
  value: number;
  status: string;
}

interface PointTrendData {
  [pointId: string]: MeasurementData[];
}

export const IceDepthTrendCharts = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState<PointTrendData>({});
  const [selectedPoint, setSelectedPoint] = useState<string>("1");
  const [availablePoints, setAvailablePoints] = useState<string[]>([]);
  const [rinks, setRinks] = useState<any[]>([]);
  const [selectedRink, setSelectedRink] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    fetchRinks();
  }, []);

  useEffect(() => {
    if (rinks.length > 0) {
      fetchTrendData();
    }
  }, [rinks, selectedRink, startDate, endDate]);

  const fetchRinks = async () => {
    try {
      const { data, error } = await supabase
        .from("rinks")
        .select("id, name, facilities(name)")
        .order("name");

      if (error) throw error;
      setRinks(data || []);
    } catch (error: any) {
      console.error("Fetch rinks error:", error);
      toast({
        title: "Error",
        description: "Failed to load rinks",
        variant: "destructive",
      });
    }
  };

  const fetchTrendData = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("ice_depth_measurements")
        .select("measurement_date, measurements, status, rink_id")
        .order("measurement_date", { ascending: true });

      if (selectedRink !== "all") {
        query = query.eq("rink_id", selectedRink);
      }

      if (startDate) {
        query = query.gte("measurement_date", startDate.toISOString());
      }

      if (endDate) {
        // Add one day to include the end date
        const endDateTime = new Date(endDate);
        endDateTime.setDate(endDateTime.getDate() + 1);
        query = query.lt("measurement_date", endDateTime.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Process data to group by point
      const pointData: PointTrendData = {};
      const points = new Set<string>();

      data?.forEach((measurement) => {
        const measurements = measurement.measurements as any;
        if (Array.isArray(measurements)) {
          measurements.forEach((point: any) => {
            const pointId = String(point.pointId);
            points.add(pointId);

            if (!pointData[pointId]) {
              pointData[pointId] = [];
            }

            // Convert to inches for display
            const valueInInches = point.value / 25.4;

            pointData[pointId].push({
              date: format(new Date(measurement.measurement_date), "MM/dd/yy"),
              value: parseFloat(valueInInches.toFixed(2)),
              status: measurement.status,
            });
          });
        }
      });

      setTrendData(pointData);
      const sortedPoints = Array.from(points).sort((a, b) => Number(a) - Number(b));
      setAvailablePoints(sortedPoints);
      
      if (sortedPoints.length > 0 && !sortedPoints.includes(selectedPoint)) {
        setSelectedPoint(sortedPoints[0]);
      }
    } catch (error: any) {
      console.error("Fetch trend data error:", error);
      toast({
        title: "Error",
        description: "Failed to load trend data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "hsl(var(--chart-1))";
      case "warning":
        return "hsl(var(--chart-3))";
      case "critical":
        return "hsl(var(--chart-5))";
      default:
        return "hsl(var(--chart-2))";
    }
  };

  if (loading) {
    return (
      <Card className="shadow-[var(--shadow-ice)]">
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading trend data...
        </CardContent>
      </Card>
    );
  }

  if (availablePoints.length === 0) {
    return (
      <Card className="shadow-[var(--shadow-ice)]">
        <CardContent className="py-8 text-center text-muted-foreground">
          No measurement data available for trend analysis
        </CardContent>
      </Card>
    );
  }

  const currentData = trendData[selectedPoint] || [];

  return (
    <div className="space-y-6">
      <Card className="shadow-[var(--shadow-ice)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Ice Depth Trend Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Rink</label>
              <Select value={selectedRink} onValueChange={setSelectedRink}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rink" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rinks</SelectItem>
                  {rinks.map((rink) => (
                    <SelectItem key={rink.id} value={rink.id}>
                      {rink.facilities?.name} - {rink.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Measurement Point</label>
              <Select value={selectedPoint} onValueChange={setSelectedPoint}>
                <SelectTrigger>
                  <SelectValue placeholder="Select point" />
                </SelectTrigger>
                <SelectContent>
                  {availablePoints.map((point) => (
                    <SelectItem key={point} value={point}>
                      Point {point}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => date > new Date() || (endDate && date > endDate)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date > new Date() || (startDate && date < startDate)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {(startDate || endDate) && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStartDate(undefined);
                  setEndDate(undefined);
                }}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Clear Date Filter
              </Button>
              {startDate && endDate && (
                <span className="text-sm text-muted-foreground">
                  Showing data from {format(startDate, "PPP")} to {format(endDate, "PPP")}
                </span>
              )}
            </div>
          )}

          <div className="mt-6">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={currentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--foreground))"
                  tick={{ fill: "hsl(var(--foreground))" }}
                />
                <YAxis 
                  stroke="hsl(var(--foreground))"
                  tick={{ fill: "hsl(var(--foreground))" }}
                  label={{ 
                    value: "Depth (inches)", 
                    angle: -90, 
                    position: "insideLeft",
                    style: { fill: "hsl(var(--foreground))" }
                  }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)"
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Ice Depth (in)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {currentData.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Average</div>
                  <div className="text-2xl font-bold">
                    {(currentData.reduce((sum, d) => sum + d.value, 0) / currentData.length).toFixed(2)}"
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Min</div>
                  <div className="text-2xl font-bold">
                    {Math.min(...currentData.map(d => d.value)).toFixed(2)}"
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Max</div>
                  <div className="text-2xl font-bold">
                    {Math.max(...currentData.map(d => d.value)).toFixed(2)}"
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Measurements</div>
                  <div className="text-2xl font-bold">
                    {currentData.length}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
