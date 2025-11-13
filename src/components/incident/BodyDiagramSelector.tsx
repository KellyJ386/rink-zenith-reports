import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface BodyDiagramSelectorProps {
  selectedParts: string[];
  onPartsChange: (parts: string[]) => void;
}

const bodyParts = {
  front: [
    { id: "head_front", label: "Head", path: "M85,15 A15,15 0 1,1 115,15 A15,15 0 1,1 85,15 Z" },
    { id: "neck_front", label: "Neck", path: "M95,30 L105,30 L105,40 L95,40 Z" },
    { id: "left_shoulder_front", label: "Left Shoulder", path: "M70,40 L85,40 L85,55 L70,55 Z" },
    { id: "right_shoulder_front", label: "Right Shoulder", path: "M115,40 L130,40 L130,55 L115,55 Z" },
    { id: "chest_front", label: "Chest", path: "M85,40 L115,40 L115,65 L85,65 Z" },
    { id: "abdomen_front", label: "Abdomen", path: "M85,65 L115,65 L115,80 L85,80 Z" },
    { id: "pelvis_front", label: "Pelvis", path: "M85,80 L115,80 L115,95 L85,95 Z" },
    { id: "left_upper_arm_front", label: "Left Upper Arm", path: "M70,55 L78,55 L78,85 L70,85 Z" },
    { id: "right_upper_arm_front", label: "Right Upper Arm", path: "M122,55 L130,55 L130,85 L122,85 Z" },
    { id: "left_elbow_front", label: "Left Elbow", path: "M66,85 A8,8 0 1,1 82,85 A8,8 0 1,1 66,85 Z" },
    { id: "right_elbow_front", label: "Right Elbow", path: "M118,85 A8,8 0 1,1 134,85 A8,8 0 1,1 118,85 Z" },
    { id: "left_forearm_front", label: "Left Forearm", path: "M70,93 L78,93 L78,120 L70,120 Z" },
    { id: "right_forearm_front", label: "Right Forearm", path: "M122,93 L130,93 L130,120 L122,120 Z" },
    { id: "left_hand_front", label: "Left Hand", path: "M66,120 A8,8 0 1,1 82,120 A8,8 0 1,1 66,120 Z" },
    { id: "right_hand_front", label: "Right Hand", path: "M118,120 A8,8 0 1,1 134,120 A8,8 0 1,1 118,120 Z" },
    { id: "left_thigh_front", label: "Left Thigh", path: "M85,95 L95,95 L95,130 L85,130 Z" },
    { id: "right_thigh_front", label: "Right Thigh", path: "M105,95 L115,95 L115,130 L105,130 Z" },
    { id: "left_knee_front", label: "Left Knee", path: "M82,130 A8,8 0 1,1 98,130 A8,8 0 1,1 82,130 Z" },
    { id: "right_knee_front", label: "Right Knee", path: "M102,130 A8,8 0 1,1 118,130 A8,8 0 1,1 102,130 Z" },
    { id: "left_shin_front", label: "Left Shin", path: "M85,138 L95,138 L95,168 L85,168 Z" },
    { id: "right_shin_front", label: "Right Shin", path: "M105,138 L115,138 L115,168 L105,168 Z" },
    { id: "left_foot_front", label: "Left Foot", path: "M80,168 L95,168 L95,178 L80,178 Z" },
    { id: "right_foot_front", label: "Right Foot", path: "M105,168 L120,168 L120,178 L105,178 Z" }
  ],
  back: [
    { id: "head_back", label: "Head (Back)", path: "M85,15 A15,15 0 1,1 115,15 A15,15 0 1,1 85,15 Z" },
    { id: "neck_back", label: "Neck (Back)", path: "M95,30 L105,30 L105,40 L95,40 Z" },
    { id: "left_shoulder_back", label: "Left Shoulder (Back)", path: "M70,40 L85,40 L85,55 L70,55 Z" },
    { id: "right_shoulder_back", label: "Right Shoulder (Back)", path: "M115,40 L130,40 L130,55 L115,55 Z" },
    { id: "upper_back", label: "Upper Back", path: "M85,40 L115,40 L115,65 L85,65 Z" },
    { id: "middle_back", label: "Middle Back", path: "M85,65 L115,65 L115,80 L85,80 Z" },
    { id: "lower_back", label: "Lower Back", path: "M85,80 L115,80 L115,95 L85,95 Z" },
    { id: "left_upper_arm_back", label: "Left Upper Arm (Back)", path: "M70,55 L78,55 L78,85 L70,85 Z" },
    { id: "right_upper_arm_back", label: "Right Upper Arm (Back)", path: "M122,55 L130,55 L130,85 L122,85 Z" },
    { id: "left_elbow_back", label: "Left Elbow (Back)", path: "M66,85 A8,8 0 1,1 82,85 A8,8 0 1,1 66,85 Z" },
    { id: "right_elbow_back", label: "Right Elbow (Back)", path: "M118,85 A8,8 0 1,1 134,85 A8,8 0 1,1 118,85 Z" },
    { id: "left_forearm_back", label: "Left Forearm (Back)", path: "M70,93 L78,93 L78,120 L70,120 Z" },
    { id: "right_forearm_back", label: "Right Forearm (Back)", path: "M122,93 L130,93 L130,120 L122,120 Z" },
    { id: "left_hand_back", label: "Left Hand (Back)", path: "M66,120 A8,8 0 1,1 82,120 A8,8 0 1,1 66,120 Z" },
    { id: "right_hand_back", label: "Right Hand (Back)", path: "M118,120 A8,8 0 1,1 134,120 A8,8 0 1,1 118,120 Z" },
    { id: "left_thigh_back", label: "Left Thigh (Back)", path: "M85,95 L95,95 L95,130 L85,130 Z" },
    { id: "right_thigh_back", label: "Right Thigh (Back)", path: "M105,95 L115,95 L115,130 L105,130 Z" },
    { id: "left_knee_back", label: "Left Knee (Back)", path: "M82,130 A8,8 0 1,1 98,130 A8,8 0 1,1 82,130 Z" },
    { id: "right_knee_back", label: "Right Knee (Back)", path: "M102,130 A8,8 0 1,1 118,130 A8,8 0 1,1 102,130 Z" },
    { id: "left_shin_back", label: "Left Shin (Back)", path: "M85,138 L95,138 L95,168 L85,168 Z" },
    { id: "right_shin_back", label: "Right Shin (Back)", path: "M105,138 L115,138 L115,168 L105,168 Z" },
    { id: "left_foot_back", label: "Left Foot (Back)", path: "M80,168 L95,168 L95,178 L80,178 Z" },
    { id: "right_foot_back", label: "Right Foot (Back)", path: "M105,168 L120,168 L120,178 L105,178 Z" }
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
    return selectedParts.includes(partId) ? "#dc2626" : "#93c5fd";
  };

  const getPartStroke = (partId: string): string => {
    return selectedParts.includes(partId) ? "#991b1b" : "#3b82f6";
  };

  const renderBodyView = (view: "front" | "back", title: string) => (
    <div className="flex-1">
      <h3 className="text-base font-medium text-center mb-3 text-foreground">{title}</h3>
      <svg 
        viewBox="0 0 200 190" 
        className="w-full h-auto max-w-[200px] mx-auto"
      >
        {bodyParts[view].map((part) => (
          <path
            key={part.id}
            d={part.path}
            fill={getPartColor(part.id)}
            stroke={getPartStroke(part.id)}
            strokeWidth="2"
            className="cursor-pointer transition-all hover:brightness-110"
            onClick={() => togglePart(part.id)}
          >
            <title>{part.label}</title>
          </path>
        ))}
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
            <div className="w-4 h-4 rounded bg-[#93c5fd] border-2 border-[#3b82f6]"></div>
            <span>Uninjured</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#dc2626] border-2 border-[#991b1b]"></div>
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
