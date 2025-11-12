export interface MeasurementPoint {
  id: number;
  x: number; // Percentage (0-100)
  y: number; // Percentage (0-100)
  name: string;
  row: number;
  isSpecial?: boolean;
  specialLabel?: string;
}

// 24-Point Template: 9 rows, varying columns
const points24: MeasurementPoint[] = [
  // Row 1 (bottom, y=90%): Points 1-3 (right to left)
  { id: 1, x: 80, y: 88, name: "Point 1", row: 1 },
  { id: 2, x: 50, y: 88, name: "Point 2", row: 1 },
  { id: 3, x: 20, y: 88, name: "Point 3", row: 1 },
  
  // Row 2 (y=80%): Points 4-6 (left to right)
  { id: 4, x: 20, y: 77, name: "Point 4", row: 2 },
  { id: 5, x: 50, y: 77, name: "Point 5", row: 2 },
  { id: 6, x: 80, y: 77, name: "Point 6", row: 2 },
  
  // Row 3 (y=70%): Points 7-8 (right to left)
  { id: 7, x: 65, y: 66, name: "Point 7", row: 3 },
  { id: 8, x: 35, y: 66, name: "Point 8", row: 3 },
  
  // Row 4 (y=60%): Points 9-11 (left to right)
  { id: 9, x: 20, y: 55, name: "Point 9", row: 4 },
  { id: 10, x: 50, y: 55, name: "Point 10", row: 4 },
  { id: 11, x: 80, y: 55, name: "Point 11", row: 4 },
  
  // Row 5 (y=50%): Points 12-14 (right to left)
  { id: 12, x: 80, y: 44, name: "Point 12", row: 5 },
  { id: 13, x: 50, y: 44, name: "Point 13", row: 5 },
  { id: 14, x: 20, y: 44, name: "Point 14", row: 5 },
  
  // Row 6 (y=40%): Points 15-17 (left to right)
  { id: 15, x: 20, y: 33, name: "Point 15", row: 6 },
  { id: 16, x: 50, y: 33, name: "Point 16", row: 6 },
  { id: 17, x: 80, y: 33, name: "Point 17", row: 6 },
  
  // Row 7 (y=30%): Points 18-19 (right to left)
  { id: 18, x: 65, y: 22, name: "Point 18", row: 7 },
  { id: 19, x: 35, y: 22, name: "Point 19", row: 7 },
  
  // Row 8 (y=20%): Points 20-22 (left to right)
  { id: 20, x: 20, y: 11, name: "Point 20", row: 8 },
  { id: 21, x: 50, y: 11, name: "Point 21", row: 8 },
  { id: 22, x: 80, y: 11, name: "Point 22", row: 8 },
  
  // Row 9 (top, y=10%): Points 23-24 (right to left)
  { id: 23, x: 65, y: 4, name: "Point 23", row: 9 },
  { id: 24, x: 35, y: 4, name: "Point 24", row: 9 },
];

// 35-Point Template: 7 rows × 5 columns
const points35: MeasurementPoint[] = [
  // Row 1 (bottom, y=85%): Points 1-5 (right to left)
  { id: 1, x: 84, y: 85, name: "Point 1", row: 1 },
  { id: 2, x: 67, y: 85, name: "Point 2", row: 1 },
  { id: 3, x: 50, y: 85, name: "Point 3", row: 1 },
  { id: 4, x: 33, y: 85, name: "Point 4", row: 1 },
  { id: 5, x: 16, y: 85, name: "Point 5", row: 1 },
  
  // Row 2 (y=70%): Points 6-10 (left to right)
  { id: 6, x: 16, y: 70, name: "Point 6", row: 2 },
  { id: 7, x: 33, y: 70, name: "Point 7", row: 2 },
  { id: 8, x: 50, y: 70, name: "Point 8", row: 2 },
  { id: 9, x: 67, y: 70, name: "Point 9", row: 2 },
  { id: 10, x: 84, y: 70, name: "Point 10", row: 2 },
  
  // Row 3 (y=57%): Points 11-15 (right to left)
  { id: 11, x: 84, y: 57, name: "Point 11", row: 3 },
  { id: 12, x: 67, y: 57, name: "Point 12", row: 3 },
  { id: 13, x: 50, y: 57, name: "Point 13", row: 3 },
  { id: 14, x: 33, y: 57, name: "Point 14", row: 3 },
  { id: 15, x: 16, y: 57, name: "Point 15", row: 3 },
  
  // Row 4 (y=43%): Points 16-20 (left to right)
  { id: 16, x: 16, y: 43, name: "Point 16", row: 4 },
  { id: 17, x: 33, y: 43, name: "Point 17", row: 4 },
  { id: 18, x: 50, y: 43, name: "Point 18", row: 4 },
  { id: 19, x: 67, y: 43, name: "Point 19", row: 4 },
  { id: 20, x: 84, y: 43, name: "Point 20", row: 4 },
  
  // Row 5 (y=30%): Points 21-25 (right to left)
  { id: 21, x: 84, y: 30, name: "Point 21", row: 5 },
  { id: 22, x: 67, y: 30, name: "Point 22", row: 5 },
  { id: 23, x: 50, y: 30, name: "Point 23", row: 5 },
  { id: 24, x: 33, y: 30, name: "Point 24", row: 5 },
  { id: 25, x: 16, y: 30, name: "Point 25", row: 5 },
  
  // Row 6 (y=17%): Points 26-30 (left to right)
  { id: 26, x: 16, y: 15, name: "Point 26", row: 6 },
  { id: 27, x: 33, y: 15, name: "Point 27", row: 6 },
  { id: 28, x: 50, y: 15, name: "Point 28", row: 6 },
  { id: 29, x: 67, y: 15, name: "Point 29", row: 6 },
  { id: 30, x: 84, y: 15, name: "Point 30", row: 6 },
  
  // Row 7 (top, y=5%): Points 31-35 (right to left)
  { id: 31, x: 84, y: 4, name: "Point 31", row: 7 },
  { id: 32, x: 67, y: 4, name: "Point 32", row: 7 },
  { id: 33, x: 50, y: 4, name: "Point 33", row: 7 },
  { id: 34, x: 33, y: 4, name: "Point 34", row: 7 },
  { id: 35, x: 16, y: 4, name: "Point 35", row: 7 },
];

// 47-Point Template: 9 rows with special goal crease and center ice points
const points47: MeasurementPoint[] = [
  // Row 1 (bottom, y=90%): Points 1-8 (right to left)
  { id: 1, x: 85, y: 88, name: "Point 1", row: 1 },
  { id: 2, x: 71, y: 88, name: "Point 2", row: 1 },
  { id: 3, x: 58, y: 88, name: "Point 3", row: 1 },
  { id: 4, x: 53, y: 91, name: "Point 4", row: 1, isSpecial: true, specialLabel: "Back of Goal Crease" },
  { id: 5, x: 50, y: 85, name: "Point 5", row: 1, isSpecial: true, specialLabel: "Top of Goal Crease" },
  { id: 6, x: 42, y: 88, name: "Point 6", row: 1 },
  { id: 7, x: 29, y: 88, name: "Point 7", row: 1 },
  { id: 8, x: 15, y: 88, name: "Point 8", row: 1 },
  
  // Row 2 (y=78%): Points 9-13 (left to right)
  { id: 9, x: 15, y: 77, name: "Point 9", row: 2 },
  { id: 10, x: 32, y: 77, name: "Point 10", row: 2 },
  { id: 11, x: 50, y: 77, name: "Point 11", row: 2 },
  { id: 12, x: 68, y: 77, name: "Point 12", row: 2 },
  { id: 13, x: 85, y: 77, name: "Point 13", row: 2 },
  
  // Row 3 (y=66%): Points 14-18 (right to left)
  { id: 14, x: 85, y: 66, name: "Point 14", row: 3 },
  { id: 15, x: 68, y: 66, name: "Point 15", row: 3 },
  { id: 16, x: 50, y: 66, name: "Point 16", row: 3 },
  { id: 17, x: 32, y: 66, name: "Point 17", row: 3 },
  { id: 18, x: 15, y: 66, name: "Point 18", row: 3 },
  
  // Row 4 (y=54%): Points 19-23 (left to right)
  { id: 19, x: 15, y: 55, name: "Point 19", row: 4 },
  { id: 20, x: 32, y: 55, name: "Point 20", row: 4 },
  { id: 21, x: 50, y: 55, name: "Point 21", row: 4 },
  { id: 22, x: 68, y: 55, name: "Point 22", row: 4 },
  { id: 23, x: 85, y: 55, name: "Point 23", row: 4 },
  
  // Row 5 (y=50%): Point 24 - Center Ice (special)
  { id: 24, x: 50, y: 50, name: "Point 24", row: 5, isSpecial: true, specialLabel: "Center Ice" },
  
  // Row 6 (y=46%): Points 25-29 (left to right)
  { id: 25, x: 15, y: 45, name: "Point 25", row: 6 },
  { id: 26, x: 32, y: 45, name: "Point 26", row: 6 },
  { id: 27, x: 50, y: 45, name: "Point 27", row: 6 },
  { id: 28, x: 68, y: 45, name: "Point 28", row: 6 },
  { id: 29, x: 85, y: 45, name: "Point 29", row: 6 },
  
  // Row 7 (y=34%): Points 30-34 (right to left)
  { id: 30, x: 85, y: 34, name: "Point 30", row: 7 },
  { id: 31, x: 68, y: 34, name: "Point 31", row: 7 },
  { id: 32, x: 50, y: 34, name: "Point 32", row: 7 },
  { id: 33, x: 32, y: 34, name: "Point 33", row: 7 },
  { id: 34, x: 15, y: 34, name: "Point 34", row: 7 },
  
  // Row 8 (y=22%): Points 35-39 (left to right)
  { id: 35, x: 15, y: 23, name: "Point 35", row: 8 },
  { id: 36, x: 32, y: 23, name: "Point 36", row: 8 },
  { id: 37, x: 50, y: 23, name: "Point 37", row: 8 },
  { id: 38, x: 68, y: 23, name: "Point 38", row: 8 },
  { id: 39, x: 85, y: 23, name: "Point 39", row: 8 },
  
  // Row 9 (top, y=10%): Points 40-47 (right to left)
  { id: 40, x: 85, y: 12, name: "Point 40", row: 9 },
  { id: 41, x: 71, y: 12, name: "Point 41", row: 9 },
  { id: 42, x: 58, y: 12, name: "Point 42", row: 9 },
  { id: 43, x: 53, y: 9, name: "Point 43", row: 9, isSpecial: true, specialLabel: "Back of Goal Crease" },
  { id: 44, x: 50, y: 15, name: "Point 44", row: 9, isSpecial: true, specialLabel: "Top of Goal Crease" },
  { id: 45, x: 42, y: 12, name: "Point 45", row: 9 },
  { id: 46, x: 29, y: 12, name: "Point 46", row: 9 },
  { id: 47, x: 15, y: 12, name: "Point 47", row: 9 },
];

// Custom Template: Empty array for user-defined patterns
const pointsCustom: MeasurementPoint[] = [];

export const measurementPoints: Record<string, MeasurementPoint[]> = {
  "24-point": points24,
  "35-point": points35,
  "47-point": points47,
  "custom": pointsCustom,
};

export const getPointCount = (templateType: string): number => {
  return measurementPoints[templateType]?.length || 24;
};
