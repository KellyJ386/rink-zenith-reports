import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, ArrowRight } from "lucide-react";
import { getPointCount } from "./measurementPoints";
import { useEffect, useRef } from "react";

interface MeasurementInputProps {
  templateType: string;
  measurements: Record<string, number>;
  onMeasurementsChange: (measurements: Record<string, number>) => void;
  currentPointId: number;
}

export const MeasurementInput = ({
  templateType,
  measurements,
  onMeasurementsChange,
  currentPointId,
}: MeasurementInputProps) => {
  const pointCount = getPointCount(templateType);
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // Auto-focus current input
  useEffect(() => {
    const currentInput = inputRefs.current[currentPointId];
    if (currentInput && currentPointId <= pointCount) {
      currentInput.focus();
    }
  }, [currentPointId, pointCount]);

  const handleMeasurementChange = (point: number, value: string) => {
    const numValue = parseFloat(value);
    onMeasurementsChange({
      ...measurements,
      [`Point ${point}`]: isNaN(numValue) ? 0 : numValue,
    });
  };

  const isPointComplete = (point: number) => {
    const value = measurements[`Point ${point}`];
    return value !== undefined && value > 0;
  };

  const isPointDisabled = (point: number) => {
    return point > currentPointId;
  };

  const filledCount = Object.values(measurements).filter(v => v > 0).length;

  return (
    <Card className="shadow-[var(--shadow-ice)]">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Enter Measurements (inches)</span>
          <span className="text-sm text-muted-foreground font-normal">
            Progress: {filledCount} / {pointCount}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {Array.from({ length: pointCount }, (_, i) => i + 1).map((point) => {
              const isCurrent = point === currentPointId;
              const isComplete = isPointComplete(point);
              const isDisabled = isPointDisabled(point);
              
              return (
                <div 
                  key={point} 
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isCurrent ? "bg-primary/10 ring-2 ring-primary" : 
                    isComplete ? "bg-green-500/10" : 
                    "bg-muted/30"
                  }`}
                >
                  {/* Status indicator */}
                  <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                    {isComplete ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : isCurrent ? (
                      <ArrowRight className="w-5 h-5 text-primary animate-pulse" />
                    ) : (
                      <span className="text-muted-foreground text-sm">{point}</span>
                    )}
                  </div>
                  
                  {/* Label */}
                  <Label 
                    htmlFor={`point-${point}`} 
                    className={`flex-shrink-0 w-20 text-sm ${
                      isCurrent ? "text-primary font-semibold" : 
                      isComplete ? "text-green-600" : 
                      isDisabled ? "text-muted-foreground" : ""
                    }`}
                  >
                    Point {point}
                  </Label>
                  
                  {/* Input */}
                  <Input
                    ref={(el) => (inputRefs.current[point] = el)}
                    id={`point-${point}`}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={measurements[`Point ${point}`] || ""}
                    onChange={(e) => handleMeasurementChange(point, e.target.value)}
                    disabled={isDisabled}
                    className={`text-center ${
                      isCurrent ? "ring-2 ring-primary" : ""
                    }`}
                  />
                  
                  {/* Value display for completed */}
                  {isComplete && (
                    <span className="flex-shrink-0 text-sm text-green-600 font-medium">
                      {measurements[`Point ${point}`].toFixed(2)}"
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};