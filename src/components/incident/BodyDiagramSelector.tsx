import { Card, CardContent } from "@/components/ui/card";
import bodyFront from "@/assets/body-diagram-front.png";
import bodyBack from "@/assets/body-diagram-back.png";

interface BodyDiagramSelectorProps {
  selectedParts: string[];
  onPartsChange: (parts: string[]) => void;
}

const bodyParts = {
  front: [
    { id: "head_front", label: "Head", top: "5%", left: "32%", width: "36%", height: "18%" },
    { id: "neck_front", label: "Neck", top: "23%", left: "40%", width: "20%", height: "5%" },
    { id: "left_shoulder", label: "Left Shoulder", top: "28%", left: "15%", width: "15%", height: "12%" },
    { id: "right_shoulder", label: "Right Shoulder", top: "28%", left: "70%", width: "15%", height: "12%" },
    { id: "chest", label: "Chest", top: "28%", left: "30%", width: "40%", height: "15%" },
    { id: "abdomen", label: "Abdomen", top: "43%", left: "30%", width: "40%", height: "15%" },
    { id: "left_arm_upper", label: "Left Upper Arm", top: "40%", left: "12%", width: "13%", height: "18%" },
    { id: "right_arm_upper", label: "Right Upper Arm", top: "40%", left: "75%", width: "13%", height: "18%" },
    { id: "left_elbow", label: "Left Elbow", top: "58%", left: "13%", width: "11%", height: "8%" },
    { id: "right_elbow", label: "Right Elbow", top: "58%", left: "76%", width: "11%", height: "8%" },
    { id: "left_forearm", label: "Left Forearm", top: "66%", left: "12%", width: "13%", height: "15%" },
    { id: "right_forearm", label: "Right Forearm", top: "66%", left: "75%", width: "13%", height: "15%" },
    { id: "left_hand", label: "Left Hand", top: "81%", left: "11%", width: "14%", height: "9%" },
    { id: "right_hand", label: "Right Hand", top: "81%", left: "75%", width: "14%", height: "9%" },
    { id: "left_thigh", label: "Left Thigh", top: "58%", left: "33%", width: "13%", height: "22%" },
    { id: "right_thigh", label: "Right Thigh", top: "58%", left: "54%", width: "13%", height: "22%" },
    { id: "left_knee", label: "Left Knee", top: "80%", left: "33%", width: "13%", height: "8%" },
    { id: "right_knee", label: "Right Knee", top: "80%", left: "54%", width: "13%", height: "8%" },
    { id: "left_shin", label: "Left Shin", top: "88%", left: "33%", width: "13%", height: "8%" },
    { id: "right_shin", label: "Right Shin", top: "88%", left: "54%", width: "13%", height: "8%" },
    { id: "left_foot", label: "Left Foot", top: "96%", left: "32%", width: "14%", height: "4%" },
    { id: "right_foot", label: "Right Foot", top: "96%", left: "54%", width: "14%", height: "4%" }
  ],
  back: [
    { id: "head_back", label: "Head (Back)", top: "5%", left: "32%", width: "36%", height: "18%" },
    { id: "neck_back", label: "Neck (Back)", top: "23%", left: "40%", width: "20%", height: "5%" },
    { id: "left_shoulder_back", label: "Left Shoulder (Back)", top: "28%", left: "15%", width: "15%", height: "12%" },
    { id: "right_shoulder_back", label: "Right Shoulder (Back)", top: "28%", left: "70%", width: "15%", height: "12%" },
    { id: "upper_back", label: "Upper Back", top: "28%", left: "30%", width: "40%", height: "15%" },
    { id: "lower_back", label: "Lower Back", top: "43%", left: "30%", width: "40%", height: "15%" },
    { id: "left_arm_back", label: "Left Arm (Back)", top: "40%", left: "12%", width: "13%", height: "18%" },
    { id: "right_arm_back", label: "Right Arm (Back)", top: "40%", left: "75%", width: "13%", height: "18%" },
    { id: "left_elbow_back", label: "Left Elbow (Back)", top: "58%", left: "13%", width: "11%", height: "8%" },
    { id: "right_elbow_back", label: "Right Elbow (Back)", top: "58%", left: "76%", width: "11%", height: "8%" },
    { id: "left_forearm_back", label: "Left Forearm (Back)", top: "66%", left: "12%", width: "13%", height: "15%" },
    { id: "right_forearm_back", label: "Right Forearm (Back)", top: "66%", left: "75%", width: "13%", height: "15%" },
    { id: "left_hand_back", label: "Left Hand (Back)", top: "81%", left: "11%", width: "14%", height: "9%" },
    { id: "right_hand_back", label: "Right Hand (Back)", top: "81%", left: "75%", width: "14%", height: "9%" },
    { id: "left_buttock", label: "Left Buttock", top: "58%", left: "35%", width: "11%", height: "10%" },
    { id: "right_buttock", label: "Right Buttock", top: "58%", left: "54%", width: "11%", height: "10%" },
    { id: "left_thigh_back", label: "Left Thigh (Back)", top: "68%", left: "33%", width: "13%", height: "12%" },
    { id: "right_thigh_back", label: "Right Thigh (Back)", top: "68%", left: "54%", width: "13%", height: "12%" },
    { id: "left_knee_back", label: "Left Knee (Back)", top: "80%", left: "33%", width: "13%", height: "8%" },
    { id: "right_knee_back", label: "Right Knee (Back)", top: "80%", left: "54%", width: "13%", height: "8%" },
    { id: "left_calf", label: "Left Calf", top: "88%", left: "33%", width: "13%", height: "8%" },
    { id: "right_calf", label: "Right Calf", top: "88%", left: "54%", width: "13%", height: "8%" },
    { id: "left_foot_back", label: "Left Foot (Back)", top: "96%", left: "32%", width: "14%", height: "4%" },
    { id: "right_foot_back", label: "Right Foot (Back)", top: "96%", left: "54%", width: "14%", height: "4%" }
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

  const getPartLabel = (partId: string) => {
    const allParts = [...bodyParts.front, ...bodyParts.back];
    return allParts.find(p => p.id === partId)?.label || partId;
  };

  const renderBodyView = (view: "front" | "back", title: string, image: string) => {
    const parts = bodyParts[view];
    
    return (
      <div className="flex-1 min-w-[280px]">
        <h3 className="text-lg font-medium text-foreground mb-3 text-center">{title}</h3>
        <div className="relative mx-auto max-w-[300px]">
          <img
            src={image}
            alt={`Body diagram ${view} view`}
            className="w-full h-auto"
          />
          <div className="absolute inset-0">
            {parts.map((part) => {
              const isSelected = selectedParts.includes(part.id);
              return (
                <button
                  key={part.id}
                  onClick={() => togglePart(part.id)}
                  className="absolute transition-colors cursor-pointer group"
                  style={{
                    top: part.top,
                    left: part.left,
                    width: part.width,
                    height: part.height,
                  }}
                  title={part.label}
                >
                  <div
                    className={`w-full h-full transition-all ${
                      isSelected
                        ? "bg-red-500/40 border-2 border-red-600"
                        : "bg-transparent hover:bg-blue-500/20 border-2 border-transparent hover:border-blue-400"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Title */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-foreground mb-2">Body Injury Diagram</h2>
            <p className="text-sm text-muted-foreground">
              Click on any body part to mark injury locations
            </p>
          </div>

          {/* Body Diagrams */}
          <div className="flex flex-col md:flex-row gap-8 justify-center items-start">
            {renderBodyView("front", "Front View", bodyFront)}
            {renderBodyView("back", "Back View", bodyBack)}
          </div>

          {/* Instructions and Legend */}
          <div className="border-t pt-4 space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Click any body part to mark injuries. Selected areas will be highlighted in red.
            </p>
            
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-200 border-2 border-blue-400"></div>
                <span className="text-sm text-foreground">Uninjured</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-red-600"></div>
                <span className="text-sm text-foreground">Injured</span>
              </div>
            </div>

            {/* Selected Locations */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-2">Selected Injury Locations:</h4>
              {selectedParts.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No injuries selected</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedParts.map((partId) => (
                    <span
                      key={partId}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-background rounded-full text-sm border"
                    >
                      {getPartLabel(partId)}
                      <button
                        onClick={() => togglePart(partId)}
                        className="ml-1 hover:text-destructive transition-colors"
                        aria-label={`Remove ${getPartLabel(partId)}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
