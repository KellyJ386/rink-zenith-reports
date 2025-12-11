import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InteractiveRinkDiagram } from "./InteractiveRinkDiagram";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TemplateSelectionProps {
  templateType: string;
  measurements: Record<string, number>;
  currentPointId: number;
  onPointClick?: (pointId: number) => void;
  onMeasurementChange?: (pointId: number, value: number) => void;
  onMeasurementComplete?: () => void;
  unit: "in" | "mm";
  rinkId?: string;
}

export const TemplateSelection = ({ 
  templateType, 
  measurements, 
  currentPointId,
  onPointClick,
  onMeasurementChange,
  onMeasurementComplete,
  unit,
  rinkId
}: TemplateSelectionProps) => {
  const [centerIceLogoUrl, setCenterIceLogoUrl] = useState<string | undefined>();

  useEffect(() => {
    const fetchRinkLogo = async () => {
      if (!rinkId) return;
      
      const { data: rink } = await supabase
        .from("rinks")
        .select("center_ice_logo_url")
        .eq("id", rinkId)
        .single();
      
      if (rink?.center_ice_logo_url) {
        setCenterIceLogoUrl(rink.center_ice_logo_url);
      }
    };

    fetchRinkLogo();
  }, [rinkId]);

  return (
    <Card className="shadow-[var(--shadow-ice)]">
      <CardHeader>
        <CardTitle>Rink Diagram - {templateType}</CardTitle>
      </CardHeader>
      <CardContent className="p-2 md:p-6">
        <div className="w-full max-w-full overflow-hidden">
          <InteractiveRinkDiagram
            templateType={templateType}
            measurements={measurements}
            currentPointId={currentPointId}
            onPointClick={onPointClick}
            onMeasurementChange={onMeasurementChange}
            onMeasurementComplete={onMeasurementComplete}
            unit={unit}
            centerIceLogoUrl={centerIceLogoUrl}
          />
        </div>
      </CardContent>
    </Card>
  );
};