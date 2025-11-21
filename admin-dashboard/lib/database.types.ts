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
      admin_sessions: {
        Row: {
          admin_user_id: string
          created_at: string | null
          expires_at: string
          id: string
          ip_address: string | null
          last_activity: string | null
          session_token: string
          user_agent: string | null
        }
        Insert: {
          admin_user_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: string | null
          last_activity?: string | null
          session_token: string
          user_agent?: string | null
        }
        Update: {
          admin_user_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          last_activity?: string | null
          session_token?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_sessions_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          account_locked_until: string | null
          created_at: string | null
          email: string
          failed_login_attempts: number | null
          full_name: string | null
          id: string
          is_active: boolean | null
          last_failed_login: string | null
          last_login_at: string | null
          password_changed_at: string | null
          password_hash: string
          role: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          account_locked_until?: string | null
          created_at?: string | null
          email: string
          failed_login_attempts?: number | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_failed_login?: string | null
          last_login_at?: string | null
          password_changed_at?: string | null
          password_hash: string
          role?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          account_locked_until?: string | null
          created_at?: string | null
          email?: string
          failed_login_attempts?: number | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_failed_login?: string | null
          last_login_at?: string | null
          password_changed_at?: string | null
          password_hash?: string
          role?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action_type: string
          admin_user_id: string
          created_at: string | null
          details: Json | null
          error_message: string | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_name: string | null
          resource_type: string
          status: string
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_user_id: string
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_name?: string | null
          resource_type: string
          status?: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_name?: string | null
          resource_type?: string
          status?: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_admin_user"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_sessions: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          last_activity: string | null
          session_token: string
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          last_activity?: string | null
          session_token: string
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          last_activity?: string | null
          session_token?: string
        }
        Relationships: []
      }
      business_applications: {
        Row: {
          address: Json | null
          business_id: string | null
          business_name: string
          contact_email: string
          contact_name: string | null
          created_at: string | null
          description: string | null
          iban: string | null
          id: string
          invite_id: string | null
          logo_url: string | null
          metadata: Json | null
          phone: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: Json | null
          business_id?: string | null
          business_name: string
          contact_email: string
          contact_name?: string | null
          created_at?: string | null
          description?: string | null
          iban?: string | null
          id?: string
          invite_id?: string | null
          logo_url?: string | null
          metadata?: Json | null
          phone?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: Json | null
          business_id?: string | null
          business_name?: string
          contact_email?: string
          contact_name?: string | null
          created_at?: string | null
          description?: string | null
          iban?: string | null
          id?: string
          invite_id?: string | null
          logo_url?: string | null
          metadata?: Json | null
          phone?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_applications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_applications_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "business_invites"
            referencedColumns: ["id"]
          },
        ]
      }
      business_credentials: {
        Row: {
          account_locked_until: string | null
          created_at: string | null
          email: string
          failed_login_attempts: number | null
          id: string
          last_failed_login: string | null
          password_changed_at: string | null
          password_hash: string
          totp_enabled: boolean | null
          totp_secret: string | null
          updated_at: string | null
        }
        Insert: {
          account_locked_until?: string | null
          created_at?: string | null
          email: string
          failed_login_attempts?: number | null
          id?: string
          last_failed_login?: string | null
          password_changed_at?: string | null
          password_hash: string
          totp_enabled?: boolean | null
          totp_secret?: string | null
          updated_at?: string | null
        }
        Update: {
          account_locked_until?: string | null
          created_at?: string | null
          email?: string
          failed_login_attempts?: number | null
          id?: string
          last_failed_login?: string | null
          password_changed_at?: string | null
          password_hash?: string
          totp_enabled?: boolean | null
          totp_secret?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      business_invites: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invite_token: string
          invited_at: string | null
          invited_by: string | null
          message: string | null
          metadata: Json | null
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invite_token: string
          invited_at?: string | null
          invited_by?: string | null
          message?: string | null
          metadata?: Json | null
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invite_token?: string
          invited_at?: string | null
          invited_by?: string | null
          message?: string | null
          metadata?: Json | null
          status?: string | null
        }
        Relationships: []
      }
      businesses: {
        Row: {
          activated_at: string | null
          address: Json | null
          commission_rate: number | null
          contact_email: string | null
          contact_name: string | null
          created_at: string | null
          description: string | null
          email: string | null
          iban: string | null
          id: string
          invite_token: string | null
          invited_at: string | null
          is_active: boolean | null
          is_visible: boolean | null
          logo_url: string | null
          name: string
          owner_user_id: string | null
          phone: string | null
          registered_at: string | null
          slug: string
          status: string | null
          updated_at: string | null
          website: string | null
          wix_product_id: string | null
        }
        Insert: {
          activated_at?: string | null
          address?: Json | null
          commission_rate?: number | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          iban?: string | null
          id?: string
          invite_token?: string | null
          invited_at?: string | null
          is_active?: boolean | null
          is_visible?: boolean | null
          logo_url?: string | null
          name: string
          owner_user_id?: string | null
          phone?: string | null
          registered_at?: string | null
          slug: string
          status?: string | null
          updated_at?: string | null
          website?: string | null
          wix_product_id?: string | null
        }
        Update: {
          activated_at?: string | null
          address?: Json | null
          commission_rate?: number | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          iban?: string | null
          id?: string
          invite_token?: string | null
          invited_at?: string | null
          is_active?: boolean | null
          is_visible?: boolean | null
          logo_url?: string | null
          name?: string
          owner_user_id?: string | null
          phone?: string | null
          registered_at?: string | null
          slug?: string
          status?: string | null
          updated_at?: string | null
          website?: string | null
          wix_product_id?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gift_card_activity: {
        Row: {
          code: string
          created_at: string | null
          gift_card_id: string | null
          id: string
          ip_address: unknown
          message: string
          metadata: Json | null
          performed_by: string | null
          type: string
        }
        Insert: {
          code: string
          created_at?: string | null
          gift_card_id?: string | null
          id?: string
          ip_address?: unknown
          message: string
          metadata?: Json | null
          performed_by?: string | null
          type: string
        }
        Update: {
          code?: string
          created_at?: string | null
          gift_card_id?: string | null
          id?: string
          ip_address?: unknown
          message?: string
          metadata?: Json | null
          performed_by?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_card_activity_gift_card_id_fkey"
            columns: ["gift_card_id"]
            isOneToOne: false
            referencedRelation: "gift_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_cards: {
        Row: {
          amount: number
          business_id: string | null
          business_name: string | null
          code: string
          created_at: string | null
          currency: string | null
          customer_id: string | null
          expires_at: string | null
          id: string
          issued_at: string | null
          line_item_id: string | null
          metadata: Json | null
          notes: string | null
          order_id: string | null
          purchase_source: string | null
          redeemed_at: string | null
          redeemed_by: string | null
          redemption_notes: string | null
          remaining_balance: number | null
          sent_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          business_id?: string | null
          business_name?: string | null
          code: string
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          line_item_id?: string | null
          metadata?: Json | null
          notes?: string | null
          order_id?: string | null
          purchase_source?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          redemption_notes?: string | null
          remaining_balance?: number | null
          sent_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          business_id?: string | null
          business_name?: string | null
          code?: string
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          line_item_id?: string | null
          metadata?: Json | null
          notes?: string | null
          order_id?: string | null
          purchase_source?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          redemption_notes?: string | null
          remaining_balance?: number | null
          sent_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_cards_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_cards_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      magic_links: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          token: string
          used: boolean | null
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          token: string
          used?: boolean | null
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean | null
          used_at?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          business_id: string | null
          created_at: string | null
          currency: string | null
          customer_id: string
          id: string
          payment_transaction_id: string | null
          shipping_address: string | null
          status: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id: string
          id?: string
          payment_transaction_id?: string | null
          shipping_address?: string | null
          status?: string | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string
          id?: string
          payment_transaction_id?: string | null
          shipping_address?: string | null
          status?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          ip_address: string | null
          token: string
          used: boolean | null
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          ip_address?: string | null
          token: string
          used?: boolean | null
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          token?: string
          used?: boolean | null
          used_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          customer_id: string | null
          description: string | null
          gift_card_id: string | null
          id: string
          metadata: Json | null
          payment_id: string | null
          payment_provider: string | null
          payment_status: string | null
          type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          description?: string | null
          gift_card_id?: string | null
          id?: string
          metadata?: Json | null
          payment_id?: string | null
          payment_provider?: string | null
          payment_status?: string | null
          type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          description?: string | null
          gift_card_id?: string | null
          id?: string
          metadata?: Json | null
          payment_id?: string | null
          payment_provider?: string | null
          payment_status?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_gift_card_id_fkey"
            columns: ["gift_card_id"]
            isOneToOne: false
            referencedRelation: "gift_cards"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_admin_sessions: { Args: never; Returns: undefined }
      cleanup_expired_auth_tokens: { Args: never; Returns: undefined }
      cleanup_expired_password_reset_tokens: { Args: never; Returns: undefined }
      create_business_invite: {
        Args: { p_email: string; p_invited_by: string; p_message?: string }
        Returns: string
      }
      generate_gift_card_code: { Args: never; Returns: string }
      generate_invite_token: { Args: never; Returns: string }
      increment_admin_failed_login_attempts: {
        Args: { admin_username: string }
        Returns: undefined
      }
      increment_failed_login_attempts: {
        Args: { user_email: string }
        Returns: undefined
      }
      log_gift_card_activity: {
        Args: {
          p_code: string
          p_gift_card_id: string
          p_message: string
          p_metadata?: Json
          p_performed_by?: string
          p_type: string
        }
        Returns: string
      }
      reset_admin_failed_login_attempts: {
        Args: { admin_username: string }
        Returns: undefined
      }
      reset_failed_login_attempts: {
        Args: { user_email: string }
        Returns: undefined
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
