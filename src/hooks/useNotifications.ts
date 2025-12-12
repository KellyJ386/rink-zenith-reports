import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Notification {
  id: string;
  type: "incident" | "shift" | "ice_depth" | "time_off" | "swap" | "system";
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  link?: string;
  data?: Record<string, any>;
}

export const useNotifications = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch recent incidents (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const [incidentsRes, shiftsRes, timeOffRes, swapsRes] = await Promise.all([
        supabase
          .from("incidents")
          .select("id, incident_number, severity_level, status, created_at, injured_person_name")
          .gte("created_at", yesterday.toISOString())
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("schedule_shifts")
          .select("id, date, start_time, end_time, status, area")
          .eq("assigned_staff_id", user.id)
          .gte("date", new Date().toISOString().split("T")[0])
          .order("date", { ascending: true })
          .limit(5),
        supabase
          .from("schedule_time_off")
          .select("id, status, start_date, end_date, request_type, created_at")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("schedule_shift_swaps")
          .select("id, status, created_at, reason")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const notificationsList: Notification[] = [];

      // Process incidents
      (incidentsRes.data || []).forEach((incident) => {
        notificationsList.push({
          id: `incident-${incident.id}`,
          type: "incident",
          title: `Incident ${incident.incident_number}`,
          message: `${incident.severity_level} incident - ${incident.injured_person_name}`,
          read: false,
          createdAt: new Date(incident.created_at),
          link: "/incident-history",
          data: incident,
        });
      });

      // Process upcoming shifts
      (shiftsRes.data || []).forEach((shift) => {
        const shiftDate = new Date(shift.date);
        const today = new Date();
        const isToday = shiftDate.toDateString() === today.toDateString();
        
        if (isToday) {
          notificationsList.push({
            id: `shift-${shift.id}`,
            type: "shift",
            title: "Upcoming Shift Today",
            message: `${shift.start_time} - ${shift.end_time} at ${shift.area}`,
            read: false,
            createdAt: new Date(),
            link: "/schedule/calendar",
            data: shift,
          });
        }
      });

      // Process time off requests
      (timeOffRes.data || []).forEach((request) => {
        notificationsList.push({
          id: `timeoff-${request.id}`,
          type: "time_off",
          title: "Pending Time Off Request",
          message: `${request.request_type}: ${request.start_date} to ${request.end_date}`,
          read: false,
          createdAt: new Date(request.created_at),
          link: "/schedule/time-off",
          data: request,
        });
      });

      // Process swap requests
      (swapsRes.data || []).forEach((swap) => {
        notificationsList.push({
          id: `swap-${swap.id}`,
          type: "swap",
          title: "Pending Shift Swap",
          message: swap.reason || "Shift swap request pending approval",
          read: false,
          createdAt: new Date(swap.created_at),
          link: "/schedule/swaps",
          data: swap,
        });
      });

      // Sort by date
      notificationsList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setNotifications(notificationsList);
      setUnreadCount(notificationsList.filter(n => !n.read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const showNotification = useCallback((notification: Omit<Notification, "id" | "read" | "createdAt">) => {
    toast({
      title: notification.title,
      description: notification.message,
    });
    
    const newNotification: Notification = {
      ...notification,
      id: `toast-${Date.now()}`,
      read: false,
      createdAt: new Date(),
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  }, [toast]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    showNotification,
    refresh: fetchNotifications,
  };
};
