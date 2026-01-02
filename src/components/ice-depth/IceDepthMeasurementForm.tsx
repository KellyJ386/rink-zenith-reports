import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { TemplateSelection } from "./TemplateSelection";
import { StatisticsPanel } from "./StatisticsPanel";
import { BluetoothCaliperControl } from "./BluetoothCaliperControl";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

interface IceDepthMeasurementFormProps {
  userId: string;
}

interface TemplatePoint {
  id: number;
  x: number;
  y: number;
  label?: string;
}

interface CustomIceTemplate {
  id: string;
  facility_id: string;
  rink_id: string;
  template_name: string;
  template_number: number;
  point_count: number;
  points: TemplatePoint[];
  is_active: boolean;
}

export const IceDepthMeasurementForm = ({ userId }: IceDepthMeasurementFormProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [rinks, setRinks] = useState<any[]>([]);
  const [facilityId, setFacilityId] = useState<string>("");
  const [selectedRink, setSelectedRink] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [customTemplates, setCustomTemplates] = useState<CustomIceTemplate[]>([]);
  const [measurements, setMeasurements] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [unit, setUnit] = useState<"in" | "mm">(() => {
    return (localStorage.getItem("ice-depth-unit") as "in" | "mm") || "in";
  });
  const [manualCurrentPoint, setManualCurrentPoint] = useState<number | null>(null);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);

  // Fetch user's facility on mount
  useEffect(() => {
    const fetchUserFacility = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("facility_id, facilities:facility_id(id, name)")
        .eq("user_id", userId)
        .single();

      if (profile?.facility_id) {
        setFacilityId(profile.facility_id);
        fetchRinks(profile.facility_id);
      }
    };

    fetchUserFacility();
  }, [userId]);

  // Check if user has admin or manager role
  useEffect(() => {
    const checkRole = async () => {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      const hasAccess = roleData?.some(
        (r) => r.role === "admin" || r.role === "manager"
      );
      setHasAdminAccess(!!hasAccess);
    };

    checkRole();
  }, [userId]);

  // Fetch custom templates when rink changes
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!facilityId || !selectedRink) return;

      const { data, error } = await supabase
        .from("custom_ice_templates")
        .select("*")
        .eq("facility_id", facilityId)
        .eq("rink_id", selectedRink)
        .eq("is_active", true)
        .order("template_number");

      if (error) {
        console.error("Error fetching templates:", error);
        return;
      }

      const templates = (data || []).map(t => ({
        ...t,
        points: (t.points as unknown as TemplatePoint[]) || []
      }));

      setCustomTemplates(templates);

      // Auto-select first template if available
      if (templates.length > 0 && !selectedTemplateId) {
        setSelectedTemplateId(templates[0].id);
      }
    };

    fetchTemplates();
  }, [facilityId, selectedRink]);

  // Reset template selection when rink changes
  useEffect(() => {
    setSelectedTemplateId("");
    setMeasurements({});
    setManualCurrentPoint(null);
  }, [selectedRink]);

  const selectedTemplate = customTemplates.find(t => t.id === selectedTemplateId);
  const pointCount = selectedTemplate?.point_count || 0;

  const getCurrentPointId = () => {
    if (manualCurrentPoint !== null) return manualCurrentPoint;
    const filledCount = Object.values(measurements).filter(v => v > 0).length;
    return filledCount < pointCount ? filledCount + 1 : pointCount;
  };

  const currentPointId = getCurrentPointId();

  useEffect(() => {
    localStorage.setItem("ice-depth-unit", unit);
  }, [unit]);

  const fetchRinks = async (facId: string) => {
    const { data, error } = await supabase
      .from("rinks")
      .select("*")
      .eq("facility_id", facId)
      .eq("is_active", true)
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

  const handleBluetoothReading = (mm: number) => {
    const pointKey = `Point ${currentPointId}`;
    const updatedMeasurements = {
      ...measurements,
      [pointKey]: mm,
    };
    setMeasurements(updatedMeasurements);

    // Auto-advance to next unfilled point
    let nextPoint = currentPointId + 1;
    
    while (nextPoint <= pointCount) {
      if (!updatedMeasurements[`Point ${nextPoint}`] || updatedMeasurements[`Point ${nextPoint}`] === 0) {
        setManualCurrentPoint(nextPoint);
        return;
      }
      nextPoint++;
    }
    
    // All points filled
    if (nextPoint > pointCount) {
      const allFilled = Object.values(updatedMeasurements).filter(v => v > 0).length === pointCount;
      if (allFilled) {
        toast({
          title: "All Points Complete",
          description: "All measurement points have been filled",
        });
        setManualCurrentPoint(null);
      }
    }
  };

  const calculateStatistics = () => {
    const values = Object.values(measurements).filter((v) => !isNaN(v) && v > 0);
    
    if (values.length === 0) {
      return { min: 0, max: 0, avg: 0, stdDev: 0 };
    }

    // Values are stored in mm, convert to display unit for statistics
    const displayValues = values.map(v => unit === "in" ? v / 25.4 : v);

    const min = Math.min(...displayValues);
    const max = Math.max(...displayValues);
    const avg = displayValues.reduce((sum, val) => sum + val, 0) / displayValues.length;
    
    const variance = displayValues.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / displayValues.length;
    const stdDev = Math.sqrt(variance);

    return {
      min: Number(min.toFixed(unit === "in" ? 3 : 2)),
      max: Number(max.toFixed(unit === "in" ? 3 : 2)),
      avg: Number(avg.toFixed(unit === "in" ? 3 : 2)),
      stdDev: Number(stdDev.toFixed(unit === "in" ? 3 : 2)),
    };
  };

  const handleSave = async () => {
    if (!facilityId || !selectedRink || !selectedTemplateId) {
      toast({
        title: "Missing Information",
        description: "Please select a rink and template",
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
      // Convert stats back to inches for storage (backend expects inches)
      const statsInInches = unit === "mm" ? {
        min: stats.min / 25.4,
        max: stats.max / 25.4,
        avg: stats.avg / 25.4,
        stdDev: stats.stdDev / 25.4,
      } : stats;

      const status = statsInInches.min < 0.75 || statsInInches.max > 1.5 || statsInInches.stdDev > 0.3 ? "critical" : 
                     statsInInches.stdDev > 0.2 ? "warning" : "good";

      // Convert measurements to inches for storage
      const measurementsInInches: Record<string, number> = {};
      Object.entries(measurements).forEach(([key, value]) => {
        measurementsInInches[key] = value / 25.4; // Convert mm to inches
      });

      const { data: savedMeasurement, error } = await supabase
        .from("ice_depth_measurements")
        .insert({
          facility_id: facilityId,
          rink_id: selectedRink,
          template_type: "custom",
          custom_template_id: selectedTemplateId,
          operator_id: userId,
          measurements: measurementsInInches,
          min_depth: statsInInches.min,
          max_depth: statsInInches.max,
          avg_depth: statsInInches.avg,
          std_deviation: statsInInches.stdDev,
          status,
        })
        .select()
        .single();

      if (error) throw error;

      // Send notifications in background
      supabase.functions.invoke("send-ice-depth-notification", {
        body: {
          measurementId: savedMeasurement.id,
          facilityId: facilityId,
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
      setManualCurrentPoint(null);
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

  // Show message if no templates configured
  if (facilityId && selectedRink && customTemplates.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="shadow-[var(--shadow-ice)]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Measurement Setup</CardTitle>
              <Tabs value={unit} onValueChange={(v) => setUnit(v as "in" | "mm")}>
                <TabsList className="grid w-[200px] grid-cols-2">
                  <TabsTrigger value="in">Inches</TabsTrigger>
                  <TabsTrigger value="mm">Millimeters</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Rink</Label>
              <Select value={selectedRink} onValueChange={setSelectedRink} disabled={!facilityId}>
                <SelectTrigger className="h-9">
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
          </CardContent>
        </Card>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Templates Configured</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              No measurement templates have been configured for this rink. 
              {hasAdminAccess 
                ? " Please create at least one template to begin recording ice depth measurements."
                : " Contact your facility manager to set up custom templates."}
            </p>
            {hasAdminAccess && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate("/admin/ice-depth-settings")}
              >
                Configure Templates
              </Button>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-[var(--shadow-ice)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Measurement Setup</CardTitle>
            <Tabs value={unit} onValueChange={(v) => setUnit(v as "in" | "mm")}>
              <TabsList className="grid w-[200px] grid-cols-2">
                <TabsTrigger value="in">Inches</TabsTrigger>
                <TabsTrigger value="mm">Millimeters</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Rink + Template on same row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Rink</Label>
              <Select value={selectedRink} onValueChange={setSelectedRink} disabled={!facilityId}>
                <SelectTrigger className="h-9">
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

            <div className="space-y-1.5">
              <Label className="text-sm">Template</Label>
              <Select 
                value={selectedTemplateId} 
                onValueChange={setSelectedTemplateId}
                disabled={!selectedRink || customTemplates.length === 0}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {customTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      Template {template.template_number}: {template.template_name} ({template.point_count} pts)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Collapsible Bluetooth Section */}
          {facilityId && selectedRink && selectedTemplateId && (
            <BluetoothCaliperControl 
              onReading={handleBluetoothReading}
              currentPoint={currentPointId}
              unit={unit}
            />
          )}
        </CardContent>
      </Card>

      {facilityId && selectedRink && selectedTemplateId && selectedTemplate && (
        <>
          <TemplateSelection
            templateType={`custom_${selectedTemplate.template_number}`}
            measurements={measurements}
            currentPointId={currentPointId}
            facilityId={facilityId}
            customPoints={selectedTemplate.points}
            onPointClick={(pointId) => {
              setManualCurrentPoint(pointId);
              const input = document.getElementById(`point-${pointId}`);
              input?.focus();
            }}
            onMeasurementChange={(pointId, value) => {
              // Value comes in display unit, convert to mm
              const mmValue = unit === "in" ? value * 25.4 : value;
              const updatedMeasurements = {
                ...measurements,
                [`Point ${pointId}`]: mmValue,
              };
              setMeasurements(updatedMeasurements);

              // Auto-advance to next unfilled point
              let nextPoint = pointId + 1;
              
              while (nextPoint <= pointCount) {
                if (!updatedMeasurements[`Point ${nextPoint}`] || updatedMeasurements[`Point ${nextPoint}`] === 0) {
                  setManualCurrentPoint(nextPoint);
                  return;
                }
                nextPoint++;
              }
              
              // Check if all filled
              const allFilled = Object.values(updatedMeasurements).filter(v => v > 0).length >= pointCount;
              if (allFilled) {
                toast({
                  title: "All Points Complete",
                  description: "All measurement points have been filled",
                });
                setManualCurrentPoint(null);
              }
            }}
            unit={unit}
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