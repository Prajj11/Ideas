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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      emergency_contacts: {
        Row: {
          category: string
          id: string
          name: string
          note: string | null
          phone: string
          sort_order: number
        }
        Insert: {
          category: string
          id?: string
          name: string
          note?: string | null
          phone: string
          sort_order?: number
        }
        Update: {
          category?: string
          id?: string
          name?: string
          note?: string | null
          phone?: string
          sort_order?: number
        }
        Relationships: []
      }
      itineraries: {
        Row: {
          created_at: string
          hours: number
          id: string
          interests: string[]
          pace: string
          place: string
          plan: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          hours?: number
          id?: string
          interests?: string[]
          pace?: string
          place: string
          plan: Json
          user_id: string
        }
        Update: {
          created_at?: string
          hours?: number
          id?: string
          interests?: string[]
          pace?: string
          place?: string
          plan?: Json
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
      safety_tags: {
        Row: {
          alt_phone: string | null
          category: string
          created_at: string
          description: string | null
          guardian_name: string
          guardian_phone: string
          id: string
          medical_notes: string | null
          person_age: number | null
          person_name: string
          staying_at: string | null
          token: string
          user_id: string
        }
        Insert: {
          alt_phone?: string | null
          category?: string
          created_at?: string
          description?: string | null
          guardian_name: string
          guardian_phone: string
          id?: string
          medical_notes?: string | null
          person_age?: number | null
          person_name: string
          staying_at?: string | null
          token?: string
          user_id: string
        }
        Update: {
          alt_phone?: string | null
          category?: string
          created_at?: string
          description?: string | null
          guardian_name?: string
          guardian_phone?: string
          id?: string
          medical_notes?: string | null
          person_age?: number | null
          person_name?: string
          staying_at?: string | null
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_places: {
        Row: {
          category: string
          created_at: string
          id: string
          image_url: string | null
          lat: number | null
          lng: number | null
          notes: string | null
          place_name: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          image_url?: string | null
          lat?: number | null
          lng?: number | null
          notes?: string | null
          place_name: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          image_url?: string | null
          lat?: number | null
          lng?: number | null
          notes?: string | null
          place_name?: string
          user_id?: string
        }
        Relationships: []
      }
      travellers: {
        Row: {
          age: number | null
          category: string
          created_at: string
          id: string
          name: string
          trip_id: string
          user_id: string
        }
        Insert: {
          age?: number | null
          category?: string
          created_at?: string
          id?: string
          name: string
          trip_id: string
          user_id: string
        }
        Update: {
          age?: number | null
          category?: string
          created_at?: string
          id?: string
          name?: string
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "travellers_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          created_at: string
          days: number
          destination: string
          id: string
          start_date: string | null
          travel_style: string
          traveller_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days?: number
          destination: string
          id?: string
          start_date?: string | null
          travel_style?: string
          traveller_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          days?: number
          destination?: string
          id?: string
          start_date?: string | null
          travel_style?: string
          traveller_name?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_safety_tag: {
        Args: { _token: string }
        Returns: {
          alt_phone: string
          category: string
          description: string
          guardian_name: string
          guardian_phone: string
          medical_notes: string
          person_age: number
          person_name: string
          staying_at: string
        }[]
      }
      check_safety_tag: {
        Args: { _token: string }
        Returns: {
          tag_id: string
          category: string
          is_active: boolean
        }[]
      }
      notify_safety_tag: {
        Args: { _token: string; _finder_note?: string | null; _finder_contact?: string | null }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
