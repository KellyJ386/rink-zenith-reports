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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-xl">Body Injury Diagram</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Front View */}
            <div className="space-y-2">
              <h3 className="text-center font-semibold text-muted-foreground">Front View</h3>
              <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-6 border-2 border-border">
                <svg viewBox="0 0 200 500" className="w-full h-auto" style={{ maxHeight: "500px" }}>
                  {/* Head */}
                  <g>
                    <ellipse
                      cx="100"
                      cy="40"
                      rx="25"
                      ry="30"
                      className={`cursor-pointer transition-all stroke-blue-600 dark:stroke-blue-400 ${
                        selectedParts.includes("head_front")
                          ? "fill-red-500"
                          : "fill-blue-200 dark:fill-blue-800 hover:fill-blue-300 dark:hover:fill-blue-700"
                      }`}
                      strokeWidth="2"
                      onClick={() => togglePart("head_front")}
                    >
                      <title>Head</title>
                    </ellipse>
                    {/* Face features */}
                    <circle cx="90" cy="35" r="3" className="fill-blue-600 dark:fill-blue-400" />
                    <circle cx="110" cy="35" r="3" className="fill-blue-600 dark:fill-blue-400" />
                    <path d="M 90 48 Q 100 52 110 48" className="stroke-blue-600 dark:stroke-blue-400 fill-none" strokeWidth="2" />
                  </g>

                  {/* Neck */}
                  <rect
                    x="85"
                    y="65"
                    width="30"
                    height="20"
                    rx="5"
                    className={`cursor-pointer transition-all stroke-blue-600 dark:stroke-blue-400 ${
                      selectedParts.includes("neck_front")
                        ? "fill-red-500"
                        : "fill-blue-200 dark:fill-blue-800 hover:fill-blue-300 dark:hover:fill-blue-700"
                    }`}
                    strokeWidth="2"
                    onClick={() => togglePart("neck_front")}
                  >
                    <title>Neck</title>
                  </rect>

                  {/* Shoulders */}
                  <rect
                    x="45"
                    y="85"
                    width="30"
                    height="25"
                    rx="8"
                    className={`cursor-pointer transition-all stroke-blue-600 dark:stroke-blue-400 ${
                      selectedParts.includes("left_shoulder")
                        ? "fill-red-500"
                        : "fill-blue-200 dark:fill-blue-800 hover:fill-blue-300 dark:hover:fill-blue-700"
                    }`}
                    strokeWidth="2"
                    onClick={() => togglePart("left_shoulder")}
                  >
                    <title>Left Shoulder</title>
                  </rect>
                  <rect
                    x="125"
                    y="85"
                    width="30"
                    height="25"
                    rx="8"
                    className={`cursor-pointer transition-all stroke-blue-600 dark:stroke-blue-400 ${
                      selectedParts.includes("right_shoulder")
                        ? "fill-red-500"
                        : "fill-blue-200 dark:fill-blue-800 hover:fill-blue-300 dark:hover:fill-blue-700"
                    }`}
                    strokeWidth="2"
                    onClick={() => togglePart("right_shoulder")}
                  >
                    <title>Right Shoulder</title>
                  </rect>

                  {/* Chest */}
                  <rect
                    x="75"
                    y="85"
                    width="50"
                    height="40"
                    rx="5"
                    className={`cursor-pointer transition-all stroke-blue-600 dark:stroke-blue-400 ${
                      selectedParts.includes("chest")
                        ? "fill-red-500"
                        : "fill-blue-200 dark:fill-blue-800 hover:fill-blue-300 dark:hover:fill-blue-700"
                    }`}
                    strokeWidth="2"
                    onClick={() => togglePart("chest")}
                  >
                    <title>Chest</title>
                  </rect>

                  {/* Abdomen */}
                  <rect
                    x="75"
                    y="125"
                    width="50"
                    height="45"
                    rx="5"
                    className={`cursor-pointer transition-all stroke-blue-600 dark:stroke-blue-400 ${
                      selectedParts.includes("abdomen")
                        ? "fill-red-500"
                        : "fill-blue-200 dark:fill-blue-800 hover:fill-blue-300 dark:hover:fill-blue-700"
                    }`}
                    strokeWidth="2"
                    onClick={() => togglePart("abdomen")}
                  >
                    <title>Abdomen</title>
                  </rect>

                  {/* Arms */}
                  <rect
                    x="30"
                    y="110"
                    width="20"
                    height="50"
                    rx="10"
                    className={`cursor-pointer transition-all stroke-blue-600 dark:stroke-blue-400 ${
                      selectedParts.includes("left_arm_upper")
                        ? "fill-red-500"
                        : "fill-blue-200 dark:fill-blue-800 hover:fill-blue-300 dark:hover:fill-blue-700"
                    }`}
                    strokeWidth="2"
                    onClick={() => togglePart("left_arm_upper")}
                  >
                    <title>Left Upper Arm</title>
                  </rect>
                  <rect
                    x="150"
                    y="110"
                    width="20"
                    height="50"
                    rx="10"
                    className={`cursor-pointer transition-all stroke-blue-600 dark:stroke-blue-400 ${
                      selectedParts.includes("right_arm_upper")
                        ? "fill-red-500"
                        : "fill-blue-200 dark:fill-blue-800 hover:fill-blue-300 dark:hover:fill-blue-700"
                    }`}
                    strokeWidth="2"
                    onClick={() => togglePart("right_arm_upper")}
                  >
                    <title>Right Upper Arm</title>
                  </rect>

                  {/* Elbows */}
                  <circle
                    cx="40"
                    cy="165"
                    r="8"
                    className={`cursor-pointer transition-all stroke-blue-600 dark:stroke-blue-400 ${
                      selectedParts.includes("left_elbow")
                        ? "fill-red-500"
                        : "fill-blue-200 dark:fill-blue-800 hover:fill-blue-300 dark:hover:fill-blue-700"
                    }`}
                    strokeWidth="2"
                    onClick={() => togglePart("left_elbow")}
                  >
                    <title>Left Elbow</title>
                  </circle>
                  <circle
                    cx="160"
                    cy="165"
                    r="8"
                    className={`cursor-pointer transition-all stroke-blue-600 dark:stroke-blue-400 ${
                      selectedParts.includes("right_elbow")
                        ? "fill-red-500"
                        : "fill-blue-200 dark:fill-blue-800 hover:fill-blue-300 dark:hover:fill-blue-700"
                    }`}
                    strokeWidth="2"
                    onClick={() => togglePart("right_elbow")}
                  >
                    <title>Right Elbow</title>
                  </circle>

                  {/* Forearms */}
                  <rect
                    x="30"
                    y="170"
                    width="20"
                    height="50"
                    rx="10"
                    className={`cursor-pointer transition-all stroke-blue-600 dark:stroke-blue-400 ${
                      selectedParts.includes("left_forearm")
                        ? "fill-red-500"
                        : "fill-blue-200 dark:fill-blue-800 hover:fill-blue-300 dark:hover:fill-blue-700"
                    }`}
                    strokeWidth="2"
                    onClick={() => togglePart("left_forearm")}
                  >
                    <title>Left Forearm</title>
                  </rect>
                  <rect
                    x="150"
                    y="170"
                    width="20"
                    height="50"
                    rx="10"
                    className={`cursor-pointer transition-all stroke-blue-600 dark:stroke-blue-400 ${
                      selectedParts.includes("right_forearm")
                        ? "fill-red-500"
                        : "fill-blue-200 dark:fill-blue-800 hover:fill-blue-300 dark:hover:fill-blue-700"
                    }`}
                    strokeWidth="2"
                    onClick={() => togglePart("right_forearm")}
                  >
                    <title>Right Forearm</title>
                  </rect>

                  {/* Hands */}
                  <ellipse
                    cx="40"
                    cy="235"
                    rx="12"
                    ry="18"
                    className={`cursor-pointer transition-all stroke-blue-600 dark:stroke-blue-400 ${
                      selectedParts.includes("left_hand")
                        ? "fill-red-500"
                        : "fill-blue-200 dark:fill-blue-800 hover:fill-blue-300 dark:hover:fill-blue-700"
                    }`}
                    strokeWidth="2"
                    onClick={() => togglePart("left_hand")}
                  >
                    <title>Left Hand</title>
                  </ellipse>
                  <ellipse
                    cx="160"
                    cy="235"
                    rx="12"
                    ry="18"
                    className={`cursor-pointer transition-all stroke-blue-600 dark:stroke-blue-400 ${
                      selectedParts.includes("right_hand")
                        ? "fill-red-500"
                        : "fill-blue-200 dark:fill-blue-800 hover:fill-blue-300 dark:hover:fill-blue-700"
                    }`}
                    strokeWidth="2"
                    onClick={() => togglePart("right_hand")}
                  >
                    <title>Right Hand</title>
                  </ellipse>

                  {/* Thighs */}
                  <rect
                    x="75"
                    y="170"
                    width="20"
                    height="80"
                    rx="10"
                    className={`cursor-pointer transition-all stroke-blue-600 dark:stroke-blue-400 ${
                      selectedParts.includes("left_thigh")
                        ? "fill-red-500"
                        : "fill-blue-200 dark:fill-blue-800 hover:fill-blue-300 dark:hover:fill-blue-700"
                    }`}
                    strokeWidth="2"
                    onClick={() => togglePart("left_thigh")}
                  >
                    <title>Left Thigh</title>
                  </rect>
                  <rect
                    x="105"
                    y="170"
                    width="20"
                    height="80"
                    rx="10"
                    className={`cursor-pointer transition-all stroke-blue-600 dark:stroke-blue-400 ${
                      selectedParts.includes("right_thigh")
                        ? "fill-red-500"
                        : "fill-blue-200 dark:fill-blue-800 hover:fill-blue-300 dark:hover:fill-blue-700"
                    }`}
                    strokeWidth="2"
                    onClick={() => togglePart("right_thigh")}
                  >
                    <title>Right Thigh</title>
                  </rect>

                  {/* Knees */}
                  <circle
                    cx="85"
                    cy="260"
                    r="10"
                    className={`cursor-pointer transition-all stroke-blue-600 dark:stroke-blue-400 ${
                      selectedParts.includes("left_knee")
                        ? "fill-red-500"
                        : "fill-blue-200 dark:fill-blue-800 hover:fill-blue-300 dark:hover:fill-blue-700"
                    }`}
                    strokeWidth="2"
                    onClick={() => togglePart("left_knee")}
                  >
                    <title>Left Knee</title>
                  </circle>
                  <circle
                    cx="115"
                    cy="260"
                    r="10"
                    className={`cursor-pointer transition-all stroke-blue-600 dark:stroke-blue-400 ${
                      selectedParts.includes("right_knee")
                        ? "fill-red-500"
                        : "fill-blue-200 dark:fill-blue-800 hover:fill-blue-300 dark:hover:fill-blue-700"
                    }`}
                    strokeWidth="2"
                    onClick={() => togglePart("right_knee")}
                  >
                    <title>Right Knee</title>
                  </circle>

                  {/* Shins */}
                  <rect
                    x="75"
                    y="270"
                    width="20"
                    height="80"
                    rx="10"
                    className={`cursor-pointer transition-all stroke-blue-600 dark:stroke-blue-400 ${
                      selectedParts.includes("left_shin")
                        ? "fill-red-500"
                        : "fill-blue-200 dark:fill-blue-800 hover:fill-blue-300 dark:hover:fill-blue-700"
                    }`}
                    strokeWidth="2"
                    onClick={() => togglePart("left_shin")}
                  >
                    <title>Left Shin</title>
                  </rect>
                  <rect
                    x="105"
                    y="270"
                    width="20"
                    height="80"
                    rx="10"
                    className={`cursor-pointer transition-all stroke-blue-600 dark:stroke-blue-400 ${
                      selectedParts.includes("right_shin")
                        ? "fill-red-500"
                        : "fill-blue-200 dark:fill-blue-800 hover:fill-blue-300 dark:hover:fill-blue-700"
                    }`}
                    strokeWidth="2"
                    onClick={() => togglePart("right_shin")}
                  >
                    <title>Right Shin</title>
                  </rect>

                  {/* Feet */}
                  <ellipse
                    cx="85"
                    cy="370"
                    rx="15"
                    ry="20"
                    className={`cursor-pointer transition-all stroke-blue-600 dark:stroke-blue-400 ${
                      selectedParts.includes("left_foot")
                        ? "fill-red-500"
                        : "fill-blue-200 dark:fill-blue-800 hover:fill-blue-300 dark:hover:fill-blue-700"
                    }`}
                    strokeWidth="2"
                    onClick={() => togglePart("left_foot")}
                  >
                    <title>Left Foot</title>
                  </ellipse>
                  <ellipse
                    cx="115"
                    cy="370"
                    rx="15"
                    ry="20"
                    className={`cursor-pointer transition-all stroke-blue-600 dark:stroke-blue-400 ${
                      selectedParts.includes("right_foot")
                        ? "fill-red-500"
                        : "fill-blue-200 dark:fill-blue-800 hover:fill-blue-300 dark:hover:fill-blue-700"
                    }`}
                    strokeWidth="2"
                    onClick={() => togglePart("right_foot")}
                  >
                    <title>Right Foot</title>
                  </ellipse>
                </svg>
              </div>
            </div>

            {/* Back View */}
            <div className="space-y-2">
              <h3 className="text-center font-semibold text-muted-foreground">Back View</h3>
              <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-6 border-2 border-border">
                <svg viewBox="0 0 200 500" className="w-full h-auto" style={{ maxHeight: "500px" }}>
                  {/* Head Back */}
                  <ellipse
                    cx="100"
                    cy="40"
                    rx="25"
                    ry="30"
                    className={`cursor-pointer transition-all stroke-blue-600 dark:stroke-blue-400 ${
                      selectedParts.includes("head_back")
                        ? "fill-red-500"
                        : "fill-blue-200 dark:fill-blue-800 hover:fill-blue-300 dark:hover:fill-blue-700"
                    }`}
                    strokeWidth="2"
                    onClick={() => togglePart("head_back")}
                  >
                    <title>Head (Back)</title>
                  </ellipse>

                  {/* Neck Back */}
                  <rect
                    x="85"
                    y="65"
                    width="30"
                    height="20"
                    rx="5"
                    className={`cursor-pointer transition-all stroke-blue-600 dark:stroke-blue-400 ${
                      selectedParts.includes("neck_back")
                        ? "fill-red-500"
                        : "fill-blue-200 dark:fill-blue-800 hover:fill-blue-300 dark:hover:fill-blue-700"
                    }`}
                    strokeWidth="2"
                    onClick={() => togglePart("neck_back")}
                  >
                    <title>Neck (Back)</title>
                  </rect>

                  {/* Upper Back */}
                  <rect
                    x="75"
                    y="85"
                    width="50"
                    height="40"
                    rx="5"
                    className={`cursor-pointer transition-all stroke-blue-600 dark:stroke-blue-400 ${
                      selectedParts.includes("upper_back")
                        ? "fill-red-500"
                        : "fill-blue-200 dark:fill-blue-800 hover:fill-blue-300 dark:hover:fill-blue-700"
                    }`}
                    strokeWidth="2"
                    onClick={() => togglePart("upper_back")}
                  >
                    <title>Upper Back</title>
                  </rect>

                  {/* Lower Back */}
                  <rect
                    x="75"
                    y="125"
                    width="50"
                    height="45"
                    rx="5"
                    className={`cursor-pointer transition-all stroke-blue-600 dark:stroke-blue-400 ${
                      selectedParts.includes("lower_back")
                        ? "fill-red-500"
                        : "fill-blue-200 dark:fill-blue-800 hover:fill-blue-300 dark:hover:fill-blue-700"
                    }`}
                    strokeWidth="2"
                    onClick={() => togglePart("lower_back")}
                  >
                    <title>Lower Back</title>
                  </rect>

                  {/* Back Arms and similar structure... */}
                  <rect
                    x="30"
                    y="110"
                    width="20"
                    height="50"
                    rx="10"
                    className={`cursor-pointer transition-all stroke-blue-600 dark:stroke-blue-400 ${
                      selectedParts.includes("left_arm_back")
                        ? "fill-red-500"
                        : "fill-blue-200 dark:fill-blue-800 hover:fill-blue-300 dark:hover:fill-blue-700"
                    }`}
                    strokeWidth="2"
                    onClick={() => togglePart("left_arm_back")}
                  >
                    <title>Left Arm (Back)</title>
                  </rect>
                  <rect
                    x="150"
                    y="110"
                    width="20"
                    height="50"
                    rx="10"
                    className={`cursor-pointer transition-all stroke-blue-600 dark:stroke-blue-400 ${
                      selectedParts.includes("right_arm_back")
                        ? "fill-red-500"
                        : "fill-blue-200 dark:fill-blue-800 hover:fill-blue-300 dark:hover:fill-blue-700"
                    }`}
                    strokeWidth="2"
                    onClick={() => togglePart("right_arm_back")}
                  >
                    <title>Right Arm (Back)</title>
                  </rect>

                  {/* Continue with back legs similar to front view */}
                  <rect
                    x="75"
                    y="170"
                    width="20"
                    height="80"
                    rx="10"
                    className={`cursor-pointer transition-all stroke-blue-600 dark:stroke-blue-400 ${
                      selectedParts.includes("left_thigh_back")
                        ? "fill-red-500"
                        : "fill-blue-200 dark:fill-blue-800 hover:fill-blue-300 dark:hover:fill-blue-700"
                    }`}
                    strokeWidth="2"
                    onClick={() => togglePart("left_thigh_back")}
                  >
                    <title>Left Thigh (Back)</title>
                  </rect>
                  <rect
                    x="105"
                    y="170"
                    width="20"
                    height="80"
                    rx="10"
                    className={`cursor-pointer transition-all stroke-blue-600 dark:stroke-blue-400 ${
                      selectedParts.includes("right_thigh_back")
                        ? "fill-red-500"
                        : "fill-blue-200 dark:fill-blue-800 hover:fill-blue-300 dark:hover:fill-blue-700"
                    }`}
                    strokeWidth="2"
                    onClick={() => togglePart("right_thigh_back")}
                  >
                    <title>Right Thigh (Back)</title>
                  </rect>

                  <rect
                    x="75"
                    y="270"
                    width="20"
                    height="80"
                    rx="10"
                    className={`cursor-pointer transition-all stroke-blue-600 dark:stroke-blue-400 ${
                      selectedParts.includes("left_calf")
                        ? "fill-red-500"
                        : "fill-blue-200 dark:fill-blue-800 hover:fill-blue-300 dark:hover:fill-blue-700"
                    }`}
                    strokeWidth="2"
                    onClick={() => togglePart("left_calf")}
                  >
                    <title>Left Calf</title>
                  </rect>
                  <rect
                    x="105"
                    y="270"
                    width="20"
                    height="80"
                    rx="10"
                    className={`cursor-pointer transition-all stroke-blue-600 dark:stroke-blue-400 ${
                      selectedParts.includes("right_calf")
                        ? "fill-red-500"
                        : "fill-blue-200 dark:fill-blue-800 hover:fill-blue-300 dark:hover:fill-blue-700"
                    }`}
                    strokeWidth="2"
                    onClick={() => togglePart("right_calf")}
                  >
                    <title>Right Calf</title>
                  </rect>

                  <ellipse
                    cx="85"
                    cy="370"
                    rx="15"
                    ry="20"
                    className={`cursor-pointer transition-all stroke-blue-600 dark:stroke-blue-400 ${
                      selectedParts.includes("left_foot_back")
                        ? "fill-red-500"
                        : "fill-blue-200 dark:fill-blue-800 hover:fill-blue-300 dark:hover:fill-blue-700"
                    }`}
                    strokeWidth="2"
                    onClick={() => togglePart("left_foot_back")}
                  >
                    <title>Left Foot (Back)</title>
                  </ellipse>
                  <ellipse
                    cx="115"
                    cy="370"
                    rx="15"
                    ry="20"
                    className={`cursor-pointer transition-all stroke-blue-600 dark:stroke-blue-400 ${
                      selectedParts.includes("right_foot_back")
                        ? "fill-red-500"
                        : "fill-blue-200 dark:fill-blue-800 hover:fill-blue-300 dark:hover:fill-blue-700"
                    }`}
                    strokeWidth="2"
                    onClick={() => togglePart("right_foot_back")}
                  >
                    <title>Right Foot (Back)</title>
                  </ellipse>
                </svg>
              </div>
            </div>
          </div>

          <p className="text-sm text-center text-muted-foreground">
            Click any part to mark injuries. Grey parts aren&apos;t configured but still selectable.
          </p>

          <div className="flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-200 dark:bg-blue-800 border-2 border-blue-600 dark:border-blue-400" />
              <span>Uninjured</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-blue-600 dark:border-blue-400" />
              <span>Injured</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-700 border-2 border-gray-400" />
              <span>Not configured</span>
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
