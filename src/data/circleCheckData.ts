export interface CheckSection {
  id: string;
  title: string;
  items: string[];
}

export const ELECTRIC_CHECK_SECTIONS: CheckSection[] = [
  {
    id: "general",
    title: "General Pre-Inspection",
    items: [
      "Auger Systems",
      "Towel",
      "Squeegee",
      "Board Brush",
      "Belts and Hoses",
      "Grease Vertical Auger Bearings",
      "Drain Water Tanks",
      "Under/Around/Behind Resurfacer",
      "Snow Pit/Dumping Area",
      "Consumables",
      "Building Ventilation",
    ],
  },
  {
    id: "safety",
    title: "Safety & Security",
    items: [
      "Tank Up/Safety Stand",
      "Key Security",
      "Safety Guards",
      "Body Condition and Safety Labels",
    ],
  },
  {
    id: "electrical",
    title: "Electrical System",
    items: [
      "Hour Meter Reading",
      "Battery Gauge",
      "Battery/Cables",
    ],
  },
  {
    id: "operator",
    title: "Operator Station",
    items: [
      "Head Lights/Tail Light",
      "Steering Wheel/Horn",
      "Control Levers",
      "Seat/Armrest",
      "Foot and Brake Pedal",
      "Step Areas",
    ],
  },
  {
    id: "auger",
    title: "Auger & Conveyor System",
    items: [
      "Vertical Auger Movement",
      "Horizontal Auger",
      "Auger Flighting",
      "Snow Breaker",
      "Snow Tank Inspection",
      "Snow Tank Seal",
      "Conveyor Drive Belt and Chain",
    ],
  },
  {
    id: "conditioner",
    title: "Conditioner & Blade",
    items: [
      "Blade Adjustment Wheel",
      "Blade and Runner Condition",
      "Blade Bar",
      "Flood Pipe",
      "Towel and Squeegee",
      "Conditioner/Lift Arm/Bushings",
      "Conditioner Leaf Springs",
      "Guide Wheel",
      "Board Brush/Arm Bushing",
    ],
  },
  {
    id: "hydraulic",
    title: "Hydraulic System",
    items: [
      "Hydraulic Hoses/Couplers",
      "Hydraulic Oil Level",
      "U-Joints",
    ],
  },
  {
    id: "suspension",
    title: "Tires & Suspension",
    items: [
      "Tires/Hubs/Studs/Nuts",
      "Leaf Springs",
      "Brake Lines",
      "Brake Fluid",
    ],
  },
  {
    id: "water",
    title: "Water Systems",
    items: [
      "Ice Making Water",
      "Wash Water",
      "Wash Water Fill",
      "Wash Water Valves",
      "Wash Water Pump",
      "Poly Water Tank",
    ],
  },
  {
    id: "optional",
    title: "Optional Equipment",
    items: [
      "Fire Extinguisher",
      "Beacon Light",
      "Backup Alarm",
      "Tire Wash Water",
      "Seatbelt",
      "Other Optional Equipment",
    ],
  },
];

export const GAS_CHECK_SECTIONS: CheckSection[] = [
  {
    id: "general",
    title: "General Pre-Inspection",
    items: [
      "Auger Systems",
      "Towel",
      "Squeegee",
      "Board Brush",
      "Belts and Hoses",
      "Grease Vertical Auger Bearings",
      "Drain Water Tanks",
      "Under/Around/Behind Resurfacer",
      "Snow Pit/Dumping Area",
      "Consumables",
      "Building Ventilation",
      "Fuel Supply",
      "Oil and Filters",
    ],
  },
  {
    id: "safety",
    title: "Safety & Security",
    items: [
      "Tank Up/Safety Stand",
      "Key Security",
      "Safety Guards",
      "Body Condition and Safety Labels",
      "Fuel Supply Shutoff",
    ],
  },
  {
    id: "engine",
    title: "Engine & Fuel System",
    items: [
      "Exhaust System",
      "Fuel Line",
      "Fuel Levels/Connections/Hoses/Tanks",
      "Belts",
      "Spark Plugs",
      "Radiator/Hoses",
      "Air Filter",
      "Battery/Cables",
    ],
  },
  {
    id: "operator",
    title: "Operator Station",
    items: [
      "Head Lights/Tail Light",
      "Gauges/Steering Wheel/Horn",
      "Control Levers",
      "Seat/Armrest",
      "Brake/Brake Pedal",
      "Step Areas",
      "Hour Meter",
      "Voltmeter",
      "Temperature",
      "Tachometer",
    ],
  },
  {
    id: "auger",
    title: "Auger & Conveyor System",
    items: [
      "Vertical Auger Movement",
      "Horizontal Auger",
      "Auger Flighting",
      "Snow Breaker",
      "Snow Tank Inspection",
      "Snow Tank Seal",
      "Conveyor Drive Belt and Chain",
    ],
  },
  {
    id: "conditioner",
    title: "Conditioner & Blade",
    items: [
      "Blade Adjustment Wheel",
      "Blade and Runner Condition",
      "Blade Bar",
      "Flood Pipe",
      "Towel and Squeegee",
      "Conditioner/Lift Arm/Bushings",
      "Conditioner Leaf Springs",
      "Guide Wheel",
      "Board Brush/Arm Bushing",
    ],
  },
  {
    id: "hydraulic",
    title: "Hydraulic System",
    items: [
      "Hydraulic Hoses/Couplers",
      "Hydraulic Oil Level",
      "Hydraulic Oil Filter",
      "Hydraulic Bypass",
      "U-Joints",
      "Fluid Levels",
    ],
  },
  {
    id: "suspension",
    title: "Tires & Suspension",
    items: [
      "Tires/Hubs/Studs/Nuts",
      "Leaf Springs",
      "Brake Lines",
    ],
  },
  {
    id: "water",
    title: "Water Systems",
    items: [
      "Ice Making Water/Wash Water Valves",
      "Water Fill",
      "Wash Water Pump",
      "Poly Water Tank",
    ],
  },
  {
    id: "optional",
    title: "Optional Equipment",
    items: [
      "Exhaust Shield (Canadian)",
      "Fire Extinguisher",
      "Beacon Light",
      "Backup Alarm",
      "Tire Wash Water",
      "Seatbelt",
    ],
  },
];

// Helper to get all items from sections as a flat list
export const getAllCheckItems = (sections: CheckSection[]): string[] => {
  return sections.flatMap((section) => section.items);
};

// Helper to initialize check state for all items
export const initializeCheckState = (
  sections: CheckSection[]
): Record<string, { passed: boolean; notes: string }> => {
  const state: Record<string, { passed: boolean; notes: string }> = {};
  sections.forEach((section) => {
    section.items.forEach((item) => {
      state[item] = { passed: true, notes: "" };
    });
  });
  return state;
};
