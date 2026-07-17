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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          active: boolean
          audience: string
          body: string | null
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          level: string
          title: string
        }
        Insert: {
          active?: boolean
          audience?: string
          body?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          level?: string
          title: string
        }
        Update: {
          active?: boolean
          audience?: string
          body?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          level?: string
          title?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
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
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          last_message_preview: string | null
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          last_message_preview?: string | null
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          last_message_preview?: string | null
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: []
      }
      help_tickets: {
        Row: {
          admin_response: string | null
          body: string
          category: string
          created_at: string
          id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          body: string
          category: string
          created_at?: string
          id?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          body?: string
          category?: string
          created_at?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
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
        ]
      }
      news: {
        Row: {
          author_id: string | null
          category: string
          content: string
          cover_url: string | null
          created_at: string
          id: string
          is_featured: boolean
          is_hidden: boolean
          published_at: string
          scheduled_at: string | null
          slug: string
          summary: string
          tags: string[]
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          author_id?: string | null
          category?: string
          content: string
          cover_url?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          is_hidden?: boolean
          published_at?: string
          scheduled_at?: string | null
          slug: string
          summary: string
          tags?: string[]
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          author_id?: string | null
          category?: string
          content?: string
          cover_url?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          is_hidden?: boolean
          published_at?: string
          scheduled_at?: string | null
          slug?: string
          summary?: string
          tags?: string[]
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          created_at: string
          id: string
          joined_staff_at: string | null
          last_seen_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          id: string
          joined_staff_at?: string | null
          last_seen_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          joined_staff_at?: string | null
          last_seen_at?: string | null
          username?: string
        }
        Relationships: []
      }
      project_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_likes: {
        Row: {
          created_at: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_likes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          image_url: string | null
          link_url: string | null
          progress: number
          status: string
          technologies: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          link_url?: string | null
          progress?: number
          status?: string
          technologies?: string[]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          link_url?: string | null
          progress?: number
          status?: string
          technologies?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ranks: {
        Row: {
          color: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          priority: number
          slug: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          priority?: number
          slug: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          priority?: number
          slug?: string
        }
        Relationships: []
      }
      staff_actions: {
        Row: {
          action: Database["public"]["Enums"]["staff_action_type"]
          actor_id: string
          created_at: string
          id: string
          reason: string | null
          result: string | null
          target_content_id: string | null
          target_content_type: string | null
          target_user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["staff_action_type"]
          actor_id: string
          created_at?: string
          id?: string
          reason?: string | null
          result?: string | null
          target_content_id?: string | null
          target_content_type?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["staff_action_type"]
          actor_id?: string
          created_at?: string
          id?: string
          reason?: string | null
          result?: string | null
          target_content_id?: string | null
          target_content_type?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan: string
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tutorial_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          tutorial_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          tutorial_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          tutorial_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutorial_comments_tutorial_id_fkey"
            columns: ["tutorial_id"]
            isOneToOne: false
            referencedRelation: "tutorials"
            referencedColumns: ["id"]
          },
        ]
      }
      tutorial_likes: {
        Row: {
          created_at: string
          tutorial_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          tutorial_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          tutorial_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutorial_likes_tutorial_id_fkey"
            columns: ["tutorial_id"]
            isOneToOne: false
            referencedRelation: "tutorials"
            referencedColumns: ["id"]
          },
        ]
      }
      tutorial_saves: {
        Row: {
          created_at: string
          tutorial_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          tutorial_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          tutorial_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutorial_saves_tutorial_id_fkey"
            columns: ["tutorial_id"]
            isOneToOne: false
            referencedRelation: "tutorials"
            referencedColumns: ["id"]
          },
        ]
      }
      tutorials: {
        Row: {
          author_id: string | null
          category: string
          comments_count: number
          content: string
          cover_url: string | null
          created_at: string
          description: string
          id: string
          is_ai_generated: boolean
          is_featured: boolean
          is_hidden: boolean
          level: string
          likes_count: number
          read_minutes: number
          saves_count: number
          slug: string
          tags: string[]
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          author_id?: string | null
          category: string
          comments_count?: number
          content: string
          cover_url?: string | null
          created_at?: string
          description: string
          id?: string
          is_ai_generated?: boolean
          is_featured?: boolean
          is_hidden?: boolean
          level?: string
          likes_count?: number
          read_minutes?: number
          saves_count?: number
          slug: string
          tags?: string[]
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          author_id?: string | null
          category?: string
          comments_count?: number
          content?: string
          cover_url?: string | null
          created_at?: string
          description?: string
          id?: string
          is_ai_generated?: boolean
          is_featured?: boolean
          is_hidden?: boolean
          level?: string
          likes_count?: number
          read_minutes?: number
          saves_count?: number
          slug?: string
          tags?: string[]
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: []
      }
      user_activity: {
        Row: {
          last_heartbeat: string
          total_seconds: number
          updated_at: string
          user_id: string
        }
        Insert: {
          last_heartbeat?: string
          total_seconds?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          last_heartbeat?: string
          total_seconds?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_status: {
        Row: {
          reason: string | null
          set_by: string | null
          status: Database["public"]["Enums"]["user_status_type"]
          until: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          reason?: string | null
          set_by?: string | null
          status?: Database["public"]["Enums"]["user_status_type"]
          until?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          reason?: string | null
          set_by?: string | null
          status?: Database["public"]["Enums"]["user_status_type"]
          until?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rank_unlocks: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      create_notification: {
        Args: {
          _body?: string
          _link?: string
          _title: string
          _type: string
          _user_id: string
        }
        Returns: string
      }
      get_or_create_conversation: { Args: { _other: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_news_view: { Args: { _id: string }; Returns: undefined }
      increment_tutorial_view: { Args: { _id: string }; Returns: undefined }
      is_admin_or_higher: { Args: { _uid: string }; Returns: boolean }
      is_founder: { Args: { _uid: string }; Returns: boolean }
      is_moderator_or_higher: { Args: { _uid: string }; Returns: boolean }
      record_activity: { Args: { _seconds: number }; Returns: number }
      staff_assign_role: {
        Args: {
          _reason?: string
          _role: Database["public"]["Enums"]["app_role"]
          _target: string
        }
        Returns: undefined
      }
      staff_broadcast_notification: {
        Args: {
          _audience?: string
          _body: string
          _link: string
          _title: string
        }
        Returns: number
      }
      staff_create_announcement: {
        Args: {
          _audience?: string
          _body: string
          _expires_at?: string
          _level?: string
          _title: string
        }
        Returns: string
      }
      staff_deactivate_announcement: {
        Args: { _id: string }
        Returns: undefined
      }
      staff_delete_content: {
        Args: { _id: string; _reason?: string; _type: string }
        Returns: undefined
      }
      staff_feature_content: {
        Args: {
          _featured: boolean
          _id: string
          _reason?: string
          _type: string
        }
        Returns: undefined
      }
      staff_grant_premium: {
        Args: { _reason?: string; _target: string }
        Returns: undefined
      }
      staff_revoke_premium: {
        Args: { _reason?: string; _target: string }
        Returns: undefined
      }
      staff_revoke_role: {
        Args: {
          _reason?: string
          _role: Database["public"]["Enums"]["app_role"]
          _target: string
        }
        Returns: undefined
      }
      staff_set_user_status: {
        Args: {
          _reason?: string
          _status: Database["public"]["Enums"]["user_status_type"]
          _target: string
          _until?: string
        }
        Returns: undefined
      }
      touch_last_seen: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "founder"
        | "premium"
        | "developer"
        | "ai_expert"
        | "verified"
        | "member"
      staff_action_type:
        | "assign_admin"
        | "remove_admin"
        | "assign_moderator"
        | "remove_moderator"
        | "assign_verified"
        | "remove_verified"
        | "grant_premium"
        | "revoke_premium"
        | "suspend_user"
        | "unsuspend_user"
        | "ban_user"
        | "unban_user"
        | "mute_user"
        | "unmute_user"
        | "delete_post"
        | "delete_project"
        | "delete_tutorial"
        | "delete_comment"
        | "feature_post"
        | "feature_project"
        | "feature_tutorial"
        | "unfeature_post"
        | "unfeature_project"
        | "unfeature_tutorial"
        | "hide_content"
        | "unhide_content"
        | "send_announcement"
        | "send_notification_broadcast"
        | "assign_developer"
        | "remove_developer"
        | "assign_ai_expert"
        | "remove_ai_expert"
        | "assign_member"
        | "remove_member"
      user_status_type: "active" | "muted" | "suspended" | "banned"
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
      app_role: [
        "admin",
        "moderator",
        "user",
        "founder",
        "premium",
        "developer",
        "ai_expert",
        "verified",
        "member",
      ],
      staff_action_type: [
        "assign_admin",
        "remove_admin",
        "assign_moderator",
        "remove_moderator",
        "assign_verified",
        "remove_verified",
        "grant_premium",
        "revoke_premium",
        "suspend_user",
        "unsuspend_user",
        "ban_user",
        "unban_user",
        "mute_user",
        "unmute_user",
        "delete_post",
        "delete_project",
        "delete_tutorial",
        "delete_comment",
        "feature_post",
        "feature_project",
        "feature_tutorial",
        "unfeature_post",
        "unfeature_project",
        "unfeature_tutorial",
        "hide_content",
        "unhide_content",
        "send_announcement",
        "send_notification_broadcast",
        "assign_developer",
        "remove_developer",
        "assign_ai_expert",
        "remove_ai_expert",
        "assign_member",
        "remove_member",
      ],
      user_status_type: ["active", "muted", "suspended", "banned"],
    },
  },
} as const
