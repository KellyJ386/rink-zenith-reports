import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Eye, TrendingDown, TrendingUp } from "lucide-react";
import { IceDepthReportExport } from "./IceDepthReportExport";

export const IceDepthHistory = () => {
  const { toast } = useToast();
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeasurement, setSelectedMeasurement] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchMeasurements();
  }, []);

  const fetchMeasurements = async () => {
    try {
      const { data, error } = await supabase
        .from("ice_depth_measurements")
        .select(`
          *,
          rinks (name),
          facilities (name)
        `)
        .order("measurement_date", { ascending: false })
        .limit(50);

      if (error) throw error;
      setMeasurements(data || []);
    } catch (error: any) {
      console.error("Fetch error:", error);
      toast({
        title: "Error",
        description: "Failed to load measurement history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "good":
        return <Badge variant="default">Good</Badge>;
      case "warning":
        return <Badge variant="secondary">Warning</Badge>;
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleViewDetails = (measurement: any) => {
    setSelectedMeasurement(measurement);
    setShowDetails(true);
  };

  if (loading) {
    return (
      <Card className="shadow-[var(--shadow-ice)]">
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading measurement history...
        </CardContent>
      </Card>
    );
  }

  if (measurements.length === 0) {
    return (
      <Card className="shadow-[var(--shadow-ice)]">
        <CardContent className="py-8 text-center text-muted-foreground">
          No measurements recorded yet
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-[var(--shadow-ice)]">
        <CardHeader>
          <CardTitle>Measurement History</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {measurements.map((measurement) => (
                <Card key={measurement.id} className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {measurement.facilities?.name} - {measurement.rinks?.name}
                          </h3>
                          {getStatusBadge(measurement.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(measurement.measurement_date), "PPP p")}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <TrendingDown className="h-4 w-4 text-muted-foreground" />
                            <span>Min: {measurement.min_depth}"</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span>Max: {measurement.max_depth}"</span>
                          </div>
                          <span>Avg: {measurement.avg_depth}"</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(measurement)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Measurement Details</DialogTitle>
          </DialogHeader>
          {selectedMeasurement && (
            <div className="space-y-4">
              {/* Export actions */}
              <IceDepthReportExport measurement={selectedMeasurement} />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Facility</p>
                  <p className="font-medium">{selectedMeasurement.facilities?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rink</p>
                  <p className="font-medium">{selectedMeasurement.rinks?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Template</p>
                  <p className="font-medium">{selectedMeasurement.template_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedMeasurement.status)}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 pt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Min Depth</p>
                  <p className="text-xl font-bold">{selectedMeasurement.min_depth}"</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Max Depth</p>
                  <p className="text-xl font-bold">{selectedMeasurement.max_depth}"</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Depth</p>
                  <p className="text-xl font-bold">{selectedMeasurement.avg_depth}"</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Std Dev</p>
                  <p className="text-xl font-bold">{selectedMeasurement.std_deviation}"</p>
                </div>
              </div>

              {selectedMeasurement.ai_analysis && (
                <div className="pt-4">
                  <p className="text-sm text-muted-foreground mb-2">AI Analysis</p>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="whitespace-pre-wrap text-sm">{selectedMeasurement.ai_analysis}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};