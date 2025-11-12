import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { TemplateSelection } from "./TemplateSelection";
import { StatisticsPanel } from "./StatisticsPanel";
import { Loader2 } from "lucide-react";

interface IceDepthMeasurementFormProps {
  userId: string;
}

export const IceDepthMeasurementForm = ({ userId }: IceDepthMeasurementFormProps) => {
  const { toast } = useToast();
  const [facilities, setFacilities] = useState<any[]>([]);
  const [rinks, setRinks] = useState<any[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<string>("");
  const [selectedRink, setSelectedRink] = useState<string>("");
  const [templateType, setTemplateType] = useState<string>("25-point");
  const [measurements, setMeasurements] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  // Calculate current point for progressive input
  const getCurrentPointId = () => {
    const filledCount = Object.values(measurements).filter(v => v > 0).length;
    return filledCount + 1;
  };

  const currentPointId = getCurrentPointId();

  useEffect(() => {
    fetchFacilities();
  }, []);

  useEffect(() => {
    if (selectedFacility) {
      fetchRinks(selectedFacility);
    }
  }, [selectedFacility]);

  const fetchFacilities = async () => {
    const { data, error } = await supabase
      .from("facilities")
      .select("*")
      .order("name");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load facilities",
        variant: "destructive",
      });
      return;
    }

    setFacilities(data || []);
  };

  const fetchRinks = async (facilityId: string) => {
    const { data, error } = await supabase
      .from("rinks")
      .select("*")
      .eq("facility_id", facilityId)
      .order("name");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load rinks",
        variant: "destructive",
      });
      return;
    }

    setRinks(data || []);
  };

  const calculateStatistics = () => {
    const values = Object.values(measurements).filter((v) => !isNaN(v) && v > 0);
    
    if (values.length === 0) {
      return { min: 0, max: 0, avg: 0, stdDev: 0 };
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return {
      min: Number(min.toFixed(2)),
      max: Number(max.toFixed(2)),
      avg: Number(avg.toFixed(2)),
      stdDev: Number(stdDev.toFixed(2)),
    };
  };

  const handleSave = async () => {
    if (!selectedFacility || !selectedRink) {
      toast({
        title: "Missing Information",
        description: "Please select a facility and rink",
        variant: "destructive",
      });
      return;
    }

    const stats = calculateStatistics();
    if (stats.min === 0) {
      toast({
        title: "No Measurements",
        description: "Please enter measurements first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const status = stats.min < 0.75 || stats.max > 1.5 || stats.stdDev > 0.3 ? "critical" : 
                     stats.stdDev > 0.2 ? "warning" : "good";

      const { data: savedMeasurement, error } = await supabase
        .from("ice_depth_measurements")
        .insert({
          facility_id: selectedFacility,
          rink_id: selectedRink,
          template_type: templateType,
          operator_id: userId,
          measurements,
          min_depth: stats.min,
          max_depth: stats.max,
          avg_depth: stats.avg,
          std_deviation: stats.stdDev,
          status,
        })
        .select()
        .single();

      if (error) throw error;

      // Send notifications in background
      supabase.functions.invoke("send-ice-depth-notification", {
        body: {
          measurementId: savedMeasurement.id,
          facilityId: selectedFacility,
        },
      }).then(({ error: notifError }) => {
        if (notifError) {
          console.error("Notification error:", notifError);
        }
      });

      toast({
        title: "Success",
        description: "Measurement saved and notifications sent",
      });

      // Reset form
      setMeasurements({});
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save measurement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const stats = calculateStatistics();

  return (
    <div className="space-y-6">
      <Card className="shadow-[var(--shadow-ice)]">
        <CardHeader>
          <CardTitle>Measurement Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Facility</Label>
              <Select value={selectedFacility} onValueChange={setSelectedFacility}>
                <SelectTrigger>
                  <SelectValue placeholder="Select facility" />
                </SelectTrigger>
                <SelectContent>
                  {facilities.map((facility) => (
                    <SelectItem key={facility.id} value={facility.id}>
                      {facility.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rink</Label>
              <Select value={selectedRink} onValueChange={setSelectedRink} disabled={!selectedFacility}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rink" />
                </SelectTrigger>
                <SelectContent>
                  {rinks.map((rink) => (
                    <SelectItem key={rink.id} value={rink.id}>
                      {rink.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Measurement Template</Label>
            <RadioGroup value={templateType} onValueChange={setTemplateType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="25-point" id="25-point" />
                <Label htmlFor="25-point" className="font-normal cursor-pointer">
                  25-Point Template
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="35-point" id="35-point" />
                <Label htmlFor="35-point" className="font-normal cursor-pointer">
                  35-Point Template
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="47-point" id="47-point" />
                <Label htmlFor="47-point" className="font-normal cursor-pointer">
                  47-Point Template
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {selectedFacility && selectedRink && (
        <>
          <TemplateSelection 
            templateType={templateType} 
            measurements={measurements}
            currentPointId={currentPointId}
            onPointClick={(pointId) => {
              // Allow clicking any point to jump to it
              const input = document.getElementById(`point-${pointId}`);
              input?.focus();
            }}
            onMeasurementChange={(pointId, value) => {
              setMeasurements({
                ...measurements,
                [`Point ${pointId}`]: value,
              });
            }}
          />

          <StatisticsPanel stats={stats} />

          <Card className="shadow-[var(--shadow-ice)]">
            <CardContent className="pt-6">
              <Button
                onClick={handleSave}
                disabled={loading || Object.keys(measurements).length === 0}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving & Sending Notifications...
                  </>
                ) : (
                  "Save & Notify Recipients"
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};