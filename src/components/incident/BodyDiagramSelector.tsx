import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface BodyDiagramSelectorProps {
  selectedParts: string[];
  onPartsChange: (parts: string[]) => void;
}

const bodyParts = {
  front: [
    { id: "head_front", label: "Head", path: "M150,20 Q140,15 140,30 Q140,42 150,48 Q160,48 162.5,48 Q165,48 175,48 Q185,42 185,30 Q185,15 175,20 Q162.5,15 150,20 Z" },
    { id: "neck_front", label: "Neck", path: "M155,48 L170,48 L172,65 L153,65 Z" },
    { id: "left_shoulder", label: "Left Shoulder", path: "M130,65 Q120,65 115,70 L115,88 Q115,93 125,93 L140,93 L140,70 Q135,65 130,65 Z" },
    { id: "right_shoulder", label: "Right Shoulder", path: "M195,65 Q205,65 210,70 L210,88 Q210,93 200,93 L185,93 L185,70 Q190,65 195,65 Z" },
    { id: "chest", label: "Chest", path: "M140,65 L185,65 L188,70 L188,105 L137,105 L137,70 Z" },
    { id: "abdomen", label: "Abdomen", path: "M137,105 L188,105 L188,145 Q188,150 183,150 L142,150 Q137,150 137,145 Z" },
    { id: "left_arm_upper", label: "Left Upper Arm", path: "M115,93 L108,93 Q103,93 101,98 L95,145 L103,147 L110,100 L115,95 Z" },
    { id: "right_arm_upper", label: "Right Upper Arm", path: "M210,93 L217,93 Q222,93 224,98 L230,145 L222,147 L215,100 L210,95 Z" },
    { id: "left_elbow", label: "Left Elbow", path: "M93,145 Q88,150 93,155 Q98,150 103,150 Q108,150 113,155 Q118,150 113,145 Z" },
    { id: "right_elbow", label: "Right Elbow", path: "M212,145 Q207,150 212,155 Q217,150 222,150 Q227,150 232,155 Q237,150 232,145 Z" },
    { id: "left_forearm", label: "Left Forearm", path: "M93,155 L88,195 L98,197 L108,197 L113,155 Z" },
    { id: "right_forearm", label: "Right Forearm", path: "M212,155 L217,197 L227,197 L237,195 L232,155 Z" },
    { id: "left_hand", label: "Left Hand", path: "M88,195 Q83,198 83,205 Q83,210 88,212 Q93,210 93,205 L98,197 Z" },
    { id: "right_hand", label: "Right Hand", path: "M237,195 Q242,198 242,205 Q242,210 237,212 Q232,210 232,205 L227,197 Z" },
    { id: "left_thigh", label: "Left Thigh", path: "M142,150 L137,230 L152,232 L157,150 Z" },
    { id: "right_thigh", label: "Right Thigh", path: "M168,150 L173,232 L188,230 L183,150 Z" },
    { id: "left_knee", label: "Left Knee", path: "M135,230 Q130,238 135,246 Q143,240 152,240 Q160,240 160,246 Q165,238 160,230 Z" },
    { id: "right_knee", label: "Right Knee", path: "M165,230 Q160,238 165,246 Q173,240 181,240 Q189,240 189,246 Q194,238 189,230 Z" },
    { id: "left_shin", label: "Left Shin", path: "M135,246 L130,315 L145,317 L155,317 L160,246 Z" },
    { id: "right_shin", label: "Right Shin", path: "M165,246 L170,317 L180,317 L195,315 L189,246 Z" },
    { id: "left_foot", label: "Left Foot", path: "M130,315 L128,322 Q128,328 135,330 L150,330 Q155,328 155,322 L155,317 Z" },
    { id: "right_foot", label: "Right Foot", path: "M170,317 L170,322 Q170,328 175,330 L190,330 Q197,328 197,322 L195,315 Z" }
  ],
  back: [
    { id: "head_back", label: "Head (Back)", path: "M150,20 Q140,15 140,30 Q140,42 150,48 Q160,48 162.5,48 Q165,48 175,48 Q185,42 185,30 Q185,15 175,20 Q162.5,15 150,20 Z" },
    { id: "neck_back", label: "Neck (Back)", path: "M155,48 L170,48 L172,65 L153,65 Z" },
    { id: "left_shoulder_back", label: "Left Shoulder (Back)", path: "M130,65 Q120,65 115,70 L115,88 Q115,93 125,93 L140,93 L140,70 Q135,65 130,65 Z" },
    { id: "right_shoulder_back", label: "Right Shoulder (Back)", path: "M195,65 Q205,65 210,70 L210,88 Q210,93 200,93 L185,93 L185,70 Q190,65 195,65 Z" },
    { id: "upper_back", label: "Upper Back", path: "M140,65 L185,65 L188,70 L188,105 L137,105 L137,70 Z" },
    { id: "lower_back", label: "Lower Back", path: "M137,105 L188,105 L188,145 Q188,150 183,150 L142,150 Q137,150 137,145 Z" },
    { id: "left_arm_back", label: "Left Upper Arm (Back)", path: "M115,93 L108,93 Q103,93 101,98 L95,145 L103,147 L110,100 L115,95 Z" },
    { id: "right_arm_back", label: "Right Upper Arm (Back)", path: "M210,93 L217,93 Q222,93 224,98 L230,145 L222,147 L215,100 L210,95 Z" },
    { id: "left_elbow_back", label: "Left Elbow (Back)", path: "M93,145 Q88,150 93,155 Q98,150 103,150 Q108,150 113,155 Q118,150 113,145 Z" },
    { id: "right_elbow_back", label: "Right Elbow (Back)", path: "M212,145 Q207,150 212,155 Q217,150 222,150 Q227,150 232,155 Q237,150 232,145 Z" },
    { id: "left_forearm_back", label: "Left Forearm (Back)", path: "M93,155 L88,195 L98,197 L108,197 L113,155 Z" },
    { id: "right_forearm_back", label: "Right Forearm (Back)", path: "M212,155 L217,197 L227,197 L237,195 L232,155 Z" },
    { id: "left_hand_back", label: "Left Hand (Back)", path: "M88,195 Q83,198 83,205 Q83,210 88,212 Q93,210 93,205 L98,197 Z" },
    { id: "right_hand_back", label: "Right Hand (Back)", path: "M237,195 Q242,198 242,205 Q242,210 237,212 Q232,210 232,205 L227,197 Z" },
    { id: "left_buttock", label: "Left Buttock", path: "M142,150 L138,170 Q138,178 147,178 L157,178 L157,150 Z" },
    { id: "right_buttock", label: "Right Buttock", path: "M168,150 L168,178 L178,178 Q187,178 187,170 L183,150 Z" },
    { id: "left_thigh_back", label: "Left Thigh (Back)", path: "M147,178 L137,230 L152,232 L157,178 Z" },
    { id: "right_thigh_back", label: "Right Thigh (Back)", path: "M168,178 L173,232 L188,230 L178,178 Z" },
    { id: "left_knee_back", label: "Left Knee (Back)", path: "M135,230 Q130,238 135,246 Q143,240 152,240 Q160,240 160,246 Q165,238 160,230 Z" },
    { id: "right_knee_back", label: "Right Knee (Back)", path: "M165,230 Q160,238 165,246 Q173,240 181,240 Q189,240 189,246 Q194,238 189,230 Z" },
    { id: "left_calf", label: "Left Calf", path: "M135,246 L130,315 L145,317 L155,317 L160,246 Z" },
    { id: "right_calf", label: "Right Calf", path: "M165,246 L170,317 L180,317 L195,315 L189,246 Z" },
    { id: "left_foot_back", label: "Left Foot (Back)", path: "M130,315 L128,322 Q128,328 135,330 L150,330 Q155,328 155,322 L155,317 Z" },
    { id: "right_foot_back", label: "Right Foot (Back)", path: "M170,317 L170,322 Q170,328 175,330 L190,330 Q197,328 197,322 L195,315 Z" }
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
