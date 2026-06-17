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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string
        }
        Relationships: []
      }
      backup_admins: {
        Row: {
          activated_at: string | null
          created_at: string | null
          created_by: string | null
          email: string
          id: string
        }
        Insert: {
          activated_at?: string | null
          created_at?: string | null
          created_by?: string | null
          email: string
          id?: string
        }
        Update: {
          activated_at?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      content_moderation_logs: {
        Row: {
          action_taken: string | null
          categories: string[] | null
          content_id: string | null
          content_preview: string
          content_type: string
          created_at: string | null
          flagged_by: string
          id: string
          reason: string
          reviewed_by: string | null
          severity: string
          updated_at: string | null
        }
        Insert: {
          action_taken?: string | null
          categories?: string[] | null
          content_id?: string | null
          content_preview: string
          content_type: string
          created_at?: string | null
          flagged_by: string
          id?: string
          reason: string
          reviewed_by?: string | null
          severity: string
          updated_at?: string | null
        }
        Update: {
          action_taken?: string | null
          categories?: string[] | null
          content_id?: string | null
          content_preview?: string
          content_type?: string
          created_at?: string | null
          flagged_by?: string
          id?: string
          reason?: string
          reviewed_by?: string | null
          severity?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      letters: {
        Row: {
          author_id: string
          body: string
          closing: string | null
          created_at: string
          delivered_at: string | null
          delivered_to: string | null
          flagged_keywords: string[] | null
          id: string
          opening: string
          status: string
          updated_at: string
          word_count: number
        }
        Insert: {
          author_id: string
          body: string
          closing?: string | null
          created_at?: string
          delivered_at?: string | null
          delivered_to?: string | null
          flagged_keywords?: string[] | null
          id?: string
          opening?: string
          status?: string
          updated_at?: string
          word_count?: number
        }
        Update: {
          author_id?: string
          body?: string
          closing?: string | null
          created_at?: string
          delivered_at?: string | null
          delivered_to?: string | null
          flagged_keywords?: string[] | null
          id?: string
          opening?: string
          status?: string
          updated_at?: string
          word_count?: number
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      privacy_policy: {
        Row: {
          content: string
          created_at: string
          id: string
          last_updated: string
          updated_by: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          last_updated?: string
          updated_by?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          last_updated?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          display_name: string | null
          email: string | null
          first_login_completed: boolean | null
          full_name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          email?: string | null
          first_login_completed?: boolean | null
          full_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          email?: string | null
          first_login_completed?: boolean | null
          full_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          author: string
          created_at: string
          id: string
          text: string
          updated_at: string
        }
        Insert: {
          author: string
          created_at?: string
          id?: string
          text: string
          updated_at?: string
        }
        Update: {
          author?: string
          created_at?: string
          id?: string
          text?: string
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          message_content: string | null
          message_id: string | null
          post_id: string | null
          reason: string | null
          reported_by_user_id: string
          reported_user_id: string
          resolved_at: string | null
          resolved_by: string | null
          room_id: string | null
          status: string | null
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          message_content?: string | null
          message_id?: string | null
          post_id?: string | null
          reason?: string | null
          reported_by_user_id: string
          reported_user_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          room_id?: string | null
          status?: string | null
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          message_content?: string | null
          message_id?: string | null
          post_id?: string | null
          reason?: string | null
          reported_by_user_id?: string
          reported_user_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          room_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "room_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_bans: {
        Row: {
          banned_by: string | null
          created_at: string
          id: string
          reason: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          banned_by?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          banned_by?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_bans_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_join_requests: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          room_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          room_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          room_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_join_requests_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          room_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          room_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "room_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_message_reactions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_message_reports: {
        Row: {
          created_at: string
          id: string
          message_id: string
          notes: string | null
          reason: string
          reported_by: string
          room_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          notes?: string | null
          reason: string
          reported_by: string
          room_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          notes?: string | null
          reason?: string
          reported_by?: string
          room_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_message_reports_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_messages: {
        Row: {
          content: string
          created_at: string
          hidden_reason: string | null
          id: string
          is_hidden: boolean
          room_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          hidden_reason?: string | null
          id?: string
          is_hidden?: boolean
          room_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          hidden_reason?: string | null
          id?: string
          is_hidden?: boolean
          room_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_participants: {
        Row: {
          agreed_at: string | null
          agreed_to_guidelines: boolean
          id: string
          joined_at: string
          last_read_at: string
          role: string
          room_id: string
          user_id: string
        }
        Insert: {
          agreed_at?: string | null
          agreed_to_guidelines?: boolean
          id?: string
          joined_at?: string
          last_read_at?: string
          role?: string
          room_id: string
          user_id: string
        }
        Update: {
          agreed_at?: string | null
          agreed_to_guidelines?: boolean
          id?: string
          joined_at?: string
          last_read_at?: string
          role?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          age_band: string
          age_max: number
          age_min: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_archived: boolean
          last_activity_at: string
          name: string
          pinned_announcement: string | null
          privacy: string
          rules: string | null
          topic_tag: string | null
          updated_at: string
        }
        Insert: {
          age_band?: string
          age_max?: number
          age_min?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean
          last_activity_at?: string
          name: string
          pinned_announcement?: string | null
          privacy?: string
          rules?: string | null
          topic_tag?: string | null
          updated_at?: string
        }
        Update: {
          age_band?: string
          age_max?: number
          age_min?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean
          last_activity_at?: string
          name?: string
          pinned_announcement?: string | null
          privacy?: string
          rules?: string | null
          topic_tag?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_letters: {
        Row: {
          id: string
          letter_id: string
          saved_at: string
          user_id: string
        }
        Insert: {
          id?: string
          letter_id: string
          saved_at?: string
          user_id: string
        }
        Update: {
          id?: string
          letter_id?: string
          saved_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_letters_letter_id_fkey"
            columns: ["letter_id"]
            isOneToOne: false
            referencedRelation: "letters"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      terms_of_service: {
        Row: {
          content: string
          created_at: string
          id: string
          last_updated: string
          updated_by: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          last_updated?: string
          updated_by?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          last_updated?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      user_moderation: {
        Row: {
          action_type: string
          created_at: string
          created_by: string
          duration_hours: number | null
          expires_at: string | null
          id: string
          is_active: boolean
          notes: string | null
          reason: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          created_by: string
          duration_hours?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          reason?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          created_by?: string
          duration_hours?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      willow_config: {
        Row: {
          additional_instructions: string | null
          created_at: string
          created_by: string | null
          custom_knowledge: string | null
          id: string
          system_prompt: string
          updated_at: string
        }
        Insert: {
          additional_instructions?: string | null
          created_at?: string
          created_by?: string | null
          custom_knowledge?: string | null
          id?: string
          system_prompt?: string
          updated_at?: string
        }
        Update: {
          additional_instructions?: string | null
          created_at?: string
          created_by?: string | null
          custom_knowledge?: string | null
          id?: string
          system_prompt?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_pending_letters: {
        Args: never
        Returns: {
          author_id: string
          body: string
          closing: string | null
          created_at: string
          delivered_at: string | null
          delivered_to: string | null
          flagged_keywords: string[] | null
          id: string
          opening: string
          status: string
          updated_at: string
          word_count: number
        }[]
        SetofOptions: {
          from: "*"
          to: "letters"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_moderate_letter: {
        Args: { _action: string; _letter_id: string }
        Returns: {
          author_id: string
          body: string
          closing: string | null
          created_at: string
          delivered_at: string | null
          delivered_to: string | null
          flagged_keywords: string[] | null
          id: string
          opening: string
          status: string
          updated_at: string
          word_count: number
        }
        SetofOptions: {
          from: "*"
          to: "letters"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      calculate_age: { Args: { birth_date: string }; Returns: number }
      claim_random_letter: {
        Args: never
        Returns: {
          author_id: string
          body: string
          closing: string | null
          created_at: string
          delivered_at: string | null
          delivered_to: string | null
          flagged_keywords: string[] | null
          id: string
          opening: string
          status: string
          updated_at: string
          word_count: number
        }
        SetofOptions: {
          from: "*"
          to: "letters"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cleanup_old_security_events: { Args: never; Returns: undefined }
      detect_suspicious_ips: {
        Args: never
        Returns: {
          event_count: number
          event_types: string[]
          ip_address: unknown
          unique_users: number
        }[]
      }
      get_letters_stats: { Args: never; Returns: Json }
      get_masked_profile: { Args: { target_user_id: string }; Returns: Json }
      get_user_warnings_count: { Args: { user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_letters_reviewer: { Args: never; Returns: boolean }
      is_room_admin: {
        Args: { _room_id: string; _user_id: string }
        Returns: boolean
      }
      is_room_banned: {
        Args: { _room_id: string; _user_id: string }
        Returns: boolean
      }
      is_room_member: {
        Args: { _room_id: string; _user_id: string }
        Returns: boolean
      }
      is_user_banned: { Args: { user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
