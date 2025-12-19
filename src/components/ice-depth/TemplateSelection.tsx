import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InteractiveRinkDiagram } from "./InteractiveRinkDiagram";

interface TemplatePoint {
  id: number;
  x: number;
  y: number;
  label?: string;
}

interface TemplateSelectionProps {
  templateType: string;
  measurements: Record<string, number>;
  currentPointId: number;
  onPointClick?: (pointId: number) => void;
  onMeasurementChange?: (pointId: number, value: number) => void;
  unit: "in" | "mm";
  facilityId?: string;
  customPoints?: TemplatePoint[];
}

export const TemplateSelection = ({ 
  templateType, 
  measurements, 
  currentPointId,
  onPointClick,
  onMeasurementChange,
  unit,
  facilityId,
  customPoints
}: TemplateSelectionProps) => {
  const displayName = customPoints 
    ? `Custom Template (${customPoints.length} points)` 
    : templateType;

  return (
    <Card className="shadow-[var(--shadow-ice)]">
      <CardHeader>
        <CardTitle>Rink Diagram - {displayName}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <div className="w-full">
          <InteractiveRinkDiagram
            templateType={templateType}
            measurements={measurements}
            currentPointId={currentPointId}
            onPointClick={onPointClick}
            onMeasurementChange={onMeasurementChange}
            unit={unit}
            facilityId={facilityId}
            customPoints={customPoints}
          />
        </div>
      </CardContent>
    </Card>
  );
};
