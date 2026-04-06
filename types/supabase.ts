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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      arrival_departure_days: {
        Row: {
          created_at: string | null
          day_name: string
          day_type: string
          house_id: number | null
          id: number
        }
        Insert: {
          created_at?: string | null
          day_name: string
          day_type: string
          house_id?: number | null
          id?: number
        }
        Update: {
          created_at?: string | null
          day_name?: string
          day_type?: string
          house_id?: number | null
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "arrival_departure_days_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_dates: {
        Row: {
          blocked_date: string
          created_at: string | null
          house_id: number | null
          id: number
          reason: string | null
        }
        Insert: {
          blocked_date: string
          created_at?: string | null
          house_id?: number | null
          id?: number
          reason?: string | null
        }
        Update: {
          blocked_date?: string
          created_at?: string | null
          house_id?: number | null
          id?: number
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_dates_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_rules: {
        Row: {
          created_at: string | null
          embedding_model: string | null
          house_id: number | null
          id: number
          rule_embedding: string | null
          rule_text: string
        }
        Insert: {
          created_at?: string | null
          embedding_model?: string | null
          house_id?: number | null
          id?: number
          rule_embedding?: string | null
          rule_text: string
        }
        Update: {
          created_at?: string | null
          embedding_model?: string | null
          house_id?: number | null
          id?: number
          rule_embedding?: string | null
          rule_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_rules_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
        ]
      }
      extra_costs: {
        Row: {
          amount: number | null
          cost_name: string
          created_at: string | null
          house_id: number | null
          id: number
          required: boolean | null
        }
        Insert: {
          amount?: number | null
          cost_name: string
          created_at?: string | null
          house_id?: number | null
          id?: number
          required?: boolean | null
        }
        Update: {
          amount?: number | null
          cost_name?: string
          created_at?: string | null
          house_id?: number | null
          id?: number
          required?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "extra_costs_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
        ]
      }
      house_amenities: {
        Row: {
          amenity_embedding: string | null
          amenity_name: string
          created_at: string | null
          embedding_model: string | null
          house_id: number | null
          id: number
        }
        Insert: {
          amenity_embedding?: string | null
          amenity_name: string
          created_at?: string | null
          embedding_model?: string | null
          house_id?: number | null
          id?: number
        }
        Update: {
          amenity_embedding?: string | null
          amenity_name?: string
          created_at?: string | null
          embedding_model?: string | null
          house_id?: number | null
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "house_amenities_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
        ]
      }
      house_facilities: {
        Row: {
          created_at: string | null
          facility_name: string
          house_id: number | null
          id: number
          included: boolean | null
        }
        Insert: {
          created_at?: string | null
          facility_name: string
          house_id?: number | null
          id?: number
          included?: boolean | null
        }
        Update: {
          created_at?: string | null
          facility_name?: string
          house_id?: number | null
          id?: number
          included?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "house_facilities_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
        ]
      }
      house_images: {
        Row: {
          created_at: string | null
          house_id: number | null
          id: number
          image_url: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          house_id?: number | null
          id?: number
          image_url: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          house_id?: number | null
          id?: number
          image_url?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "house_images_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
        ]
      }
      house_rules: {
        Row: {
          created_at: string | null
          embedding_model: string | null
          house_id: number | null
          id: number
          rule_embedding: string | null
          rule_type: string
          rule_value: string | null
        }
        Insert: {
          created_at?: string | null
          embedding_model?: string | null
          house_id?: number | null
          id?: number
          rule_embedding?: string | null
          rule_type: string
          rule_value?: string | null
        }
        Update: {
          created_at?: string | null
          embedding_model?: string | null
          house_id?: number | null
          id?: number
          rule_embedding?: string | null
          rule_type?: string
          rule_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "house_rules_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
        ]
      }
      houses: {
        Row: {
          accommodation_name: string
          amenities_embedding: string | null
          country: string
          created_at: string | null
          description: string | null
          description_embedding: string | null
          embedding_model: string | null
          embedding_updated_at: string | null
          energy_label: string | null
          has_public_transport: boolean | null
          host_id: string | null
          house_number: string | null
          id: number
          is_near_neighbors: boolean | null
          land_registration_option: string | null
          living_situation: string
          location: string | null
          location_embedding: string | null
          max_nights: number
          max_person: number
          min_nights: number
          place: string | null
          plot_size: string | null
          postal_code: string | null
          price_per_night: number | null
          region: string
          registration_number: string | null
          registration_number_option: string | null
          safety_deposit: string | null
          safety_deposit_amount: number | null
          search_embedding: string | null
          status: string | null
          street: string | null
          surroundings: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          accommodation_name: string
          amenities_embedding?: string | null
          country?: string
          created_at?: string | null
          description?: string | null
          description_embedding?: string | null
          embedding_model?: string | null
          embedding_updated_at?: string | null
          energy_label?: string | null
          has_public_transport?: boolean | null
          host_id?: string | null
          house_number?: string | null
          id?: number
          is_near_neighbors?: boolean | null
          land_registration_option?: string | null
          living_situation: string
          location?: string | null
          location_embedding?: string | null
          max_nights?: number
          max_person?: number
          min_nights?: number
          place?: string | null
          plot_size?: string | null
          postal_code?: string | null
          price_per_night?: number | null
          region?: string
          registration_number?: string | null
          registration_number_option?: string | null
          safety_deposit?: string | null
          safety_deposit_amount?: number | null
          search_embedding?: string | null
          status?: string | null
          street?: string | null
          surroundings?: string | null
          type?: string
          updated_at?: string | null
        }
        Update: {
          accommodation_name?: string
          amenities_embedding?: string | null
          country?: string
          created_at?: string | null
          description?: string | null
          description_embedding?: string | null
          embedding_model?: string | null
          embedding_updated_at?: string | null
          energy_label?: string | null
          has_public_transport?: boolean | null
          host_id?: string | null
          house_number?: string | null
          id?: number
          is_near_neighbors?: boolean | null
          land_registration_option?: string | null
          living_situation?: string
          location?: string | null
          location_embedding?: string | null
          max_nights?: number
          max_person?: number
          min_nights?: number
          place?: string | null
          plot_size?: string | null
          postal_code?: string | null
          price_per_night?: number | null
          region?: string
          registration_number?: string | null
          registration_number_option?: string | null
          safety_deposit?: string | null
          safety_deposit_amount?: number | null
          search_embedding?: string | null
          status?: string | null
          street?: string | null
          surroundings?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "house_images_house_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "house_images"
            referencedColumns: ["house_id"]
          },
          {
            foreignKeyName: "house_amenities_house_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "house_amenities"
            referencedColumns: ["house_id"]
          },
          {
            foreignKeyName: "house_facilities_house_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "house_facilities"
            referencedColumns: ["house_id"]
          },
          {
            foreignKeyName: "house_rules_house_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "house_rules"
            referencedColumns: ["house_id"]
          },
          {
            foreignKeyName: "person_pricing_house_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "person_pricing"
            referencedColumns: ["house_id"]
          },
          {
            foreignKeyName: "extra_costs_house_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "extra_costs"
            referencedColumns: ["house_id"]
          },
          {
            foreignKeyName: "sustainability_features_house_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "sustainability_features"
            referencedColumns: ["house_id"]
          },
          {
            foreignKeyName: "blocked_dates_house_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "blocked_dates"
            referencedColumns: ["house_id"]
          },
          {
            foreignKeyName: "arrival_departure_days_house_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "arrival_departure_days"
            referencedColumns: ["house_id"]
          },
          {
            foreignKeyName: "custom_rules_house_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "custom_rules"
            referencedColumns: ["house_id"]
          },
        ]
      }
      person_pricing: {
        Row: {
          additional_person_price: number | null
          base_persons: number
          created_at: string | null
          house_id: number | null
          id: number
        }
        Insert: {
          additional_person_price?: number | null
          base_persons?: number
          created_at?: string | null
          house_id?: number | null
          id?: number
        }
        Update: {
          additional_person_price?: number | null
          base_persons?: number
          created_at?: string | null
          house_id?: number | null
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "person_pricing_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_tiers: {
        Row: {
          created_at: string | null
          house_id: number | null
          id: number
          price: number | null
          tier_type: string | null
        }
        Insert: {
          created_at?: string | null
          house_id?: number | null
          id?: number
          price?: number | null
          tier_type?: string | null
        }
        Update: {
          created_at?: string | null
          house_id?: number | null
          id?: number
          price?: number | null
          tier_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_tiers_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          id: number
          house_id: number
          room_name: string
          room_type: string
          room_number: string | null
          floor_level: number | null
          size_sqm: number | null
          ceiling_height: number | null
          bed_type: string | null
          bed_count: number | null
          max_occupants: number | null
          has_private_bathroom: boolean | null
          has_private_kitchen: boolean | null
          has_private_entrance: boolean | null
          has_balcony: boolean | null
          has_terrace: boolean | null
          has_air_conditioning: boolean | null
          has_heating: boolean | null
          has_tv: boolean | null
          has_wifi: boolean | null
          has_desk: boolean | null
          has_wardrobe: boolean | null
          has_safety_box: boolean | null
          window_count: number | null
          window_direction: string | null
          has_blackout_curtains: boolean | null
          is_wheelchair_accessible: boolean | null
          has_ground_floor_access: boolean | null
          description: string | null
          price_per_night: number | null
          min_nights: number | null
          is_active: boolean | null
          is_available: boolean | null
          created_at: string | null
          updated_at: string | null
          search_embedding: unknown | null
          description_embedding: unknown | null
          features_embedding: unknown | null
          embedding_model: string | null
          embedding_updated_at: string | null
        }
        Insert: {
          id?: number
          house_id?: number
          room_name: string
          room_type: string
          room_number?: string | null
          floor_level?: number | null
          size_sqm?: number | null
          ceiling_height?: number | null
          bed_type?: string | null
          bed_count?: number | null
          max_occupants?: number | null
          has_private_bathroom?: boolean | null
          has_private_kitchen?: boolean | null
          has_private_entrance?: boolean | null
          has_balcony?: boolean | null
          has_terrace?: boolean | null
          has_air_conditioning?: boolean | null
          has_heating?: boolean | null
          has_tv?: boolean | null
          has_wifi?: boolean | null
          has_desk?: boolean | null
          has_wardrobe?: boolean | null
          has_safety_box?: boolean | null
          window_count?: number | null
          window_direction?: string | null
          has_blackout_curtains?: boolean | null
          is_wheelchair_accessible?: boolean | null
          has_ground_floor_access?: boolean | null
          description?: string | null
          price_per_night?: number | null
          min_nights?: number | null
          is_active?: boolean | null
          is_available?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          search_embedding?: unknown | null
          description_embedding?: unknown | null
          features_embedding?: unknown | null
          embedding_model?: string | null
          embedding_updated_at?: string | null
        }
        Update: {
          id?: number
          house_id?: number
          room_name?: string
          room_type?: string
          room_number?: string | null
          floor_level?: number | null
          size_sqm?: number | null
          ceiling_height?: number | null
          bed_type?: string | null
          bed_count?: number | null
          max_occupants?: number | null
          has_private_bathroom?: boolean | null
          has_private_kitchen?: boolean | null
          has_private_entrance?: boolean | null
          has_balcony?: boolean | null
          has_terrace?: boolean | null
          has_air_conditioning?: boolean | null
          has_heating?: boolean | null
          has_tv?: boolean | null
          has_wifi?: boolean | null
          has_desk?: boolean | null
          has_wardrobe?: boolean | null
          has_safety_box?: boolean | null
          window_count?: number | null
          window_direction?: string | null
          has_blackout_curtains?: boolean | null
          is_wheelchair_accessible?: boolean | null
          has_ground_floor_access?: boolean | null
          description?: string | null
          price_per_night?: number | null
          min_nights?: number | null
          is_active?: boolean | null
          is_available?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          search_embedding?: unknown | null
          description_embedding?: unknown | null
          features_embedding?: unknown | null
          embedding_model?: string | null
          embedding_updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
        ]
      }
      room_amenities: {
        Row: {
          amenity_embedding: string | null
          amenity_name: string
          amenity_type: string | null
          created_at: string | null
          embedding_model: string | null
          id: number
          quantity: number | null
          room_id: number | null
        }
        Insert: {
          amenity_embedding?: string | null
          amenity_name: string
          amenity_type?: string | null
          created_at?: string | null
          embedding_model?: string | null
          id?: number
          quantity?: number | null
          room_id?: number | null
        }
        Update: {
          amenity_embedding?: string | null
          amenity_name?: string
          amenity_type?: string | null
          created_at?: string | null
          embedding_model?: string | null
          id?: number
          quantity?: number | null
          room_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "room_amenities_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_images: {
        Row: {
          created_at: string | null
          id: number
          image_type: string | null
          image_url: string
          room_id: number | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          image_type?: string | null
          image_url: string
          room_id?: number | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          image_type?: string | null
          image_url?: string
          room_id?: number | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "room_images_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      sustainability_features: {
        Row: {
          created_at: string | null
          embedding_model: string | null
          feature_embedding: string | null
          feature_key: string
          feature_value: string | null
          house_id: number | null
          id: number
        }
        Insert: {
          created_at?: string | null
          embedding_model?: string | null
          feature_embedding?: string | null
          feature_key: string
          feature_value?: string | null
          house_id?: number | null
          id?: number
        }
        Update: {
          created_at?: string | null
          embedding_model?: string | null
          feature_embedding?: string | null
          feature_key?: string
          feature_value?: string | null
          house_id?: number | null
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "sustainability_features_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          alternative_email: string | null
          auth_user_id: string
          avatar_url: string | null
          business_license: string | null
          city: string | null
          company_name: string | null
          coordinates: unknown | null
          country: string
          created_at: string
          currency_preference: string
          date_of_birth: string | null
          display_name: string | null
          email: string
          email_notifications: boolean
          first_name: string | null
          gender: Database["public"]["Enums"]["user_gender"] | null
          id: string
          is_verified: boolean
          last_login_at: string | null
          last_name: string | null
          marketing_emails: boolean
          metadata: Json | null
          nationality: string | null
          payment_methods: Json | null
          phone_country_code: string | null
          phone_full: string | null
          phone_number: string | null
          phone_verification_code: string | null
          phone_verified: boolean
          postal_code: string | null
          preferences: Json | null
          preferred_language: string
          role: Database["public"]["Enums"]["user_role"]
          sms_notifications: boolean
          state: string | null
          status: Database["public"]["Enums"]["user_status"]
          stripe_customer_id: string | null
          tax_id: string | null
          timezone: string
          updated_at: string
          verification_document_url: string | null
          website: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          alternative_email?: string | null
          auth_user_id: string
          avatar_url?: string | null
          business_license?: string | null
          city?: string | null
          company_name?: string | null
          coordinates?: unknown | null
          country?: string
          created_at?: string
          currency_preference?: string
          date_of_birth?: string | null
          display_name?: string | null
          email: string
          email_notifications?: boolean
          first_name?: string | null
          gender?: Database["public"]["Enums"]["user_gender"] | null
          id?: string
          is_verified?: boolean
          last_login_at?: string | null
          last_name?: string | null
          marketing_emails?: boolean
          metadata?: Json | null
          nationality?: string | null
          payment_methods?: Json | null
          phone_country_code?: string | null
          phone_full?: string | null
          phone_number?: string | null
          phone_verification_code?: string | null
          phone_verified?: boolean
          postal_code?: string | null
          preferences?: Json | null
          preferred_language?: string
          role?: Database["public"]["Enums"]["user_role"]
          sms_notifications?: boolean
          state?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          stripe_customer_id?: string | null
          tax_id?: string | null
          timezone?: string
          updated_at?: string
          verification_document_url?: string | null
          website?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          alternative_email?: string | null
          auth_user_id?: string
          avatar_url?: string | null
          business_license?: string | null
          city?: string | null
          company_name?: string | null
          coordinates?: unknown | null
          country?: string
          created_at?: string
          currency_preference?: string
          date_of_birth?: string | null
          display_name?: string | null
          email?: string
          email_notifications?: boolean
          first_name?: string | null
          gender?: Database["public"]["Enums"]["user_gender"] | null
          id?: string
          is_verified?: boolean
          last_login_at?: string | null
          last_name?: string | null
          marketing_emails?: boolean
          metadata?: Json | null
          nationality?: string | null
          payment_methods?: Json | null
          phone_country_code?: string | null
          phone_full?: string | null
          phone_number?: string | null
          phone_verification_code?: string | null
          phone_verified?: boolean
          postal_code?: string | null
          preferences?: Json | null
          preferred_language?: string
          role?: Database["public"]["Enums"]["user_role"]
          sms_notifications?: boolean
          state?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          stripe_customer_id?: string | null
          tax_id?: string | null
          timezone?: string
          updated_at?: string
          verification_document_url?: string | null
          website?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_documents: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: number
          similarity: number
          title: string
        }[]
      }
    }
    Enums: {
      user_gender: "male" | "female" | "other" | "prefer_not_to_say"
      user_role: "user" | "landlord" | "admin"
      user_status: "active" | "inactive" | "suspended" | "pending_verification"
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
      user_gender: ["male", "female", "other", "prefer_not_to_say"],
      user_role: ["user", "landlord", "admin"],
      user_status: ["active", "inactive", "suspended", "pending_verification"],
    },
  },
} as const
