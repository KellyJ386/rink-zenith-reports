import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InteractiveRinkDiagram } from "./InteractiveRinkDiagram";

interface TemplateSelectionProps {
  templateType: string;
  measurements: Record<string, number>;
  currentPointId: number;
  onPointClick?: (pointId: number) => void;
}

export const TemplateSelection = ({ 
  templateType, 
  measurements, 
  currentPointId,
  onPointClick 
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
          />
        </div>
      </CardContent>
    </Card>
  );
};