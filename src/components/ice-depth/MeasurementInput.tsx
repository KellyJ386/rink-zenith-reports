import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MeasurementInputProps {
  templateType: string;
  measurements: Record<string, number>;
  onMeasurementsChange: (measurements: Record<string, number>) => void;
}

export const MeasurementInput = ({
  templateType,
  measurements,
  onMeasurementsChange,
}: MeasurementInputProps) => {
  const getPointCount = () => {
    switch (templateType) {
      case "24-point":
        return 24;
      case "35-point":
        return 35;
      case "46-point":
        return 46;
      default:
        return 24;
    }
  };

  const pointCount = getPointCount();

  const handleMeasurementChange = (point: number, value: string) => {
    const numValue = parseFloat(value);
    onMeasurementsChange({
      ...measurements,
      [`Point ${point}`]: isNaN(numValue) ? 0 : numValue,
    });
  };

  return (
    <Card className="shadow-[var(--shadow-ice)]">
      <CardHeader>
        <CardTitle>Enter Measurements (inches)</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: pointCount }, (_, i) => i + 1).map((point) => (
              <div key={point} className="space-y-2">
                <Label htmlFor={`point-${point}`} className="text-sm">
                  Point {point}
                </Label>
                <Input
                  id={`point-${point}`}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={measurements[`Point ${point}`] || ""}
                  onChange={(e) => handleMeasurementChange(point, e.target.value)}
                  className="text-center"
                />
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};