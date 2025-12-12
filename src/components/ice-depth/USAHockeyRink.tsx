import React from 'react';

interface USAHockeyRinkProps {
  className?: string;
  showPoints?: boolean;
  points?: Array<{ id: number; x: number; y: number }>;
  measurements?: Record<string, number>;
  currentPointId?: number;
  onPointClick?: (pointId: number) => void;
  unit?: "in" | "mm";
}

const USAHockeyRink: React.FC<USAHockeyRinkProps> = ({
  className = "",
  showPoints = false,
  points = [],
  measurements = {},
  currentPointId,
  onPointClick,
  unit = "mm",
}) => {
  // Scale: 1 foot = 4 units for precision
  const scale = 4;
  const rinkLength = 200 * scale;
  const rinkWidth = 85 * scale;
  const cornerRadius = 28 * scale;

  // Key measurements
  const goalLineFromBoards = 11 * scale;
  const blueLineFromGoal = 64 * scale;
  const centerX = rinkLength / 2;
  const centerY = rinkWidth / 2;

  // Face-off positions
  const faceoffFromCenter = 22 * scale;
  const neutralFaceoffFromBlue = 5 * scale;
  const endFaceoffFromGoal = 20 * scale;

  // Circle dimensions
  const faceoffCircleRadius = 15 * scale;

  // Line widths
  const thinLine = 2;
  const thickLine = scale;

  // Colors
  const redLine = '#c8102e';
  const blueLine = '#003087';
  const creaseBlue = '#a8d4f0';

  // Goal line intersection with corner radius
  const goalLineOffset = cornerRadius - goalLineFromBoards;
  const goalLineIntersectOffset = Math.sqrt(cornerRadius * cornerRadius - goalLineOffset * goalLineOffset);
  const goalLineYTop = cornerRadius - goalLineIntersectOffset;
  const goalLineYBottom = rinkWidth - cornerRadius + goalLineIntersectOffset;

  // Calculated positions
  const leftGoalLine = goalLineFromBoards;
  const rightGoalLine = rinkLength - goalLineFromBoards;
  const leftBlueLine = goalLineFromBoards + blueLineFromGoal;
  const rightBlueLine = rinkLength - goalLineFromBoards - blueLineFromGoal;

  // Face-off spot positions
  const neutralFaceoffX_left = leftBlueLine + neutralFaceoffFromBlue;
  const neutralFaceoffX_right = rightBlueLine - neutralFaceoffFromBlue;
  const endFaceoffX_left = leftGoalLine + endFaceoffFromGoal;
  const endFaceoffX_right = rightGoalLine - endFaceoffFromGoal;
  const faceoffY_top = centerY - faceoffFromCenter;
  const faceoffY_bottom = centerY + faceoffFromCenter;

  // Rink outline path
  const rinkPath = `
    M ${cornerRadius} 0
    L ${rinkLength - cornerRadius} 0
    Q ${rinkLength} 0 ${rinkLength} ${cornerRadius}
    L ${rinkLength} ${rinkWidth - cornerRadius}
    Q ${rinkLength} ${rinkWidth} ${rinkLength - cornerRadius} ${rinkWidth}
    L ${cornerRadius} ${rinkWidth}
    Q 0 ${rinkWidth} 0 ${rinkWidth - cornerRadius}
    L 0 ${cornerRadius}
    Q 0 0 ${cornerRadius} 0
    Z
  `;

  const getDisplayValue = (mmValue: number): string => {
    if (unit === "in") {
      return (mmValue / 25.4).toFixed(3);
    }
    return mmValue.toFixed(2);
  };

  const getDepthColor = (depth: number): string => {
    const inches = depth / 25.4;
    if (inches < 0.75) return "#ef4444"; // red
    if (inches <= 1.25) return "#22c55e"; // green
    if (inches <= 1.5) return "#3b82f6"; // blue
    return "#eab308"; // yellow
  };

  const GoalCrease = ({ x, direction }: { x: number; direction: 'left' | 'right' }) => {
    const creaseRadius = 6 * scale;
    const creaseHalfWidth = 4 * scale;
    const dir = direction === 'left' ? 1 : -1;
    const sideLineLength = Math.sqrt(creaseRadius * creaseRadius - creaseHalfWidth * creaseHalfWidth);
    
    return (
      <g>
        <path
          d={`
            M ${x} ${centerY - creaseHalfWidth}
            L ${x + dir * sideLineLength} ${centerY - creaseHalfWidth}
            A ${creaseRadius} ${creaseRadius} 0 0 ${direction === 'left' ? 1 : 0} ${x + dir * sideLineLength} ${centerY + creaseHalfWidth}
            L ${x} ${centerY + creaseHalfWidth}
            Z
          `}
          fill={creaseBlue}
          opacity={0.7}
        />
        <line x1={x} y1={centerY - creaseHalfWidth} x2={x + dir * sideLineLength} y2={centerY - creaseHalfWidth} stroke={redLine} strokeWidth={thinLine} />
        <line x1={x} y1={centerY + creaseHalfWidth} x2={x + dir * sideLineLength} y2={centerY + creaseHalfWidth} stroke={redLine} strokeWidth={thinLine} />
        <path
          d={`M ${x + dir * sideLineLength} ${centerY - creaseHalfWidth} A ${creaseRadius} ${creaseRadius} 0 0 ${direction === 'left' ? 1 : 0} ${x + dir * sideLineLength} ${centerY + creaseHalfWidth}`}
          fill="none"
          stroke={redLine}
          strokeWidth={thinLine}
        />
      </g>
    );
  };

  const GoalNet = ({ x, direction }: { x: number; direction: 'left' | 'right' }) => {
    const goalWidth = 6 * scale / 2;
    const goalDepth = 3.33 * scale;
    const dir = direction === 'left' ? -1 : 1;
    
    return (
      <g>
        <rect
          x={direction === 'left' ? x + dir * goalDepth : x}
          y={centerY - goalWidth}
          width={goalDepth}
          height={goalWidth * 2}
          fill="none"
          stroke={redLine}
          strokeWidth={3}
        />
        <circle cx={x} cy={centerY - goalWidth} r={2} fill={redLine} />
        <circle cx={x} cy={centerY + goalWidth} r={2} fill={redLine} />
      </g>
    );
  };

  const EndZoneFaceoffCircle = ({ cx, cy }: { cx: number; cy: number }) => {
    const hashLength = 2 * scale;
    const hashDistance = 2 * scale;
    const lShapeLength = 4 * scale;
    const lShapeWidth = 3 * scale;

    return (
      <g>
        <circle cx={cx} cy={cy} r={faceoffCircleRadius} fill="none" stroke={redLine} strokeWidth={thinLine} />
        <circle cx={cx} cy={cy} r={scale} fill={redLine} />
        
        {[-1, 1].map(side => (
          <g key={`hash-${side}`}>
            <line x1={cx - hashDistance} y1={cy + side * (faceoffCircleRadius + 1)} x2={cx - hashDistance} y2={cy + side * (faceoffCircleRadius + hashLength + 1)} stroke={redLine} strokeWidth={thinLine} />
            <line x1={cx + hashDistance} y1={cy + side * (faceoffCircleRadius + 1)} x2={cx + hashDistance} y2={cy + side * (faceoffCircleRadius + hashLength + 1)} stroke={redLine} strokeWidth={thinLine} />
          </g>
        ))}
        
        {[-1, 1].map((yDir, i) => (
          <g key={`L-left-${i}`}>
            <line x1={cx - 4} y1={cy + yDir * 8} x2={cx - 4 - lShapeWidth} y2={cy + yDir * 8} stroke={redLine} strokeWidth={thinLine} />
            <line x1={cx - 4} y1={cy + yDir * 8} x2={cx - 4} y2={cy + yDir * (8 + lShapeLength)} stroke={redLine} strokeWidth={thinLine} />
          </g>
        ))}
        {[-1, 1].map((yDir, i) => (
          <g key={`L-right-${i}`}>
            <line x1={cx + 4} y1={cy + yDir * 8} x2={cx + 4 + lShapeWidth} y2={cy + yDir * 8} stroke={redLine} strokeWidth={thinLine} />
            <line x1={cx + 4} y1={cy + yDir * 8} x2={cx + 4} y2={cy + yDir * (8 + lShapeLength)} stroke={redLine} strokeWidth={thinLine} />
          </g>
        ))}
      </g>
    );
  };

  const NeutralFaceoffSpot = ({ cx, cy }: { cx: number; cy: number }) => (
    <g>
      <circle cx={cx} cy={cy} r={scale} fill={redLine} />
      <circle cx={cx} cy={cy} r={scale * 1.5} fill="none" stroke={redLine} strokeWidth={thinLine} />
    </g>
  );

  return (
    <div className={`w-full ${className}`}>
      <svg 
        viewBox={`-10 -10 ${rinkWidth + 20} ${rinkLength + 20}`} 
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="iceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f0f7fc" />
            <stop offset="50%" stopColor="#e8f4fc" />
            <stop offset="100%" stopColor="#dceef8" />
          </linearGradient>
        </defs>

        <g transform={`rotate(90, ${rinkWidth / 2}, ${rinkWidth / 2})`}>
          {/* Ice surface */}
          <path d={rinkPath} fill="url(#iceGradient)" />
          <path d={rinkPath} fill="none" stroke="#000000" strokeWidth="6" />

          {/* Goal lines */}
          <line x1={leftGoalLine} y1={goalLineYTop} x2={leftGoalLine} y2={goalLineYBottom} stroke={redLine} strokeWidth={thinLine} />
          <line x1={rightGoalLine} y1={goalLineYTop} x2={rightGoalLine} y2={goalLineYBottom} stroke={redLine} strokeWidth={thinLine} />

          {/* Blue lines */}
          <rect x={leftBlueLine - thickLine / 2} y={0} width={thickLine} height={rinkWidth} fill={blueLine} />
          <rect x={rightBlueLine - thickLine / 2} y={0} width={thickLine} height={rinkWidth} fill={blueLine} />

          {/* Center red line */}
          <rect x={centerX - thickLine / 2} y={0} width={thickLine} height={rinkWidth} fill={redLine} />

          {/* Center circle */}
          <circle cx={centerX} cy={centerY} r={faceoffCircleRadius} fill="none" stroke={blueLine} strokeWidth={thinLine} />
          <circle cx={centerX} cy={centerY} r={scale / 2} fill={blueLine} />

          {/* Goal creases */}
          <GoalCrease x={leftGoalLine} direction="left" />
          <GoalCrease x={rightGoalLine} direction="right" />

          {/* Goal nets */}
          <GoalNet x={leftGoalLine} direction="left" />
          <GoalNet x={rightGoalLine} direction="right" />

          {/* End zone faceoff circles */}
          <EndZoneFaceoffCircle cx={endFaceoffX_left} cy={faceoffY_top} />
          <EndZoneFaceoffCircle cx={endFaceoffX_left} cy={faceoffY_bottom} />
          <EndZoneFaceoffCircle cx={endFaceoffX_right} cy={faceoffY_top} />
          <EndZoneFaceoffCircle cx={endFaceoffX_right} cy={faceoffY_bottom} />

          {/* Neutral zone faceoff spots */}
          <NeutralFaceoffSpot cx={neutralFaceoffX_left} cy={faceoffY_top} />
          <NeutralFaceoffSpot cx={neutralFaceoffX_left} cy={faceoffY_bottom} />
          <NeutralFaceoffSpot cx={neutralFaceoffX_right} cy={faceoffY_top} />
          <NeutralFaceoffSpot cx={neutralFaceoffX_right} cy={faceoffY_bottom} />

          {/* Measurement points overlay */}
          {showPoints && points.map((point) => {
            const measurementKey = `Point ${point.id}`;
            const depth = measurements[measurementKey];
            const isCurrent = point.id === currentPointId;
            const hasValue = depth !== undefined && depth > 0;
            
            // Convert percentage-based coordinates to SVG coordinates
            const svgX = (point.x / 100) * rinkLength;
            const svgY = (point.y / 100) * rinkWidth;
            
            return (
              <g 
                key={point.id}
                onClick={() => onPointClick?.(point.id)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={svgX}
                  cy={svgY}
                  r={12}
                  fill={hasValue ? getDepthColor(depth) : isCurrent ? "hsl(var(--primary))" : "#374151"}
                  stroke="#fff"
                  strokeWidth={2}
                  opacity={isCurrent ? 1 : 0.9}
                />
                <text
                  x={svgX}
                  y={svgY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#fff"
                  fontSize="8"
                  fontWeight="bold"
                >
                  {hasValue ? getDisplayValue(depth) : point.id}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

export default USAHockeyRink;
