
## Add Complete Circle Check Items for Gas and Electric Machines

### Overview
Update the Circle Check form to display the appropriate checklist items based on the selected machine's fuel type. Gas and electric ice resurfacers have different components requiring inspection, so the checklist will dynamically change when a machine is selected.

### Data Extracted from Uploaded Documents

**Electric Machine Check Items (41 items + 6 optional):**
- General: Auger Systems, Towel, Squeegee, Ice Making Water, Wash Water, Board Brush, Belts and Hoses, Grease Vertical Auger Bearings, Drain Water Tanks, Under/Around/Behind resurfacer, Snow Pit/Dumping Area, Consumables, Building Ventilation
- Detail: Head Lights/Tail Light, Hour Meter Reading, Battery Gauge, Wash Water Fill, Blade Adjustment Wheel, Ice Making Water, Blade and Runner Condition, Flood Pipe, Towel and Squeegee, Snow Breaker, Snow Tank Inspection, Body Condition and Safety Labels, Poly Water Tank, Vertical Auger Movement, Tank Up/Safety Stand, Steering Wheel/Horn, Control Levers, Key Security, Wash Water Valves, Seat/Armrest, Foot and Brake Pedal, Conditioner/Lift Arm/Bushings, Safety Guards, Horizontal Auger, Step Areas, Tires/Hubs/Studs/Nuts, Board Brush/Arm Bushing, Guide Wheel, Snow Tank Seal, U-Joints, Hydraulic Hoses/Couplers, Leaf Springs, Conveyor Drive Belt and Chain, Wash Water Pump, Brake Lines, Hydraulic Oil Level, Brake Fluid, Blade Bar, Conditioner Leaf Springs, Auger Flighting, Battery/Cables
- Optional: Fire Extinguisher, Beacon Light, Backup Alarm, Tire Wash Water, Seatbelt, Other Optional Equipment

**Gas Machine Check Items (51 items + 6 optional):**
- General: Same as electric PLUS Fuel Supply assessment, Oil and Filters monitoring, Fuel Supply shutoff reminder
- Detail: Tank Up/Safety Stand, Key Security, Exhaust System, Fuel Line, Fuel Levels/Connections/Hoses/Tanks, Belts, Snow Tank Seal, Hydraulic Hoses/Couplers, Battery/Cables, Spark Plugs, Radiator/Hoses, Air Filter, Leaf Springs, Brake Lines, Fluid Levels, Hydraulic Bypass, U-Joints, Tires/Hubs/Studs/Nuts, Board Brush/Arm Bushing, Guide Wheel, Head Lights/Tail Light, Vertical Auger Movement, Blade and Runner Condition, Conditioner/Lift Arm/Bushings, Snow Breaker, Blade Adjustment Wheel, Towel and Squeegee, Flood Pipe, Horizontal Auger, Gauges/Steering Wheel/Horn, Blade Bar, Conditioner Leaf Springs, Auger Flighting, Hour Meter, Voltmeter, Temperature, Tachometer, Water Fill, Seat/Armrest, Poly Water Tank, Snow Tank Inspection, Brake/Brake Pedal, Ice Making Water/Wash Water Valves, Step Areas, Control Levers, Wash Water Pump, Conveyor Drive Belt and Chain, Body Condition and Safety Labels, Hydraulic Oil Level, Hydraulic Oil Filter
- Optional: Exhaust Shield (Canadian), Fire Extinguisher, Beacon Light, Backup Alarm, Tire Wash Water, Seatbelt

### Implementation Changes

**File: `src/components/maintenance/CircleCheckForm.tsx`**

1. **Create organized checklist data structures**
   - Replace the simple `defaultCheckItems` array with categorized sections for both gas and electric machines
   - Group items into logical categories: General Inspection, Operator Controls, Safety Systems, Auger/Conveyor, Conditioner/Blade, Hydraulics/Fluids, Tires/Suspension, Water Systems, Engine/Power (gas-specific), Optional Equipment

2. **Add machine type detection**
   - When a machine is selected, read its `fuel_type` property from the machines array
   - Dynamically update the displayed checklist items based on the fuel type

3. **Update state management**
   - Modify `checkItems` state to initialize based on the selected machine's fuel type
   - Reset checklist state when machine selection changes

4. **Update UI to show sections**
   - Group checklist items into collapsible sections for better organization
   - Add section headers with completion progress indicators
   - Keep the existing pass/fail toggle with notes functionality

### Checklist Organization Structure

```text
Gas Machine Sections:
├── General Pre-Inspection (6 items)
├── Safety & Security (5 items)
├── Engine & Fuel System (10 items)
├── Operator Station (8 items)
├── Auger & Conveyor System (6 items)
├── Conditioner & Blade (6 items)
├── Hydraulic System (5 items)
├── Tires & Suspension (5 items)
├── Water Systems (5 items)
└── Optional Equipment (6 items)

Electric Machine Sections:
├── General Pre-Inspection (6 items)
├── Safety & Security (5 items)
├── Electrical System (3 items)
├── Operator Station (8 items)
├── Auger & Conveyor System (6 items)
├── Conditioner & Blade (6 items)
├── Hydraulic System (5 items)
├── Tires & Suspension (5 items)
├── Water Systems (5 items)
└── Optional Equipment (6 items)
```

### User Experience Flow
1. User selects a machine from the dropdown
2. Form detects the machine's fuel type (gas or electric)
3. Appropriate checklist sections expand with all items defaulting to "Pass"
4. User toggles items to "Fail" as needed and adds notes
5. Section headers show completion progress (e.g., "5/6 passed")
6. Submit saves all check items to the database

### Technical Details

**New data structure:**
```typescript
interface CheckSection {
  id: string;
  title: string;
  items: string[];
}

const GAS_CHECK_SECTIONS: CheckSection[] = [...];
const ELECTRIC_CHECK_SECTIONS: CheckSection[] = [...];
```

**State updates:**
- Track selected machine's fuel type
- Initialize check items based on fuel type when machine changes
- Use collapsible Accordion for sections
