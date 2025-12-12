import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import rinkBackground from "@/assets/rink-background.jpg";

interface MeasurementPoint {
  id: number;
  x: number;
  y: number;
  name?: string;
}

interface SVGRinkDiagramProps {
  points: MeasurementPoint[];
  measurements: Record<string, number>;
  currentPointId: number;
  onPointClick?: (pointId: number) => void;
  onMeasurementChange?: (pointId: number, value: number) => void;
  unit: "in" | "mm";
  centerLogoUrl?: string | null;
  editMode?: boolean;
  onPointsChange?: (points: MeasurementPoint[]) => void;
  maxPoints?: number;
}

export const SVGRinkDiagram = ({
  points,
  measurements,
  currentPointId,
  onPointClick,
  onMeasurementChange,
  unit,
  centerLogoUrl,
  editMode = false,
  onPointsChange,
  maxPoints = 60,
}: SVGRinkDiagramProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [editingPointId, setEditingPointId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingPointId !== null) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editingPointId]);

  const getDisplayValue = (mmValue: number): string => {
    if (unit === "in") {
      return (mmValue / 25.4).toFixed(3);
    }
    return mmValue.toFixed(2);
  };

  const getDepthColor = (depth: number): string => {
    // depth is in mm
    const inches = depth / 25.4;
    if (inches < 0.75) return "bg-red-500";
    if (inches <= 1.25) return "bg-green-500";
    if (inches <= 1.5) return "bg-blue-500";
    return "bg-yellow-500";
  };

  const getPointState = (point: MeasurementPoint): "current" | "complete" | "available" => {
    const measurementKey = `Point ${point.id}`;
    const hasMeasurement = measurements[measurementKey] !== undefined && measurements[measurementKey] > 0;
    
    if (hasMeasurement) return "complete";
    if (point.id === currentPointId) return "current";
    return "available";
  };

  const handleDiagramClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editMode || !onPointsChange) return;
    if (points.length >= maxPoints) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newPoint: MeasurementPoint = {
      id: points.length + 1,
      x: parseFloat(x.toFixed(2)),
      y: parseFloat(y.toFixed(2)),
      name: `Point ${points.length + 1}`,
    };

    onPointsChange([...points, newPoint]);
  };

  const handlePointClick = (point: MeasurementPoint, e: React.MouseEvent) => {
    e.stopPropagation();

    if (editMode && onPointsChange) {
      // In edit mode, remove point on click
      const updatedPoints = points
        .filter(p => p.id !== point.id)
        .map((p, index) => ({ ...p, id: index + 1, name: `Point ${index + 1}` }));
      onPointsChange(updatedPoints);
      return;
    }

    // Normal mode - edit measurement
    onPointClick?.(point.id);
    setEditingPointId(point.id);
    const measurementKey = `Point ${point.id}`;
    const currentValue = measurements[measurementKey];
    if (currentValue) {
      setEditValue(getDisplayValue(currentValue));
    } else {
      setEditValue("");
    }
  };

  const handleInputSubmit = () => {
    if (editingPointId && editValue) {
      const numValue = parseFloat(editValue);
      if (!isNaN(numValue) && numValue > 0) {
        onMeasurementChange?.(editingPointId, numValue);
      }
    }
    setEditingPointId(null);
    setEditValue("");
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleInputSubmit();
    } else if (e.key === "Escape") {
      setEditingPointId(null);
      setEditValue("");
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Layer 1: Real ice photo background */}
      <div
        className={cn(
          "relative w-full rounded-lg overflow-hidden shadow-lg",
          editMode && "cursor-crosshair"
        )}
        onClick={handleDiagramClick}
      >
        <img
          src={rinkBackground}
          alt="Ice rink background"
          className="w-full h-auto object-cover"
          draggable={false}
        />

        {/* Layer 2: SVG Rink markings overlay */}
        <svg
          viewBox="0 0 200 85"
          className="absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Rink outline */}
          <rect
            x="2"
            y="2"
            width="196"
            height="81"
            rx="20"
            ry="20"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="0.5"
            opacity="0.6"
          />

          {/* Center red line */}
          <line
            x1="100"
            y1="2"
            x2="100"
            y2="83"
            stroke="#C41E3A"
            strokeWidth="0.8"
            opacity="0.7"
          />

          {/* Blue lines */}
          <line
            x1="65"
            y1="2"
            x2="65"
            y2="83"
            stroke="#0066B3"
            strokeWidth="0.6"
            opacity="0.7"
          />
          <line
            x1="135"
            y1="2"
            x2="135"
            y2="83"
            stroke="#0066B3"
            strokeWidth="0.6"
            opacity="0.7"
          />

          {/* Center circle */}
          <circle
            cx="100"
            cy="42.5"
            r="12"
            fill="none"
            stroke="#0066B3"
            strokeWidth="0.5"
            opacity="0.6"
          />

          {/* Goal creases */}
          <path
            d="M 12 36 Q 18 36 18 42.5 Q 18 49 12 49"
            fill="none"
            stroke="#0066B3"
            strokeWidth="0.4"
            opacity="0.6"
          />
          <path
            d="M 188 36 Q 182 36 182 42.5 Q 182 49 188 49"
            fill="none"
            stroke="#0066B3"
            strokeWidth="0.4"
            opacity="0.6"
          />

          {/* Face-off circles */}
          <circle cx="35" cy="22" r="8" fill="none" stroke="#C41E3A" strokeWidth="0.4" opacity="0.5" />
          <circle cx="35" cy="63" r="8" fill="none" stroke="#C41E3A" strokeWidth="0.4" opacity="0.5" />
          <circle cx="165" cy="22" r="8" fill="none" stroke="#C41E3A" strokeWidth="0.4" opacity="0.5" />
          <circle cx="165" cy="63" r="8" fill="none" stroke="#C41E3A" strokeWidth="0.4" opacity="0.5" />
        </svg>

        {/* Layer 3: Center ice logo */}
        {centerLogoUrl && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: "15%",
              opacity: 0.7,
            }}
          >
            <img
              src={centerLogoUrl}
              alt="Center ice logo"
              className="w-full h-auto"
              draggable={false}
            />
          </div>
        )}

        {/* Layer 4: Measurement points */}
        {points.map((point) => {
          const state = getPointState(point);
          const measurementKey = `Point ${point.id}`;
          const depth = measurements[measurementKey];
          const isEditing = editingPointId === point.id;

          return (
            <div
              key={point.id}
              className={cn(
                "absolute flex items-center justify-center rounded-full font-bold text-white transition-all cursor-pointer",
                "w-8 h-8 md:w-10 md:h-10 text-xs md:text-sm",
                state === "current" && "bg-primary animate-pulse shadow-lg ring-2 ring-primary/50",
                state === "complete" && depth && getDepthColor(depth),
                state === "available" && "bg-black/70 hover:bg-black",
                editMode && "hover:bg-red-500 hover:scale-110"
              )}
              style={{
                left: `${point.x}%`,
                top: `${point.y}%`,
                transform: "translate(-50%, -50%)",
              }}
              onClick={(e) => handlePointClick(point, e)}
            >
              {isEditing ? (
                <input
                  ref={inputRef}
                  type="number"
                  step={unit === "in" ? "0.001" : "0.01"}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleInputSubmit}
                  onKeyDown={handleInputKeyDown}
                  className="w-full h-full bg-transparent text-center text-white outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : state === "complete" && depth ? (
                <span className="text-[10px] md:text-xs">{getDisplayValue(depth)}</span>
              ) : (
                <span>{point.id}</span>
              )}
            </div>
          );
        })}

        {/* Edit mode overlay */}
        {editMode && (
          <div className="absolute top-2 left-2 bg-black/70 text-white px-3 py-1 rounded text-sm">
            Click to add points ({points.length}/{maxPoints}) • Click point to remove
          </div>
        )}
      </div>
    </div>
  );
};
