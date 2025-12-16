import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { TemplateSelection } from "./TemplateSelection";
import { StatisticsPanel } from "./StatisticsPanel";
import { BluetoothCaliperControl } from "./BluetoothCaliperControl";
import { Loader2, ChevronDown, Bluetooth } from "lucide-react";
import { getPointCount } from "./measurementPoints";
import { Badge } from "@/components/ui/badge";

interface IceDepthMeasurementFormProps {
  userId: string;
}

interface EnabledTemplates {
  "24-point": boolean;
  "35-point": boolean;
  "47-point": boolean;
  "custom_1": boolean;
  "custom_2": boolean;
  "custom_3": boolean;
}

interface CustomTemplate {
  id: string;
  name: string;
  slot_number: number;
  point_count: number;
  template_data: {
    points: { id: number; x: number; y: number; name?: string }[];
  };
}

const defaultEnabledTemplates: EnabledTemplates = {
  "24-point": true,
  "35-point": true,
  "47-point": true,
  "custom_1": false,
  "custom_2": false,
  "custom_3": false,
};

export const IceDepthMeasurementForm = ({ userId }: IceDepthMeasurementFormProps) => {
  const { toast } = useToast();
  const [rinks, setRinks] = useState<any[]>([]);
  const [facilityId, setFacilityId] = useState<string>("");
  const [facilityName, setFacilityName] = useState<string>("");
  const [selectedRink, setSelectedRink] = useState<string>("");
  const [templateType, setTemplateType] = useState<string>("25-point");
  const [measurements, setMeasurements] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [unit, setUnit] = useState<"in" | "mm">(() => {
    return (localStorage.getItem("ice-depth-unit") as "in" | "mm") || "in";
  });
  const [manualCurrentPoint, setManualCurrentPoint] = useState<number | null>(null);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [enabledTemplates, setEnabledTemplates] = useState<EnabledTemplates>(defaultEnabledTemplates);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);

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
        const facilityData = profile.facilities as unknown as { id: string; name: string } | null;
        setFacilityName(facilityData?.name || "");
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

  // Fetch enabled templates when facility changes
  useEffect(() => {
    const fetchTemplateSettings = async () => {
      if (!facilityId) return;

      const { data: facilityData } = await supabase
        .from("facilities")
        .select("enabled_templates")
        .eq("id", facilityId)
        .single();

      if (facilityData?.enabled_templates) {
        setEnabledTemplates(facilityData.enabled_templates as unknown as EnabledTemplates);
      }

      const { data: customData } = await supabase
        .from("custom_templates")
        .select("*")
        .eq("facility_id", facilityId)
        .order("slot_number");

      setCustomTemplates((customData || []).map(t => ({
        ...t,
        template_data: t.template_data as CustomTemplate["template_data"]
      })));
    };

    fetchTemplateSettings();
  }, [facilityId]);

  const getCurrentPointId = () => {
    if (manualCurrentPoint !== null) return manualCurrentPoint;
    const filledCount = Object.values(measurements).filter(v => v > 0).length;
    const pointCount = getPointCount(templateType, measurements);
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
    const pointCount = getPointCount(templateType, updatedMeasurements);
    let nextPoint = currentPointId + 1;
    
    // Find next unfilled point, wrapping around
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
    if (!facilityId || !selectedRink) {
      toast({
        title: "Missing Information",
        description: "Please select a rink",
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
          template_type: templateType,
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

  // Get available preset templates
  const availablePresets = [
    { key: "25-point", label: "24-Point Template", enabled: enabledTemplates["24-point"] },
    { key: "35-point", label: "35-Point Template", enabled: enabledTemplates["35-point"] },
    { key: "47-point", label: "47-Point Template", enabled: enabledTemplates["47-point"] },
  ].filter(t => t.enabled || hasAdminAccess);

  // Get available custom templates
  const availableCustom = [1, 2, 3].map(slot => {
    const template = customTemplates.find(t => t.slot_number === slot);
    const slotKey = `custom_${slot}` as keyof EnabledTemplates;
    const enabled = enabledTemplates[slotKey];
    const isConfigured = !!template;

    return {
      slot,
      key: `custom_${slot}`,
      template,
      enabled,
      isConfigured,
      // Show to staff only if enabled AND configured
      // Show to admin always (but grey out if not configured)
      visible: hasAdminAccess || (enabled && isConfigured),
      disabled: !isConfigured,
    };
  }).filter(t => t.visible);

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
              <Select value={templateType} onValueChange={setTemplateType}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Preset Templates</SelectLabel>
                    {availablePresets.map((preset) => (
                      <SelectItem key={preset.key} value={preset.key}>
                        {preset.label.replace(" Template", "")}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  {availableCustom.length > 0 && (
                    <>
                      <SelectSeparator />
                      <SelectGroup>
                        <SelectLabel>Custom Templates</SelectLabel>
                        {availableCustom.map((custom) => (
                          <SelectItem 
                            key={custom.key} 
                            value={custom.key}
                            disabled={custom.disabled}
                          >
                            {custom.template?.name || `Custom ${custom.slot}`}
                            {custom.template && ` (${custom.template.point_count} pts)`}
                            {custom.disabled && " - Not Set"}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Collapsible Bluetooth Section */}
          {facilityId && selectedRink && (
            <BluetoothCaliperControl 
              onReading={handleBluetoothReading}
              currentPoint={currentPointId}
              unit={unit}
            />
          )}
        </CardContent>
      </Card>

      {facilityId && selectedRink && (
        <>

          <TemplateSelection
            templateType={templateType} 
            measurements={measurements}
            currentPointId={currentPointId}
            onPointClick={(pointId) => {
              // Allow clicking any point to jump to it
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
              const pointCount = getPointCount(templateType, updatedMeasurements);
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
