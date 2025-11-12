import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import IceDepthLog from "./pages/IceDepthLog";
import IceMaintenance from "./pages/IceMaintenance";
import Admin from "./pages/Admin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import FacilitySettings from "./pages/admin/FacilitySettings";
import UserManagement from "./pages/admin/UserManagement";
import ModuleAdministration from "./pages/admin/ModuleAdministration";
import AdminFormConfig from "./pages/AdminFormConfig";
import RefrigerationLog from "./pages/RefrigerationLog";
import RefrigerationReports from "./pages/RefrigerationReports";
import RefrigerationConfig from "./pages/admin/RefrigerationConfig";
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
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ice-depth" element={<IceDepthLog />} />
          <Route path="/ice-maintenance" element={<IceMaintenance />} />
          <Route path="/refrigeration-log" element={<RefrigerationLog />} />
          <Route path="/refrigeration-reports" element={<RefrigerationReports />} />
          <Route path="/admin" element={<Admin />}>
            <Route index element={<AdminDashboard />} />
            <Route path="facility" element={<FacilitySettings />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="reports" element={<AdminFormConfig />} />
            <Route path="modules" element={<ModuleAdministration />} />
            <Route path="refrigeration-config" element={<RefrigerationConfig />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
