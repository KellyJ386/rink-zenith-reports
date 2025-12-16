import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { EmailChangePrompt } from "@/components/EmailChangePrompt";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import IceDepthLog from "./pages/IceDepthLog";
import IceMaintenance from "./pages/IceMaintenance";
import RefrigerationLog from "./pages/RefrigerationLog";
import RefrigerationDashboard from "./pages/RefrigerationDashboard";
import DailyReports from "./pages/DailyReports";
import DailyReportsDashboard from "./pages/DailyReportsDashboard";
import AirQualityLog from "./pages/AirQualityLog";
import IncidentReport from "./pages/IncidentReport";
import IncidentHistory from "./pages/IncidentHistory";
import Admin from "./pages/Admin";
import AdminFormConfig from "./pages/AdminFormConfig";
import AdminDashboard from "./pages/admin/AdminDashboard";
import FacilitySettings from "./pages/admin/FacilitySettings";
import UserManagement from "./pages/admin/UserManagement";
import ModuleAdministration from "./pages/admin/ModuleAdministration";
import CustomTemplateManager from "./pages/admin/CustomTemplateManager";
import AuditLog from "./pages/admin/AuditLog";
import FormTemplateLibrary from "./pages/admin/FormTemplateLibrary";
import TemplateCalibration from "./pages/admin/TemplateCalibration";
import Schedule from "./pages/schedule/Schedule";
import ScheduleCalendar from "./pages/schedule/ScheduleCalendar";
import ScheduleStaff from "./pages/schedule/ScheduleStaff";
import ScheduleAvailability from "./pages/schedule/ScheduleAvailability";
import ScheduleTimeOff from "./pages/schedule/ScheduleTimeOff";
import ScheduleSwaps from "./pages/schedule/ScheduleSwaps";
import ScheduleReports from "./pages/schedule/ScheduleReports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <EmailChangePrompt />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/ice-depth" element={<IceDepthLog />} />
            <Route path="/ice-maintenance" element={<IceMaintenance />} />
            <Route path="/refrigeration-log" element={<RefrigerationLog />} />
            <Route path="/refrigeration-dashboard" element={<RefrigerationDashboard />} />
            <Route path="/daily-reports" element={<DailyReports />} />
            <Route path="/daily-reports-dashboard" element={<DailyReportsDashboard />} />
            <Route path="/air-quality" element={<AirQualityLog />} />
            <Route path="/incident-report" element={<IncidentReport />} />
            <Route path="/schedule" element={<Schedule />}>
              <Route index element={<ScheduleCalendar />} />
              <Route path="calendar" element={<ScheduleCalendar />} />
              <Route path="staff" element={<ScheduleStaff />} />
              <Route path="availability" element={<ScheduleAvailability />} />
              <Route path="time-off" element={<ScheduleTimeOff />} />
              <Route path="swaps" element={<ScheduleSwaps />} />
              <Route path="reports" element={<ScheduleReports />} />
            </Route>
            <Route path="/admin" element={<Admin />}>
              <Route index element={<AdminDashboard />} />
              <Route path="facility" element={<FacilitySettings />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="reports" element={<AdminFormConfig />} />
              <Route path="form-config" element={<AdminFormConfig />} />
              <Route path="form-templates" element={<FormTemplateLibrary />} />
              <Route path="modules" element={<ModuleAdministration />} />
              <Route path="incidents" element={<IncidentHistory />} />
              <Route path="templates" element={<CustomTemplateManager />} />
              <Route path="calibration" element={<TemplateCalibration />} />
              <Route path="audit" element={<AuditLog />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
