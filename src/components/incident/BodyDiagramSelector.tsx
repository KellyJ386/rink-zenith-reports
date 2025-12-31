import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface BodyDiagramSelectorProps {
  selectedParts: string[];
  onPartsChange: (parts: string[]) => void;
}

// Anatomically correct human figure with organic curved shapes
const bodyParts = {
  front: [
    // Head - oval shape
    { id: "head_front", label: "Head", path: "M100,8 C116,8 128,22 128,40 C128,58 116,70 100,70 C84,70 72,58 72,40 C72,22 84,8 100,8 Z" },
    // Neck - tapered cylinder
    { id: "neck_front", label: "Neck", path: "M92,68 C92,68 95,70 100,70 C105,70 108,68 108,68 L106,85 C106,85 103,86 100,86 C97,86 94,85 94,85 Z" },
    // Shoulders - curved caps
    { id: "left_shoulder_front", label: "Left Shoulder", path: "M94,85 C82,85 65,88 58,95 C55,98 56,102 60,104 L72,100 C78,96 85,93 94,92 Z" },
    { id: "right_shoulder_front", label: "Right Shoulder", path: "M106,85 C118,85 135,88 142,95 C145,98 144,102 140,104 L128,100 C122,96 115,93 106,92 Z" },
    // Chest - curved trapezoid
    { id: "chest_front", label: "Chest", path: "M94,85 L106,85 C108,90 110,95 110,105 L90,105 C90,95 92,90 94,85 Z" },
    // Abdomen - tapered
    { id: "abdomen_front", label: "Abdomen", path: "M90,105 L110,105 L108,130 C108,130 104,132 100,132 C96,132 92,130 92,130 Z" },
    // Pelvis - curved hip shape
    { id: "pelvis_front", label: "Pelvis", path: "M92,130 C90,130 82,132 80,140 C78,150 82,158 88,160 L100,158 L112,160 C118,158 122,150 120,140 C118,132 110,130 108,130 C104,132 100,132 100,132 C100,132 96,132 92,130 Z" },
    // Left arm parts with natural curves
    { id: "left_upper_arm_front", label: "Left Upper Arm", path: "M60,104 C56,108 50,120 48,138 C47,145 50,148 54,148 L64,146 C66,142 68,130 70,118 C71,110 72,102 72,100 Z" },
    { id: "left_elbow_front", label: "Left Elbow", path: "M48,138 C44,140 42,148 44,156 C46,162 52,164 58,162 L64,146 C58,146 52,144 48,138 Z" },
    { id: "left_forearm_front", label: "Left Forearm", path: "M44,156 C40,168 36,185 34,200 C33,206 36,210 42,210 L54,206 C56,200 58,188 60,175 C61,166 60,160 58,162 Z" },
    { id: "left_hand_front", label: "Left Hand", path: "M34,200 C30,205 28,215 30,224 C32,232 40,236 48,234 C56,232 58,224 56,216 C55,210 54,206 54,206 L42,210 C42,210 38,206 34,200 Z" },
    // Right arm parts with natural curves
    { id: "right_upper_arm_front", label: "Right Upper Arm", path: "M140,104 C144,108 150,120 152,138 C153,145 150,148 146,148 L136,146 C134,142 132,130 130,118 C129,110 128,102 128,100 Z" },
    { id: "right_elbow_front", label: "Right Elbow", path: "M152,138 C156,140 158,148 156,156 C154,162 148,164 142,162 L136,146 C142,146 148,144 152,138 Z" },
    { id: "right_forearm_front", label: "Right Forearm", path: "M156,156 C160,168 164,185 166,200 C167,206 164,210 158,210 L146,206 C144,200 142,188 140,175 C139,166 140,160 142,162 Z" },
    { id: "right_hand_front", label: "Right Hand", path: "M166,200 C170,205 172,215 170,224 C168,232 160,236 152,234 C144,232 142,224 144,216 C145,210 146,206 146,206 L158,210 C158,210 162,206 166,200 Z" },
    // Legs with natural muscle curves
    { id: "left_thigh_front", label: "Left Thigh", path: "M88,160 C82,165 78,180 78,200 C78,215 80,228 84,235 L96,235 C98,228 99,215 98,200 C97,180 96,165 100,158 Z" },
    { id: "right_thigh_front", label: "Right Thigh", path: "M112,160 C118,165 122,180 122,200 C122,215 120,228 116,235 L104,235 C102,228 101,215 102,200 C103,180 104,165 100,158 Z" },
    { id: "left_knee_front", label: "Left Knee", path: "M84,235 C80,238 78,245 78,252 C78,260 82,265 88,265 L96,264 C98,260 99,252 98,245 C97,240 96,236 96,235 Z" },
    { id: "right_knee_front", label: "Right Knee", path: "M116,235 C120,238 122,245 122,252 C122,260 118,265 112,265 L104,264 C102,260 101,252 102,245 C103,240 104,236 104,235 Z" },
    { id: "left_shin_front", label: "Left Shin", path: "M88,265 C84,270 82,290 82,310 C82,325 84,335 86,340 L94,340 C96,335 97,325 96,310 C95,290 96,270 96,264 Z" },
    { id: "right_shin_front", label: "Right Shin", path: "M112,265 C116,270 118,290 118,310 C118,325 116,335 114,340 L106,340 C104,335 103,325 104,310 C105,290 104,270 104,264 Z" },
    { id: "left_foot_front", label: "Left Foot", path: "M86,340 C82,342 78,348 76,355 C74,362 78,368 86,368 L96,366 C98,362 97,355 95,350 C94,346 94,342 94,340 Z" },
    { id: "right_foot_front", label: "Right Foot", path: "M114,340 C118,342 122,348 124,355 C126,362 122,368 114,368 L104,366 C102,362 103,355 105,350 C106,346 106,342 106,340 Z" }
  ],
  back: [
    // Head - oval shape
    { id: "head_back", label: "Head (Back)", path: "M100,8 C116,8 128,22 128,40 C128,58 116,70 100,70 C84,70 72,58 72,40 C72,22 84,8 100,8 Z" },
    // Neck
    { id: "neck_back", label: "Neck (Back)", path: "M92,68 C92,68 95,70 100,70 C105,70 108,68 108,68 L106,85 C106,85 103,86 100,86 C97,86 94,85 94,85 Z" },
    // Shoulders
    { id: "left_shoulder_back", label: "Left Shoulder (Back)", path: "M94,85 C82,85 65,88 58,95 C55,98 56,102 60,104 L72,100 C78,96 85,93 94,92 Z" },
    { id: "right_shoulder_back", label: "Right Shoulder (Back)", path: "M106,85 C118,85 135,88 142,95 C145,98 144,102 140,104 L128,100 C122,96 115,93 106,92 Z" },
    // Upper back
    { id: "upper_back", label: "Upper Back", path: "M94,85 L106,85 C108,90 110,95 110,105 L90,105 C90,95 92,90 94,85 Z" },
    // Middle back
    { id: "middle_back", label: "Middle Back", path: "M90,105 L110,105 L108,130 C108,130 104,132 100,132 C96,132 92,130 92,130 Z" },
    // Lower back
    { id: "lower_back", label: "Lower Back", path: "M92,130 C90,130 82,132 80,140 C78,150 82,158 88,160 L100,158 L112,160 C118,158 122,150 120,140 C118,132 110,130 108,130 C104,132 100,132 100,132 C100,132 96,132 92,130 Z" },
    // Left arm parts
    { id: "left_upper_arm_back", label: "Left Upper Arm (Back)", path: "M60,104 C56,108 50,120 48,138 C47,145 50,148 54,148 L64,146 C66,142 68,130 70,118 C71,110 72,102 72,100 Z" },
    { id: "left_elbow_back", label: "Left Elbow (Back)", path: "M48,138 C44,140 42,148 44,156 C46,162 52,164 58,162 L64,146 C58,146 52,144 48,138 Z" },
    { id: "left_forearm_back", label: "Left Forearm (Back)", path: "M44,156 C40,168 36,185 34,200 C33,206 36,210 42,210 L54,206 C56,200 58,188 60,175 C61,166 60,160 58,162 Z" },
    { id: "left_hand_back", label: "Left Hand (Back)", path: "M34,200 C30,205 28,215 30,224 C32,232 40,236 48,234 C56,232 58,224 56,216 C55,210 54,206 54,206 L42,210 C42,210 38,206 34,200 Z" },
    // Right arm parts
    { id: "right_upper_arm_back", label: "Right Upper Arm (Back)", path: "M140,104 C144,108 150,120 152,138 C153,145 150,148 146,148 L136,146 C134,142 132,130 130,118 C129,110 128,102 128,100 Z" },
    { id: "right_elbow_back", label: "Right Elbow (Back)", path: "M152,138 C156,140 158,148 156,156 C154,162 148,164 142,162 L136,146 C142,146 148,144 152,138 Z" },
    { id: "right_forearm_back", label: "Right Forearm (Back)", path: "M156,156 C160,168 164,185 166,200 C167,206 164,210 158,210 L146,206 C144,200 142,188 140,175 C139,166 140,160 142,162 Z" },
    { id: "right_hand_back", label: "Right Hand (Back)", path: "M166,200 C170,205 172,215 170,224 C168,232 160,236 152,234 C144,232 142,224 144,216 C145,210 146,206 146,206 L158,210 C158,210 162,206 166,200 Z" },
    // Legs
    { id: "left_thigh_back", label: "Left Thigh (Back)", path: "M88,160 C82,165 78,180 78,200 C78,215 80,228 84,235 L96,235 C98,228 99,215 98,200 C97,180 96,165 100,158 Z" },
    { id: "right_thigh_back", label: "Right Thigh (Back)", path: "M112,160 C118,165 122,180 122,200 C122,215 120,228 116,235 L104,235 C102,228 101,215 102,200 C103,180 104,165 100,158 Z" },
    { id: "left_knee_back", label: "Left Knee (Back)", path: "M84,235 C80,238 78,245 78,252 C78,260 82,265 88,265 L96,264 C98,260 99,252 98,245 C97,240 96,236 96,235 Z" },
    { id: "right_knee_back", label: "Right Knee (Back)", path: "M116,235 C120,238 122,245 122,252 C122,260 118,265 112,265 L104,264 C102,260 101,252 102,245 C103,240 104,236 104,235 Z" },
    { id: "left_shin_back", label: "Left Shin (Back)", path: "M88,265 C84,270 82,290 82,310 C82,325 84,335 86,340 L94,340 C96,335 97,325 96,310 C95,290 96,270 96,264 Z" },
    { id: "right_shin_back", label: "Right Shin (Back)", path: "M112,265 C116,270 118,290 118,310 C118,325 116,335 114,340 L106,340 C104,335 103,325 104,310 C105,290 104,270 104,264 Z" },
    { id: "left_foot_back", label: "Left Foot (Back)", path: "M86,340 C82,342 78,348 76,355 C74,362 78,368 86,368 L96,366 C98,362 97,355 95,350 C94,346 94,342 94,340 Z" },
    { id: "right_foot_back", label: "Right Foot (Back)", path: "M114,340 C118,342 122,348 124,355 C126,362 122,368 114,368 L104,366 C102,362 103,355 105,350 C106,346 106,342 106,340 Z" }
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
        viewBox="0 0 200 380" 
        className="w-full h-auto max-w-[180px] mx-auto"
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
