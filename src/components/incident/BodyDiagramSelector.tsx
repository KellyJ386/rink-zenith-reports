import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BodyDiagramSelectorProps {
  selectedParts: string[];
  onPartsChange: (parts: string[]) => void;
}

const bodyParts = {
  front: [
    { id: "head_front", label: "Head", x: 50, y: 10, width: 15, height: 12 },
    { id: "neck_front", label: "Neck", x: 50, y: 22, width: 8, height: 6 },
    { id: "chest", label: "Chest", x: 50, y: 28, width: 20, height: 15 },
    { id: "abdomen", label: "Abdomen", x: 50, y: 43, width: 18, height: 12 },
    { id: "left_shoulder", label: "Left Shoulder", x: 32, y: 28, width: 10, height: 8 },
    { id: "right_shoulder", label: "Right Shoulder", x: 68, y: 28, width: 10, height: 8 },
    { id: "left_arm_upper", label: "Left Upper Arm", x: 25, y: 36, width: 8, height: 15 },
    { id: "right_arm_upper", label: "Right Upper Arm", x: 75, y: 36, width: 8, height: 15 },
    { id: "left_forearm", label: "Left Forearm", x: 22, y: 51, width: 8, height: 14 },
    { id: "right_forearm", label: "Right Forearm", x: 78, y: 51, width: 8, height: 14 },
    { id: "left_hand", label: "Left Hand", x: 20, y: 65, width: 8, height: 8 },
    { id: "right_hand", label: "Right Hand", x: 80, y: 65, width: 8, height: 8 },
    { id: "left_thigh", label: "Left Thigh", x: 43, y: 55, width: 9, height: 18 },
    { id: "right_thigh", label: "Right Thigh", x: 57, y: 55, width: 9, height: 18 },
    { id: "left_knee", label: "Left Knee", x: 43, y: 73, width: 9, height: 6 },
    { id: "right_knee", label: "Right Knee", x: 57, y: 73, width: 9, height: 6 },
    { id: "left_shin", label: "Left Shin", x: 43, y: 79, width: 8, height: 15 },
    { id: "right_shin", label: "Right Shin", x: 57, y: 79, width: 8, height: 15 },
    { id: "left_foot", label: "Left Foot", x: 42, y: 94, width: 9, height: 6 },
    { id: "right_foot", label: "Right Foot", x: 57, y: 94, width: 9, height: 6 }
  ],
  back: [
    { id: "head_back", label: "Head (Back)", x: 50, y: 10, width: 15, height: 12 },
    { id: "neck_back", label: "Neck (Back)", x: 50, y: 22, width: 8, height: 6 },
    { id: "upper_back", label: "Upper Back", x: 50, y: 28, width: 20, height: 12 },
    { id: "lower_back", label: "Lower Back", x: 50, y: 40, width: 18, height: 15 },
    { id: "left_shoulder_back", label: "Left Shoulder (Back)", x: 32, y: 28, width: 10, height: 8 },
    { id: "right_shoulder_back", label: "Right Shoulder (Back)", x: 68, y: 28, width: 10, height: 8 },
    { id: "left_arm_back", label: "Left Arm (Back)", x: 25, y: 36, width: 8, height: 15 },
    { id: "right_arm_back", label: "Right Arm (Back)", x: 75, y: 36, width: 8, height: 15 },
    { id: "left_forearm_back", label: "Left Forearm (Back)", x: 22, y: 51, width: 8, height: 14 },
    { id: "right_forearm_back", label: "Right Forearm (Back)", x: 78, y: 51, width: 8, height: 14 },
    { id: "left_hand_back", label: "Left Hand (Back)", x: 20, y: 65, width: 8, height: 8 },
    { id: "right_hand_back", label: "Right Hand (Back)", x: 80, y: 65, width: 8, height: 8 },
    { id: "left_buttock", label: "Left Buttock", x: 43, y: 55, width: 9, height: 10 },
    { id: "right_buttock", label: "Right Buttock", x: 57, y: 55, width: 9, height: 10 },
    { id: "left_thigh_back", label: "Left Thigh (Back)", x: 43, y: 65, width: 9, height: 14 },
    { id: "right_thigh_back", label: "Right Thigh (Back)", x: 57, y: 65, width: 9, height: 14 },
    { id: "left_calf", label: "Left Calf", x: 43, y: 79, width: 8, height: 15 },
    { id: "right_calf", label: "Right Calf", x: 57, y: 79, width: 8, height: 15 },
    { id: "left_foot_back", label: "Left Foot (Back)", x: 42, y: 94, width: 9, height: 6 },
    { id: "right_foot_back", label: "Right Foot (Back)", x: 57, y: 94, width: 9, height: 6 }
  ]
};

export default function BodyDiagramSelector({ selectedParts, onPartsChange }: BodyDiagramSelectorProps) {
  const [view, setView] = useState<"front" | "back">("front");

  const togglePart = (partId: string) => {
    if (selectedParts.includes(partId)) {
      onPartsChange(selectedParts.filter(p => p !== partId));
    } else {
      onPartsChange([...selectedParts, partId]);
    }
  };

  const getPartLabel = (partId: string) => {
    const allParts = [...bodyParts.front, ...bodyParts.back];
    return allParts.find(p => p.id === partId)?.label || partId;
  };

  const currentParts = bodyParts[view];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Injury Location</CardTitle>
        <CardDescription>Body Injury Diagram - Click any part to mark injuries</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === "front" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted hover:bg-muted/80"
              }`}
              onClick={() => setView("front")}
            >
              Front View
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === "back" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted hover:bg-muted/80"
              }`}
              onClick={() => setView("back")}
            >
              Back View
            </button>
          </div>

          <div className="relative w-full max-w-md mx-auto border rounded-lg bg-muted/20 p-4">
            <svg viewBox="0 0 100 100" className="w-full h-auto">
              {/* Body outline */}
              <g className="stroke-foreground/30 fill-none" strokeWidth="0.5">
                {/* Head */}
                <ellipse cx="50" cy="16" rx="7" ry="8" />
                {/* Neck */}
                <rect x="46" y="22" width="8" height="6" rx="2" />
                {/* Torso */}
                <path d="M 35 28 L 35 55 L 65 55 L 65 28 Z" />
                {/* Arms */}
                <path d="M 22 36 L 22 65 L 30 65 L 30 36" />
                <path d="M 78 36 L 78 65 L 70 65 L 70 36" />
                {/* Legs */}
                <path d="M 43 55 L 43 94 L 51 94 L 51 55" />
                <path d="M 57 55 L 57 94 L 49 94 L 49 55" />
              </g>

              {/* Clickable body parts */}
              {currentParts.map((part) => {
                const isSelected = selectedParts.includes(part.id);
                return (
                  <rect
                    key={part.id}
                    x={part.x - part.width / 2}
                    y={part.y}
                    width={part.width}
                    height={part.height}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? "fill-destructive/70 stroke-destructive"
                        : "fill-muted/50 hover:fill-primary/30 stroke-border"
                    }`}
                    strokeWidth="0.5"
                    onClick={() => togglePart(part.id)}
                  >
                    <title>{part.label}</title>
                  </rect>
                );
              })}
            </svg>
            
            <p className="text-xs text-center text-muted-foreground mt-2">
              Click any part to mark injuries. Grey parts aren&apos;t configured but still selectable.
            </p>
          </div>

          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted/50 border" />
              <span>Uninjured</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-destructive/70" />
              <span>Injured</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted/20 border" />
              <span>Not configured</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-medium">Selected Injury Locations:</p>
            {selectedParts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No injuries selected</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedParts.map(partId => (
                  <Badge key={partId} variant="destructive">
                    {getPartLabel(partId)}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
