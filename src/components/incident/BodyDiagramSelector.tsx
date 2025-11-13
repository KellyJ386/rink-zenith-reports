import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface BodyDiagramSelectorProps {
  selectedParts: string[];
  onPartsChange: (parts: string[]) => void;
}

const bodyParts = {
  front: [
    { id: "head_front", label: "Head", path: "M140,25 Q140,10 162.5,10 Q185,10 185,25 Q185,40 175,50 Q162.5,55 150,50 Q140,40 140,25 Z" },
    { id: "neck_front", label: "Neck", path: "M155,50 L170,50 L172,70 L153,70 Z" },
    { id: "left_shoulder", label: "Left Shoulder", path: "M120,70 Q110,70 105,75 L105,95 Q105,100 115,100 L140,100 L140,75 Q135,70 120,70 Z" },
    { id: "right_shoulder", label: "Right Shoulder", path: "M205,70 Q215,70 220,75 L220,95 Q220,100 210,100 L185,100 L185,75 Q190,70 205,70 Z" },
    { id: "chest", label: "Chest", path: "M140,70 L185,70 Q190,75 190,85 L190,110 L135,110 L135,85 Q135,75 140,70 Z" },
    { id: "abdomen", label: "Abdomen", path: "M135,110 L190,110 L190,155 Q190,165 185,165 L140,165 Q135,165 135,155 Z" },
    { id: "left_arm_upper", label: "Left Upper Arm", path: "M105,100 L95,100 Q90,100 88,110 L80,155 L90,157 L100,112 L105,105 Z" },
    { id: "right_arm_upper", label: "Right Upper Arm", path: "M220,100 L230,100 Q235,100 237,110 L245,155 L235,157 L225,112 L220,105 Z" },
    { id: "left_elbow", label: "Left Elbow", path: "M75,155 Q70,162 75,169 Q80,162 85,162 Q90,162 95,169 Q100,162 95,155 L85,155 Z" },
    { id: "right_elbow", label: "Right Elbow", path: "M230,155 Q225,162 230,169 Q235,162 240,162 Q245,162 250,169 Q255,162 250,155 L240,155 Z" },
    { id: "left_forearm", label: "Left Forearm", path: "M75,169 L65,230 L75,232 L85,232 L95,169 Z" },
    { id: "right_forearm", label: "Right Forearm", path: "M230,169 L240,232 L250,232 L260,230 L250,169 Z" },
    { id: "left_hand", label: "Left Hand", path: "M65,230 Q55,235 55,245 Q55,252 65,255 Q75,252 75,245 L85,232 Z" },
    { id: "right_hand", label: "Right Hand", path: "M260,230 Q270,235 270,245 Q270,252 260,255 Q250,252 250,245 L240,232 Z" },
    { id: "left_thigh", label: "Left Thigh", path: "M140,165 L130,240 L150,240 L155,165 Z" },
    { id: "right_thigh", label: "Right Thigh", path: "M170,165 L175,240 L195,240 L185,165 Z" },
    { id: "left_knee", label: "Left Knee", path: "M125,240 Q120,250 125,260 Q135,255 145,255 Q155,255 155,260 Q160,250 155,240 Z" },
    { id: "right_knee", label: "Right Knee", path: "M170,240 Q165,250 170,260 Q180,255 190,255 Q200,255 200,260 Q205,250 200,240 Z" },
    { id: "left_shin", label: "Left Shin", path: "M125,260 L115,325 L135,327 L145,327 L155,260 Z" },
    { id: "right_shin", label: "Right Shin", path: "M170,260 L180,327 L190,327 L210,325 L200,260 Z" },
    { id: "left_foot", label: "Left Foot", path: "M115,325 L110,335 Q110,342 120,345 L140,345 Q145,342 145,335 L145,327 Z" },
    { id: "right_foot", label: "Right Foot", path: "M180,327 L180,335 Q180,342 185,345 L205,345 Q215,342 215,335 L210,325 Z" }
  ],
  back: [
    { id: "head_back", label: "Head (Back)", path: "M140,25 Q140,10 162.5,10 Q185,10 185,25 Q185,40 175,50 Q162.5,55 150,50 Q140,40 140,25 Z" },
    { id: "neck_back", label: "Neck (Back)", path: "M155,50 L170,50 L172,70 L153,70 Z" },
    { id: "left_shoulder_back", label: "Left Shoulder (Back)", path: "M120,70 Q110,70 105,75 L105,95 Q105,100 115,100 L140,100 L140,75 Q135,70 120,70 Z" },
    { id: "right_shoulder_back", label: "Right Shoulder (Back)", path: "M205,70 Q215,70 220,75 L220,95 Q220,100 210,100 L185,100 L185,75 Q190,70 205,70 Z" },
    { id: "upper_back", label: "Upper Back", path: "M140,70 L185,70 Q190,75 190,85 L190,110 L135,110 L135,85 Q135,75 140,70 Z" },
    { id: "lower_back", label: "Lower Back", path: "M135,110 L190,110 L190,155 Q190,165 185,165 L140,165 Q135,165 135,155 Z" },
    { id: "left_arm_back", label: "Left Upper Arm (Back)", path: "M105,100 L95,100 Q90,100 88,110 L80,155 L90,157 L100,112 L105,105 Z" },
    { id: "right_arm_back", label: "Right Upper Arm (Back)", path: "M220,100 L230,100 Q235,100 237,110 L245,155 L235,157 L225,112 L220,105 Z" },
    { id: "left_elbow_back", label: "Left Elbow (Back)", path: "M75,155 Q70,162 75,169 Q80,162 85,162 Q90,162 95,169 Q100,162 95,155 L85,155 Z" },
    { id: "right_elbow_back", label: "Right Elbow (Back)", path: "M230,155 Q225,162 230,169 Q235,162 240,162 Q245,162 250,169 Q255,162 250,155 L240,155 Z" },
    { id: "left_forearm_back", label: "Left Forearm (Back)", path: "M75,169 L65,230 L75,232 L85,232 L95,169 Z" },
    { id: "right_forearm_back", label: "Right Forearm (Back)", path: "M230,169 L240,232 L250,232 L260,230 L250,169 Z" },
    { id: "left_hand_back", label: "Left Hand (Back)", path: "M65,230 Q55,235 55,245 Q55,252 65,255 Q75,252 75,245 L85,232 Z" },
    { id: "right_hand_back", label: "Right Hand (Back)", path: "M260,230 Q270,235 270,245 Q270,252 260,255 Q250,252 250,245 L240,232 Z" },
    { id: "left_buttock", label: "Left Buttock", path: "M140,165 L135,190 Q135,200 145,200 L155,200 L155,165 Z" },
    { id: "right_buttock", label: "Right Buttock", path: "M170,165 L170,200 L180,200 Q190,200 190,190 L185,165 Z" },
    { id: "left_thigh_back", label: "Left Thigh (Back)", path: "M145,200 L130,240 L150,240 L155,200 Z" },
    { id: "right_thigh_back", label: "Right Thigh (Back)", path: "M170,200 L175,240 L195,240 L180,200 Z" },
    { id: "left_knee_back", label: "Left Knee (Back)", path: "M125,240 Q120,250 125,260 Q135,255 145,255 Q155,255 155,260 Q160,250 155,240 Z" },
    { id: "right_knee_back", label: "Right Knee (Back)", path: "M170,240 Q165,250 170,260 Q180,255 190,255 Q200,255 200,260 Q205,250 200,240 Z" },
    { id: "left_calf", label: "Left Calf", path: "M125,260 L115,325 L135,327 L145,327 L155,260 Z" },
    { id: "right_calf", label: "Right Calf", path: "M170,260 L180,327 L190,327 L210,325 L200,260 Z" },
    { id: "left_foot_back", label: "Left Foot (Back)", path: "M115,325 L110,335 Q110,342 120,345 L140,345 Q145,342 145,335 L145,327 Z" },
    { id: "right_foot_back", label: "Right Foot (Back)", path: "M180,327 L180,335 Q180,342 185,345 L205,345 Q215,342 215,335 L210,325 Z" }
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
