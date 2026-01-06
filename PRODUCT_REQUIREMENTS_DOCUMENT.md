# Rink Zenith Reports - Product Requirements Document (PRD)

## Executive Summary

**Product Name:** Rink Zenith Reports
**Domain:** Ice Rink Facility Management
**Type:** Web-based SaaS Application
**Purpose:** Comprehensive operational management platform for ice skating facilities

Rink Zenith Reports is an enterprise-grade facility management system designed specifically for ice rinks. It centralizes critical operations including ice maintenance tracking, refrigeration monitoring, air quality compliance, staff scheduling, incident reporting, and daily operations management. The platform serves facility managers, maintenance staff, administrators, and operators with role-based access controls and multi-tenant architecture.

---

## Technology Stack

### Frontend
- **Framework:** React 18.3.1 with TypeScript 5.8.3
- **Build Tool:** Vite 5.4.19
- **Styling:**
  - Tailwind CSS 3.4.17
  - shadcn-ui component library (Radix UI primitives)
  - Custom CSS animations and theming
- **Routing:** React Router v6.30.1
- **State Management:**
  - TanStack React Query v5.83.0 (server state)
  - React Hook Form v7.61.1 (form state)
- **UI Components:**
  - Radix UI primitives (accessible, headless components)
  - Lucide React v0.462.0 (icon library)
  - shadcn-ui pre-built components
- **Data Visualization:** Recharts v2.15.4
- **Form Validation:** Zod v3.25.76
- **Drag & Drop:** @dnd-kit (core, sortable, utilities)
- **Notifications:** Sonner v1.7.4
- **PDF Export:** html2pdf.js v0.12.1
- **Theme Management:** next-themes v0.3.0
- **Date Handling:** date-fns v3.6.0

### Backend & Infrastructure
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Supabase Auth (email/password)
- **Real-time:** Supabase Realtime subscriptions
- **API:** Supabase REST API with auto-generated TypeScript types
- **Security:** Row Level Security (RLS) policies on all tables
- **Storage:** Supabase Storage for documents and PDFs
- **Edge Functions:** Supabase Edge Functions (Deno runtime)

### Development Tools
- **Linting:** ESLint v9.32.0 with TypeScript support
- **Package Manager:** npm/bun
- **Type Safety:** Strict TypeScript configuration
- **Code Quality:** TypeScript ESLint v8.38.0

---

## User Roles & Permissions

### 1. Admin Role (`admin`)
**Capabilities:**
- Full system access across all modules
- User management (create, edit, delete users)
- Facility management (create and configure facilities)
- Module configuration (enable/disable features per facility)
- Form builder access (custom form creation and templates)
- Audit log viewing and system monitoring
- Billing and subscription management
- All data read/write permissions

**Use Cases:**
- System configuration and setup
- Team member onboarding
- Security and compliance oversight
- Custom workflow configuration

### 2. Manager Role (`manager`)
**Capabilities:**
- Facility operations management
- Staff scheduling (create, modify, approve shifts)
- Report review and approval (daily reports, incidents)
- Form template customization
- Analytics and reporting access
- Staff time-off and shift swap approvals
- Module-level data access (based on permissions)

**Use Cases:**
- Day-to-day operations oversight
- Schedule optimization
- Incident review and follow-up
- Performance monitoring

### 3. Staff Role (`staff`)
**Capabilities:**
- Data entry for assigned modules (logs, measurements, reports)
- View personal schedule
- Request time-off and shift swaps
- Submit incident reports
- View and respond to shift assignments
- Edit own submitted data (within time windows)

**Use Cases:**
- Daily operational logging
- Ice maintenance tracking
- Incident documentation
- Schedule management

### 4. Account Owner (Special Role)
**Capabilities:**
- All Admin capabilities
- Billing and subscription changes
- Account-level settings
- Team member invitations
- Payment method management

**Use Cases:**
- Financial management
- Account administration
- Subscription upgrades/downgrades

---

## Module-Level Permissions

Each user can be granted access to specific modules:

1. **Ice Depth Log** - Ice thickness measurement tracking
2. **Ice Maintenance Log** - Resurfacing and equipment maintenance
3. **Refrigeration Log** - Compressor and cooling system monitoring
4. **Air Quality Log** - CO/NO2 monitoring and compliance
5. **Employee Scheduling** - Staff scheduling and time management
6. **Incident Reports** - Safety and injury documentation
7. **Daily Reports** - Shift-based operational reporting
8. **Communications Log** - Inter-staff communication (future module)
9. **Safety & Compliance** - Regulatory compliance tracking (future module)

---

## Core Features & Modules

## 1. Ice Depth Log Module

### Purpose
Track ice surface thickness measurements using standardized or custom measurement templates to ensure optimal ice quality and safety.

### Key Features

#### A. Measurement Templates
- **Standard Templates:**
  - 24-point template (USA Hockey standard)
  - 35-point template (expanded coverage)
  - 46-point template (comprehensive analysis)
  - USA Hockey Official template (regulation layout)

- **Custom Templates:**
  - Up to 8 custom templates per facility/rink
  - Visual point placement via interactive diagram
  - Template library with save/load functionality
  - Import/export (JSON, CSV, TypeScript formats)
  - Template calibration and validation

#### B. Interactive Rink Diagram
- **Visual Components:**
  - SVG-based hockey rink with regulation markings
  - Goal creases, blue lines, red line, face-off circles
  - Center ice logo support
  - Real ice surface photo background option

- **Measurement Points:**
  - Clickable point-based data entry
  - Color-coded by depth (red/yellow/green/blue scale)
  - Real-time depth visualization
  - Point state indicators (current, complete, available)
  - Auto-advance to next point on entry

- **Admin Development Mode:**
  - Click-to-place custom measurement points
  - Coordinate capture with percentage-based positioning
  - Visual point editing and repositioning
  - Multi-format export (JSON, CSV, TypeScript)

#### C. Bluetooth Caliper Integration
- **Hardware Support:**
  - Direct Bluetooth connectivity to digital calipers
  - Automatic measurement capture on trigger press
  - Auto-advance to next measurement point
  - Real-time data streaming

- **Workflow:**
  - One-click device connection
  - Automatic point progression
  - Manual override capability
  - Connection status monitoring

#### D. Statistical Analysis
- **Calculations:**
  - Minimum depth (with location)
  - Maximum depth (with location)
  - Average depth across all points
  - Standard deviation
  - Variance analysis

- **Quality Indicators:**
  - Overall status: Good, Warning, Critical
  - Threshold-based alerts
  - Trend analysis over time

#### E. AI-Powered Analysis
- **Features:**
  - Ice quality assessment
  - Surface uniformity analysis
  - Maintenance recommendations
  - Pattern recognition (e.g., high traffic areas)
  - Predictive maintenance suggestions

#### F. Historical Tracking
- **Trend Charts:**
  - Time-series depth visualization
  - Multi-point comparison
  - Date range filtering
  - Export to PDF with charts

- **Comparison Tools:**
  - Before/after resurfacing analysis
  - Session-to-session tracking
  - Seasonal trend analysis

#### G. Reporting & Export
- **PDF Export:**
  - Comprehensive ice depth report
  - Visual rink diagram with measurements
  - Statistical summary
  - AI analysis results
  - Trend charts and graphs
  - Timestamp and operator information

- **Email Distribution:**
  - Send reports to stakeholders
  - Scheduled report generation
  - Automated compliance reporting

### Technical Implementation

#### Measurement Storage
```typescript
// Database table: ice_depth_measurements
{
  id: UUID,
  facility_id: UUID,
  rink_id: UUID,
  operator_id: UUID,
  measurement_date: TIMESTAMP,
  template_type: STRING, // "24-point", "35-point", "47-point", "custom", etc.
  unit: STRING, // "in" or "mm"
  measurements: JSONB, // { "Point 1": 25.4, "Point 2": 26.1, ... }
  statistics: JSONB, // { min, max, avg, stdDev }
  ai_analysis: JSONB, // { quality_score, recommendations, ... }
  status: STRING, // "good", "warning", "critical"
  notes: TEXT,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
}
```

#### Custom Template Storage
```typescript
// Database table: custom_ice_templates
{
  id: UUID,
  facility_id: UUID,
  rink_id: UUID,
  template_name: STRING,
  point_count: INTEGER,
  template_data: JSONB, // { points: [{ id, x, y, name, row }] }
  is_active: BOOLEAN,
  created_by: UUID,
  created_at: TIMESTAMP
}
```

#### Rink Diagram SVG Code

**Base Rink SVG (400x850px, Portrait Orientation):**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 850" width="400" height="850">
  <defs>
    <linearGradient id="creaseGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#b3d9ff;stop-opacity:0.6"/>
      <stop offset="100%" style="stop-color:#87ceeb;stop-opacity:0.4"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="400" height="850" fill="#f8fafc"/>

  <!-- Ice surface with rounded corners (boards) -->
  <rect x="10" y="10" width="380" height="830" rx="56" ry="56" fill="#e8f4fc" stroke="#1a365d" stroke-width="4"/>

  <!-- Center red line -->
  <line x1="10" y1="425" x2="390" y2="425" stroke="#c53030" stroke-width="12"/>

  <!-- Blue lines -->
  <line x1="10" y1="285" x2="390" y2="285" stroke="#2b6cb0" stroke-width="10"/>
  <line x1="10" y1="565" x2="390" y2="565" stroke="#2b6cb0" stroke-width="10"/>

  <!-- Goal lines -->
  <path d="M 45 70 L 355 70" stroke="#c53030" stroke-width="4" stroke-linecap="round"/>
  <path d="M 45 780 L 355 780" stroke="#c53030" stroke-width="4" stroke-linecap="round"/>

  <!-- Top goal crease -->
  <path d="M 165 70 L 165 100 Q 165 115, 200 115 Q 235 115, 235 100 L 235 70 Z"
        fill="url(#creaseGradient)" stroke="#c53030" stroke-width="2"/>
  <path d="M 165 100 Q 200 140, 235 100" fill="none" stroke="#c53030" stroke-width="2"/>

  <!-- Bottom goal crease -->
  <path d="M 165 780 L 165 750 Q 165 735, 200 735 Q 235 735, 235 750 L 235 780 Z"
        fill="url(#creaseGradient)" stroke="#c53030" stroke-width="2"/>
  <path d="M 165 750 Q 200 710, 235 750" fill="none" stroke="#c53030" stroke-width="2"/>

  <!-- Center ice circle -->
  <circle cx="200" cy="425" r="50" fill="none" stroke="#2b6cb0" stroke-width="3"/>
  <circle cx="200" cy="425" r="6" fill="#2b6cb0"/>

  <!-- Face-off circles (4 total) -->
  <!-- Top left -->
  <circle cx="110" cy="160" r="50" fill="none" stroke="#c53030" stroke-width="2"/>
  <circle cx="110" cy="160" r="6" fill="#c53030"/>

  <!-- Top right -->
  <circle cx="290" cy="160" r="50" fill="none" stroke="#c53030" stroke-width="2"/>
  <circle cx="290" cy="160" r="6" fill="#c53030"/>

  <!-- Bottom left -->
  <circle cx="110" cy="690" r="50" fill="none" stroke="#c53030" stroke-width="2"/>
  <circle cx="110" cy="690" r="6" fill="#c53030"/>

  <!-- Bottom right -->
  <circle cx="290" cy="690" r="50" fill="none" stroke="#c53030" stroke-width="2"/>
  <circle cx="290" cy="690" r="6" fill="#c53030"/>

  <!-- Neutral zone face-off dots (4 total) -->
  <circle cx="110" cy="335" r="6" fill="#c53030"/>
  <circle cx="290" cy="335" r="6" fill="#c53030"/>
  <circle cx="110" cy="515" r="6" fill="#c53030"/>
  <circle cx="290" cy="515" r="6" fill="#c53030"/>
</svg>
```

**React Component for Interactive Rink (Simplified):**

```typescript
interface USAHockeyRinkProps {
  showPoints?: boolean;
  points?: Array<{ id: number; x: number; y: number }>;
  measurements?: Record<string, number>;
  currentPointId?: number;
  onPointClick?: (pointId: number) => void;
  onMeasurementChange?: (pointId: number, value: number) => void;
  unit?: "in" | "mm";
}

const USAHockeyRink: React.FC<USAHockeyRinkProps> = ({
  showPoints = false,
  points = [],
  measurements = {},
  currentPointId,
  onPointClick,
  onMeasurementChange,
  unit = "mm",
}) => {
  // Scale: 1 foot = 4 units
  const scale = 4;
  const rinkLength = 200 * scale; // 200 feet
  const rinkWidth = 85 * scale;   // 85 feet
  const cornerRadius = 28 * scale;

  // Key measurements
  const goalLineFromBoards = 11 * scale;
  const blueLineFromGoal = 64 * scale;
  const centerX = rinkLength / 2;
  const centerY = rinkWidth / 2;

  // Colors
  const redLine = '#c8102e';
  const blueLine = '#003087';
  const creaseBlue = '#a8d4f0';

  // Calculated positions
  const leftGoalLine = goalLineFromBoards;
  const rightGoalLine = rinkLength - goalLineFromBoards;
  const leftBlueLine = goalLineFromBoards + blueLineFromGoal;
  const rightBlueLine = rinkLength - goalLineFromBoards - blueLineFromGoal;

  return (
    <svg
      viewBox={`-10 -10 ${rinkWidth + 20} ${rinkLength + 20}`}
      className="w-full h-auto"
    >
      <g transform={`rotate(90, ${rinkWidth / 2}, ${rinkWidth / 2})`}>
        {/* Ice surface */}
        <path d={rinkPath} fill="url(#iceGradient)" />

        {/* Goal lines */}
        <line x1={leftGoalLine} y1="0" x2={leftGoalLine} y2={rinkWidth}
              stroke={redLine} strokeWidth="2" />

        {/* Blue lines */}
        <rect x={leftBlueLine} y="0" width="4" height={rinkWidth} fill={blueLine} />

        {/* Center red line */}
        <rect x={centerX - 2} y="0" width="4" height={rinkWidth} fill={redLine} />

        {/* Measurement points overlay */}
        {showPoints && points.map((point) => {
          const measurementKey = `Point ${point.id}`;
          const depth = measurements[measurementKey];
          const svgX = (point.x / 100) * rinkLength;
          const svgY = (point.y / 100) * rinkWidth;

          return (
            <g key={point.id} onClick={() => onPointClick?.(point.id)}>
              <circle
                cx={svgX}
                cy={svgY}
                r="14"
                fill={depth ? getDepthColor(depth) : "#374151"}
              />
              <text
                x={svgX}
                y={svgY}
                textAnchor="middle"
                fill="#fff"
                fontSize="9"
                transform={`rotate(-90, ${svgX}, ${svgY})`}
              >
                {depth ? displayValue(depth) : point.id}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
};
```

### User Workflows

**Standard Measurement Workflow:**
1. Staff navigates to Ice Depth Log
2. Selects rink and measurement template
3. Optional: Connects Bluetooth caliper
4. Clicks measurement points on diagram (or uses auto-capture)
5. System calculates statistics in real-time
6. AI analysis displays recommendations
7. Staff adds notes and submits
8. PDF export and/or email distribution

**Custom Template Creation (Admin):**
1. Admin enters development mode
2. Selects base template or starts blank
3. Clicks diagram to place measurement points
4. Reviews and adjusts point positions
5. Names and saves template
6. Template becomes available facility-wide

---

## 2. Ice Maintenance Module

### Purpose
Track all ice resurfacing activities, equipment maintenance, blade changes, and quality checks to ensure optimal ice conditions.

### Key Features

#### A. Maintenance Types
1. **Resurfacing Logs**
   - Ice machine/Zamboni usage tracking
   - Pre/post resurfacing ice conditions
   - Operator assignment
   - Duration tracking
   - Water temperature and quality notes

2. **Blade Changes**
   - Blade replacement tracking
   - Blade condition assessment
   - Equipment downtime logs
   - Part inventory management

3. **Edging Operations**
   - Perimeter edging tracking
   - Equipment used
   - Condition assessment

4. **Circle Checks**
   - Quality validation checklists
   - Multi-point inspection forms
   - Pass/fail criteria
   - Corrective action tracking

#### B. Equipment Configuration
- **Machine Profiles:**
  - Zamboni/ice resurfacer inventory
  - Equipment specifications
  - Maintenance schedules
  - Usage hours tracking
  - Service history

- **Blade Inventory:**
  - Blade type and size
  - Installation date
  - Expected lifespan
  - Replacement alerts

#### C. Activity Feed
- **Timeline View:**
  - Chronological maintenance history
  - Filter by type, machine, operator
  - Search functionality
  - Export to CSV/PDF

- **Statistics Dashboard:**
  - Resurfacing frequency
  - Average session duration
  - Equipment utilization rates
  - Maintenance cost tracking

#### D. Custom Form Fields
- **Facility-Specific Fields:**
  - Admin-configurable form sections
  - Custom data capture
  - Conditional field logic
  - Validation rules

### Data Model

```typescript
// Database table: ice_maintenance_logs
{
  id: UUID,
  facility_id: UUID,
  rink_id: UUID,
  maintenance_type: STRING, // "resurfacing", "blade_change", "edging", "circle_check"
  machine_id: UUID,
  operator_id: UUID,
  start_time: TIMESTAMP,
  end_time: TIMESTAMP,
  duration_minutes: INTEGER,
  pre_conditions: JSONB,
  post_conditions: JSONB,
  water_temp_f: DECIMAL,
  notes: TEXT,
  custom_fields: JSONB,
  created_at: TIMESTAMP
}
```

### User Workflows

**Resurfacing Log Entry:**
1. Staff selects maintenance type (Resurfacing)
2. Selects ice machine from dropdown
3. Records pre-resurfacing conditions
4. Starts timer or enters times manually
5. Completes resurfacing
6. Records post-resurfacing conditions
7. Adds notes and submits
8. Activity appears in facility feed

---

## 3. Refrigeration Log Module

### Purpose
Monitor refrigeration system performance, track daily readings, and ensure compliance with temperature and pressure specifications.

### Key Features

#### A. System Components Tracked
1. **Compressor System**
   - Suction pressure (PSI)
   - Discharge pressure (PSI)
   - Oil pressure (PSI)
   - Oil temperature (°F/°C)
   - Amperage draw
   - Running status

2. **Condenser System**
   - Condenser temperature
   - Ambient temperature
   - Fan status (running/stopped)
   - Water inlet temperature
   - Water outlet temperature
   - Flow rate

3. **Evaporator System**
   - Evaporator pressure
   - Brine supply temperature
   - Brine return temperature
   - Flow rate (GPM)
   - Ice surface temperature

4. **Brine System**
   - Brine concentration (%)
   - pH levels
   - Additive levels
   - System pressure

#### B. Multiple Readings Per Day
- Reading number sequence (1, 2, 3...)
- Timestamp for each reading
- Operator assignment
- Shift-based organization

#### C. Temperature Unit Selection
- Fahrenheit (°F)
- Celsius (°C)
- Automatic conversion
- User preference persistence

#### D. Dashboard View
- Real-time system status
- Alert indicators for out-of-range values
- Trend graphs for key metrics
- Historical comparison

#### E. Alerts & Notifications
- Threshold-based alerts
- Out-of-range warnings
- Equipment malfunction detection
- Email/SMS notifications to managers

### Data Model

```typescript
// Database table: refrigeration_logs
{
  id: UUID,
  facility_id: UUID,
  rink_id: UUID,
  log_date: DATE,
  reading_number: INTEGER,
  operator_id: UUID,
  temperature_unit: STRING, // "F" or "C"

  // Stored as JSONB for flexibility
  compressor_readings: JSONB,
  condenser_readings: JSONB,
  evaporator_readings: JSONB,
  brine_readings: JSONB,

  notes: TEXT,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
}
```

### User Workflows

**Daily Reading Entry:**
1. Staff navigates to Refrigeration Log
2. Selects reading number for the day
3. Enters compressor readings
4. Enters condenser readings
5. Enters evaporator readings
6. Enters brine system data
7. Reviews values for alerts
8. Adds notes and submits
9. System validates ranges and alerts if needed

---

## 4. Air Quality Log Module

### Purpose
Comprehensive indoor air quality monitoring for CO (Carbon Monoxide) and NO2 (Nitrogen Dioxide) compliance, meeting health and safety regulations.

### Key Features

#### A. Equipment Tracking
1. **CO/NO2 Monitors**
   - Monitor make and model
   - Serial numbers
   - Calibration dates
   - Calibration due dates
   - Sensor lifespan tracking

2. **Resurfacing Equipment**
   - Ice resurfacer inventory
   - Fuel type (electric, propane, natural gas, gasoline)
   - Engine specifications
   - Emission ratings
   - Maintenance schedules

3. **Other Equipment**
   - Auxiliary powered equipment
   - Fuel type classification
   - Usage tracking

#### B. Measurement Recording
1. **Routine Measurements**
   - CO instant reading (PPM)
   - CO 1-hour average (PPM)
   - NO2 instant reading (PPM)
   - NO2 1-hour average (PPM)
   - Measurement location
   - Time of measurement
   - Pre/post edging classification

2. **Post-Edging Measurements**
   - Required measurements after resurfacing
   - Comparison to baseline
   - Ventilation effectiveness

#### C. Action Records
1. **Immediate Actions**
   - Exceedance event documentation
   - CO concentration at exceedance
   - NO2 concentration at exceedance
   - Exceedance time
   - Immediate actions taken
   - Staff notified

2. **Corrective Actions**
   - Cause identification
   - Corrective measures implemented
   - Equipment repairs/adjustments
   - Ventilation system changes

3. **Health Authority Notification**
   - Authority name and contact
   - Notification time
   - Follow-up actions
   - Re-entry authorization
   - Authorized person details
   - Re-entry datetime
   - Acceptable levels restored time

#### D. Facility Status Checks
- Arena status (open/closed/restricted)
- Ventilation system status
- Staff training verification
- Public signage verification
- Maintenance history review

#### E. Compliance Reporting
- Historical exceedance tracking
- Trend analysis
- Regulatory report generation
- Export to PDF/CSV
- Email distribution to authorities

### Regulatory Thresholds

**Carbon Monoxide (CO):**
- Instant reading alert: > 30 PPM
- 1-hour average limit: 25 PPM
- Evacuation threshold: > 50 PPM

**Nitrogen Dioxide (NO2):**
- Instant reading alert: > 0.5 PPM
- 1-hour average limit: 0.25 PPM
- Evacuation threshold: > 1.0 PPM

### Data Model

```typescript
// Database table: air_quality_logs
{
  id: UUID,
  facility_id: UUID,
  rink_id: UUID,
  log_date: DATE,
  operator_id: UUID,

  // Monitor information
  co_monitor: JSONB,
  no2_monitor: JSONB,

  // Arena status
  arena_status: STRING,
  ventilation_status: STRING,
  staff_trained: BOOLEAN,
  signage_posted: BOOLEAN,

  notes: TEXT,
  created_at: TIMESTAMP
}

// Database table: air_quality_measurements
{
  id: UUID,
  log_id: UUID,
  measurement_time: TIMESTAMP,
  measurement_type: STRING, // "routine", "post_edging"
  location: STRING,
  co_instant: DECIMAL,
  co_1hr_avg: DECIMAL,
  no2_instant: DECIMAL,
  no2_1hr_avg: DECIMAL,
  exceeds_threshold: BOOLEAN,
  created_at: TIMESTAMP
}

// Database table: air_quality_actions
{
  id: UUID,
  log_id: UUID,
  action_type: STRING, // "immediate", "corrective"
  exceedance_time: TIMESTAMP,
  co_concentration: DECIMAL,
  no2_concentration: DECIMAL,
  cause_and_measures: TEXT,
  health_authority_name: STRING,
  health_authority_notified_time: TIMESTAMP,
  reentry_authority: STRING,
  reentry_authorized_datetime: TIMESTAMP,
  acceptable_levels_restored_time: TIMESTAMP,
  created_at: TIMESTAMP
}
```

### User Workflows

**Routine Measurement Entry:**
1. Staff navigates to Air Quality Log
2. Verifies monitor calibration dates
3. Selects measurement type (routine/post-edging)
4. Records location
5. Enters CO readings (instant and 1-hour)
6. Enters NO2 readings (instant and 1-hour)
7. System checks thresholds automatically
8. If exceeded, action form appears
9. Staff documents actions taken
10. Submits log entry

**Exceedance Event:**
1. System detects threshold violation
2. Alert triggers to manager/admin
3. Staff documents immediate actions
4. Facility status updated (closed/restricted)
5. Health authority notification documented
6. Corrective measures recorded
7. Follow-up measurements required
8. Re-entry authorization process
9. Compliance report generated

---

## 5. Incident Reports Module

### Purpose
Comprehensive incident and injury documentation system for liability protection, insurance claims, and safety analysis.

### Key Features

#### A. Incident Classification
- **Slip and Fall**
- **Collision** (skater-to-skater, skater-to-boards)
- **Equipment-Related**
- **Medical Emergency**
- **Property Damage**
- **Other**

#### B. Severity Levels
- **Minor:** First aid only, no medical attention
- **Moderate:** Medical attention required, no transport
- **Serious:** Ambulance transport required
- **Critical:** Life-threatening, immediate emergency response

#### C. Injured Person Information
- Full name and demographics
- Contact information (phone, email, address)
- Age and date of birth
- Emergency contact details
- Medical information (allergies, conditions)
- Insurance information (if applicable)

#### D. Body Diagram Selector
- **Interactive Body Diagram:**
  - Front and back view
  - Clickable injury locations
  - Multiple injury site selection
  - Injury type classification (bruise, cut, fracture, sprain, etc.)
  - Severity per injury

#### E. Witness Information
- Witness name and contact
- Multiple witness support
- Witness statement capture
- Staff witness vs public witness

#### F. Incident Details
- Date and time of incident
- Location (specific rink area)
- Activity at time of incident (public skate, hockey, lessons, etc.)
- Weather/ice conditions
- Lighting conditions
- Detailed incident description
- Contributing factors

#### G. Immediate Actions Taken
- First aid administered
- Staff members involved
- Medical facility transport (which hospital)
- Ambulance service used
- Ice pack provided
- Incident scene photos
- Equipment inspected/removed

#### H. Staff Information
- Reporting staff member (auto-populated)
- Witnesses who are staff
- Responding staff members
- Manager notified

#### I. Follow-Up Management
- Follow-up action items
- Status tracking (submitted, under_review, closed)
- Insurance claim linkage
- Legal review flags
- Resolution notes
- Closure date and signature

#### J. Auto-Generated Incident Numbers
- Sequential numbering per facility
- Format: FAC-YYYY-####
- Unique identifier for tracking

### Data Model

```typescript
// Database table: incidents
{
  id: UUID,
  incident_number: STRING, // Auto-generated
  facility_id: UUID,
  rink_id: UUID,

  // Incident classification
  incident_type: STRING,
  severity: STRING,
  incident_date: TIMESTAMP,
  location: STRING,
  activity: STRING,

  // Injured person
  injured_person: JSONB, // { name, age, contact, emergency_contact, insurance }

  // Body diagram data
  injuries: JSONB, // [{ location, type, severity, description }]

  // Incident details
  description: TEXT,
  contributing_factors: TEXT[],
  weather_conditions: STRING,
  ice_conditions: STRING,

  // Actions taken
  immediate_actions: JSONB,
  first_aid_administered: BOOLEAN,
  ambulance_called: BOOLEAN,
  medical_facility: STRING,

  // Witnesses
  witnesses: JSONB, // [{ name, contact, statement }]

  // Staff
  reporting_staff_id: UUID,
  responding_staff_ids: UUID[],
  manager_notified_id: UUID,

  // Follow-up
  status: STRING, // "submitted", "under_review", "closed"
  follow_ups: JSONB,
  insurance_claim_number: STRING,
  legal_review_required: BOOLEAN,
  resolution_notes: TEXT,
  closed_date: DATE,

  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
}

// Database table: incident_follow_ups
{
  id: UUID,
  incident_id: UUID,
  follow_up_date: DATE,
  contact_method: STRING,
  contacted_by: UUID,
  notes: TEXT,
  status_update: STRING,
  created_at: TIMESTAMP
}
```

### PDF Export
- Comprehensive incident report
- Body diagram with marked injuries
- Witness statements
- Staff signatures
- Photo attachments
- Timeline of events
- Follow-up history

### User Workflows

**Incident Report Creation:**
1. Staff immediately after incident navigates to Incident Reports
2. Clicks "New Incident Report"
3. Selects incident type and severity
4. Fills in injured person information
5. Uses body diagram to mark injury locations
6. Describes incident in detail
7. Documents immediate actions taken
8. Adds witness information
9. Reviews and submits
10. Auto-generated incident number assigned
11. Manager receives notification
12. PDF export available immediately

**Manager Review:**
1. Manager receives incident notification
2. Reviews incident details
3. Adds follow-up actions
4. Changes status (under_review)
5. Assigns legal review if needed
6. Links to insurance claim if filed
7. Monitors follow-ups
8. Closes incident when resolved

---

## 6. Daily Reports Module

### Purpose
Comprehensive shift-based reporting system for all facility operations, financial transactions, task management, and shift handoffs.

### Key Features

#### A. Dynamic Tab System
Admin-configurable tabs per facility with default set:

1. **Front Desk Operations**
   - Guest check-ins
   - Rental transactions
   - Phone calls and inquiries
   - Customer service issues

2. **Custodial Services**
   - Cleaning tasks completed
   - Supplies restocked
   - Maintenance issues found
   - Facility condition notes

3. **Pro Shop**
   - Sales transactions
   - Inventory sold
   - Customer orders
   - Merchandise issues

4. **Concessions**
   - Sales summary
   - Food safety checks
   - Equipment status
   - Supply needs

5. **Learn to Skate Programs**
   - Class attendance
   - Instructor notes
   - Student progress
   - Equipment needs

6. **Public Sessions**
   - Attendance counts
   - Special events
   - Music/lighting notes
   - Customer feedback

7. **Safety & Emergency**
   - Incidents (links to incident reports)
   - First aid administered
   - Equipment checks
   - Safety observations

8. **General Facility**
   - Facility condition
   - Equipment status
   - Upcoming events
   - General notes

9. **Locker Rooms**
   - Cleanliness checks
   - Supplies status
   - Maintenance issues
   - Customer feedback

10. **Parking/Exterior**
    - Parking lot condition
    - Exterior building checks
    - Landscaping notes
    - Security concerns

11. **HVAC/Building Systems**
    - Temperature checks
    - System status
    - Maintenance needs
    - Energy usage notes

12. **Event Setup**
    - Event preparations
    - Equipment setup
    - Staffing assignments
    - Post-event cleanup

13. **Rental Equipment**
    - Skate rentals processed
    - Equipment condition
    - Missing items
    - Inventory needs

14. **Skating Aids**
    - Skating aids rented
    - Equipment condition
    - Cleaning/sanitization
    - Repair needs

15. **Custom/Reserved**
    - Facility-specific custom tabs
    - Special programs
    - Unique operations

#### B. Shift Types
- **Morning Shift** (typically 6am-2pm)
- **Afternoon Shift** (typically 2pm-10pm)
- **Evening Shift** (typically 10pm-6am)
- **Overnight Shift** (maintenance/cleaning)
- Custom shift times per facility

#### C. Role-Based Tab Visibility
- Tabs can be restricted to specific roles
- Staff only see tabs relevant to their position
- Admin controls tab-role assignments

#### D. Financial Tracking

**Revenue Categories:**
- Public skate admissions
- Private lessons
- Group lessons
- Ice rental
- Equipment rental
- Pro shop sales
- Concession sales
- Other revenue

**Expense Categories:**
- Supplies purchased
- Equipment repairs
- Contractor services
- Utilities (if tracked daily)
- Other expenses

**Payment Methods:**
- Cash
- Credit card
- Debit card
- Check
- Gift card
- Account charge

**Petty Cash Management:**
- Beginning balance
- Cash in (deposits, reimbursements)
- Cash out (purchases, withdrawals)
- Ending balance
- Variance tracking
- Reconciliation notes

#### E. Task Management

**Task Structure:**
- Work area assignment (e.g., Front Desk, Rink 1, Locker Rooms)
- Task category (Cleaning, Maintenance, Customer Service, etc.)
- Task subcategory
- Task description
- Assigned to (staff member)
- Priority level (Low, Medium, High, Urgent)
- Status (Pending, In Progress, Completed, Skipped)
- Estimated time
- Actual time taken
- Notes and photos

**Task Templates:**
- Pre-built task checklists per shift
- Recurring tasks auto-populate
- Custom task library
- Seasonal task sets

#### F. Shift Handoff Features

**Handoff Summary:**
- Outstanding tasks from current shift
- Issues requiring next shift attention
- Facility condition assessment
- Equipment status updates
- VIP/event notifications
- Attendance/revenue summary
- Keys/cash transfer notes

**Staff-to-Staff Communication:**
- Shift notes section
- Read receipts for important messages
- Issue escalation flags

#### G. Report Status Workflow
- **Draft:** Report in progress, editable
- **Submitted:** Submitted by staff, locked for editing
- **Approved:** Manager reviewed and approved
- **Rejected:** Manager rejected with feedback, returned to staff

#### H. Tab-Level Submission Tracking
- Each tab can be submitted independently
- Progress indicator shows completion percentage
- Incomplete tabs highlighted
- Manager can see which tabs need review

#### I. Form Configuration

**Admin Capabilities:**
- Add/remove tabs
- Reorder tab sequence
- Configure fields per tab
- Set required vs optional fields
- Create custom field types (text, number, dropdown, checkbox, date, etc.)
- Set validation rules
- Configure conditional logic
- Create form sections (collapsible)

### Data Model

```typescript
// Database table: daily_reports
{
  id: UUID,
  facility_id: UUID,
  report_date: DATE,
  shift_type: STRING,
  operator_id: UUID,
  status: STRING, // "draft", "submitted", "approved", "rejected"

  // Shift times
  shift_start: TIME,
  shift_end: TIME,

  // Handoff summary
  handoff_notes: TEXT,
  outstanding_issues: TEXT,
  facility_condition: STRING,

  // Manager review
  reviewed_by: UUID,
  reviewed_at: TIMESTAMP,
  rejection_reason: TEXT,

  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
}

// Database table: daily_report_tabs
{
  id: UUID,
  facility_id: UUID,
  tab_name: STRING,
  tab_order: INTEGER,
  is_active: BOOLEAN,
  icon: STRING,
  description: TEXT,
  custom_fields: JSONB,
  created_at: TIMESTAMP
}

// Database table: daily_report_tab_submissions
{
  id: UUID,
  report_id: UUID,
  tab_id: UUID,
  content: JSONB, // Dynamic content based on tab configuration
  submitted_by: UUID,
  submitted_at: TIMESTAMP,
  status: STRING // "incomplete", "complete", "approved"
}

// Database table: daily_report_financials
{
  id: UUID,
  report_id: UUID,
  transaction_type: STRING, // "revenue", "expense", "petty_cash"
  category: STRING,
  amount: DECIMAL,
  payment_method: STRING,
  description: TEXT,
  receipt_number: STRING,
  created_at: TIMESTAMP
}

// Database table: daily_report_tasks
{
  id: UUID,
  report_id: UUID,
  work_area_id: UUID,
  task_category_id: UUID,
  task_description: TEXT,
  assigned_to: UUID,
  priority: STRING,
  status: STRING,
  estimated_minutes: INTEGER,
  actual_minutes: INTEGER,
  notes: TEXT,
  photo_urls: TEXT[],
  created_at: TIMESTAMP,
  completed_at: TIMESTAMP
}
```

### User Workflows

**Daily Report Submission:**
1. Staff logs in and navigates to Daily Reports
2. Clicks "New Daily Report"
3. Selects report date and shift type
4. Sees tabs relevant to their role
5. Navigates through tabs filling in information:
   - Tab 1 (Front Desk): Logs guest check-ins, phone calls
   - Tab 2 (Custodial): Marks cleaning tasks complete
   - Tab 3 (Pro Shop): Enters sales transactions
   - ... continues through all assigned tabs
6. Financial tab: Enters revenue and expenses
7. Task tab: Updates task statuses, adds photos
8. Views completion progress indicator
9. Fills in shift handoff summary
10. Reviews all tabs
11. Submits report (locks for editing)
12. Manager receives notification

**Manager Review:**
1. Manager sees pending daily reports
2. Opens submitted report
3. Reviews each tab for completeness
4. Checks financial reconciliation
5. Reviews outstanding tasks
6. Either:
   - Approves report → Status = Approved
   - Rejects report → Adds rejection reason → Status = Rejected (staff can edit)
7. Report appears in historical records

---

## 7. Employee Scheduling Module

### Purpose
Comprehensive staff scheduling system with shift management, availability tracking, time-off requests, shift swap capabilities, and analytics.

### Key Features

#### A. Calendar View
- **Weekly Grid:**
  - Horizontal: Days of week
  - Vertical: Time slots (configurable intervals)
  - Color-coded by role or staff member
  - Drag-and-drop shift assignment
  - Multi-rink support

- **Monthly Overview:**
  - High-level staffing view
  - Shift coverage heat map
  - Special events highlighted
  - Holiday indicators

- **Day View:**
  - Detailed daily schedule
  - Shift overlap visualization
  - Break times
  - Staff contact info

#### B. Staff Management

**Staff Profiles:**
- Full name and contact information
- Employee ID
- Hire date
- Employment status (active, inactive, on_leave)
- Default hourly rate
- Emergency contact
- Availability preferences
- Certifications and qualifications

**Role Management:**
- Role definitions (Manager, Supervisor, Attendant, Instructor, etc.)
- Role colors for visual identification
- Required certifications per role
- Pay rate ranges
- Responsibility descriptions

**Staff-Role Certifications:**
- Many-to-many relationship (staff can have multiple roles)
- Certification date
- Expiration date (if applicable)
- Renewal tracking
- Qualification documents

#### C. Shift Management

**Shift Types:**
- Opening shift
- Closing shift
- Mid-shift
- Event coverage
- On-call
- Custom shift types

**Shift Attributes:**
- Start time and end time
- Role required
- Staff assigned
- Rink/location
- Break times (paid/unpaid)
- Special instructions
- Minimum staff requirements

**Shift Templates:**
- Recurring shift patterns
- Weekly templates
- Seasonal variations
- Event-based templates

#### D. Availability Management

**Staff Availability:**
- Day-of-week availability (e.g., "Available Mondays 9am-5pm")
- Recurring unavailability (e.g., "Not available Sundays")
- Date-specific availability overrides
- Maximum hours per week preference
- Minimum hours per week requirement

**Manager Features:**
- View all staff availability
- Conflict detection when assigning shifts
- Auto-suggest based on availability
- Availability reports

#### E. Time-Off Requests

**Request Types:**
- Vacation
- Sick leave
- Personal time
- Unpaid time off
- Bereavement
- Other

**Request Workflow:**
1. Staff submits request with date range
2. Manager receives notification
3. Manager reviews:
   - Checks shift coverage impact
   - Reviews staffing levels
   - Considers seniority/policies
4. Manager approves or denies
5. Staff receives notification
6. If approved, shifts auto-removed or marked as needing coverage
7. Approved time-off blocks schedule availability

**Accrual Tracking:**
- PTO balance per staff member
- Accrual rates
- Used vs available hours
- Projected balance

#### F. Shift Swap Requests

**Swap Workflow:**
1. Staff A requests to swap shift with Staff B
2. Staff B receives notification
3. Staff B accepts or declines
4. If accepted, manager receives approval request
5. Manager reviews:
   - Both staff qualified for the shifts?
   - No overtime violations?
   - Coverage maintained?
6. Manager approves or denies
7. If approved, shifts are swapped
8. Both staff receive confirmations

**Shift Coverage Requests:**
- Staff can request coverage without specific swap
- Available staff receive notification
- First to claim gets the shift (with manager approval)

#### G. Schedule Publishing

**Draft vs Published:**
- Schedules start in draft mode
- Managers can make changes freely
- "Publish" locks schedule and notifies staff
- Published schedules require manager approval to change

**Advance Notice:**
- Configurable notice period (e.g., 2 weeks)
- System alerts if publishing late
- Staff notification preferences (email, SMS, in-app)

#### H. Analytics & Reports

**Schedule Reports:**
- Staff utilization (hours scheduled vs available)
- Role coverage analysis
- Overtime tracking and projections
- Labor cost reports
- Certification expiration alerts
- Attendance and absence tracking

**Export Options:**
- PDF schedules (printable for staff room)
- Excel/CSV exports
- iCal feed for personal calendars
- Email schedule distribution

### Data Model

```typescript
// Database table: schedule_staff
{
  id: UUID,
  facility_id: UUID,
  first_name: STRING,
  last_name: STRING,
  email: STRING,
  phone: STRING,
  employee_id: STRING,
  hire_date: DATE,
  employment_status: STRING, // "active", "inactive", "on_leave"
  default_hourly_rate: DECIMAL,
  emergency_contact: JSONB,
  notes: TEXT,
  created_at: TIMESTAMP
}

// Database table: schedule_roles
{
  id: UUID,
  facility_id: UUID,
  role_name: STRING,
  role_color: STRING, // Hex color for calendar
  required_certifications: STRING[],
  pay_rate_min: DECIMAL,
  pay_rate_max: DECIMAL,
  description: TEXT,
  created_at: TIMESTAMP
}

// Database table: schedule_staff_roles
{
  id: UUID,
  staff_id: UUID,
  role_id: UUID,
  certification_date: DATE,
  expiration_date: DATE,
  notes: TEXT,
  created_at: TIMESTAMP
}

// Database table: schedule_shifts
{
  id: UUID,
  facility_id: UUID,
  rink_id: UUID,
  shift_date: DATE,
  start_time: TIME,
  end_time: TIME,
  role_id: UUID,
  assigned_staff_id: UUID,
  shift_type: STRING,
  break_minutes: INTEGER,
  special_instructions: TEXT,
  is_published: BOOLEAN,
  created_at: TIMESTAMP
}

// Database table: schedule_availability
{
  id: UUID,
  staff_id: UUID,
  day_of_week: INTEGER, // 0=Sunday, 6=Saturday
  start_time: TIME,
  end_time: TIME,
  is_available: BOOLEAN,
  notes: TEXT,
  created_at: TIMESTAMP
}

// Database table: schedule_time_off
{
  id: UUID,
  staff_id: UUID,
  request_type: STRING,
  start_date: DATE,
  end_date: DATE,
  hours_requested: DECIMAL,
  reason: TEXT,
  status: STRING, // "pending", "approved", "denied"
  requested_at: TIMESTAMP,
  reviewed_by: UUID,
  reviewed_at: TIMESTAMP,
  review_notes: TEXT
}

// Database table: schedule_shift_swaps
{
  id: UUID,
  shift_id: UUID,
  requesting_staff_id: UUID,
  covering_staff_id: UUID,
  swap_reason: TEXT,
  status: STRING, // "pending_staff", "pending_manager", "approved", "denied"
  staff_approved_at: TIMESTAMP,
  manager_reviewed_by: UUID,
  manager_reviewed_at: TIMESTAMP,
  review_notes: TEXT,
  created_at: TIMESTAMP
}
```

### User Workflows

**Creating Weekly Schedule (Manager):**
1. Manager navigates to Scheduling module
2. Selects week to schedule
3. Views staff availability overlay
4. Creates shifts:
   - Clicks time slot on calendar
   - Selects role and time
   - System suggests available qualified staff
   - Assigns staff member
   - Adds special instructions if needed
5. Repeats for all shifts
6. Reviews coverage and conflicts
7. Publishes schedule
8. Staff receive notifications

**Requesting Time Off (Staff):**
1. Staff navigates to Scheduling > Time Off
2. Clicks "Request Time Off"
3. Selects request type (vacation, sick, etc.)
4. Selects date range
5. Adds reason/notes
6. Submits request
7. Manager receives notification
8. Manager reviews and approves/denies
9. Staff receives decision notification

**Shift Swap (Staff):**
1. Staff A views their schedule
2. Identifies shift they can't work
3. Clicks "Request Swap"
4. Selects Staff B from qualified staff list
5. Adds reason
6. Submits swap request
7. Staff B receives notification
8. Staff B accepts swap
9. Manager receives approval request
10. Manager reviews and approves
11. Schedule updates, both staff notified

---

## 8. Admin Dashboard

### Purpose
Centralized administration interface for system configuration, user management, facility setup, and module customization.

### Key Features

#### A. Dashboard Overview
- System statistics
- User activity metrics
- Module usage analytics
- Recent activities feed
- Quick actions menu
- System health indicators

#### B. User Management

**Create Users:**
- Add new team members
- Email invitation system
- Auto-generated temporary passwords
- Force password change on first login

**Edit Users:**
- Update user information
- Change roles
- Enable/disable accounts
- Reset passwords
- View user activity logs

**Delete Users:**
- Soft delete (retain historical data)
- Transfer ownership of records
- Deactivation vs permanent deletion

**Role Assignment:**
- Assign admin, manager, or staff role
- Module-level permissions
- Facility-level access control

#### C. Facility Management

**Create Facilities:**
- Facility name and location
- Address and contact information
- Timezone configuration
- Operating hours
- Number of rinks
- Facility-specific settings

**Rink Configuration:**
- Rink names (e.g., "Main Rink", "Practice Rink")
- Rink dimensions
- Ice measurement templates
- Equipment assignments

**Multi-Facility Support:**
- Enterprise plan feature
- Separate data isolation
- Cross-facility reporting
- Centralized user management

#### D. Module Administration

**Enable/Disable Modules:**
- Per-facility module activation
- License tier enforcement
- Feature flags

**Module Configuration:**
- Ice Depth: Template management, AI settings
- Maintenance: Equipment profiles, activity types
- Refrigeration: System specifications, alert thresholds
- Air Quality: Monitor calibration, compliance thresholds
- Scheduling: Shift templates, role definitions
- Incidents: Auto-numbering, notification rules
- Daily Reports: Tab configuration, field customization

#### E. Form Configuration & Templates

**Form Builder:**
- Visual drag-and-drop form designer
- Field types:
  - Text input
  - Number input
  - Dropdown/select
  - Multi-select
  - Radio buttons
  - Checkboxes
  - Date picker
  - Time picker
  - Text area
  - File upload
  - Section headers
  - Dividers
- Field properties:
  - Label and placeholder
  - Required vs optional
  - Validation rules (min, max, regex pattern)
  - Help text
  - Default values
  - Conditional visibility logic

**Form Sections:**
- Collapsible sections
- Section ordering
- Section-level permissions
- Progressive disclosure

**Template Management:**
- System templates (default)
- Custom templates (user-created)
- Template versioning
- Template comparison tool
- Import/export templates
- Template library

**Daily Report Tab Configuration:**
- Create custom tabs
- Reorder tab sequence
- Assign tabs to roles
- Configure tab fields
- Set completion requirements

#### F. Calibration Management

**Ice Depth Template Calibration:**
- Facility-specific point adjustments
- Override default template positions
- Calibration history
- Comparison to standard templates
- Validation and approval workflow

#### G. Audit Logging

**Tracked Actions:**
- User logins and logouts
- User creation/modification/deletion
- Facility configuration changes
- Module enable/disable
- Form builder changes
- Data modifications (who changed what, when)
- Permission changes
- Report approvals/rejections

**Audit Log Features:**
- Filterable by user, action type, date range
- Searchable log entries
- Export to CSV
- Retention policies
- Compliance reporting

#### H. Incident History

**Centralized Incident View:**
- All facility incidents
- Filter by date, severity, type, status
- Search by incident number or injured person
- Export filtered results
- Trend analysis
- Heat map by location/time

### User Workflows

**Adding a New User (Admin):**
1. Admin navigates to Admin > User Management
2. Clicks "Add User"
3. Fills in user details (name, email, role)
4. Assigns module permissions
5. Assigns facility access
6. Sends invitation email
7. User receives email with temporary password
8. User logs in and sets new password

**Configuring Daily Report Tabs (Admin):**
1. Admin navigates to Admin > Form Builder
2. Selects "Daily Reports"
3. Clicks "Add Tab"
4. Names tab (e.g., "Aquatics Operations")
5. Adds fields using drag-and-drop
6. Configures field properties and validation
7. Sets role visibility
8. Saves tab configuration
9. Tab immediately available to staff

**Customizing Ice Depth Template (Admin):**
1. Admin navigates to Admin > Ice Depth Settings
2. Selects facility and rink
3. Chooses base template (e.g., 24-point)
4. Enters calibration mode
5. Adjusts point positions to match facility rink
6. Saves calibrated template
7. Template override applies to all future measurements

---

## 9. Account Management Module

### Purpose
Billing, subscription, team management, and user preferences for account owners.

### Key Features

#### A. Account Dashboard
- Account overview
- Active subscription plan
- Team member count
- Usage statistics
- Billing status

#### B. User Management
- View all team members
- Invite new members
- Modify user roles
- Remove users
- Transfer account ownership

#### C. Permissions Overview
- Module access by user
- Role-based access summary
- Permission audit trail

#### D. Billing & Subscription

**Subscription Plans:**

1. **Starter - $49/month or $470/year (save $118)**
   - Up to 5 users
   - Single facility
   - Basic features:
     - Ice maintenance logging
     - Incident reports
     - Basic refrigeration logging
   - Email support
   - 30-day data retention

2. **Standard - $99/month or $950/year (save $238)**
   - Up to 15 users
   - Single facility
   - All Starter features plus:
     - Staff scheduling
     - Daily reports
     - Refrigeration logging (full)
     - Air quality monitoring
   - Priority email support
   - 1-year data retention

3. **Professional - $199/month or $1,910/year (save $478)**
   - Up to 50 users
   - Single facility
   - All Standard features plus:
     - Advanced analytics and dashboards
     - Custom form builder
     - Ice depth AI analysis
     - API access for integrations
     - Bluetooth caliper support
   - Phone + email support
   - 3-year data retention

4. **Enterprise - Custom Pricing**
   - Unlimited users
   - Multiple facilities
   - All Professional features plus:
     - White-label branding
     - Dedicated account manager
     - Custom integrations
     - SLA guarantees
     - Advanced security features
     - SSO/SAML authentication
   - 24/7 priority support
   - Unlimited data retention

**Billing Features:**
- View current plan
- Upgrade/downgrade plans
- Monthly vs annual toggle
- Payment method management (Stripe)
- Invoice history
- Download invoices
- Usage tracking (users, storage, API calls)
- Overage alerts
- Auto-renewal settings

**Stripe Integration:**
- Secure payment processing
- Customer portal access
- Automatic invoicing
- Failed payment retry logic
- Prorated upgrades/downgrades
- Tax calculation

#### E. Notification Settings

**Notification Center:**
- Real-time notification feed
- Unread count badge
- Mark as read/unread
- Notification categories:
  - Incidents
  - Schedule changes
  - Time-off requests
  - Report approvals
  - System alerts
  - Maintenance reminders

**Notification Preferences:**
- In-app notifications (on/off)
- Email notifications (on/off)
- Push notifications (future feature)
- SMS notifications (Enterprise only)

**Notification Types:**
- New incident reports
- Daily report submissions
- Time-off requests
- Shift swap requests
- Refrigeration system alerts
- Air quality exceedances
- Equipment maintenance due
- Certification expirations
- Payment failures

**Digest Preferences:**
- Real-time (immediate)
- Hourly digest
- Daily digest (morning/evening)
- Weekly summary
- Custom schedule

**Per-Module Notification Control:**
- Configure notification preferences per module
- Granular control (e.g., "Only critical air quality alerts")

#### F. Account Settings
- Company name and logo
- Facility branding
- Default timezone
- Date and time format preferences
- Currency settings
- Language preferences (future)
- Data export requests
- Account deletion

### Data Model

```typescript
// Database table: subscription_plans
{
  id: UUID,
  plan_name: STRING, // "Starter", "Standard", "Professional", "Enterprise"
  plan_tier: INTEGER, // 1, 2, 3, 4
  monthly_price: DECIMAL,
  annual_price: DECIMAL,
  max_users: INTEGER,
  max_facilities: INTEGER,
  features: JSONB, // { scheduling: true, ai_analysis: false, ... }
  data_retention_years: INTEGER,
  support_level: STRING,
  created_at: TIMESTAMP
}

// Database table: facility_subscriptions
{
  id: UUID,
  facility_id: UUID,
  plan_id: UUID,
  billing_cycle: STRING, // "monthly", "annual"
  status: STRING, // "active", "past_due", "canceled", "trialing"
  stripe_customer_id: STRING,
  stripe_subscription_id: STRING,
  current_period_start: DATE,
  current_period_end: DATE,
  cancel_at_period_end: BOOLEAN,
  trial_end: DATE,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
}

// Database table: subscription_invoices
{
  id: UUID,
  subscription_id: UUID,
  stripe_invoice_id: STRING,
  invoice_number: STRING,
  amount: DECIMAL,
  status: STRING, // "draft", "open", "paid", "void", "uncollectible"
  invoice_date: DATE,
  due_date: DATE,
  paid_date: DATE,
  invoice_pdf_url: STRING,
  created_at: TIMESTAMP
}

// Database table: notifications
{
  id: UUID,
  recipient_id: UUID,
  notification_type: STRING,
  title: STRING,
  message: TEXT,
  link: STRING, // Deep link to related resource
  is_read: BOOLEAN,
  created_at: TIMESTAMP,
  read_at: TIMESTAMP
}

// Database table: notification_preferences
{
  id: UUID,
  user_id: UUID,
  notification_type: STRING,
  in_app_enabled: BOOLEAN,
  email_enabled: BOOLEAN,
  push_enabled: BOOLEAN,
  sms_enabled: BOOLEAN,
  digest_frequency: STRING, // "realtime", "hourly", "daily", "weekly"
  created_at: TIMESTAMP
}
```

### User Workflows

**Upgrading Subscription (Account Owner):**
1. Account owner navigates to Account > Billing
2. Views current plan (e.g., Standard)
3. Clicks "Upgrade Plan"
4. Compares plans in modal
5. Selects Professional plan
6. Chooses monthly vs annual
7. Reviews new pricing and features
8. Confirms upgrade
9. Stripe processes prorated payment
10. Plan upgrades immediately
11. New features become available
12. Confirmation email sent

**Configuring Notifications (User):**
1. User navigates to Account > Notification Settings
2. Views notification preferences by category
3. Toggles email notifications for incidents: ON
4. Sets daily report notifications: Daily digest (morning)
5. Disables shift swap notifications (prefers in-app only)
6. Sets air quality alerts: Real-time
7. Saves preferences
8. Future notifications follow new settings

---

## Database Architecture

### Multi-Tenancy Strategy
- **Facility-based scoping:** All tables include `facility_id` for data isolation
- **Row Level Security (RLS):** PostgreSQL RLS policies enforce data access
- **User-facility association:** Each user linked to one or more facilities
- **Admin override:** Admins can access all facilities if authorized

### Security Policies

**Example RLS Policy (ice_depth_measurements):**
```sql
CREATE POLICY "Users can view measurements from their facility"
ON ice_depth_measurements
FOR SELECT
USING (
  facility_id IN (
    SELECT facility_id
    FROM profiles
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Staff can insert measurements for their facility"
ON ice_depth_measurements
FOR INSERT
WITH CHECK (
  facility_id IN (
    SELECT facility_id
    FROM profiles
    WHERE id = auth.uid()
  )
  AND
  EXISTS (
    SELECT 1
    FROM user_permissions
    WHERE user_id = auth.uid()
    AND module_name = 'ice_depth_log'
  )
);
```

### Key Tables Summary

**User & Access (4 tables):**
- `profiles` - User profiles with facility assignment
- `user_roles` - Role definitions
- `user_permissions` - Module-level permissions
- `auth.users` - Supabase authentication

**Facility & Organization (4 tables):**
- `facilities` - Facility records
- `rinks` - Individual rink surfaces
- `resurfacing_machines` - Equipment inventory
- `schedule_staff` - Staff member profiles

**Ice Depth (2 tables):**
- `ice_depth_measurements` - Measurement records
- `custom_ice_templates` - Custom templates

**Refrigeration (1 table):**
- `refrigeration_logs` - Daily readings

**Air Quality (4 tables):**
- `air_quality_logs` - Main log records
- `air_quality_measurements` - CO/NO2 readings
- `air_quality_actions` - Exceedance events
- `air_quality_equipment` - Equipment tracking

**Daily Reports (8 tables):**
- `daily_reports` - Main report records
- `daily_report_tabs` - Tab definitions
- `daily_report_tab_submissions` - Tab content
- `daily_report_tasks` - Task tracking
- `daily_report_financials` - Transactions
- `work_areas` - Work area definitions
- `task_categories` - Task categorization
- `task_subcategories` - Task subcategories

**Incidents (2 tables):**
- `incidents` - Incident reports
- `incident_follow_ups` - Follow-up records

**Scheduling (6 tables):**
- `schedule_shifts` - Shift definitions
- `schedule_roles` - Role definitions
- `schedule_staff_roles` - Staff certifications
- `schedule_availability` - Availability windows
- `schedule_time_off` - Time-off requests
- `schedule_shift_swaps` - Swap requests

**Forms (6 tables):**
- `form_configurations` - Form field definitions
- `form_sections` - Form sections
- `form_templates` - System templates
- `custom_templates` - User templates
- `circle_checks` - Checklist definitions
- `maintenance_activities` - Activity templates

**Billing (3 tables):**
- `subscription_plans` - Plan definitions
- `facility_subscriptions` - Subscription records
- `subscription_invoices` - Invoice history

**Notifications (2 tables):**
- `notifications` - Notification records
- `notification_preferences` - User preferences

### Performance Optimizations
- Indexes on foreign keys
- Composite indexes on frequently queried columns
- JSONB indexes for dynamic data
- Materialized views for analytics
- Query result caching with React Query

---

## API Architecture

### Supabase Client Integration

**Auto-Generated TypeScript Types:**
```typescript
import { Database } from '@/integrations/supabase/types'

type IceDepthMeasurement = Database['public']['Tables']['ice_depth_measurements']['Row']
type IceDepthInsert = Database['public']['Tables']['ice_depth_measurements']['Insert']
type IceDepthUpdate = Database['public']['Tables']['ice_depth_measurements']['Update']
```

**React Query Integration:**
```typescript
// Custom hook example: useIceDepthMeasurements
export const useIceDepthMeasurements = (facilityId: string, rinkId: string) => {
  return useQuery({
    queryKey: ['ice_depth_measurements', facilityId, rinkId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ice_depth_measurements')
        .select('*')
        .eq('facility_id', facilityId)
        .eq('rink_id', rinkId)
        .order('measurement_date', { ascending: false })

      if (error) throw error
      return data
    }
  })
}
```

### Real-Time Subscriptions

**Notification Real-Time Updates:**
```typescript
export const useRealtimeNotifications = (userId: string) => {
  useEffect(() => {
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`
        },
        (payload) => {
          // Handle new notification
          queryClient.invalidateQueries(['notifications'])
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])
}
```

### Edge Functions

**Ice Depth Notification Email:**
```typescript
// supabase/functions/send-ice-depth-notification/index.ts
Deno.serve(async (req) => {
  const { measurementId } = await req.json()

  // Fetch measurement details
  const { data: measurement } = await supabase
    .from('ice_depth_measurements')
    .select('*, profiles(*), facilities(*)')
    .eq('id', measurementId)
    .single()

  // Send email via SMTP or service
  await sendEmail({
    to: facility.manager_email,
    subject: `Ice Depth Report - ${measurement.measurement_date}`,
    body: renderEmailTemplate(measurement)
  })

  return new Response(JSON.stringify({ success: true }))
})
```

---

## Component Architecture

### Component Organization

**UI Components (`/components/ui`):**
- Atomic components from shadcn-ui
- 40+ components (button, card, dialog, dropdown, form, input, etc.)
- Fully accessible (Radix UI primitives)
- Themeable with CSS variables

**Feature Components:**
- `/components/ice-depth` (14 components)
- `/components/scheduling` (10 components)
- `/components/daily-reports` (4 components)
- `/components/incident` (2 components)
- `/components/maintenance` (6 components)
- `/components/admin` (9 components)
- `/components/account` (various)

### Key Custom Hooks (22 total)

**Ice Depth:**
- `useBluetoothCaliper` - Bluetooth device management
- `useTemplateOverrides` - Facility-specific template overrides

**Scheduling:**
- `useScheduleShifts` - Shift data management
- `useScheduleStaff` - Staff data management
- `useScheduleRoles` - Role data management
- `useScheduleAvailability` - Availability data
- `useScheduleTimeOff` - Time-off request management

**Daily Reports:**
- `useDailyReportTabs` - Dynamic tab loading
- `useTabSubmissionTracking` - Tab completion tracking

**Notifications:**
- `useNotifications` - Notification data
- `useRealtimeNotifications` - Real-time updates

**Billing:**
- `useSubscription` - Subscription data

**Forms:**
- `useFormTemplates` - Template loading
- `useFormConfiguration` - Form field management

### State Management Strategy

**Server State (React Query):**
- All database data
- Automatic caching and refetching
- Optimistic updates
- Background synchronization

**Form State (React Hook Form):**
- Complex form management
- Field-level validation
- Error handling
- Dirty state tracking

**Local State (useState):**
- UI state (modals, dialogs)
- Temporary input values
- Component-specific state

**Theme State (next-themes):**
- Light/dark mode
- System preference detection
- Persistent across sessions

---

## User Experience & Design

### Design System

**Color Palette:**
- Primary: Blue (ice/hockey theme)
- Secondary: Red (hockey accents)
- Success: Green
- Warning: Yellow/Orange
- Error: Red
- Neutral: Gray scale

**Typography:**
- System font stack
- Responsive sizing
- Clear hierarchy
- Monospace for data/numbers

**Spacing:**
- 4px base unit
- Consistent padding/margins
- Responsive scaling

### Responsive Design

**Breakpoints:**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px
- Large: > 1440px

**Mobile Optimizations:**
- Touch-friendly hit targets (48px minimum)
- Simplified navigation
- Collapsible sections
- Bottom navigation on mobile
- Swipe gestures where appropriate

### Accessibility

**WCAG 2.1 AA Compliance:**
- Semantic HTML
- ARIA labels and roles
- Keyboard navigation
- Focus management
- Screen reader support
- Color contrast ratios
- Alt text for images

**Keyboard Shortcuts:**
- Tab navigation
- Escape to close dialogs
- Enter to submit forms
- Arrow keys in lists and calendars

### Dark Mode
- System preference detection
- Manual toggle
- Persistent preference
- Optimized for low-light viewing
- High contrast for data visibility

---

## File Structure

```
rink-zenith-reports/
├── src/
│   ├── components/
│   │   ├── ui/                   # shadcn-ui components (40+)
│   │   ├── ice-depth/            # Ice depth module (14 components)
│   │   │   ├── InteractiveRinkDiagram.tsx
│   │   │   ├── SVGRinkDiagram.tsx
│   │   │   ├── USAHockeyRink.tsx
│   │   │   ├── BluetoothCaliperControl.tsx
│   │   │   ├── IceDepthMeasurementForm.tsx
│   │   │   ├── StatisticsPanel.tsx
│   │   │   ├── AIAnalysisDisplay.tsx
│   │   │   ├── IceDepthTrendCharts.tsx
│   │   │   └── ...
│   │   ├── scheduling/           # Scheduling module (10 components)
│   │   ├── daily-reports/        # Daily reports (4 components)
│   │   ├── incident/             # Incidents (2 components)
│   │   ├── maintenance/          # Maintenance (6 components)
│   │   ├── admin/                # Admin (9 components)
│   │   └── account/              # Account management
│   ├── pages/                    # Route pages (40 pages)
│   │   ├── IceDepthLog.tsx
│   │   ├── IceMaintenance.tsx
│   │   ├── RefrigerationLog.tsx
│   │   ├── AirQualityLog.tsx
│   │   ├── DailyReports.tsx
│   │   ├── IncidentHistory.tsx
│   │   ├── schedule/
│   │   │   ├── ScheduleCalendar.tsx
│   │   │   ├── StaffManagement.tsx
│   │   │   ├── ScheduleReports.tsx
│   │   │   └── ...
│   │   ├── admin/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── UserManagement.tsx
│   │   │   ├── FacilityManagement.tsx
│   │   │   └── ...
│   │   └── account/
│   ├── hooks/                    # Custom React hooks (22 hooks)
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts
│   │       └── types.ts          # Auto-generated DB types
│   ├── types/                    # TypeScript type definitions
│   ├── lib/                      # Utility functions
│   ├── data/                     # Static data (shift types, templates)
│   ├── assets/                   # SVG diagrams, images
│   │   ├── rink-24-point.svg
│   │   ├── rink-35-point.svg
│   │   ├── rink-47-point.svg
│   │   ├── rink-base.svg
│   │   ├── body-diagram-front.png
│   │   └── body-diagram-back.png
│   ├── App.tsx                   # Main routing
│   └── main.tsx                  # Entry point
├── supabase/
│   ├── migrations/               # Database migrations (33 files)
│   ├── functions/                # Edge functions
│   │   └── send-ice-depth-notification/
│   └── config.toml
├── public/                       # Static assets
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
└── README.md
```

---

## Deployment & Infrastructure

### Hosting
- **Frontend:** Vercel, Netlify, or Cloudflare Pages
- **Backend:** Supabase (managed PostgreSQL + Auth + Storage + Edge Functions)
- **CDN:** Automatic via hosting provider

### Environment Variables
```env
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
VITE_STRIPE_PUBLIC_KEY=[stripe-publishable-key]
```

### Build Process
```bash
npm install
npm run build  # Vite production build
```

### Database Migrations
```bash
supabase db push  # Apply migrations
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

---

## Security Considerations

### Authentication
- Email/password via Supabase Auth
- Password strength requirements
- Session management
- Auto-logout on inactivity
- Password reset flow
- Email verification

### Authorization
- Row Level Security (RLS) on all tables
- Role-based access control (RBAC)
- Module-level permissions
- Facility-level data isolation

### Data Protection
- Encryption in transit (HTTPS)
- Encryption at rest (Supabase default)
- Secure environment variables
- API key rotation
- No sensitive data in client code

### Compliance
- GDPR considerations (data export, deletion)
- PIPEDA compliance (Canada)
- OSHA record keeping
- Insurance documentation requirements

---

## Future Enhancements

### Planned Features
1. **Mobile App** (React Native or Progressive Web App)
2. **Advanced Analytics Dashboard** with predictive insights
3. **Integration Marketplace** (QuickBooks, Stripe, Mailchimp)
4. **SMS Notifications** (Twilio integration)
5. **Advanced Reporting** (custom report builder)
6. **Equipment IoT Integration** (sensor data automation)
7. **Communications Log Module** (inter-staff messaging)
8. **Safety & Compliance Module** (regulatory checklists)
9. **Inventory Management** (supplies, equipment, retail)
10. **Customer Management** (CRM for lessons, memberships)
11. **Point of Sale Integration**
12. **Multi-Language Support** (i18n)
13. **White-Label Customization** (Enterprise feature)
14. **SSO/SAML Integration** (Enterprise feature)
15. **Advanced Scheduling AI** (auto-optimization)

### Technical Debt
- Increase test coverage (unit, integration, e2e)
- Performance optimization (bundle size reduction)
- Code splitting and lazy loading
- Accessibility audit and improvements
- Documentation expansion
- API rate limiting and throttling
- Advanced caching strategies

---

## Success Metrics

### User Engagement
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Session duration
- Feature adoption rates
- Module usage statistics

### Business Metrics
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- Churn rate
- Net Promoter Score (NPS)
- Conversion rate (trial to paid)

### Technical Metrics
- Page load time (< 2 seconds)
- Time to Interactive (TTI)
- Error rate (< 1%)
- Uptime (99.9% target)
- API response time (< 500ms)

### Support Metrics
- Ticket response time
- Resolution time
- Customer satisfaction (CSAT)
- Knowledge base article views

---

## Conclusion

Rink Zenith Reports is a comprehensive, production-ready facility management platform specifically designed for ice rink operations. With 45+ database tables, 100+ components, and 9 core modules, it provides end-to-end operational management from ice quality tracking to staff scheduling, regulatory compliance, and financial reporting.

The platform is built on modern web technologies (React, TypeScript, Supabase) with strong emphasis on security, accessibility, and user experience. Its modular architecture, role-based permissions, and multi-tenant design make it suitable for single-facility operations to enterprise-level organizations managing multiple rinks.

This PRD serves as the comprehensive reference for understanding, maintaining, and extending the Rink Zenith Reports platform.

---

**Document Version:** 1.0
**Last Updated:** 2026-01-06
**Contact:** [Your Contact Information]
