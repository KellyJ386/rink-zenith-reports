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
  unit: "in" | "mm";
  bluetoothConnected?: boolean;
}

export const MeasurementInput = ({
  templateType,
  measurements,
  onMeasurementsChange,
  currentPointId,
  unit,
  bluetoothConnected = false,
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
    // Convert display value to mm for internal storage
    const mmValue = unit === "in" ? numValue * 25.4 : numValue;
    onMeasurementsChange({
      ...measurements,
      [`Point ${point}`]: isNaN(mmValue) ? 0 : mmValue,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, point: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Find next unfilled point
      let nextPoint = point + 1;
      while (nextPoint <= pointCount) {
        const nextValue = measurements[`Point ${nextPoint}`];
        if (!nextValue || nextValue === 0) {
          const nextInput = inputRefs.current[nextPoint];
          nextInput?.focus();
          return;
        }
        nextPoint++;
      }
    }
  };

  const getDisplayValue = (point: number): string => {
    const mmValue = measurements[`Point ${point}`];
    if (!mmValue) return "";
    // Convert from mm to display unit
    const displayValue = unit === "in" ? mmValue / 25.4 : mmValue;
    return displayValue.toFixed(unit === "in" ? 3 : 2);
  };

  const getUnitLabel = () => unit === "in" ? "inches" : "mm";

  const isPointComplete = (point: number) => {
    const value = measurements[`Point ${point}`];
    return value !== undefined && value > 0;
  };

  const isPointDisabled = (point: number) => {
    // Don't disable any points - allow jumping to any point
    return false;
  };

  const filledCount = Object.values(measurements).filter(v => v > 0).length;

  return (
    <Card className="shadow-[var(--shadow-ice)]">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Enter Measurements ({getUnitLabel()})</span>
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
                    ) : isCurrent && bluetoothConnected ? (
                      <span className="relative flex h-5 w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <ArrowRight className="relative inline-flex w-5 h-5 text-primary" />
                      </span>
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
                    step={unit === "in" ? "0.001" : "0.01"}
                    placeholder={unit === "in" ? "0.000" : "0.00"}
                    value={getDisplayValue(point)}
                    onChange={(e) => handleMeasurementChange(point, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, point)}
                    disabled={isDisabled}
                    className={`text-center ${
                      isCurrent ? "ring-2 ring-primary" : ""
                    }`}
                  />
                  
                  {/* Value display for completed */}
                  {isComplete && (
                    <span className="flex-shrink-0 text-sm text-green-600 font-medium">
                      {getDisplayValue(point)}{unit === "in" ? '"' : " mm"}
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