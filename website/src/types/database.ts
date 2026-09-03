export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          role: 'developer' | 'officer' | 'public'
          password_hash: string | null
          email_verified: boolean
          is_demo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          role?: 'developer' | 'officer' | 'public'
          password_hash?: string | null
          email_verified?: boolean
          is_demo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: 'developer' | 'officer' | 'public'
          password_hash?: string | null
          email_verified?: boolean
          is_demo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      officer_profiles: {
        Row: {
          user_id: string
          designation: string | null
          jurisdiction: string | null
          department: string | null
          badge_id: string | null
        }
        Insert: {
          user_id: string
          designation?: string | null
          jurisdiction?: string | null
          department?: string | null
          badge_id?: string | null
        }
        Update: {
          user_id?: string
          designation?: string | null
          jurisdiction?: string | null
          department?: string | null
          badge_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "officer_profiles_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      public_profiles: {
        Row: {
          user_id: string
          phone: string | null
          anonymous_allowed: boolean
        }
        Insert: {
          user_id: string
          phone?: string | null
          anonymous_allowed?: boolean
        }
        Update: {
          user_id?: string
          phone?: string | null
          anonymous_allowed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "public_profiles_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      public_reports: {
        Row: {
          id: string
          title: string | null
          description: string
          category: 'GROUND_CRACK' | 'SLOPE_MOVEMENT' | 'FALLEN_DEBRIS' | 'BLOCKED_ROAD' | 'ROCKFALL' | 'WATER_SEEPAGE' | 'LANDSLIDE' | 'DAMAGED_INFRA'
          severity: 'LOW' | 'MODERATE' | 'HIGH'
          lat: number
          lon: number
          reporter_id: string | null
          status: 'NEW' | 'UNDER_REVIEW' | 'ASSIGNED' | 'FIELD_VERIFICATION' | 'RESOLVED' | 'DISMISSED'
          nearest_grid_cell: string | null
          nearest_village: string | null
          nearest_road: string | null
          anonymous: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title?: string | null
          description: string
          category: 'GROUND_CRACK' | 'SLOPE_MOVEMENT' | 'FALLEN_DEBRIS' | 'BLOCKED_ROAD' | 'ROCKFALL' | 'WATER_SEEPAGE' | 'LANDSLIDE' | 'DAMAGED_INFRA'
          severity: 'LOW' | 'MODERATE' | 'HIGH'
          lat: number
          lon: number
          reporter_id?: string | null
          status?: 'NEW' | 'UNDER_REVIEW' | 'ASSIGNED' | 'FIELD_VERIFICATION' | 'RESOLVED' | 'DISMISSED'
          nearest_grid_cell?: string | null
          nearest_village?: string | null
          nearest_road?: string | null
          anonymous?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string | null
          description?: string
          category?: 'GROUND_CRACK' | 'SLOPE_MOVEMENT' | 'FALLEN_DEBRIS' | 'BLOCKED_ROAD' | 'ROCKFALL' | 'WATER_SEEPAGE' | 'LANDSLIDE' | 'DAMAGED_INFRA'
          severity?: 'LOW' | 'MODERATE' | 'HIGH'
          lat?: number
          lon?: number
          reporter_id?: string | null
          status?: 'NEW' | 'UNDER_REVIEW' | 'ASSIGNED' | 'FIELD_VERIFICATION' | 'RESOLVED' | 'DISMISSED'
          nearest_grid_cell?: string | null
          nearest_village?: string | null
          nearest_road?: string | null
          anonymous?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      report_media: {
        Row: {
          id: string
          report_id: string
          url: string
          thumbnail_url: string | null
          type: 'photo' | 'video'
          imagekit_file_id: string | null
          size_bytes: number | null
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          url: string
          thumbnail_url?: string | null
          type: 'photo' | 'video'
          imagekit_file_id?: string | null
          size_bytes?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          url?: string
          thumbnail_url?: string | null
          type?: 'photo' | 'video'
          imagekit_file_id?: string | null
          size_bytes?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_media_report_id_fkey"
            columns: ["report_id"]
            referencedRelation: "public_reports"
            referencedColumns: ["id"]
          }
        ]
      }
      decision_flags: {
        Row: {
          id: string
          type: 'DISCREPANCY' | 'HIGH_RISK_ASSET'
          related_report_id: string | null
          related_asset_id: string | null
          grid_id: string | null
          title: string
          description: string
          status: 'NEW' | 'UNDER_REVIEW' | 'ASSIGNED' | 'FIELD_VERIFICATION' | 'RESOLVED' | 'DISMISSED'
          recommended_action: string | null
          model_estimate: number | null
          field_severity: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: 'DISCREPANCY' | 'HIGH_RISK_ASSET'
          related_report_id?: string | null
          related_asset_id?: string | null
          grid_id?: string | null
          title: string
          description: string
          status?: 'NEW' | 'UNDER_REVIEW' | 'ASSIGNED' | 'FIELD_VERIFICATION' | 'RESOLVED' | 'DISMISSED'
          recommended_action?: string | null
          model_estimate?: number | null
          field_severity?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: 'DISCREPANCY' | 'HIGH_RISK_ASSET'
          related_report_id?: string | null
          related_asset_id?: string | null
          grid_id?: string | null
          title?: string
          description?: string
          status?: 'NEW' | 'UNDER_REVIEW' | 'ASSIGNED' | 'FIELD_VERIFICATION' | 'RESOLVED' | 'DISMISSED'
          recommended_action?: string | null
          model_estimate?: number | null
          field_severity?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_flags_related_report_id_fkey"
            columns: ["related_report_id"]
            referencedRelation: "public_reports"
            referencedColumns: ["id"]
          }
        ]
      }
      officer_actions: {
        Row: {
          id: string
          officer_id: string
          entity_type: 'REPORT' | 'FLAG' | 'ADVISORY'
          entity_id: string
          action: 'REVIEW' | 'ASSIGN' | 'ESCALATE' | 'CONFIRM' | 'DISMISS' | 'RESOLVE' | 'DRAFT' | 'PUBLISH' | 'WITHDRAW'
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          officer_id: string
          entity_type: 'REPORT' | 'FLAG' | 'ADVISORY'
          entity_id: string
          action: 'REVIEW' | 'ASSIGN' | 'ESCALATE' | 'CONFIRM' | 'DISMISS' | 'RESOLVE' | 'DRAFT' | 'PUBLISH' | 'WITHDRAW'
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          officer_id?: string
          entity_type?: 'REPORT' | 'FLAG' | 'ADVISORY'
          entity_id?: string
          action?: 'REVIEW' | 'ASSIGN' | 'ESCALATE' | 'CONFIRM' | 'DISMISS' | 'RESOLVE' | 'DRAFT' | 'PUBLISH' | 'WITHDRAW'
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "officer_actions_officer_id_fkey"
            columns: ["officer_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      advisories: {
        Row: {
          id: string
          type: 'INFORMATIONAL' | 'MONITOR' | 'TRAVEL_CAUTION' | 'ROAD_RESTRICTION' | 'PREPAREDNESS' | 'EVACUATION'
          title: string
          description: string
          severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
          area: string
          status: 'DRAFT' | 'PUBLISHED' | 'WITHDRAWN'
          published_by: string | null
          published_at: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: 'INFORMATIONAL' | 'MONITOR' | 'TRAVEL_CAUTION' | 'ROAD_RESTRICTION' | 'PREPAREDNESS' | 'EVACUATION'
          title: string
          description: string
          severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
          area: string
          status?: 'DRAFT' | 'PUBLISHED' | 'WITHDRAWN'
          published_by?: string | null
          published_at?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: 'INFORMATIONAL' | 'MONITOR' | 'TRAVEL_CAUTION' | 'ROAD_RESTRICTION' | 'PREPAREDNESS' | 'EVACUATION'
          title?: string
          description?: string
          severity?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
          area?: string
          status?: 'DRAFT' | 'PUBLISHED' | 'WITHDRAWN'
          published_by?: string | null
          published_at?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "advisories_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advisories_published_by_fkey"
            columns: ["published_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      audit_logs: {
        Row: {
          id: string
          actor_user_id: string
          actor_role: string
          action: string
          entity_type: string
          entity_id: string
          old_value: Json | null
          new_value: Json | null
          reason: string | null
          timestamp: string
        }
        Insert: {
          id?: string
          actor_user_id: string
          actor_role: string
          action: string
          entity_type: string
          entity_id: string
          old_value?: Json | null
          new_value?: Json | null
          reason?: string | null
          timestamp?: string
        }
        Update: {
          id?: string
          actor_user_id?: string
          actor_role?: string
          action?: string
          entity_type?: string
          entity_id?: string
          old_value?: Json | null
          new_value?: Json | null
          reason?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      grid_cells: {
        Row: {
          id: string
          geometry: Json
          risk_score: number
          risk_category: 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH'
          model_estimate: number
          rainfall_24h: number
          rainfall_72h: number
          rainfall_7d: number
          slope: number
          elevation: number
          aspect: string
          susceptibility: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH'
          land_cover: string
          confidence: 'LOW' | 'MODERATE' | 'HIGH'
          explanation: Json | null
          generated_at: string
          is_demo: boolean
        }
        Insert: {
          id: string
          geometry: Json
          risk_score: number
          risk_category: 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH'
          model_estimate: number
          rainfall_24h: number
          rainfall_72h: number
          rainfall_7d: number
          slope: number
          elevation: number
          aspect: string
          susceptibility: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH'
          land_cover: string
          confidence: 'LOW' | 'MODERATE' | 'HIGH'
          explanation?: Json | null
          generated_at?: string
          is_demo?: boolean
        }
        Update: {
          id?: string
          geometry?: Json
          risk_score?: number
          risk_category?: 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH'
          model_estimate?: number
          rainfall_24h?: number
          rainfall_72h?: number
          rainfall_7d?: number
          slope?: number
          elevation?: number
          aspect?: string
          susceptibility?: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH'
          land_cover?: string
          confidence?: 'LOW' | 'MODERATE' | 'HIGH'
          explanation?: Json | null
          generated_at?: string
          is_demo?: boolean
        }
        Relationships: []
      }
      villages: {
        Row: {
          id: string
          name: string
          lat: number
          lon: number
          risk_score: number
          priority: 'ROUTINE' | 'MONITOR' | 'ADVISORY' | 'PRIORITY_INSPECTION'
          exposure: number | null
          district: string | null
          is_demo: boolean
        }
        Insert: {
          id: string
          name: string
          lat: number
          lon: number
          risk_score: number
          priority: 'ROUTINE' | 'MONITOR' | 'ADVISORY' | 'PRIORITY_INSPECTION'
          exposure?: number | null
          district?: string | null
          is_demo?: boolean
        }
        Update: {
          id?: string
          name?: string
          lat?: number
          lon?: number
          risk_score?: number
          priority?: 'ROUTINE' | 'MONITOR' | 'ADVISORY' | 'PRIORITY_INSPECTION'
          exposure?: number | null
          district?: string | null
          is_demo?: boolean
        }
        Relationships: []
      }
      road_segments: {
        Row: {
          id: string
          name: string
          geometry: Json
          risk_score: number
          priority: 'ROUTINE' | 'MONITOR' | 'ADVISORY' | 'PRIORITY_INSPECTION'
          is_demo: boolean
        }
        Insert: {
          id: string
          name: string
          geometry: Json
          risk_score: number
          priority: 'ROUTINE' | 'MONITOR' | 'ADVISORY' | 'PRIORITY_INSPECTION'
          is_demo?: boolean
        }
        Update: {
          id?: string
          name?: string
          geometry?: Json
          risk_score?: number
          priority?: 'ROUTINE' | 'MONITOR' | 'ADVISORY' | 'PRIORITY_INSPECTION'
          is_demo?: boolean
        }
        Relationships: []
      }
      rainfall_records: {
        Row: {
          id: string
          location_id: string
          timestamp: string
          rainfall_24h: number
          rainfall_72h: number
          rainfall_7d: number
          trend: 'UP' | 'DOWN' | 'STABLE'
          source: string
          is_demo: boolean
        }
        Insert: {
          id?: string
          location_id: string
          timestamp: string
          rainfall_24h: number
          rainfall_72h: number
          rainfall_7d: number
          trend: 'UP' | 'DOWN' | 'STABLE'
          source: string
          is_demo?: boolean
        }
        Update: {
          id?: string
          location_id?: string
          timestamp?: string
          rainfall_24h?: number
          rainfall_72h?: number
          rainfall_7d?: number
          trend?: 'UP' | 'DOWN' | 'STABLE'
          source?: string
          is_demo?: boolean
        }
        Relationships: []
      }
      historical_events: {
        Row: {
          id: string
          date: string
          location: string
          lat: number
          lon: number
          source: string
          nearest_village: string | null
          nearest_road: string | null
          description: string | null
          is_demo: boolean
        }
        Insert: {
          id?: string
          date: string
          location: string
          lat: number
          lon: number
          source: string
          nearest_village?: string | null
          nearest_road?: string | null
          description?: string | null
          is_demo?: boolean
        }
        Update: {
          id?: string
          date?: string
          location?: string
          lat?: number
          lon?: number
          source?: string
          nearest_village?: string | null
          nearest_road?: string | null
          description?: string | null
          is_demo?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
