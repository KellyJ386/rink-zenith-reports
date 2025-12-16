import { useState, useRef, useEffect } from "react";
import { MeasurementPoint } from "./measurementPoints";

interface DraggablePointProps {
  point: MeasurementPoint;
  containerRef: React.RefObject<HTMLDivElement>;
  onPositionChange: (id: number, x: number, y: number) => void;
  isSelected?: boolean;
  onClick?: () => void;
}

export const DraggablePoint = ({
  point,
  containerRef,
  onPositionChange,
  isSelected,
  onClick,
}: DraggablePointProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: point.x, y: point.y });
  const pointRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPosition({ x: point.x, y: point.y });
  }, [point.x, point.y]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    onClick?.();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      // Clamp to bounds
      const clampedX = Math.max(0, Math.min(100, x));
      const clampedY = Math.max(0, Math.min(100, y));

      setPosition({ x: clampedX, y: clampedY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onPositionChange(point.id, position.x, position.y);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, position, containerRef, onPositionChange, point.id]);

  // Touch support
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    onClick?.();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (!containerRef.current) return;
      const touch = e.touches[0];
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((touch.clientX - rect.left) / rect.width) * 100;
      const y = ((touch.clientY - rect.top) / rect.height) * 100;

      const clampedX = Math.max(0, Math.min(100, x));
      const clampedY = Math.max(0, Math.min(100, y));

      setPosition({ x: clampedX, y: clampedY });
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      onPositionChange(point.id, position.x, position.y);
    };

    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, position, containerRef, onPositionChange, point.id]);

  return (
    <div
      ref={pointRef}
      className={`absolute flex items-center justify-center rounded-full font-bold text-white transition-colors cursor-grab select-none
        ${isDragging 
          ? "w-14 h-14 bg-primary ring-4 ring-primary/50 z-50 cursor-grabbing scale-110" 
          : isSelected 
            ? "w-12 h-12 bg-primary ring-2 ring-primary/50 z-40" 
            : "w-10 h-10 bg-blue-600 hover:bg-blue-500 z-30"
        }`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: "translate(-50%, -50%)",
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <span className={`${isDragging ? "text-sm" : "text-xs"}`}>{point.id}</span>
      {isDragging && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          x: {position.x.toFixed(1)}% y: {position.y.toFixed(1)}%
        </div>
      )}
    </div>
  );
};
