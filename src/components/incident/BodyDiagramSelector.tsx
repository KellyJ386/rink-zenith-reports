import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface BodyDiagramSelectorProps {
  selectedParts: string[];
  onPartsChange: (parts: string[]) => void;
}

const bodyParts = {
  front: [
    { id: "head_front", label: "Head", path: "M150,40 Q150,20 170,20 Q190,20 190,40 Q190,60 170,70 Q150,60 150,40 Z" },
    { id: "neck_front", label: "Neck", path: "M165,70 L175,70 L175,85 L165,85 Z" },
    { id: "left_shoulder", label: "Left Shoulder", path: "M130,85 Q120,85 115,95 L115,110 L145,110 L145,95 Z" },
    { id: "right_shoulder", label: "Right Shoulder", path: "M195,85 Q205,85 210,95 L210,110 L180,110 L180,95 Z" },
    { id: "chest", label: "Chest", path: "M145,85 L180,85 L180,125 L145,125 Z" },
    { id: "abdomen", label: "Abdomen", path: "M145,125 L180,125 L180,165 L145,165 Z" },
    { id: "left_arm_upper", label: "Left Upper Arm", path: "M115,110 L105,110 L95,165 L105,165 L115,125 Z" },
    { id: "right_arm_upper", label: "Right Upper Arm", path: "M210,110 L220,110 L230,165 L220,165 L210,125 Z" },
    { id: "left_elbow", label: "Left Elbow", path: "M95,165 Q90,170 95,175 L105,175 Q110,170 105,165 Z" },
    { id: "right_elbow", label: "Right Elbow", path: "M220,165 Q215,170 220,175 L230,175 Q235,170 230,165 Z" },
    { id: "left_forearm", label: "Left Forearm", path: "M95,175 L85,230 L95,230 L105,175 Z" },
    { id: "right_forearm", label: "Right Forearm", path: "M220,175 L230,230 L240,230 L230,175 Z" },
    { id: "left_hand", label: "Left Hand", path: "M85,230 L80,245 L90,250 L100,245 L95,230 Z" },
    { id: "right_hand", label: "Right Hand", path: "M230,230 L225,245 L235,250 L245,245 L240,230 Z" },
    { id: "left_thigh", label: "Left Thigh", path: "M145,165 L135,235 L155,235 L155,165 Z" },
    { id: "right_thigh", label: "Right Thigh", path: "M170,165 L170,235 L190,235 L180,165 Z" },
    { id: "left_knee", label: "Left Knee", path: "M135,235 Q130,245 135,255 L155,255 Q160,245 155,235 Z" },
    { id: "right_knee", label: "Right Knee", path: "M170,235 Q165,245 170,255 L190,255 Q195,245 190,235 Z" },
    { id: "left_shin", label: "Left Shin", path: "M135,255 L130,315 L140,315 L155,255 Z" },
    { id: "right_shin", label: "Right Shin", path: "M170,255 L185,315 L195,315 L190,255 Z" },
    { id: "left_foot", label: "Left Foot", path: "M130,315 L125,330 L145,330 L140,315 Z" },
    { id: "right_foot", label: "Right Foot", path: "M185,315 L180,330 L200,330 L195,315 Z" }
  ],
  back: [
    { id: "head_back", label: "Head (Back)", path: "M150,40 Q150,20 170,20 Q190,20 190,40 Q190,60 170,70 Q150,60 150,40 Z" },
    { id: "neck_back", label: "Neck (Back)", path: "M165,70 L175,70 L175,85 L165,85 Z" },
    { id: "left_shoulder_back", label: "Left Shoulder (Back)", path: "M130,85 Q120,85 115,95 L115,110 L145,110 L145,95 Z" },
    { id: "right_shoulder_back", label: "Right Shoulder (Back)", path: "M195,85 Q205,85 210,95 L210,110 L180,110 L180,95 Z" },
    { id: "upper_back", label: "Upper Back", path: "M145,85 L180,85 L180,125 L145,125 Z" },
    { id: "lower_back", label: "Lower Back", path: "M145,125 L180,125 L180,165 L145,165 Z" },
    { id: "left_arm_back", label: "Left Upper Arm (Back)", path: "M115,110 L105,110 L95,165 L105,165 L115,125 Z" },
    { id: "right_arm_back", label: "Right Upper Arm (Back)", path: "M210,110 L220,110 L230,165 L220,165 L210,125 Z" },
    { id: "left_elbow_back", label: "Left Elbow (Back)", path: "M95,165 Q90,170 95,175 L105,175 Q110,170 105,165 Z" },
    { id: "right_elbow_back", label: "Right Elbow (Back)", path: "M220,165 Q215,170 220,175 L230,175 Q235,170 230,165 Z" },
    { id: "left_forearm_back", label: "Left Forearm (Back)", path: "M95,175 L85,230 L95,230 L105,175 Z" },
    { id: "right_forearm_back", label: "Right Forearm (Back)", path: "M220,175 L230,230 L240,230 L230,175 Z" },
    { id: "left_hand_back", label: "Left Hand (Back)", path: "M85,230 L80,245 L90,250 L100,245 L95,230 Z" },
    { id: "right_hand_back", label: "Right Hand (Back)", path: "M230,230 L225,245 L235,250 L245,245 L240,230 Z" },
    { id: "left_buttock", label: "Left Buttock", path: "M145,165 L145,190 Q145,200 155,200 L155,165 Z" },
    { id: "right_buttock", label: "Right Buttock", path: "M170,165 L170,200 Q180,200 180,190 L180,165 Z" },
    { id: "left_thigh_back", label: "Left Thigh (Back)", path: "M145,200 L135,235 L155,235 L155,200 Z" },
    { id: "right_thigh_back", label: "Right Thigh (Back)", path: "M170,200 L170,235 L190,235 L180,200 Z" },
    { id: "left_knee_back", label: "Left Knee (Back)", path: "M135,235 Q130,245 135,255 L155,255 Q160,245 155,235 Z" },
    { id: "right_knee_back", label: "Right Knee (Back)", path: "M170,235 Q165,245 170,255 L190,255 Q195,245 190,235 Z" },
    { id: "left_calf", label: "Left Calf", path: "M135,255 L130,315 L140,315 L155,255 Z" },
    { id: "right_calf", label: "Right Calf", path: "M170,255 L185,315 L195,315 L190,255 Z" },
    { id: "left_foot_back", label: "Left Foot (Back)", path: "M130,315 L125,330 L145,330 L140,315 Z" },
    { id: "right_foot_back", label: "Right Foot (Back)", path: "M185,315 L180,330 L200,330 L195,315 Z" }
  ]
};

export default function BodyDiagramSelector({ selectedParts, onPartsChange }: BodyDiagramSelectorProps) {
  const togglePart = (partId: string) => {
    if (selectedParts.includes(partId)) {
      onPartsChange(selectedParts.filter(p => p !== partId));
    } else {
      onPartsChange([...selectedParts, partId]);
    }
  };

  const getPartLabel = (partId: string): string => {
    const allParts = [...bodyParts.front, ...bodyParts.back];
    const part = allParts.find(p => p.id === partId);
    return part?.label || partId;
  };

  const getPartColor = (partId: string) => {
    return selectedParts.includes(partId) 
      ? "hsl(var(--destructive))" 
      : "hsl(var(--primary))";
  };

  const getPartOpacity = (partId: string) => {
    return selectedParts.includes(partId) ? 0.7 : 0.15;
  };

  const renderBodyView = (view: "front" | "back", title: string) => {
    const parts = bodyParts[view];
    
    return (
      <div className="flex flex-col items-center gap-2">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <svg 
          viewBox="0 0 325 350" 
          className="w-full max-w-[300px] border border-border rounded-lg bg-card"
        >
          {parts.map((part) => (
            <g key={part.id}>
              <path
                d={part.path}
                fill={getPartColor(part.id)}
                fillOpacity={getPartOpacity(part.id)}
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                className="cursor-pointer transition-all hover:opacity-100"
                onClick={() => togglePart(part.id)}
              >
                <title>{part.label}</title>
              </path>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Body Injury Diagram</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-primary opacity-20 border-2 border-primary" />
              <span className="text-muted-foreground">Uninjured</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-destructive opacity-70" />
              <span className="text-muted-foreground">Injured</span>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Click on body parts to mark injury locations
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {renderBodyView("front", "Front View")}
          {renderBodyView("back", "Back View")}
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Selected Injury Locations:</h3>
          {selectedParts.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedParts.map((partId) => (
                <span
                  key={partId}
                  className="px-3 py-1 bg-destructive/10 text-destructive rounded-full text-sm border border-destructive/20"
                >
                  {getPartLabel(partId)}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No injuries selected</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="injury-details">Additional Injury Details</Label>
          <Textarea
            id="injury-details"
            placeholder="Describe the nature and severity of the injuries in detail..."
            className="min-h-[100px]"
          />
        </div>
      </CardContent>
    </Card>
  );
}
