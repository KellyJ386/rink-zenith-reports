import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface BodyDiagramSelectorProps {
  selectedParts: string[];
  onPartsChange: (parts: string[]) => void;
}

type DiagramPart =
  | {
      id: string;
      label: string;
      kind: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      rx?: number;
      ry?: number;
    }
  | {
      id: string;
      label: string;
      kind: "ellipse";
      cx: number;
      cy: number;
      rx: number;
      ry: number;
    }
  | {
      id: string;
      label: string;
      kind: "path";
      d: string;
    };

// Simple, human-like “diagram” figure (rounded blocks) to match the reference UI
const bodyParts: Record<"front" | "back", DiagramPart[]> = {
  front: [
    { id: "head_front", label: "Head", kind: "ellipse", cx: 100, cy: 28, rx: 18, ry: 20 },
    { id: "neck_front", label: "Neck", kind: "rect", x: 90, y: 50, width: 20, height: 12, rx: 6 },

    // Shoulders moved in to touch neck (inside edge at x=90 and x=110)
    { id: "left_shoulder_front", label: "Left Shoulder", kind: "rect", x: 76, y: 58, width: 14, height: 14, rx: 4 },
    { id: "right_shoulder_front", label: "Right Shoulder", kind: "rect", x: 110, y: 58, width: 14, height: 14, rx: 4 },

    { id: "chest_front", label: "Chest", kind: "rect", x: 72, y: 74, width: 56, height: 54, rx: 10 },
    { id: "abdomen_front", label: "Abdomen", kind: "rect", x: 78, y: 130, width: 44, height: 36, rx: 10 },
    { id: "pelvis_front", label: "Pelvis", kind: "rect", x: 80, y: 168, width: 40, height: 22, rx: 10 },

    { id: "left_upper_arm_front", label: "Left Upper Arm", kind: "rect", x: 58, y: 78, width: 14, height: 44, rx: 7 },
    { id: "left_elbow_front", label: "Left Elbow", kind: "ellipse", cx: 65, cy: 126, rx: 7, ry: 7 },
    { id: "left_forearm_front", label: "Left Forearm", kind: "rect", x: 58, y: 133, width: 14, height: 44, rx: 7 },
    { id: "left_hand_front", label: "Left Hand", kind: "ellipse", cx: 65, cy: 187, rx: 9, ry: 11 },

    { id: "right_upper_arm_front", label: "Right Upper Arm", kind: "rect", x: 128, y: 78, width: 14, height: 44, rx: 7 },
    { id: "right_elbow_front", label: "Right Elbow", kind: "ellipse", cx: 135, cy: 126, rx: 7, ry: 7 },
    { id: "right_forearm_front", label: "Right Forearm", kind: "rect", x: 128, y: 133, width: 14, height: 44, rx: 7 },
    { id: "right_hand_front", label: "Right Hand", kind: "ellipse", cx: 135, cy: 187, rx: 9, ry: 11 },

    // Legs moved outward (left shifted left, right shifted right)
    { id: "left_thigh_front", label: "Left Thigh", kind: "rect", x: 80, y: 190, width: 14, height: 44, rx: 7 },
    { id: "right_thigh_front", label: "Right Thigh", kind: "rect", x: 106, y: 190, width: 14, height: 44, rx: 7 },
    { id: "left_knee_front", label: "Left Knee", kind: "ellipse", cx: 87, cy: 240, rx: 7, ry: 7 },
    { id: "right_knee_front", label: "Right Knee", kind: "ellipse", cx: 113, cy: 240, rx: 7, ry: 7 },
    { id: "left_shin_front", label: "Left Shin", kind: "rect", x: 80, y: 248, width: 14, height: 42, rx: 7 },
    { id: "right_shin_front", label: "Right Shin", kind: "rect", x: 106, y: 248, width: 14, height: 42, rx: 7 },
    { id: "left_foot_front", label: "Left Foot", kind: "ellipse", cx: 87, cy: 298, rx: 12, ry: 6 },
    { id: "right_foot_front", label: "Right Foot", kind: "ellipse", cx: 113, cy: 298, rx: 12, ry: 6 }
  ],
  back: [
    { id: "head_back", label: "Head (Back)", kind: "ellipse", cx: 100, cy: 28, rx: 18, ry: 20 },
    { id: "neck_back", label: "Neck (Back)", kind: "rect", x: 90, y: 50, width: 20, height: 12, rx: 6 },

    // Shoulders moved in to touch neck
    { id: "left_shoulder_back", label: "Left Shoulder (Back)", kind: "rect", x: 76, y: 58, width: 14, height: 14, rx: 4 },
    { id: "right_shoulder_back", label: "Right Shoulder (Back)", kind: "rect", x: 110, y: 58, width: 14, height: 14, rx: 4 },

    { id: "upper_back", label: "Upper Back", kind: "rect", x: 72, y: 74, width: 56, height: 54, rx: 10 },
    { id: "middle_back", label: "Middle Back", kind: "rect", x: 78, y: 130, width: 44, height: 36, rx: 10 },
    { id: "lower_back", label: "Lower Back", kind: "rect", x: 80, y: 168, width: 40, height: 22, rx: 10 },

    { id: "left_upper_arm_back", label: "Left Upper Arm (Back)", kind: "rect", x: 58, y: 78, width: 14, height: 44, rx: 7 },
    { id: "left_elbow_back", label: "Left Elbow (Back)", kind: "ellipse", cx: 65, cy: 126, rx: 7, ry: 7 },
    { id: "left_forearm_back", label: "Left Forearm (Back)", kind: "rect", x: 58, y: 133, width: 14, height: 44, rx: 7 },
    { id: "left_hand_back", label: "Left Hand (Back)", kind: "ellipse", cx: 65, cy: 187, rx: 9, ry: 11 },

    { id: "right_upper_arm_back", label: "Right Upper Arm (Back)", kind: "rect", x: 128, y: 78, width: 14, height: 44, rx: 7 },
    { id: "right_elbow_back", label: "Right Elbow (Back)", kind: "ellipse", cx: 135, cy: 126, rx: 7, ry: 7 },
    { id: "right_forearm_back", label: "Right Forearm (Back)", kind: "rect", x: 128, y: 133, width: 14, height: 44, rx: 7 },
    { id: "right_hand_back", label: "Right Hand (Back)", kind: "ellipse", cx: 135, cy: 187, rx: 9, ry: 11 },

    // Legs moved outward
    { id: "left_thigh_back", label: "Left Thigh (Back)", kind: "rect", x: 80, y: 190, width: 14, height: 44, rx: 7 },
    { id: "right_thigh_back", label: "Right Thigh (Back)", kind: "rect", x: 106, y: 190, width: 14, height: 44, rx: 7 },
    { id: "left_knee_back", label: "Left Knee (Back)", kind: "ellipse", cx: 87, cy: 240, rx: 7, ry: 7 },
    { id: "right_knee_back", label: "Right Knee (Back)", kind: "ellipse", cx: 113, cy: 240, rx: 7, ry: 7 },
    { id: "left_shin_back", label: "Left Shin (Back)", kind: "rect", x: 80, y: 248, width: 14, height: 42, rx: 7 },
    { id: "right_shin_back", label: "Right Shin (Back)", kind: "rect", x: 106, y: 248, width: 14, height: 42, rx: 7 },
    { id: "left_foot_back", label: "Left Foot (Back)", kind: "ellipse", cx: 87, cy: 298, rx: 12, ry: 6 },
    { id: "right_foot_back", label: "Right Foot (Back)", kind: "ellipse", cx: 113, cy: 298, rx: 12, ry: 6 }
  ]
};


export const BodyDiagramSelector = ({ selectedParts, onPartsChange }: BodyDiagramSelectorProps) => {
  const togglePart = (partId: string) => {
    if (selectedParts.includes(partId)) {
      onPartsChange(selectedParts.filter(id => id !== partId));
    } else {
      onPartsChange([...selectedParts, partId]);
    }
  };

  const getPartLabel = (partId: string): string => {
    const allParts = [...bodyParts.front, ...bodyParts.back];
    return allParts.find(part => part.id === partId)?.label || partId;
  };

  const getPartColor = (partId: string): string => {
    return selectedParts.includes(partId)
      ? "hsl(var(--destructive))"
      : "hsl(var(--injury-uninjured))";
  };

  const getPartStroke = (partId: string): string => {
    return selectedParts.includes(partId)
      ? "hsl(var(--injury-injured-stroke))"
      : "hsl(var(--injury-uninjured-stroke))";
  };

  const renderPart = (part: DiagramPart) => {
    const commonProps = {
      fill: getPartColor(part.id),
      stroke: getPartStroke(part.id),
      strokeWidth: 2,
      className: "cursor-pointer transition-all hover:brightness-110",
      onClick: () => togglePart(part.id)
    };

    switch (part.kind) {
      case "rect":
        return (
          <rect
            key={part.id}
            x={part.x}
            y={part.y}
            width={part.width}
            height={part.height}
            rx={part.rx ?? 8}
            ry={part.ry ?? part.rx ?? 8}
            {...commonProps}
          >
            <title>{part.label}</title>
          </rect>
        );
      case "ellipse":
        return (
          <ellipse
            key={part.id}
            cx={part.cx}
            cy={part.cy}
            rx={part.rx}
            ry={part.ry}
            {...commonProps}
          >
            <title>{part.label}</title>
          </ellipse>
        );
      case "path":
      default:
        return (
          <path key={part.id} d={part.d} {...commonProps}>
            <title>{part.label}</title>
          </path>
        );
    }
  };

  const renderBodyView = (view: "front" | "back", title: string) => (
    <div className="flex-1">
      <h3 className="text-base font-medium text-center mb-3 text-foreground">{title}</h3>
      <svg viewBox="0 0 200 310" className="w-full h-auto max-w-[200px] mx-auto">
        {bodyParts[view].map(renderPart)}

        {view === "front" && (
          <g
            pointerEvents="none"
            stroke={getPartStroke("head_front")}
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
          >
            <circle
              cx={94}
              cy={24}
              r={2}
              fill={getPartStroke("head_front")}
              stroke="none"
            />
            <circle
              cx={106}
              cy={24}
              r={2}
              fill={getPartStroke("head_front")}
              stroke="none"
            />
            <path d="M94 34 Q100 38 106 34" />
          </g>
        )}
      </svg>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">Body Injury Diagram</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-3 items-center justify-center pb-3 border-b text-sm">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded border-2"
              style={{
                backgroundColor: "hsl(var(--injury-uninjured))",
                borderColor: "hsl(var(--injury-uninjured-stroke))"
              }}
            />
            <span>Uninjured</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded border-2"
              style={{
                backgroundColor: "hsl(var(--destructive))",
                borderColor: "hsl(var(--injury-injured-stroke))"
              }}
            />
            <span>Injured</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-muted border-2 border-border"></div>
            <span>Not configured</span>
          </div>
        </div>

        <div className="flex gap-8 justify-center items-start">
          {renderBodyView("front", "Front View")}
          {renderBodyView("back", "Back View")}
        </div>

        <div className="text-sm text-muted-foreground text-center italic">
          Click any part to mark injuries. Gray parts aren't configurable but still selectable.
        </div>

        <div className="space-y-3">
          <div className="font-medium text-sm">Selected Injury Locations:</div>
          {selectedParts.length === 0 ? (
            <div className="text-sm text-muted-foreground italic">No injuries selected</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedParts.map(partId => (
                <span 
                  key={partId} 
                  className="text-sm px-3 py-1.5 bg-destructive/10 text-destructive rounded border border-destructive/20 font-medium"
                >
                  {getPartLabel(partId)}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="additional-injury-details">Additional Injury Details</Label>
          <Textarea 
            id="additional-injury-details"
            placeholder="Describe any other details about the injuries..."
            className="min-h-[80px]"
          />
        </div>
      </CardContent>
    </Card>
  );
};
