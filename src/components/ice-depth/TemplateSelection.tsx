import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InteractiveRinkDiagram } from "./InteractiveRinkDiagram";

interface TemplateSelectionProps {
  templateType: string;
  measurements: Record<string, number>;
  currentPointId: number;
  onPointClick?: (pointId: number) => void;
  onMeasurementChange?: (pointId: number, value: number) => void;
  unit: "in" | "mm";
}

export const TemplateSelection = ({ 
  templateType, 
  measurements, 
  currentPointId,
  onPointClick,
  onMeasurementChange,
  unit
}: TemplateSelectionProps) => {
  return (
    <Card className="shadow-[var(--shadow-ice)]">
      <CardHeader>
        <CardTitle>Rink Diagram - {templateType}</CardTitle>
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
          />
        </div>
      </CardContent>
    </Card>
  );
};