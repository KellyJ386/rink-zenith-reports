import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import bodyFront from "@/assets/body-diagram-front.png";
import bodyBack from "@/assets/body-diagram-back.png";

interface BodyDiagramSelectorProps {
  selectedParts: string[];
  onPartsChange: (parts: string[]) => void;
}

const bodyParts = {
  front: [
    { id: "head_front", label: "Head", top: "3%", left: "38%", width: "24%", height: "12%" },
    { id: "neck_front", label: "Neck", top: "15%", left: "42%", width: "16%", height: "5%" },
    { id: "chest", label: "Chest", top: "20%", left: "32%", width: "36%", height: "15%" },
    { id: "abdomen", label: "Abdomen", top: "35%", left: "34%", width: "32%", height: "12%" },
    { id: "left_shoulder", label: "Left Shoulder", top: "20%", left: "20%", width: "12%", height: "8%" },
    { id: "right_shoulder", label: "Right Shoulder", top: "20%", left: "68%", width: "12%", height: "8%" },
    { id: "left_arm_upper", label: "Left Upper Arm", top: "28%", left: "15%", width: "10%", height: "15%" },
    { id: "right_arm_upper", label: "Right Upper Arm", top: "28%", left: "75%", width: "10%", height: "15%" },
    { id: "left_elbow", label: "Left Elbow", top: "43%", left: "13%", width: "10%", height: "6%" },
    { id: "right_elbow", label: "Right Elbow", top: "43%", left: "77%", width: "10%", height: "6%" },
    { id: "left_forearm", label: "Left Forearm", top: "49%", left: "10%", width: "12%", height: "15%" },
    { id: "right_forearm", label: "Right Forearm", top: "49%", left: "78%", width: "12%", height: "15%" },
    { id: "left_hand", label: "Left Hand", top: "64%", left: "8%", width: "12%", height: "8%" },
    { id: "right_hand", label: "Right Hand", top: "64%", left: "80%", width: "12%", height: "8%" },
    { id: "left_thigh", label: "Left Thigh", top: "47%", left: "36%", width: "10%", height: "18%" },
    { id: "right_thigh", label: "Right Thigh", top: "47%", left: "54%", width: "10%", height: "18%" },
    { id: "left_knee", label: "Left Knee", top: "65%", left: "36%", width: "10%", height: "6%" },
    { id: "right_knee", label: "Right Knee", top: "65%", left: "54%", width: "10%", height: "6%" },
    { id: "left_shin", label: "Left Shin", top: "71%", left: "36%", width: "10%", height: "17%" },
    { id: "right_shin", label: "Right Shin", top: "71%", left: "54%", width: "10%", height: "17%" },
    { id: "left_foot", label: "Left Foot", top: "88%", left: "35%", width: "11%", height: "8%" },
    { id: "right_foot", label: "Right Foot", top: "88%", left: "54%", width: "11%", height: "8%" }
  ],
  back: [
    { id: "head_back", label: "Head (Back)", top: "3%", left: "38%", width: "24%", height: "12%" },
    { id: "neck_back", label: "Neck (Back)", top: "15%", left: "42%", width: "16%", height: "5%" },
    { id: "upper_back", label: "Upper Back", top: "20%", left: "32%", width: "36%", height: "15%" },
    { id: "lower_back", label: "Lower Back", top: "35%", left: "34%", width: "32%", height: "12%" },
    { id: "left_shoulder_back", label: "Left Shoulder (Back)", top: "20%", left: "20%", width: "12%", height: "8%" },
    { id: "right_shoulder_back", label: "Right Shoulder (Back)", top: "20%", left: "68%", width: "12%", height: "8%" },
    { id: "left_arm_back", label: "Left Arm (Back)", top: "28%", left: "15%", width: "10%", height: "15%" },
    { id: "right_arm_back", label: "Right Arm (Back)", top: "28%", left: "75%", width: "10%", height: "15%" },
    { id: "left_elbow_back", label: "Left Elbow (Back)", top: "43%", left: "13%", width: "10%", height: "6%" },
    { id: "right_elbow_back", label: "Right Elbow (Back)", top: "43%", left: "77%", width: "10%", height: "6%" },
    { id: "left_forearm_back", label: "Left Forearm (Back)", top: "49%", left: "10%", width: "12%", height: "15%" },
    { id: "right_forearm_back", label: "Right Forearm (Back)", top: "49%", left: "78%", width: "12%", height: "15%" },
    { id: "left_hand_back", label: "Left Hand (Back)", top: "64%", left: "8%", width: "12%", height: "8%" },
    { id: "right_hand_back", label: "Right Hand (Back)", top: "64%", left: "80%", width: "12%", height: "8%" },
    { id: "left_buttock", label: "Left Buttock", top: "46%", left: "38%", width: "10%", height: "8%" },
    { id: "right_buttock", label: "Right Buttock", top: "46%", left: "52%", width: "10%", height: "8%" },
    { id: "left_thigh_back", label: "Left Thigh (Back)", top: "54%", left: "36%", width: "10%", height: "15%" },
    { id: "right_thigh_back", label: "Right Thigh (Back)", top: "54%", left: "54%", width: "10%", height: "15%" },
    { id: "left_knee_back", label: "Left Knee (Back)", top: "69%", left: "36%", width: "10%", height: "6%" },
    { id: "right_knee_back", label: "Right Knee (Back)", top: "69%", left: "54%", width: "10%", height: "6%" },
    { id: "left_calf", label: "Left Calf", top: "75%", left: "36%", width: "10%", height: "13%" },
    { id: "right_calf", label: "Right Calf", top: "75%", left: "54%", width: "10%", height: "13%" },
    { id: "left_foot_back", label: "Left Foot (Back)", top: "88%", left: "35%", width: "11%", height: "8%" },
    { id: "right_foot_back", label: "Right Foot (Back)", top: "88%", left: "54%", width: "11%", height: "8%" }
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

  const renderBodyView = (parts: typeof bodyParts.front, imageSrc: string, viewTitle: string) => (
    <div className="space-y-2">
      <h3 className="text-center font-semibold text-muted-foreground">{viewTitle}</h3>
      <div className="relative bg-gradient-to-br from-muted/30 to-muted/50 rounded-lg p-4 border-2 border-border overflow-hidden">
        <div className="relative w-full" style={{ paddingBottom: "162.5%" }}>
          {/* Background Image */}
          <img
            src={imageSrc}
            alt={viewTitle}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />
          
          {/* Clickable Overlay Regions */}
          {parts.map((part) => (
            <div
              key={part.id}
              className={`absolute cursor-pointer transition-all duration-200 rounded-md ${
                selectedParts.includes(part.id)
                  ? "bg-destructive/70 border-2 border-destructive hover:bg-destructive/80"
                  : "hover:bg-primary/20 border-2 border-transparent hover:border-primary/40"
              }`}
              style={{
                top: part.top,
                left: part.left,
                width: part.width,
                height: part.height,
              }}
              onClick={() => togglePart(part.id)}
              title={part.label}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-xl">Body Injury Diagram</CardTitle>
        <CardDescription className="text-center">
          Click on any body part to mark injury locations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Front View */}
            {renderBodyView(bodyParts.front, bodyFront, "Front View")}
            
            {/* Back View */}
            {renderBodyView(bodyParts.back, bodyBack, "Back View")}
          </div>

          <p className="text-sm text-center text-muted-foreground">
            Click any body part to mark injuries. Selected areas will be highlighted in red.
          </p>

          <div className="flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md border-2 border-border" />
              <span>Uninjured</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-destructive/70 border-2 border-destructive" />
              <span>Injured</span>
            </div>
          </div>

          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <p className="font-semibold text-center">Selected Injury Locations:</p>
            {selectedParts.length === 0 ? (
              <p className="text-sm text-center text-muted-foreground italic">No injuries selected</p>
            ) : (
              <div className="flex flex-wrap justify-center gap-2">
                {selectedParts.map(partId => (
                  <Badge key={partId} variant="destructive" className="text-sm">
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
