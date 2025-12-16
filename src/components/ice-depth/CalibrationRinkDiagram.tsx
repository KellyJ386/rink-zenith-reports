import { useRef } from "react";
import { MeasurementPoint } from "./measurementPoints";
import { DraggablePoint } from "./DraggablePoint";
import USAHockeyRink from "./USAHockeyRink";

interface CalibrationRinkDiagramProps {
  points: MeasurementPoint[];
  selectedPointId: number | null;
  onPointSelect: (id: number) => void;
  onPointMove: (id: number, x: number, y: number) => void;
}

export const CalibrationRinkDiagram = ({
  points,
  selectedPointId,
  onPointSelect,
  onPointMove,
}: CalibrationRinkDiagramProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
      <div ref={containerRef} className="relative">
        {/* Base rink SVG without points */}
        <USAHockeyRink showPoints={false} />
        
        {/* Draggable points overlay */}
        <div className="absolute inset-0">
          {points.map((point) => (
            <DraggablePoint
              key={point.id}
              point={point}
              containerRef={containerRef}
              isSelected={selectedPointId === point.id}
              onClick={() => onPointSelect(point.id)}
              onPositionChange={onPointMove}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
