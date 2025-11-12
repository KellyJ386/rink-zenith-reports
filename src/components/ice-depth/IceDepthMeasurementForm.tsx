import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { TemplateSelection } from "./TemplateSelection";
import { MeasurementInput } from "./MeasurementInput";
import { StatisticsPanel } from "./StatisticsPanel";
import { AIAnalysisDisplay } from "./AIAnalysisDisplay";
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
  const [templateType, setTemplateType] = useState<string>("24-point");
  const [measurements, setMeasurements] = useState<Record<string, number>>({});
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

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

  const handleAnalyze = async () => {
    if (!selectedFacility || !selectedRink) {
      toast({
        title: "Missing Information",
        description: "Please select a facility and rink first",
        variant: "destructive",
      });
      return;
    }

    const stats = calculateStatistics();
    if (stats.min === 0) {
      toast({
        title: "No Measurements",
        description: "Please enter some measurements first",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);
    try {
      const measurementArray = Object.entries(measurements).map(([point, depth]) => ({
        point,
        depth,
      }));

      const { data, error } = await supabase.functions.invoke("analyze-ice-depth", {
        body: {
          measurements: measurementArray,
          minDepth: stats.min,
          maxDepth: stats.max,
          avgDepth: stats.avg,
          stdDeviation: stats.stdDev,
          templateType,
        },
      });

      if (error) throw error;

      setAiAnalysis(data.analysis);
      toast({
        title: "Analysis Complete",
        description: "AI analysis has been generated",
      });
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to generate AI analysis",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
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

      const { error } = await supabase.from("ice_depth_measurements").insert({
        facility_id: selectedFacility,
        rink_id: selectedRink,
        template_type: templateType,
        operator_id: userId,
        measurements,
        min_depth: stats.min,
        max_depth: stats.max,
        avg_depth: stats.avg,
        std_deviation: stats.stdDev,
        ai_analysis: aiAnalysis || null,
        status,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Measurement saved successfully",
      });

      // Reset form
      setMeasurements({});
      setAiAnalysis("");
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
                <RadioGroupItem value="24-point" id="24-point" />
                <Label htmlFor="24-point" className="font-normal cursor-pointer">
                  24-Point Template
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
              // Allow clicking on completed points to edit
              if (pointId < currentPointId) {
                const input = document.getElementById(`point-${pointId}`);
                input?.focus();
              }
            }}
          />
          
          <MeasurementInput
            templateType={templateType}
            measurements={measurements}
            onMeasurementsChange={setMeasurements}
            currentPointId={currentPointId}
          />

          <StatisticsPanel stats={stats} />

          {aiAnalysis && <AIAnalysisDisplay analysis={aiAnalysis} />}

          <Card className="shadow-[var(--shadow-ice)]">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Button
                  onClick={handleAnalyze}
                  disabled={analyzing || Object.keys(measurements).length === 0}
                  className="flex-1"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Generate AI Analysis"
                  )}
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={loading || Object.keys(measurements).length === 0}
                  variant="secondary"
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Measurement"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};