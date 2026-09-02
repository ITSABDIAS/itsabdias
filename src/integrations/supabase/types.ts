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
      academy_certificates: {
        Row: {
          code: string
          course_id: string
          id: string
          issued_at: string
          user_id: string
        }
        Insert: {
          code: string
          course_id: string
          id?: string
          issued_at?: string
          user_id: string
        }
        Update: {
          code?: string
          course_id?: string
          id?: string
          issued_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_courses: {
        Row: {
          author_id: string | null
          created_at: string
          description: string
          estimated_minutes: number
          id: string
          image_url: string | null
          is_featured: boolean
          is_nexus: boolean
          is_published: boolean
          lessons_count: number
          level: string
          path_id: string | null
          slug: string
          students_count: number
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          description?: string
          estimated_minutes?: number
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_nexus?: boolean
          is_published?: boolean
          lessons_count?: number
          level?: string
          path_id?: string | null
          slug: string
          students_count?: number
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          created_at?: string
          description?: string
          estimated_minutes?: number
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_nexus?: boolean
          is_published?: boolean
          lessons_count?: number
          level?: string
          path_id?: string | null
          slug?: string
          students_count?: number
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_courses_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "academy_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          last_lesson_id: string | null
          minutes_studied: number
          progress_percent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          last_lesson_id?: string | null
          minutes_studied?: number
          progress_percent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          last_lesson_id?: string | null
          minutes_studied?: number
          progress_percent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_lesson_progress: {
        Row: {
          completed_at: string
          course_id: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          course_id: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          course_id?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_lesson_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "academy_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_lessons: {
        Row: {
          common_mistakes: string | null
          content: string
          course_id: string
          created_at: string
          duration_minutes: number
          exercise: string | null
          id: string
          position: number
          resources: Json
          summary: string | null
          tips: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          common_mistakes?: string | null
          content?: string
          course_id: string
          created_at?: string
          duration_minutes?: number
          exercise?: string | null
          id?: string
          position?: number
          resources?: Json
          summary?: string | null
          tips?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          common_mistakes?: string | null
          content?: string
          course_id?: string
          created_at?: string
          duration_minutes?: number
          exercise?: string | null
          id?: string
          position?: number
          resources?: Json
          summary?: string | null
          tips?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academy_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_paths: {
        Row: {
          category: string
          color: string
          created_at: string
          description: string
          icon: string
          id: string
          is_published: boolean
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          color?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_published?: boolean
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          color?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_published?: boolean
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      ban_requests: {
        Row: {
          created_at: string
          evidence: string | null
          id: string
          reason: string
          requester_id: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          evidence?: string | null
          id?: string
          reason: string
          requester_id: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          evidence?: string | null
          id?: string
          reason?: string
          requester_id?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string
          id: string
          image_url: string | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
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
      report_actions: {
        Row: {
          action: string
          created_at: string
          id: string
          reason: string | null
          report_id: string
          result: string | null
          staff_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          reason?: string | null
          report_id: string
          result?: string | null
          staff_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          reason?: string | null
          report_id?: string
          result?: string | null
          staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_actions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          duplicate_of: string | null
          evidence: string | null
          id: string
          is_false_report: boolean
          number: number
          priority: Database["public"]["Enums"]["report_priority"]
          reason: string
          reporter_id: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          screenshot_url: string | null
          status: Database["public"]["Enums"]["report_status"]
          target_content_id: string | null
          target_type: Database["public"]["Enums"]["report_target_type"]
          target_user_id: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          duplicate_of?: string | null
          evidence?: string | null
          id?: string
          is_false_report?: boolean
          number?: never
          priority?: Database["public"]["Enums"]["report_priority"]
          reason: string
          reporter_id: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_content_id?: string | null
          target_type: Database["public"]["Enums"]["report_target_type"]
          target_user_id?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          duplicate_of?: string | null
          evidence?: string | null
          id?: string
          is_false_report?: boolean
          number?: never
          priority?: Database["public"]["Enums"]["report_priority"]
          reason?: string
          reporter_id?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_content_id?: string | null
          target_type?: Database["public"]["Enums"]["report_target_type"]
          target_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_duplicate_of_fkey"
            columns: ["duplicate_of"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      sanctions: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          is_permanent: boolean
          reason: string | null
          staff_id: string | null
          starts_at: string
          state: string
          type: Database["public"]["Enums"]["user_status_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          is_permanent?: boolean
          reason?: string | null
          staff_id?: string | null
          starts_at?: string
          state?: string
          type: Database["public"]["Enums"]["user_status_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          is_permanent?: boolean
          reason?: string | null
          staff_id?: string | null
          starts_at?: string
          state?: string
          type?: Database["public"]["Enums"]["user_status_type"]
          updated_at?: string
          user_id?: string
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
      staff_applications: {
        Row: {
          accepted_rules: boolean
          conflict_answer: string
          contribution: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          experience: string
          id: string
          motivation: string
          phase: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tech_knowledge: string
          trust_answer: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_rules?: boolean
          conflict_answer: string
          contribution: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          experience: string
          id?: string
          motivation: string
          phase?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tech_knowledge: string
          trust_answer: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_rules?: boolean
          conflict_answer?: string
          contribution?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          experience?: string
          id?: string
          motivation?: string
          phase?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tech_knowledge?: string
          trust_answer?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      staff_evaluations: {
        Row: {
          application_id: string
          communication: number
          created_at: string
          ethics: number
          evaluator_id: string | null
          id: string
          knowledge: number
          moderation: number
          overall_note: string | null
          recommendation: string
          responsibility: number
          security: number
        }
        Insert: {
          application_id: string
          communication: number
          created_at?: string
          ethics: number
          evaluator_id?: string | null
          id?: string
          knowledge: number
          moderation: number
          overall_note?: string | null
          recommendation: string
          responsibility: number
          security: number
        }
        Update: {
          application_id?: string
          communication?: number
          created_at?: string
          ethics?: number
          evaluator_id?: string | null
          id?: string
          knowledge?: number
          moderation?: number
          overall_note?: string | null
          recommendation?: string
          responsibility?: number
          security?: number
        }
        Relationships: [
          {
            foreignKeyName: "staff_evaluations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "staff_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_exam_attempts: {
        Row: {
          answers: Json
          attempt_number: number
          created_at: string
          detail: Json
          exam_id: string
          id: string
          passed: boolean
          score: number
          user_id: string
        }
        Insert: {
          answers?: Json
          attempt_number: number
          created_at?: string
          detail?: Json
          exam_id: string
          id?: string
          passed: boolean
          score: number
          user_id: string
        }
        Update: {
          answers?: Json
          attempt_number?: number
          created_at?: string
          detail?: Json
          exam_id?: string
          id?: string
          passed?: boolean
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_exam_attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "staff_exams"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_exam_questions: {
        Row: {
          correct_answer: string
          created_at: string
          exam_id: string
          explanation: string | null
          id: string
          kind: string
          options: Json
          position: number
          prompt: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          exam_id: string
          explanation?: string | null
          id?: string
          kind?: string
          options?: Json
          position: number
          prompt: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          exam_id?: string
          explanation?: string | null
          id?: string
          kind?: string
          options?: Json
          position?: number
          prompt?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_exam_questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "staff_exams"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_exams: {
        Row: {
          created_at: string
          description: string
          id: string
          max_attempts: number
          module_id: string
          pass_score: number
          position: number
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          max_attempts?: number
          module_id: string
          pass_score?: number
          position?: number
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          max_attempts?: number
          module_id?: string
          pass_score?: number
          position?: number
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_exams_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "staff_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_lesson_progress: {
        Row: {
          completed_at: string
          id: string
          lesson_id: string
          seconds_spent: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          lesson_id: string
          seconds_spent?: number
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          lesson_id?: string
          seconds_spent?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "staff_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_lessons: {
        Row: {
          content: string
          created_at: string
          description: string
          examples: string | null
          id: string
          is_required: boolean
          key_points: string | null
          min_seconds: number
          module_id: string
          position: number
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          description: string
          examples?: string | null
          id?: string
          is_required?: boolean
          key_points?: string | null
          min_seconds?: number
          module_id: string
          position: number
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          description?: string
          examples?: string | null
          id?: string
          is_required?: boolean
          key_points?: string | null
          min_seconds?: number
          module_id?: string
          position?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "staff_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_modules: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          is_published: boolean
          position: number
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          icon?: string
          id?: string
          is_published?: boolean
          position: number
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_published?: boolean
          position?: number
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff_program_history: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          application_id: string | null
          created_at: string
          detail: string | null
          id: string
          result: string | null
          user_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          application_id?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          result?: string | null
          user_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          application_id?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          result?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_program_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "staff_applications"
            referencedColumns: ["id"]
          },
        ]
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
          is_permanent: boolean
          reason: string | null
          set_by: string | null
          started_at: string
          status: Database["public"]["Enums"]["user_status_type"]
          until: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          is_permanent?: boolean
          reason?: string | null
          set_by?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["user_status_type"]
          until?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          is_permanent?: boolean
          reason?: string | null
          set_by?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["user_status_type"]
          until?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_warnings: {
        Row: {
          created_at: string
          id: string
          reason: string
          report_id: string | null
          staff_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          report_id?: string | null
          staff_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          report_id?: string | null
          staff_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_warnings_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      academy_complete_lesson: {
        Args: { _lesson_id: string; _minutes?: number }
        Returns: Json
      }
      academy_enroll: { Args: { _course_id: string }; Returns: undefined }
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
      create_report: {
        Args: {
          _description?: string
          _evidence?: string
          _reason: string
          _screenshot_url?: string
          _target_content_id?: string
          _target_type: Database["public"]["Enums"]["report_target_type"]
          _target_user_id?: string
        }
        Returns: string
      }
      expire_user_sanction: { Args: { _uid: string }; Returns: undefined }
      founder_remove_permanent_ban: {
        Args: { _reason?: string; _target: string }
        Returns: undefined
      }
      founder_review_ban_request: {
        Args: { _approve: boolean; _id: string; _note?: string }
        Returns: undefined
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
      is_premium: { Args: { _user_id: string }; Returns: boolean }
      is_user_muted: { Args: { _uid: string }; Returns: boolean }
      my_sanction: {
        Args: never
        Returns: {
          is_permanent: boolean
          reason: string
          staff_username: string
          started_at: string
          status: Database["public"]["Enums"]["user_status_type"]
          until: string
        }[]
      }
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
      staff_complete_lesson: {
        Args: { _lesson_id: string; _seconds: number }
        Returns: Json
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
      staff_get_exam: { Args: { _exam_id: string }; Returns: Json }
      staff_grant_premium: {
        Args: { _reason?: string; _target: string }
        Returns: undefined
      }
      staff_program_apply: {
        Args: {
          _conflict: string
          _contribution: string
          _experience: string
          _motivation: string
          _tech: string
          _trust: string
        }
        Returns: string
      }
      staff_program_check_training: { Args: { _user: string }; Returns: Json }
      staff_program_decide: {
        Args: { _application_id: string; _decision: string; _note: string }
        Returns: undefined
      }
      staff_program_evaluate: {
        Args: {
          _application_id: string
          _communication: number
          _ethics: number
          _knowledge: number
          _moderation: number
          _note: string
          _recommendation: string
          _responsibility: number
          _security: number
        }
        Returns: string
      }
      staff_program_log: {
        Args: {
          _action: string
          _app: string
          _detail: string
          _result: string
          _user: string
        }
        Returns: undefined
      }
      staff_program_progress: { Args: { _user: string }; Returns: Json }
      staff_program_review: {
        Args: { _id: string; _note: string; _status: string }
        Returns: undefined
      }
      staff_request_permanent_ban: {
        Args: { _evidence?: string; _reason: string; _target: string }
        Returns: string
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
          _permanent?: boolean
          _reason?: string
          _status: Database["public"]["Enums"]["user_status_type"]
          _target: string
          _until?: string
        }
        Returns: undefined
      }
      staff_submit_exam: {
        Args: { _answers: Json; _exam_id: string }
        Returns: Json
      }
      staff_update_report: {
        Args: {
          _assign_to?: string
          _duplicate_of?: string
          _false_report?: boolean
          _id: string
          _priority?: Database["public"]["Enums"]["report_priority"]
          _resolution?: string
          _status?: Database["public"]["Enums"]["report_status"]
        }
        Returns: undefined
      }
      staff_warn_user: {
        Args: { _reason: string; _report_id?: string; _target: string }
        Returns: undefined
      }
      touch_last_seen: { Args: never; Returns: undefined }
      verify_certificate: {
        Args: { _code: string }
        Returns: {
          code: string
          course_title: string
          issued_at: string
          username: string
        }[]
      }
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
      report_priority: "low" | "normal" | "high" | "critical"
      report_status:
        | "new"
        | "reviewing"
        | "action_required"
        | "escalated"
        | "resolved"
        | "closed"
      report_target_type: "user" | "post" | "comment" | "tutorial" | "project"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      report_priority: ["low", "normal", "high", "critical"],
      report_status: [
        "new",
        "reviewing",
        "action_required",
        "escalated",
        "resolved",
        "closed",
      ],
      report_target_type: ["user", "post", "comment", "tutorial", "project"],
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
