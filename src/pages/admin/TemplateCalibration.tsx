import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalibrationRinkDiagram } from "@/components/ice-depth/CalibrationRinkDiagram";
import { measurementPoints, MeasurementPoint } from "@/components/ice-depth/measurementPoints";
import { useToast } from "@/hooks/use-toast";
import { Save, RotateCcw, GripVertical, Lock, Unlock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Json } from "@/integrations/supabase/types";

const PRESET_TEMPLATES = [
  { key: "25-point", label: "24-Point Template", pointCount: 25 },
  { key: "35-point", label: "35-Point Template", pointCount: 35 },
  { key: "47-point", label: "47-Point Template", pointCount: 47 },
];

const TemplateCalibration = () => {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("25-point");
  const [points, setPoints] = useState<MeasurementPoint[]>([]);
  const [selectedPointId, setSelectedPointId] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [facilityId, setFacilityId] = useState<string>("");
  const [existingOverrideId, setExistingOverrideId] = useState<string | null>(null);
  const [isCalibrated, setIsCalibrated] = useState(false);

  // Fetch user's facility
  useEffect(() => {
    const fetchFacility = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("facility_id")
        .eq("user_id", user.id)
        .single();

      if (profile?.facility_id) {
        setFacilityId(profile.facility_id);
      }
    };
    fetchFacility();
  }, []);

  // Load template points when template or facility changes
  useEffect(() => {
    const loadTemplate = async () => {
      if (!facilityId) return;

      // Check for existing facility override
      const { data: override } = await supabase
        .from("custom_templates")
        .select("id, template_data")
        .eq("facility_id", facilityId)
        .eq("is_preset_override", true)
        .eq("preset_template_key", selectedTemplate)
        .maybeSingle();

      if (override?.template_data) {
        const data = override.template_data as unknown as { points: MeasurementPoint[] };
        setPoints(data.points || []);
        setExistingOverrideId(override.id);
        setIsCalibrated(true);
      } else {
        // Use default points
        setPoints(JSON.parse(JSON.stringify(measurementPoints[selectedTemplate] || [])));
        setExistingOverrideId(null);
        setIsCalibrated(false);
      }
      setHasChanges(false);
      setSelectedPointId(null);
    };

    loadTemplate();
  }, [selectedTemplate, facilityId]);

  const handlePointMove = (id: number, x: number, y: number) => {
    setPoints((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)) } : p
      )
    );
    setHasChanges(true);
  };

  const handleResetToDefaults = () => {
    const defaultPoints = measurementPoints[selectedTemplate] || [];
    setPoints(JSON.parse(JSON.stringify(defaultPoints)));
    setHasChanges(true);
    toast({
      title: "Reset to Defaults",
      description: "Points have been reset to their default positions",
    });
  };

  const handleSaveCalibration = async () => {
    if (!facilityId) {
      toast({
        title: "Error",
        description: "No facility found for your account",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const templateData = { points } as unknown as Json;
      const templateInfo = PRESET_TEMPLATES.find((t) => t.key === selectedTemplate);

      if (existingOverrideId) {
        // Update existing override
        const { error } = await supabase
          .from("custom_templates")
          .update({
            template_data: templateData,
            point_count: points.length,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingOverrideId);

        if (error) throw error;
      } else {
        // Create new override
        const { data, error } = await supabase
          .from("custom_templates")
          .insert({
            name: `${templateInfo?.label || selectedTemplate} - Calibrated`,
            user_id: user.id,
            facility_id: facilityId,
            template_data: templateData,
            point_count: points.length,
            is_preset_override: true,
            preset_template_key: selectedTemplate,
          })
          .select("id")
          .single();

        if (error) throw error;
        setExistingOverrideId(data.id);
      }

      setHasChanges(false);
      setIsCalibrated(true);
      toast({
        title: "Calibration Saved",
        description: `${templateInfo?.label} positions have been saved for your facility`,
      });
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save calibration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCalibration = async () => {
    if (!existingOverrideId) return;

    try {
      const { error } = await supabase
        .from("custom_templates")
        .delete()
        .eq("id", existingOverrideId);

      if (error) throw error;

      // Reset to defaults
      setPoints(JSON.parse(JSON.stringify(measurementPoints[selectedTemplate] || [])));
      setExistingOverrideId(null);
      setIsCalibrated(false);
      setHasChanges(false);

      toast({
        title: "Calibration Removed",
        description: "Your facility will now use the default point positions",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove calibration",
        variant: "destructive",
      });
    }
  };

  const selectedPoint = points.find((p) => p.id === selectedPointId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Template Calibration</h2>
        <p className="text-muted-foreground">
          Drag points to correct their positions for your rink
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls Panel */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRESET_TEMPLATES.map((template) => (
                  <SelectItem key={template.key} value={template.key}>
                    {template.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              {isCalibrated ? (
                <Badge variant="default" className="gap-1">
                  <Lock className="h-3 w-3" />
                  Calibrated
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  <Unlock className="h-3 w-3" />
                  Using Defaults
                </Badge>
              )}
            </div>

            <div className="border-t pt-4 space-y-2">
              <Button
                onClick={handleSaveCalibration}
                disabled={!hasChanges || saving}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Calibration"}
              </Button>

              <Button
                variant="outline"
                onClick={handleResetToDefaults}
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>

              {isCalibrated && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteCalibration}
                  className="w-full"
                >
                  Remove Calibration
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Rink Diagram */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                  Drag Points to Calibrate
                </CardTitle>
                <CardDescription>
                  Click and drag any point to reposition it. Changes are saved per-facility.
                </CardDescription>
              </div>
              {hasChanges && (
                <Badge variant="secondary">Unsaved Changes</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedPoint && (
              <Alert className="mb-4">
                <AlertDescription className="flex items-center justify-between">
                  <span>
                    <strong>Point {selectedPoint.id}</strong>: x: {selectedPoint.x.toFixed(2)}%, y: {selectedPoint.y.toFixed(2)}%
                  </span>
                  {selectedPoint.isSpecial && (
                    <Badge variant="outline">{selectedPoint.specialLabel}</Badge>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <CalibrationRinkDiagram
              points={points}
              selectedPointId={selectedPointId}
              onPointSelect={setSelectedPointId}
              onPointMove={handlePointMove}
            />

            <div className="mt-4 text-sm text-muted-foreground text-center">
              {points.length} measurement points • Click a point to select, drag to move
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TemplateCalibration;
