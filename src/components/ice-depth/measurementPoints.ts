export interface MeasurementPoint {
  id: number;
  x: number; // Percentage (0-100)
  y: number; // Percentage (0-100)
  name: string;
  row: number;
  isSpecial?: boolean;
  specialLabel?: string;
}

// 25-Point Template (updated with accurate coordinates)
const points25: MeasurementPoint[] = [
  { id: 1, x: 84.47, y: 97.67, name: "Point 1", row: 1 },
  { id: 2, x: 50.21, y: 97.32, name: "Point 2", row: 1 },
  { id: 3, x: 18.32, y: 97.32, name: "Point 3", row: 1 },
  { id: 4, x: 17.75, y: 84.94, name: "Point 4", row: 1 },
  { id: 5, x: 49.88, y: 84.77, name: "Point 5", row: 1 },
  { id: 6, x: 83.98, y: 84.48, name: "Point 6", row: 1 },
  { id: 7, x: 66.06, y: 76.23, name: "Point 7", row: 1 },
  { id: 8, x: 35.41, y: 76.63, name: "Point 8", row: 1 },
  { id: 9, x: 25.88, y: 68.96, name: "Point 9", row: 1 },
  { id: 10, x: 50.12, y: 68.85, name: "Point 10", row: 1 },
  { id: 11, x: 77.65, y: 68.85, name: "Point 11", row: 1 },
  { id: 12, x: 84.31, y: 49.85, name: "Point 12", row: 1 },
  { id: 13, x: 50.37, y: 49.79, name: "Point 13", row: 1 },
  { id: 14, x: 17.42, y: 49.85, name: "Point 14", row: 1 },
  { id: 15, x: 77.57, y: 31.66, name: "Point 15", row: 1 },
  { id: 16, x: 49.96, y: 31.61, name: "Point 16", row: 1 },
  { id: 17, x: 24.82, y: 31.55, name: "Point 17", row: 1 },
  { id: 18, x: 34.84, y: 22.02, name: "Point 18", row: 1 },
  { id: 19, x: 65.74, y: 22.14, name: "Point 19", row: 1 },
  { id: 20, x: 84.31, y: 15.05, name: "Point 20", row: 1 },
  { id: 21, x: 50.12, y: 14.87, name: "Point 21", row: 1 },
  { id: 22, x: 17.67, y: 14.93, name: "Point 22", row: 1 },
  { id: 23, x: 24.9, y: 2.61, name: "Point 23", row: 1 },
  { id: 24, x: 50.37, y: 2.73, name: "Point 24", row: 1 },
  { id: 25, x: 77.57, y: 2.67, name: "Point 25", row: 1 },
];

// 35-Point Template (updated with accurate coordinates)
const points35: MeasurementPoint[] = [
  { id: 1, x: 84.47, y: 97.55, name: "Point 1", row: 1 },
  { id: 2, x: 68.94, y: 97.43, name: "Point 2", row: 1 },
  { id: 3, x: 49.96, y: 97.55, name: "Point 3", row: 1 },
  { id: 4, x: 31.14, y: 97.49, name: "Point 4", row: 1 },
  { id: 5, x: 18.16, y: 97.38, name: "Point 5", row: 1 },
  { id: 6, x: 17.5, y: 85, name: "Point 6", row: 1 },
  { id: 7, x: 31.22, y: 84.59, name: "Point 7", row: 1 },
  { id: 8, x: 50.62, y: 84.59, name: "Point 8", row: 1 },
  { id: 9, x: 69.02, y: 84.54, name: "Point 9", row: 1 },
  { id: 10, x: 84.22, y: 84.59, name: "Point 10", row: 1 },
  { id: 11, x: 84.31, y: 68.73, name: "Point 11", row: 1 },
  { id: 12, x: 68.86, y: 68.62, name: "Point 12", row: 1 },
  { id: 13, x: 49.79, y: 68.67, name: "Point 13", row: 1 },
  { id: 14, x: 30.81, y: 68.44, name: "Point 14", row: 1 },
  { id: 15, x: 18.16, y: 68.44, name: "Point 15", row: 1 },
  { id: 16, x: 17.09, y: 50.08, name: "Point 16", row: 1 },
  { id: 17, x: 30.9, y: 49.91, name: "Point 17", row: 1 },
  { id: 18, x: 49.96, y: 49.97, name: "Point 18", row: 1 },
  { id: 19, x: 69.1, y: 50.08, name: "Point 19", row: 1 },
  { id: 20, x: 84.47, y: 49.97, name: "Point 20", row: 1 },
  { id: 21, x: 84.06, y: 31.61, name: "Point 21", row: 1 },
  { id: 22, x: 68.69, y: 31.49, name: "Point 22", row: 1 },
  { id: 23, x: 50.04, y: 31.72, name: "Point 23", row: 1 },
  { id: 24, x: 30.98, y: 31.55, name: "Point 24", row: 1 },
  { id: 25, x: 17.83, y: 31.43, name: "Point 25", row: 1 },
  { id: 26, x: 18.57, y: 15.4, name: "Point 26", row: 1 },
  { id: 27, x: 30.81, y: 15.34, name: "Point 27", row: 1 },
  { id: 28, x: 49.88, y: 14.93, name: "Point 28", row: 1 },
  { id: 29, x: 68.69, y: 15.22, name: "Point 29", row: 1 },
  { id: 30, x: 84.14, y: 14.76, name: "Point 30", row: 1 },
  { id: 31, x: 84.06, y: 2.61, name: "Point 31", row: 1 },
  { id: 32, x: 69.27, y: 2.79, name: "Point 32", row: 1 },
  { id: 33, x: 49.96, y: 2.73, name: "Point 33", row: 1 },
  { id: 34, x: 33.11, y: 2.61, name: "Point 34", row: 1 },
  { id: 35, x: 18.41, y: 2.79, name: "Point 35", row: 1 },
];

// 47-Point Template (updated with accurate coordinates)
const points47: MeasurementPoint[] = [
  { id: 1, x: 84.63, y: 97.61, name: "Point 1", row: 1 },
  { id: 2, x: 68.94, y: 97.49, name: "Point 2", row: 1 },
  { id: 3, x: 55.46, y: 97.2, name: "Point 3", row: 1 },
  { id: 4, x: 49.63, y: 93.95, name: "Point 4", row: 1, isSpecial: true, specialLabel: "Back of Goal Crease" },
  { id: 5, x: 49.88, y: 98.13, name: "Point 5", row: 1, isSpecial: true, specialLabel: "Top of Goal Crease" },
  { id: 6, x: 45.11, y: 97.2, name: "Point 6", row: 1 },
  { id: 7, x: 29.75, y: 97.38, name: "Point 7", row: 1 },
  { id: 8, x: 18, y: 97.61, name: "Point 8", row: 1 },
  { id: 9, x: 17.26, y: 85.35, name: "Point 9", row: 2 },
  { id: 10, x: 30.4, y: 84.65, name: "Point 10", row: 2 },
  { id: 11, x: 50.45, y: 84.77, name: "Point 11", row: 2 },
  { id: 12, x: 69.35, y: 85, name: "Point 12", row: 2 },
  { id: 13, x: 84.55, y: 84.83, name: "Point 13", row: 2 },
  { id: 14, x: 84.47, y: 73.32, name: "Point 14", row: 3 },
  { id: 15, x: 68.78, y: 73.44, name: "Point 15", row: 3 },
  { id: 16, x: 51.19, y: 73.55, name: "Point 16", row: 3 },
  { id: 17, x: 30.48, y: 73.44, name: "Point 17", row: 3 },
  { id: 18, x: 17.91, y: 73.5, name: "Point 18", row: 3 },
  { id: 19, x: 17.83, y: 60.95, name: "Point 19", row: 4 },
  { id: 20, x: 30.65, y: 61, name: "Point 20", row: 4 },
  { id: 21, x: 50.94, y: 61.18, name: "Point 21", row: 4 },
  { id: 22, x: 69.19, y: 61, name: "Point 22", row: 4 },
  { id: 23, x: 84.06, y: 60.95, name: "Point 23", row: 4 },
  { id: 24, x: 50.94, y: 49.97, name: "Point 24", row: 5, isSpecial: true, specialLabel: "Center Ice" },
  { id: 25, x: 84.55, y: 41.6, name: "Point 25", row: 6 },
  { id: 26, x: 68.61, y: 41.25, name: "Point 26", row: 6 },
  { id: 27, x: 51.03, y: 41.25, name: "Point 27", row: 6 },
  { id: 28, x: 30.98, y: 41.31, name: "Point 28", row: 6 },
  { id: 29, x: 17.34, y: 41.25, name: "Point 29", row: 6 },
  { id: 30, x: 17.67, y: 28.99, name: "Point 30", row: 7 },
  { id: 31, x: 31.39, y: 28.41, name: "Point 31", row: 7 },
  { id: 32, x: 50.94, y: 28.35, name: "Point 32", row: 7 },
  { id: 33, x: 69.27, y: 28.7, name: "Point 33", row: 7 },
  { id: 34, x: 84.55, y: 28.7, name: "Point 34", row: 7 },
  { id: 35, x: 84.72, y: 15.11, name: "Point 35", row: 8 },
  { id: 36, x: 68.69, y: 15.22, name: "Point 36", row: 8 },
  { id: 37, x: 51.19, y: 15.05, name: "Point 37", row: 8 },
  { id: 38, x: 31.06, y: 15.28, name: "Point 38", row: 8 },
  { id: 39, x: 17.67, y: 15.11, name: "Point 39", row: 8 },
  { id: 40, x: 18.73, y: 2.73, name: "Point 40", row: 9 },
  { id: 41, x: 33.03, y: 2.73, name: "Point 41", row: 9 },
  { id: 42, x: 45.28, y: 2.85, name: "Point 42", row: 9 },
  { id: 43, x: 50.04, y: 5.93, name: "Point 43", row: 9, isSpecial: true, specialLabel: "Back of Goal Crease" },
  { id: 44, x: 50.37, y: 0.99, name: "Point 44", row: 9, isSpecial: true, specialLabel: "Top of Goal Crease" },
  { id: 45, x: 55.46, y: 3.02, name: "Point 45", row: 9 },
  { id: 46, x: 69.1, y: 2.67, name: "Point 46", row: 9 },
  { id: 47, x: 84.63, y: 2.61, name: "Point 47", row: 9 },
];

// Custom Template: Empty array for user-defined patterns
const pointsCustom: MeasurementPoint[] = [];

export const measurementPoints: Record<string, MeasurementPoint[]> = {
  "25-point": points25,
  "35-point": points35,
  "47-point": points47,
  "custom": pointsCustom,
};

export const getPointCount = (templateType: string): number => {
  return measurementPoints[templateType]?.length || 25;
};
