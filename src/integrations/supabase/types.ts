export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      login_attempts: {
        Row: {
          created_at: string
          email: string
          fingerprint: string | null
          id: string
          ip_address: unknown | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          fingerprint?: string | null
          id?: string
          ip_address?: unknown | null
          success: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          fingerprint?: string | null
          id?: string
          ip_address?: unknown | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "login_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_verifications: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          token: string
          type: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          token: string
          type?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          token?: string
          type?: string
          used_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          cnam_verified: boolean | null
          created_at: string
          face_verified: boolean | null
          full_name: string
          id: string
          is_verified: boolean | null
          oneci_verified: boolean | null
          phone: string | null
          ui_density: string | null
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          cnam_verified?: boolean | null
          created_at?: string
          face_verified?: boolean | null
          full_name: string
          id: string
          is_verified?: boolean | null
          oneci_verified?: boolean | null
          phone?: string | null
          ui_density?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          cnam_verified?: boolean | null
          created_at?: string
          face_verified?: boolean | null
          full_name?: string
          id?: string
          is_verified?: boolean | null
          oneci_verified?: boolean | null
          phone?: string | null
          ui_density?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      user_active_roles: {
        Row: {
          active_role: Database["public"]["Enums"]["user_type"]
          available_roles: Database["public"]["Enums"]["user_type"][] | null
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active_role: Database["public"]["Enums"]["user_type"]
          available_roles?: Database["public"]["Enums"]["user_type"][] | null
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active_role?: Database["public"]["Enums"]["user_type"]
          available_roles?: Database["public"]["Enums"]["user_type"][] | null
          created_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_active_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown | null
          is_active: boolean | null
          last_accessed_at: string
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_accessed_at?: string
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_accessed_at?: string
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_verifications: {
        Row: {
          cnam_data: Json | null
          cnam_status: Database["public"]["Enums"]["verification_status"] | null
          created_at: string
          face_data: Json | null
          face_status: Database["public"]["Enums"]["verification_status"] | null
          id: string
          oneci_data: Json | null
          oneci_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cnam_data?: Json | null
          cnam_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          created_at?: string
          face_data?: Json | null
          face_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          id?: string
          oneci_data?: Json | null
          oneci_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cnam_data?: Json | null
          cnam_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          created_at?: string
          face_data?: Json | null
          face_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          id?: string
          oneci_data?: Json | null
          oneci_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_otp_tokens: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_otp_token: {
        Args: { p_email: string; p_type?: string }
        Returns: string
      }
      get_current_user_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_role: Database["public"]["Enums"]["user_type"]
          available_roles: Database["public"]["Enums"]["user_type"][]
          avatar_url: string
          full_name: string
          id: string
          is_verified: boolean
          user_type: Database["public"]["Enums"]["user_type"]
        }[]
      }
      get_user_statistics: {
        Args: Record<PropertyKey, never>
        Returns: {
          by_user_type: Json
          new_users_today: number
          total_users: number
          verified_users: number
        }[]
      }
      log_login_attempt: {
        Args: {
          p_email: string
          p_fingerprint?: string
          p_ip_address?: unknown
          p_success: boolean
          p_user_agent?: string
        }
        Returns: undefined
      }
      maintenance_cleanup: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      request_role_access: {
        Args: {
          p_justification?: string
          p_requested_role: Database["public"]["Enums"]["user_type"]
        }
        Returns: boolean
      }
      switch_user_role: {
        Args: { new_role: Database["public"]["Enums"]["user_type"] }
        Returns: boolean
      }
      update_user_profile: {
        Args: {
          p_avatar_url?: string
          p_bio?: string
          p_city?: string
          p_full_name?: string
          p_phone?: string
        }
        Returns: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          cnam_verified: boolean | null
          created_at: string
          face_verified: boolean | null
          full_name: string
          id: string
          is_verified: boolean | null
          oneci_verified: boolean | null
          phone: string | null
          ui_density: string | null
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
      }
      verify_otp_token: {
        Args: { p_email: string; p_token: string }
        Returns: boolean
      }
    }
    Enums: {
      application_status: "pending" | "approved" | "rejected" | "withdrawn"
      billing_frequency: "mensuel" | "trimestriel" | "annuel"
      mandate_type: "location" | "vente" | "gestion"
      moderation_status: "pending" | "approved" | "rejected"
      property_status: "disponible" | "loué" | "en_attente" | "retiré"
      subscription_tier: "free" | "pro" | "premium" | "enterprise"
      user_type:
        | "locataire"
        | "proprietaire"
        | "agence"
        | "tiers_de_confiance"
        | "admin_ansut"
      verification_status: "pending" | "verified" | "rejected" | "not_attempted"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      application_status: ["pending", "approved", "rejected", "withdrawn"],
      billing_frequency: ["mensuel", "trimestriel", "annuel"],
      mandate_type: ["location", "vente", "gestion"],
      moderation_status: ["pending", "approved", "rejected"],
      property_status: ["disponible", "loué", "en_attente", "retiré"],
      subscription_tier: ["free", "pro", "premium", "enterprise"],
      user_type: [
        "locataire",
        "proprietaire",
        "agence",
        "tiers_de_confiance",
        "admin_ansut",
      ],
      verification_status: ["pending", "verified", "rejected", "not_attempted"],
    },
  },
} as const

