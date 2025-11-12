export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      circle_checks: {
        Row: {
          activity_id: string
          check_item: string
          created_at: string
          id: string
          notes: string | null
          status: string
        }
        Insert: {
          activity_id: string
          check_item: string
          created_at?: string
          id?: string
          notes?: string | null
          status: string
        }
        Update: {
          activity_id?: string
          check_item?: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_checks_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "maintenance_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      compressor_readings: {
        Row: {
          compressor_name: string
          created_at: string
          discharge_pressure: number | null
          id: string
          log_id: string
          oil_level: string
          running_hours: number | null
          suction_pressure: number | null
          temperature: number | null
        }
        Insert: {
          compressor_name: string
          created_at?: string
          discharge_pressure?: number | null
          id?: string
          log_id: string
          oil_level: string
          running_hours?: number | null
          suction_pressure?: number | null
          temperature?: number | null
        }
        Update: {
          compressor_name?: string
          created_at?: string
          discharge_pressure?: number | null
          id?: string
          log_id?: string
          oil_level?: string
          running_hours?: number | null
          suction_pressure?: number | null
          temperature?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "compressor_readings_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: false
            referencedRelation: "refrigeration_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      condenser_readings: {
        Row: {
          ambient_temp: number | null
          created_at: string
          fan_status: string
          id: string
          log_id: string
          temperature: number | null
        }
        Insert: {
          ambient_temp?: number | null
          created_at?: string
          fan_status: string
          id?: string
          log_id: string
          temperature?: number | null
        }
        Update: {
          ambient_temp?: number | null
          created_at?: string
          fan_status?: string
          id?: string
          log_id?: string
          temperature?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "condenser_readings_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: false
            referencedRelation: "refrigeration_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_templates: {
        Row: {
          created_at: string
          id: string
          name: string
          point_count: number
          template_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          point_count: number
          template_data: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          point_count?: number
          template_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      facilities: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          timezone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      form_configurations: {
        Row: {
          created_at: string
          display_order: number | null
          facility_id: string
          field_label: string
          field_name: string
          field_options: Json | null
          field_type: string
          form_type: string
          id: string
          is_active: boolean | null
          is_required: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          facility_id: string
          field_label: string
          field_name: string
          field_options?: Json | null
          field_type: string
          form_type: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          facility_id?: string
          field_label?: string
          field_name?: string
          field_options?: Json | null
          field_type?: string
          form_type?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_configurations_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      ice_depth_measurements: {
        Row: {
          ai_analysis: string | null
          avg_depth: number | null
          created_at: string
          facility_id: string
          id: string
          max_depth: number | null
          measurement_date: string
          measurements: Json
          min_depth: number | null
          operator_id: string
          rink_id: string
          status: string
          std_deviation: number | null
          template_type: string
          updated_at: string
        }
        Insert: {
          ai_analysis?: string | null
          avg_depth?: number | null
          created_at?: string
          facility_id: string
          id?: string
          max_depth?: number | null
          measurement_date?: string
          measurements: Json
          min_depth?: number | null
          operator_id: string
          rink_id: string
          status?: string
          std_deviation?: number | null
          template_type: string
          updated_at?: string
        }
        Update: {
          ai_analysis?: string | null
          avg_depth?: number | null
          created_at?: string
          facility_id?: string
          id?: string
          max_depth?: number | null
          measurement_date?: string
          measurements?: Json
          min_depth?: number | null
          operator_id?: string
          rink_id?: string
          status?: string
          std_deviation?: number | null
          template_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ice_depth_measurements_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ice_depth_measurements_rink_id_fkey"
            columns: ["rink_id"]
            isOneToOne: false
            referencedRelation: "rinks"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_activities: {
        Row: {
          activity_datetime: string
          activity_type: string
          created_at: string
          custom_fields: Json | null
          edging_type: string | null
          facility_id: string
          id: string
          machine_hours: number | null
          machine_id: string | null
          new_blade_id: string | null
          notes: string | null
          old_blade_hours: number | null
          operator_id: string
          rink_id: string | null
          updated_at: string
          water_used: number | null
        }
        Insert: {
          activity_datetime?: string
          activity_type: string
          created_at?: string
          custom_fields?: Json | null
          edging_type?: string | null
          facility_id: string
          id?: string
          machine_hours?: number | null
          machine_id?: string | null
          new_blade_id?: string | null
          notes?: string | null
          old_blade_hours?: number | null
          operator_id: string
          rink_id?: string | null
          updated_at?: string
          water_used?: number | null
        }
        Update: {
          activity_datetime?: string
          activity_type?: string
          created_at?: string
          custom_fields?: Json | null
          edging_type?: string | null
          facility_id?: string
          id?: string
          machine_hours?: number | null
          machine_id?: string | null
          new_blade_id?: string | null
          notes?: string | null
          old_blade_hours?: number | null
          operator_id?: string
          rink_id?: string | null
          updated_at?: string
          water_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_activities_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_activities_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "resurfacing_machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_activities_rink_id_fkey"
            columns: ["rink_id"]
            isOneToOne: false
            referencedRelation: "rinks"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_recipients: {
        Row: {
          created_at: string
          email: string | null
          facility_id: string
          id: string
          is_active: boolean
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          facility_id: string
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          facility_id?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_recipients_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      plant_checklist: {
        Row: {
          checklist_item: string
          created_at: string
          id: string
          log_id: string
          status: boolean
        }
        Insert: {
          checklist_item: string
          created_at?: string
          id?: string
          log_id: string
          status: boolean
        }
        Update: {
          checklist_item?: string
          created_at?: string
          id?: string
          log_id?: string
          status?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "plant_checklist_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: false
            referencedRelation: "refrigeration_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          facility_id: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          facility_id?: string | null
          id: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          facility_id?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      refrigeration_logs: {
        Row: {
          created_at: string
          facility_id: string
          id: string
          log_date: string
          notes: string | null
          operator_id: string
        }
        Insert: {
          created_at?: string
          facility_id: string
          id?: string
          log_date?: string
          notes?: string | null
          operator_id: string
        }
        Update: {
          created_at?: string
          facility_id?: string
          id?: string
          log_date?: string
          notes?: string | null
          operator_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refrigeration_logs_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      resurfacing_machines: {
        Row: {
          created_at: string
          facility_id: string
          id: string
          model: string | null
          name: string
        }
        Insert: {
          created_at?: string
          facility_id: string
          id?: string
          model?: string | null
          name: string
        }
        Update: {
          created_at?: string
          facility_id?: string
          id?: string
          model?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "resurfacing_machines_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      rinks: {
        Row: {
          created_at: string
          facility_id: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          facility_id: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          facility_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "rinks_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          can_access: boolean
          id: string
          module_name: string
          user_id: string
        }
        Insert: {
          can_access?: boolean
          id?: string
          module_name: string
          user_id: string
        }
        Update: {
          can_access?: boolean
          id?: string
          module_name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "staff"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "staff"],
    },
  },
} as const
