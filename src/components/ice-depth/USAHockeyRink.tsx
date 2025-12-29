import React, { useState, useRef, useEffect } from 'react';

interface Point {
  id: number;
  x: number;
  y: number;
}

interface USAHockeyRinkProps {
  className?: string;
  style?: React.CSSProperties;
  showPoints?: boolean;
  points?: Point[];
  measurements?: Record<string | number, number>;
  currentPointId?: number | null;
  onPointClick?: (pointId: number) => void;
  onMeasurementChange?: (pointId: number, value: number) => void;
  unit?: 'in' | 'mm';
}

const USAHockeyRink: React.FC<USAHockeyRinkProps> = ({
  className = '',
  style,
  showPoints = false,
  points = [],
  measurements = {},
  currentPointId = null,
  onPointClick,
  onMeasurementChange,
  unit = 'in'
}) => {
  const [editingPointId, setEditingPointId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingPointId !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingPointId]);

  // Standard NHL rink dimensions (200ft x 85ft)
  const rinkWidth = 200;
  const rinkHeight = 85;
  const scale = 1;
  
  // Calculate positions based on percentage
  const cornerRadius = 28 * scale;
  const goalLineFromEnd = 11 * scale;
  const blueLineFromCenter = 25 * scale;
  const centerX = rinkWidth / 2;
  const centerY = rinkHeight / 2;
  
  // Circle radii
  const centerCircleRadius = 15 * scale;
  const faceoffCircleRadius = 15 * scale;
  
  // Faceoff spot positions
  const faceoffDotsFromCenter = 22 * scale;
  const neutralZoneDotsFromCenter = 5 * scale;
  const faceoffDotsFromSide = 22 * scale;

  // Helper to get display value
  const getDisplayValue = (depth: number) => {
    if (unit === 'mm') {
      return `${(depth * 25.4).toFixed(0)}`;
    }
    return depth.toFixed(2);
  };

  // Color based on depth
  const getDepthColor = (depth: number) => {
    if (depth < 0.75) return '#ef4444'; // red - too thin
    if (depth > 1.25) return '#f97316'; // orange - too thick
    return '#22c55e'; // green - good
  };

  const handlePointClick = (pointId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Start editing this point
    setEditingPointId(pointId);
    const currentValue = measurements[pointId];
    setEditValue(currentValue !== undefined ? getDisplayValue(currentValue) : '');
    
    // Also notify parent
    if (onPointClick) {
      onPointClick(pointId);
    }
  };

  const handleInputSubmit = () => {
    if (editingPointId === null) return;
    
    const numValue = parseFloat(editValue);
    if (!isNaN(numValue) && numValue > 0) {
      // Convert from display unit to inches for storage
      const valueInInches = unit === 'mm' ? numValue / 25.4 : numValue;
      
      if (onMeasurementChange) {
        onMeasurementChange(editingPointId, valueInInches);
      }
    }
    
    setEditingPointId(null);
    setEditValue('');
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInputSubmit();
    } else if (e.key === 'Escape') {
      setEditingPointId(null);
      setEditValue('');
    }
  };

  const handleInputBlur = () => {
    handleInputSubmit();
  };

  return (
    <div className={`relative ${className}`} style={style}>
      <svg
        viewBox={`0 0 ${rinkWidth} ${rinkHeight}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Ice surface background */}
        <rect x="0" y="0" width={rinkWidth} height={rinkHeight} fill="hsl(200, 30%, 95%)" />
        
        {/* Rink outline with rounded corners */}
        <rect
          x="1"
          y="1"
          width={rinkWidth - 2}
          height={rinkHeight - 2}
          rx={cornerRadius}
          ry={cornerRadius}
          fill="none"
          stroke="hsl(210, 50%, 40%)"
          strokeWidth="1"
        />

        {/* Goal lines */}
        <line x1={goalLineFromEnd} y1="1" x2={goalLineFromEnd} y2={rinkHeight - 1} stroke="#C41E3A" strokeWidth="0.5" />
        <line x1={rinkWidth - goalLineFromEnd} y1="1" x2={rinkWidth - goalLineFromEnd} y2={rinkHeight - 1} stroke="#C41E3A" strokeWidth="0.5" />

        {/* Blue lines */}
        <line x1={centerX - blueLineFromCenter} y1="1" x2={centerX - blueLineFromCenter} y2={rinkHeight - 1} stroke="#0066B3" strokeWidth="1" />
        <line x1={centerX + blueLineFromCenter} y1="1" x2={centerX + blueLineFromCenter} y2={rinkHeight - 1} stroke="#0066B3" strokeWidth="1" />

        {/* Center red line */}
        <line x1={centerX} y1="1" x2={centerX} y2={rinkHeight - 1} stroke="#C41E3A" strokeWidth="1.5" />

        {/* Center circle */}
        <circle cx={centerX} cy={centerY} r={centerCircleRadius} fill="none" stroke="#0066B3" strokeWidth="0.8" />
        <circle cx={centerX} cy={centerY} r="1.5" fill="#0066B3" />

        {/* Goal creases */}
        <path 
          d={`M ${goalLineFromEnd} ${centerY - 6} Q ${goalLineFromEnd + 6} ${centerY - 6} ${goalLineFromEnd + 6} ${centerY} Q ${goalLineFromEnd + 6} ${centerY + 6} ${goalLineFromEnd} ${centerY + 6}`}
          fill="none" stroke="#C41E3A" strokeWidth="0.6" 
        />
        <path 
          d={`M ${rinkWidth - goalLineFromEnd} ${centerY - 6} Q ${rinkWidth - goalLineFromEnd - 6} ${centerY - 6} ${rinkWidth - goalLineFromEnd - 6} ${centerY} Q ${rinkWidth - goalLineFromEnd - 6} ${centerY + 6} ${rinkWidth - goalLineFromEnd} ${centerY + 6}`}
          fill="none" stroke="#C41E3A" strokeWidth="0.6" 
        />

        {/* Faceoff circles - End zones */}
        {/* Left end zone */}
        <circle cx={goalLineFromEnd + faceoffDotsFromCenter} cy={centerY - faceoffDotsFromSide} r={faceoffCircleRadius} fill="none" stroke="#C41E3A" strokeWidth="0.6" />
        <circle cx={goalLineFromEnd + faceoffDotsFromCenter} cy={centerY - faceoffDotsFromSide} r="1" fill="#C41E3A" />
        <circle cx={goalLineFromEnd + faceoffDotsFromCenter} cy={centerY + faceoffDotsFromSide} r={faceoffCircleRadius} fill="none" stroke="#C41E3A" strokeWidth="0.6" />
        <circle cx={goalLineFromEnd + faceoffDotsFromCenter} cy={centerY + faceoffDotsFromSide} r="1" fill="#C41E3A" />

        {/* Right end zone */}
        <circle cx={rinkWidth - goalLineFromEnd - faceoffDotsFromCenter} cy={centerY - faceoffDotsFromSide} r={faceoffCircleRadius} fill="none" stroke="#C41E3A" strokeWidth="0.6" />
        <circle cx={rinkWidth - goalLineFromEnd - faceoffDotsFromCenter} cy={centerY - faceoffDotsFromSide} r="1" fill="#C41E3A" />
        <circle cx={rinkWidth - goalLineFromEnd - faceoffDotsFromCenter} cy={centerY + faceoffDotsFromSide} r={faceoffCircleRadius} fill="none" stroke="#C41E3A" strokeWidth="0.6" />
        <circle cx={rinkWidth - goalLineFromEnd - faceoffDotsFromCenter} cy={centerY + faceoffDotsFromSide} r="1" fill="#C41E3A" />

        {/* Neutral zone faceoff dots */}
        <circle cx={centerX - 20} cy={centerY - faceoffDotsFromSide} r="1" fill="#C41E3A" />
        <circle cx={centerX - 20} cy={centerY + faceoffDotsFromSide} r="1" fill="#C41E3A" />
        <circle cx={centerX + 20} cy={centerY - faceoffDotsFromSide} r="1" fill="#C41E3A" />
        <circle cx={centerX + 20} cy={centerY + faceoffDotsFromSide} r="1" fill="#C41E3A" />

        {/* Measurement points */}
        {showPoints && points.map((point) => {
          const svgX = (point.x / 100) * rinkWidth;
          const svgY = (point.y / 100) * rinkHeight;
          const depth = measurements[point.id];
          const hasValue = depth !== undefined;
          const isCurrentPoint = currentPointId === point.id;
          const isEditing = editingPointId === point.id;
          
          const fillColor = hasValue ? getDepthColor(depth) : (isCurrentPoint ? '#3b82f6' : '#6b7280');
          
          return (
            <g key={point.id}>
              <circle
                cx={svgX}
                cy={svgY}
                r="5"
                fill={fillColor}
                stroke={isCurrentPoint || isEditing ? '#fff' : 'none'}
                strokeWidth={isCurrentPoint || isEditing ? '1' : '0'}
                className="cursor-pointer transition-all hover:opacity-80"
                onClick={(e) => handlePointClick(point.id, e)}
              />
              {!isEditing && (
                <text
                  x={svgX}
                  y={svgY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#fff"
                  fontSize="4"
                  fontWeight="bold"
                  className="pointer-events-none select-none"
                >
                  {hasValue ? getDisplayValue(depth) : point.id}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Floating input for editing */}
      {editingPointId !== null && points.find(p => p.id === editingPointId) && (
        <div
          className="absolute z-10"
          style={{
            left: `${points.find(p => p.id === editingPointId)!.x}%`,
            top: `${points.find(p => p.id === editingPointId)!.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <input
            ref={inputRef}
            type="number"
            step="0.01"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            onBlur={handleInputBlur}
            className="w-16 h-8 text-center text-sm font-medium border-2 border-primary rounded-md bg-background shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder={unit === 'mm' ? 'mm' : 'in'}
          />
        </div>
      )}
    </div>
  );
};

export default USAHockeyRink;
