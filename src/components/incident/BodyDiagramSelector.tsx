import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface BodyDiagramSelectorProps {
  selectedParts: string[];
  onPartsChange: (parts: string[]) => void;
}

// Improved proportions: larger head, wider shoulders, tapered waist, natural arm position, longer legs
const bodyParts = {
  front: [
    { id: "head_front", label: "Head", path: "M82,18 A18,18 0 1,1 118,18 A18,18 0 1,1 82,18 Z" },
    { id: "neck_front", label: "Neck", path: "M93,35 L107,35 L107,48 L93,48 Z" },
    { id: "left_shoulder_front", label: "Left Shoulder", path: "M62,48 L88,48 L88,62 L62,58 Z" },
    { id: "right_shoulder_front", label: "Right Shoulder", path: "M112,48 L138,48 L138,58 L112,62 Z" },
    { id: "chest_front", label: "Chest", path: "M88,48 L112,48 L112,72 L88,72 Z" },
    { id: "abdomen_front", label: "Abdomen", path: "M90,72 L110,72 L110,90 L90,90 Z" },
    { id: "pelvis_front", label: "Pelvis", path: "M86,90 L114,90 L114,108 L86,108 Z" },
    { id: "left_upper_arm_front", label: "Left Upper Arm", path: "M56,60 L66,58 L68,95 L58,95 Z" },
    { id: "right_upper_arm_front", label: "Right Upper Arm", path: "M134,58 L144,60 L142,95 L132,95 Z" },
    { id: "left_elbow_front", label: "Left Elbow", path: "M55,95 A8,8 0 1,1 71,95 A8,8 0 1,1 55,95 Z" },
    { id: "right_elbow_front", label: "Right Elbow", path: "M129,95 A8,8 0 1,1 145,95 A8,8 0 1,1 129,95 Z" },
    { id: "left_forearm_front", label: "Left Forearm", path: "M57,103 L67,103 L65,138 L55,138 Z" },
    { id: "right_forearm_front", label: "Right Forearm", path: "M133,103 L143,103 L145,138 L135,138 Z" },
    { id: "left_hand_front", label: "Left Hand", path: "M52,138 A10,10 0 1,1 68,138 A10,10 0 1,1 52,138 Z" },
    { id: "right_hand_front", label: "Right Hand", path: "M132,138 A10,10 0 1,1 148,138 A10,10 0 1,1 132,138 Z" },
    { id: "left_thigh_front", label: "Left Thigh", path: "M86,108 L98,108 L98,152 L86,152 Z" },
    { id: "right_thigh_front", label: "Right Thigh", path: "M102,108 L114,108 L114,152 L102,152 Z" },
    { id: "left_knee_front", label: "Left Knee", path: "M84,152 A9,9 0 1,1 100,152 A9,9 0 1,1 84,152 Z" },
    { id: "right_knee_front", label: "Right Knee", path: "M100,152 A9,9 0 1,1 116,152 A9,9 0 1,1 100,152 Z" },
    { id: "left_shin_front", label: "Left Shin", path: "M86,161 L98,161 L98,198 L86,198 Z" },
    { id: "right_shin_front", label: "Right Shin", path: "M102,161 L114,161 L114,198 L102,198 Z" },
    { id: "left_foot_front", label: "Left Foot", path: "M82,198 L98,198 L98,210 L82,210 Z" },
    { id: "right_foot_front", label: "Right Foot", path: "M102,198 L118,198 L118,210 L102,210 Z" }
  ],
  back: [
    { id: "head_back", label: "Head (Back)", path: "M82,18 A18,18 0 1,1 118,18 A18,18 0 1,1 82,18 Z" },
    { id: "neck_back", label: "Neck (Back)", path: "M93,35 L107,35 L107,48 L93,48 Z" },
    { id: "left_shoulder_back", label: "Left Shoulder (Back)", path: "M62,48 L88,48 L88,62 L62,58 Z" },
    { id: "right_shoulder_back", label: "Right Shoulder (Back)", path: "M112,48 L138,48 L138,58 L112,62 Z" },
    { id: "upper_back", label: "Upper Back", path: "M88,48 L112,48 L112,72 L88,72 Z" },
    { id: "middle_back", label: "Middle Back", path: "M90,72 L110,72 L110,90 L90,90 Z" },
    { id: "lower_back", label: "Lower Back", path: "M86,90 L114,90 L114,108 L86,108 Z" },
    { id: "left_upper_arm_back", label: "Left Upper Arm (Back)", path: "M56,60 L66,58 L68,95 L58,95 Z" },
    { id: "right_upper_arm_back", label: "Right Upper Arm (Back)", path: "M134,58 L144,60 L142,95 L132,95 Z" },
    { id: "left_elbow_back", label: "Left Elbow (Back)", path: "M55,95 A8,8 0 1,1 71,95 A8,8 0 1,1 55,95 Z" },
    { id: "right_elbow_back", label: "Right Elbow (Back)", path: "M129,95 A8,8 0 1,1 145,95 A8,8 0 1,1 129,95 Z" },
    { id: "left_forearm_back", label: "Left Forearm (Back)", path: "M57,103 L67,103 L65,138 L55,138 Z" },
    { id: "right_forearm_back", label: "Right Forearm (Back)", path: "M133,103 L143,103 L145,138 L135,138 Z" },
    { id: "left_hand_back", label: "Left Hand (Back)", path: "M52,138 A10,10 0 1,1 68,138 A10,10 0 1,1 52,138 Z" },
    { id: "right_hand_back", label: "Right Hand (Back)", path: "M132,138 A10,10 0 1,1 148,138 A10,10 0 1,1 132,138 Z" },
    { id: "left_thigh_back", label: "Left Thigh (Back)", path: "M86,108 L98,108 L98,152 L86,152 Z" },
    { id: "right_thigh_back", label: "Right Thigh (Back)", path: "M102,108 L114,108 L114,152 L102,152 Z" },
    { id: "left_knee_back", label: "Left Knee (Back)", path: "M84,152 A9,9 0 1,1 100,152 A9,9 0 1,1 84,152 Z" },
    { id: "right_knee_back", label: "Right Knee (Back)", path: "M100,152 A9,9 0 1,1 116,152 A9,9 0 1,1 100,152 Z" },
    { id: "left_shin_back", label: "Left Shin (Back)", path: "M86,161 L98,161 L98,198 L86,198 Z" },
    { id: "right_shin_back", label: "Right Shin (Back)", path: "M102,161 L114,161 L114,198 L102,198 Z" },
    { id: "left_foot_back", label: "Left Foot (Back)", path: "M82,198 L98,198 L98,210 L82,210 Z" },
    { id: "right_foot_back", label: "Right Foot (Back)", path: "M102,198 L118,198 L118,210 L102,210 Z" }
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
        viewBox="0 0 200 220" 
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
