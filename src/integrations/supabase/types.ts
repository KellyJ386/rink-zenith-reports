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
      air_quality_actions: {
        Row: {
          acceptable_levels_restored_time: string | null
          action_type: string
          cause_and_measures: string | null
          co_concentration: number | null
          created_at: string
          exceedance_time: string
          health_authority_name: string | null
          health_authority_notified_time: string | null
          id: string
          log_id: string
          no2_concentration: number | null
          reentry_authority: string | null
          reentry_authorized_datetime: string | null
        }
        Insert: {
          acceptable_levels_restored_time?: string | null
          action_type: string
          cause_and_measures?: string | null
          co_concentration?: number | null
          created_at?: string
          exceedance_time: string
          health_authority_name?: string | null
          health_authority_notified_time?: string | null
          id?: string
          log_id: string
          no2_concentration?: number | null
          reentry_authority?: string | null
          reentry_authorized_datetime?: string | null
        }
        Update: {
          acceptable_levels_restored_time?: string | null
          action_type?: string
          cause_and_measures?: string | null
          co_concentration?: number | null
          created_at?: string
          exceedance_time?: string
          health_authority_name?: string | null
          health_authority_notified_time?: string | null
          id?: string
          log_id?: string
          no2_concentration?: number | null
          reentry_authority?: string | null
          reentry_authorized_datetime?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "air_quality_actions_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: false
            referencedRelation: "air_quality_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      air_quality_equipment: {
        Row: {
          equipment_name: string
          fuel_type: string | null
          id: string
          log_id: string
          notes: string | null
        }
        Insert: {
          equipment_name: string
          fuel_type?: string | null
          id?: string
          log_id: string
          notes?: string | null
        }
        Update: {
          equipment_name?: string
          fuel_type?: string | null
          id?: string
          log_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "air_quality_equipment_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: false
            referencedRelation: "air_quality_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      air_quality_logs: {
        Row: {
          arena_status: string | null
          co_monitor_calibration_date: string | null
          co_monitor_model: string | null
          co_monitor_type: string | null
          created_at: string
          electric_equipment_consideration: string | null
          facility_id: string
          id: string
          log_date: string
          log_time: string
          no2_monitor_calibration_date: string | null
          no2_monitor_model: string | null
          no2_monitor_type: string | null
          other_equipment_last_maintenance: string | null
          public_signage_present: boolean | null
          resurfacer_last_maintenance: string | null
          staff_trained: boolean | null
          status: string
          submitted_by: string
          tester_certification: string | null
          tester_name: string | null
          unusual_observations: string | null
          updated_at: string
          ventilation_last_inspection: string | null
          ventilation_last_maintenance: string | null
          ventilation_status: string | null
        }
        Insert: {
          arena_status?: string | null
          co_monitor_calibration_date?: string | null
          co_monitor_model?: string | null
          co_monitor_type?: string | null
          created_at?: string
          electric_equipment_consideration?: string | null
          facility_id: string
          id?: string
          log_date: string
          log_time: string
          no2_monitor_calibration_date?: string | null
          no2_monitor_model?: string | null
          no2_monitor_type?: string | null
          other_equipment_last_maintenance?: string | null
          public_signage_present?: boolean | null
          resurfacer_last_maintenance?: string | null
          staff_trained?: boolean | null
          status?: string
          submitted_by: string
          tester_certification?: string | null
          tester_name?: string | null
          unusual_observations?: string | null
          updated_at?: string
          ventilation_last_inspection?: string | null
          ventilation_last_maintenance?: string | null
          ventilation_status?: string | null
        }
        Update: {
          arena_status?: string | null
          co_monitor_calibration_date?: string | null
          co_monitor_model?: string | null
          co_monitor_type?: string | null
          created_at?: string
          electric_equipment_consideration?: string | null
          facility_id?: string
          id?: string
          log_date?: string
          log_time?: string
          no2_monitor_calibration_date?: string | null
          no2_monitor_model?: string | null
          no2_monitor_type?: string | null
          other_equipment_last_maintenance?: string | null
          public_signage_present?: boolean | null
          resurfacer_last_maintenance?: string | null
          staff_trained?: boolean | null
          status?: string
          submitted_by?: string
          tester_certification?: string | null
          tester_name?: string | null
          unusual_observations?: string | null
          updated_at?: string
          ventilation_last_inspection?: string | null
          ventilation_last_maintenance?: string | null
          ventilation_status?: string | null
        }
        Relationships: []
      }
      air_quality_measurements: {
        Row: {
          actions_taken: string | null
          co_instant: number | null
          co_one_hour_avg: number | null
          created_at: string
          id: string
          location: string
          log_id: string
          measurement_time: string
          measurement_type: string
          no2_instant: number | null
          no2_one_hour_avg: number | null
          notes: string | null
        }
        Insert: {
          actions_taken?: string | null
          co_instant?: number | null
          co_one_hour_avg?: number | null
          created_at?: string
          id?: string
          location: string
          log_id: string
          measurement_time: string
          measurement_type?: string
          no2_instant?: number | null
          no2_one_hour_avg?: number | null
          notes?: string | null
        }
        Update: {
          actions_taken?: string | null
          co_instant?: number | null
          co_one_hour_avg?: number | null
          created_at?: string
          id?: string
          location?: string
          log_id?: string
          measurement_time?: string
          measurement_type?: string
          no2_instant?: number | null
          no2_one_hour_avg?: number | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "air_quality_measurements_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: false
            referencedRelation: "air_quality_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      air_quality_resurfacers: {
        Row: {
          fuel_type: string | null
          id: string
          log_id: string
          make_model: string | null
          unit_number: number
        }
        Insert: {
          fuel_type?: string | null
          id?: string
          log_id: string
          make_model?: string | null
          unit_number: number
        }
        Update: {
          fuel_type?: string | null
          id?: string
          log_id?: string
          make_model?: string | null
          unit_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "air_quality_resurfacers_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: false
            referencedRelation: "air_quality_logs"
            referencedColumns: ["id"]
          },
        ]
      }
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
      daily_report_financials: {
        Row: {
          amount: number
          category: string
          description: string | null
          id: string
          payment_method: string | null
          recorded_at: string
          report_id: string
          transaction_type: string
        }
        Insert: {
          amount: number
          category: string
          description?: string | null
          id?: string
          payment_method?: string | null
          recorded_at?: string
          report_id: string
          transaction_type: string
        }
        Update: {
          amount?: number
          category?: string
          description?: string | null
          id?: string
          payment_method?: string | null
          recorded_at?: string
          report_id?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_report_financials_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_report_tasks: {
        Row: {
          category_id: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          description: string | null
          id: string
          notes: string | null
          report_id: string
          status: string
          subcategory_id: string | null
          task_name: string
          work_area_id: string | null
        }
        Insert: {
          category_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          report_id: string
          status?: string
          subcategory_id?: string | null
          task_name: string
          work_area_id?: string | null
        }
        Update: {
          category_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          report_id?: string
          status?: string
          subcategory_id?: string | null
          task_name?: string
          work_area_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_report_tasks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "task_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_report_tasks_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_report_tasks_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "task_subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_report_tasks_work_area_id_fkey"
            columns: ["work_area_id"]
            isOneToOne: false
            referencedRelation: "work_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_reports: {
        Row: {
          created_at: string
          duty_type: string | null
          facility_id: string
          id: string
          notes: string | null
          petty_cash_balance: number | null
          report_date: string
          shift_type: string
          status: string
          submitted_by: string
          total_expenses: number | null
          total_revenue: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          duty_type?: string | null
          facility_id: string
          id?: string
          notes?: string | null
          petty_cash_balance?: number | null
          report_date: string
          shift_type: string
          status?: string
          submitted_by: string
          total_expenses?: number | null
          total_revenue?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          duty_type?: string | null
          facility_id?: string
          id?: string
          notes?: string | null
          petty_cash_balance?: number | null
          report_date?: string
          shift_type?: string
          status?: string
          submitted_by?: string
          total_expenses?: number | null
          total_revenue?: number | null
          updated_at?: string
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
      incident_follow_ups: {
        Row: {
          created_at: string
          follow_up_by: string
          follow_up_date: string
          follow_up_notes: string
          id: string
          incident_id: string
        }
        Insert: {
          created_at?: string
          follow_up_by: string
          follow_up_date: string
          follow_up_notes: string
          id?: string
          incident_id: string
        }
        Update: {
          created_at?: string
          follow_up_by?: string
          follow_up_date?: string
          follow_up_notes?: string
          id?: string
          incident_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_follow_ups_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          activity_at_time: string
          additional_injury_details: string | null
          additional_notes: string | null
          ambulance_called: boolean | null
          created_at: string
          facility_id: string
          id: string
          immediate_action_taken: string
          incident_date: string
          incident_description: string
          incident_number: string
          incident_time: string
          incident_type: string
          injured_person_address: string | null
          injured_person_age: number | null
          injured_person_email: string | null
          injured_person_gender: string | null
          injured_person_name: string
          injured_person_phone: string | null
          injury_locations: Json | null
          location: string
          medical_attention_required: string | null
          medical_facility_name: string | null
          report_date: string
          report_time: string
          severity_level: string
          staff_email: string | null
          staff_id: string
          staff_name: string
          staff_phone: string | null
          staff_position: string
          status: string
          updated_at: string
          witness_email: string | null
          witness_name: string | null
          witness_phone: string | null
        }
        Insert: {
          activity_at_time: string
          additional_injury_details?: string | null
          additional_notes?: string | null
          ambulance_called?: boolean | null
          created_at?: string
          facility_id: string
          id?: string
          immediate_action_taken: string
          incident_date: string
          incident_description: string
          incident_number: string
          incident_time: string
          incident_type: string
          injured_person_address?: string | null
          injured_person_age?: number | null
          injured_person_email?: string | null
          injured_person_gender?: string | null
          injured_person_name: string
          injured_person_phone?: string | null
          injury_locations?: Json | null
          location: string
          medical_attention_required?: string | null
          medical_facility_name?: string | null
          report_date: string
          report_time: string
          severity_level: string
          staff_email?: string | null
          staff_id: string
          staff_name: string
          staff_phone?: string | null
          staff_position: string
          status?: string
          updated_at?: string
          witness_email?: string | null
          witness_name?: string | null
          witness_phone?: string | null
        }
        Update: {
          activity_at_time?: string
          additional_injury_details?: string | null
          additional_notes?: string | null
          ambulance_called?: boolean | null
          created_at?: string
          facility_id?: string
          id?: string
          immediate_action_taken?: string
          incident_date?: string
          incident_description?: string
          incident_number?: string
          incident_time?: string
          incident_type?: string
          injured_person_address?: string | null
          injured_person_age?: number | null
          injured_person_email?: string | null
          injured_person_gender?: string | null
          injured_person_name?: string
          injured_person_phone?: string | null
          injury_locations?: Json | null
          location?: string
          medical_attention_required?: string | null
          medical_facility_name?: string | null
          report_date?: string
          report_time?: string
          severity_level?: string
          staff_email?: string | null
          staff_id?: string
          staff_name?: string
          staff_phone?: string | null
          staff_position?: string
          status?: string
          updated_at?: string
          witness_email?: string | null
          witness_name?: string | null
          witness_phone?: string | null
        }
        Relationships: []
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
      profiles: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string | null
          email_notifications_enabled: boolean | null
          facility_id: string | null
          force_email_change: boolean | null
          id: string
          name: string
          phone_number: string | null
          sms_notifications_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email_notifications_enabled?: boolean | null
          facility_id?: string | null
          force_email_change?: boolean | null
          id: string
          name: string
          phone_number?: string | null
          sms_notifications_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email_notifications_enabled?: boolean | null
          facility_id?: string | null
          force_email_change?: boolean | null
          id?: string
          name?: string
          phone_number?: string | null
          sms_notifications_enabled?: boolean | null
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
          ambient_temperature: number | null
          brine_flow_rate: number | null
          brine_temp_return: number | null
          brine_temp_supply: number | null
          compressor_amps: number | null
          condenser_fan_status: string | null
          condenser_pressure: number | null
          created_at: string
          discharge_pressure: number | null
          evaporator_pressure: number | null
          facility_id: string
          ice_surface_temp: number | null
          id: string
          log_date: string
          notes: string | null
          oil_pressure: number | null
          oil_temperature: number | null
          operator_id: string
          reading_number: number
          suction_pressure: number | null
          temperature_unit: string
          water_temp_in: number | null
          water_temp_out: number | null
        }
        Insert: {
          ambient_temperature?: number | null
          brine_flow_rate?: number | null
          brine_temp_return?: number | null
          brine_temp_supply?: number | null
          compressor_amps?: number | null
          condenser_fan_status?: string | null
          condenser_pressure?: number | null
          created_at?: string
          discharge_pressure?: number | null
          evaporator_pressure?: number | null
          facility_id: string
          ice_surface_temp?: number | null
          id?: string
          log_date?: string
          notes?: string | null
          oil_pressure?: number | null
          oil_temperature?: number | null
          operator_id: string
          reading_number?: number
          suction_pressure?: number | null
          temperature_unit?: string
          water_temp_in?: number | null
          water_temp_out?: number | null
        }
        Update: {
          ambient_temperature?: number | null
          brine_flow_rate?: number | null
          brine_temp_return?: number | null
          brine_temp_supply?: number | null
          compressor_amps?: number | null
          condenser_fan_status?: string | null
          condenser_pressure?: number | null
          created_at?: string
          discharge_pressure?: number | null
          evaporator_pressure?: number | null
          facility_id?: string
          ice_surface_temp?: number | null
          id?: string
          log_date?: string
          notes?: string | null
          oil_pressure?: number | null
          oil_temperature?: number | null
          operator_id?: string
          reading_number?: number
          suction_pressure?: number | null
          temperature_unit?: string
          water_temp_in?: number | null
          water_temp_out?: number | null
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
      report_templates: {
        Row: {
          created_at: string
          duty_type: string | null
          facility_id: string
          id: string
          is_active: boolean
          shift_type: string | null
          template_config: Json
          template_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duty_type?: string | null
          facility_id: string
          id?: string
          is_active?: boolean
          shift_type?: string | null
          template_config?: Json
          template_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duty_type?: string | null
          facility_id?: string
          id?: string
          is_active?: boolean
          shift_type?: string | null
          template_config?: Json
          template_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      resurfacing_machines: {
        Row: {
          created_at: string
          facility_id: string
          fuel_type: string | null
          id: string
          model: string | null
          name: string
        }
        Insert: {
          created_at?: string
          facility_id: string
          fuel_type?: string | null
          id?: string
          model?: string | null
          name: string
        }
        Update: {
          created_at?: string
          facility_id?: string
          fuel_type?: string | null
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
      schedule_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean
          notes: string | null
          staff_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean
          notes?: string | null
          staff_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean
          notes?: string | null
          staff_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_availability_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "schedule_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_roles: {
        Row: {
          color: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          required_certification: string | null
          sort_order: number
        }
        Insert: {
          color: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          required_certification?: string | null
          sort_order?: number
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          required_certification?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      schedule_shift_responses: {
        Row: {
          created_at: string
          decline_reason: string | null
          id: string
          response: string
          response_date: string | null
          shift_id: string
          staff_id: string
        }
        Insert: {
          created_at?: string
          decline_reason?: string | null
          id?: string
          response?: string
          response_date?: string | null
          shift_id: string
          staff_id: string
        }
        Update: {
          created_at?: string
          decline_reason?: string | null
          id?: string
          response?: string
          response_date?: string | null
          shift_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_shift_responses_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "schedule_shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_shift_responses_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "schedule_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_shift_swaps: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          manager_notes: string | null
          reason: string | null
          requested_by: string
          requested_to: string
          shift_id: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          manager_notes?: string | null
          reason?: string | null
          requested_by: string
          requested_to: string
          shift_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          manager_notes?: string | null
          reason?: string | null
          requested_by?: string
          requested_to?: string
          shift_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_shift_swaps_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "schedule_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_shift_swaps_requested_to_fkey"
            columns: ["requested_to"]
            isOneToOne: false
            referencedRelation: "schedule_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_shift_swaps_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "schedule_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_shifts: {
        Row: {
          area: string
          assigned_staff_id: string | null
          created_at: string
          created_by: string
          date: string
          end_time: string
          id: string
          notes: string | null
          role_id: string
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          area: string
          assigned_staff_id?: string | null
          created_at?: string
          created_by: string
          date: string
          end_time: string
          id?: string
          notes?: string | null
          role_id: string
          start_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          area?: string
          assigned_staff_id?: string | null
          created_at?: string
          created_by?: string
          date?: string
          end_time?: string
          id?: string
          notes?: string | null
          role_id?: string
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_shifts_assigned_staff_id_fkey"
            columns: ["assigned_staff_id"]
            isOneToOne: false
            referencedRelation: "schedule_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_shifts_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "schedule_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_staff: {
        Row: {
          created_at: string
          email: string
          employment_status: string
          full_name: string
          hire_date: string
          id: string
          notes: string | null
          phone_number: string | null
          target_hours_per_week: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          employment_status?: string
          full_name: string
          hire_date: string
          id?: string
          notes?: string | null
          phone_number?: string | null
          target_hours_per_week?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          employment_status?: string
          full_name?: string
          hire_date?: string
          id?: string
          notes?: string | null
          phone_number?: string | null
          target_hours_per_week?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      schedule_staff_roles: {
        Row: {
          certification_expires: string | null
          certified_date: string | null
          created_at: string
          id: string
          role_id: string
          staff_id: string
        }
        Insert: {
          certification_expires?: string | null
          certified_date?: string | null
          created_at?: string
          id?: string
          role_id: string
          staff_id: string
        }
        Update: {
          certification_expires?: string | null
          certified_date?: string | null
          created_at?: string
          id?: string
          role_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_staff_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "schedule_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_staff_roles_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "schedule_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_time_off: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          end_date: string
          id: string
          manager_response: string | null
          reason: string | null
          request_type: string
          staff_id: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          end_date: string
          id?: string
          manager_response?: string | null
          reason?: string | null
          request_type: string
          staff_id: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          end_date?: string
          id?: string
          manager_response?: string | null
          reason?: string | null
          request_type?: string
          staff_id?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_time_off_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "schedule_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      task_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          facility_id: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          work_area_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          facility_id: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          work_area_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          facility_id?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          work_area_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_categories_work_area_id_fkey"
            columns: ["work_area_id"]
            isOneToOne: false
            referencedRelation: "work_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      task_subcategories: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "task_categories"
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
      work_areas: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          facility_id: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          facility_id: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          facility_id?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_incident_number: { Args: never; Returns: string }
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
