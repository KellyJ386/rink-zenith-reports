import { measurementPoints, MeasurementPoint } from "./measurementPoints";
import { Check } from "lucide-react";
import rink24Point from "@/assets/rink-24-point.svg";
import rink35Point from "@/assets/rink-35-point.svg";
import rink47Point from "@/assets/rink-47-point.svg";

interface InteractiveRinkDiagramProps {
  templateType: string;
  measurements: Record<string, number>;
  currentPointId: number;
  onPointClick?: (pointId: number) => void;
}

export const InteractiveRinkDiagram = ({
  templateType,
  measurements,
  currentPointId,
  onPointClick,
}: InteractiveRinkDiagramProps) => {
  const points = measurementPoints[templateType] || [];

  const getPointState = (point: MeasurementPoint): "disabled" | "current" | "complete" => {
    const measurementKey = `Point ${point.id}`;
    const hasMeasurement = measurements[measurementKey] !== undefined && measurements[measurementKey] > 0;
    
    if (hasMeasurement) return "complete";
    if (point.id === currentPointId) return "current";
    return "disabled";
  };

  const getPointStyles = (state: "disabled" | "current" | "complete", isSpecial?: boolean) => {
    const baseClasses = "absolute flex items-center justify-center rounded-full font-bold text-white transition-all cursor-pointer";
    
    // Responsive sizing
    const sizeClasses = state === "current" 
      ? "w-10 h-10 md:w-12 md:h-12 text-sm md:text-base" 
      : "w-8 h-8 md:w-10 md:h-10 text-xs md:text-sm";
    
    if (state === "disabled") {
      return `${baseClasses} ${sizeClasses} bg-muted text-muted-foreground opacity-50`;
    }
    
    if (state === "current") {
      return `${baseClasses} ${sizeClasses} bg-primary text-primary-foreground animate-pulse shadow-lg ring-2 ring-primary/50`;
    }
    
    if (state === "complete") {
      const bgColor = isSpecial ? "bg-amber-500" : "bg-green-500";
      return `${baseClasses} ${sizeClasses} ${bgColor} text-white shadow-md hover:scale-110`;
    }
    
    return baseClasses;
  };

  const getImageSource = () => {
    switch (templateType) {
      case "24-point":
        return rink24Point;
      case "35-point":
        return rink35Point;
      case "47-point":
        return rink47Point;
      default:
        return rink24Point;
    }
  };

  return (
    <div className="relative w-full" style={{ aspectRatio: "595.28 / 841.89" }}>
      {/* Base rink diagram */}
      <img
        src={getImageSource()}
        alt={`Ice rink ${templateType} measurement template`}
        className="w-full h-full object-contain"
      />
      
      {/* Measurement point overlays */}
      <div className="absolute inset-0 pointer-events-none">
        {points.map((point) => {
          const state = getPointState(point);
          const measurementKey = `Point ${point.id}`;
          const measurementValue = measurements[measurementKey];
          const hasValue = measurementValue !== undefined && measurementValue > 0;
          
          return (
            <div
              key={point.id}
              className={`${getPointStyles(state, point.isSpecial)} pointer-events-auto`}
              style={{
                left: `${point.x}%`,
                top: `${point.y}%`,
                transform: "translate(-50%, -50%)",
              }}
              onClick={() => onPointClick?.(point.id)}
              title={point.isSpecial ? point.specialLabel : point.name}
            >
              {state === "complete" ? (
                hasValue ? (
                  <span className="flex items-center gap-1">
                    <Check className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden md:inline text-xs">
                      {measurementValue.toFixed(2)}
                    </span>
                  </span>
                ) : (
                  <Check className="w-3 h-3 md:w-4 md:h-4" />
                )
              ) : (
                <span>{point.id}</span>
              )}
              
              {/* Special badge for goal crease and center ice */}
              {point.isSpecial && state !== "disabled" && (
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap shadow-md hidden md:block">
                  {point.specialLabel === "Center Ice" ? "CI" : "GC"}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
