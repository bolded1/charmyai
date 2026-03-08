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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auto_category_rules: {
        Row: {
          category: string
          created_at: string
          id: string
          match_field: string
          match_type: string
          match_value: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          match_field?: string
          match_type?: string
          match_value: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          match_field?: string
          match_type?: string
          match_value?: string
          user_id?: string
        }
        Relationships: []
      }
      broadcast_history: {
        Row: {
          body: string
          created_at: string
          id: string
          link: string | null
          role_filter: string | null
          scheduled_at: string | null
          segment: string
          sent_by: string | null
          sent_count: number
          status: string
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          link?: string | null
          role_filter?: string | null
          scheduled_at?: string | null
          segment?: string
          sent_by?: string | null
          sent_count?: number
          status?: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          link?: string | null
          role_filter?: string | null
          scheduled_at?: string | null
          segment?: string
          sent_by?: string | null
          sent_count?: number
          status?: string
          title?: string
        }
        Relationships: []
      }
      chat_conversations: {
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
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      demo_uploads: {
        Row: {
          confidence_score: number | null
          created_at: string
          expires_at: string
          extracted_data: Json | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          ip_address: string | null
          ocr_text: string | null
          session_id: string
          status: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          expires_at?: string
          extracted_data?: Json | null
          file_name: string
          file_path: string
          file_size?: number
          file_type: string
          id?: string
          ip_address?: string | null
          ocr_text?: string | null
          session_id: string
          status?: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          expires_at?: string
          extracted_data?: Json | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          ip_address?: string | null
          ocr_text?: string | null
          session_id?: string
          status?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          category: string | null
          confidence_score: number | null
          created_at: string
          currency: string | null
          customer_name: string | null
          document_type: string | null
          due_date: string | null
          email_import_id: string | null
          extracted_data: Json | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          invoice_date: string | null
          invoice_number: string | null
          net_amount: number | null
          ocr_text: string | null
          potential_duplicate_of: string | null
          source: string
          status: string
          supplier_name: string | null
          total_amount: number | null
          updated_at: string
          user_corrections: Json | null
          user_id: string
          validation_errors: Json | null
          vat_amount: number | null
          vat_number: string | null
        }
        Insert: {
          category?: string | null
          confidence_score?: number | null
          created_at?: string
          currency?: string | null
          customer_name?: string | null
          document_type?: string | null
          due_date?: string | null
          email_import_id?: string | null
          extracted_data?: Json | null
          file_name: string
          file_path: string
          file_size?: number
          file_type: string
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          net_amount?: number | null
          ocr_text?: string | null
          potential_duplicate_of?: string | null
          source?: string
          status?: string
          supplier_name?: string | null
          total_amount?: number | null
          updated_at?: string
          user_corrections?: Json | null
          user_id: string
          validation_errors?: Json | null
          vat_amount?: number | null
          vat_number?: string | null
        }
        Update: {
          category?: string | null
          confidence_score?: number | null
          created_at?: string
          currency?: string | null
          customer_name?: string | null
          document_type?: string | null
          due_date?: string | null
          email_import_id?: string | null
          extracted_data?: Json | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          net_amount?: number | null
          ocr_text?: string | null
          potential_duplicate_of?: string | null
          source?: string
          status?: string
          supplier_name?: string | null
          total_amount?: number | null
          updated_at?: string
          user_corrections?: Json | null
          user_id?: string
          validation_errors?: Json | null
          vat_amount?: number | null
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_email_import_id_fkey"
            columns: ["email_import_id"]
            isOneToOne: false
            referencedRelation: "email_imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_potential_duplicate_of_fkey"
            columns: ["potential_duplicate_of"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          created_at: string
          error_count: number
          errors: Json | null
          html_body: string
          id: string
          recipient_count: number
          role_filter: string | null
          scheduled_at: string | null
          segment: string
          sent_at: string | null
          sent_by: string | null
          sent_count: number
          status: string
          subject: string
          template_id: string | null
        }
        Insert: {
          created_at?: string
          error_count?: number
          errors?: Json | null
          html_body: string
          id?: string
          recipient_count?: number
          role_filter?: string | null
          scheduled_at?: string | null
          segment?: string
          sent_at?: string | null
          sent_by?: string | null
          sent_count?: number
          status?: string
          subject: string
          template_id?: string | null
        }
        Update: {
          created_at?: string
          error_count?: number
          errors?: Json | null
          html_body?: string
          id?: string
          recipient_count?: number
          role_filter?: string | null
          scheduled_at?: string | null
          segment?: string
          sent_at?: string | null
          sent_by?: string | null
          sent_count?: number
          status?: string
          subject?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_imports: {
        Row: {
          attachment_count: number
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          organization_id: string
          processed_count: number
          received_at: string
          recipient_address: string | null
          sender_email: string | null
          sender_name: string | null
          status: string
          subject: string | null
        }
        Insert: {
          attachment_count?: number
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          organization_id: string
          processed_count?: number
          received_at?: string
          recipient_address?: string | null
          sender_email?: string | null
          sender_name?: string | null
          status?: string
          subject?: string | null
        }
        Update: {
          attachment_count?: number
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          organization_id?: string
          processed_count?: number
          received_at?: string
          recipient_address?: string | null
          sender_email?: string | null
          sender_name?: string | null
          status?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_imports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          html_body: string
          id: string
          name: string
          subject: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          html_body?: string
          id?: string
          name: string
          subject?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          html_body?: string
          id?: string
          name?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      expense_records: {
        Row: {
          category: string | null
          created_at: string
          currency: string
          document_id: string | null
          due_date: string | null
          id: string
          invoice_date: string
          invoice_number: string | null
          net_amount: number
          supplier_name: string
          total_amount: number
          user_id: string
          vat_amount: number
          vat_number: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          currency?: string
          document_id?: string | null
          due_date?: string | null
          id?: string
          invoice_date: string
          invoice_number?: string | null
          net_amount?: number
          supplier_name: string
          total_amount?: number
          user_id: string
          vat_amount?: number
          vat_number?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          currency?: string
          document_id?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string | null
          net_amount?: number
          supplier_name?: string
          total_amount?: number
          user_id?: string
          vat_amount?: number
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_records_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      export_history: {
        Row: {
          created_at: string
          export_name: string
          export_type: string
          format: string
          id: string
          row_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          export_name: string
          export_type: string
          format?: string
          id?: string
          row_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          export_name?: string
          export_type?: string
          format?: string
          id?: string
          row_count?: number
          user_id?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          key: string
          name: string
          segment: string
          updated_at: string
          user_ids: Json | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          key: string
          name: string
          segment?: string
          updated_at?: string
          user_ids?: Json | null
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          key?: string
          name?: string
          segment?: string
          updated_at?: string
          user_ids?: Json | null
        }
        Relationships: []
      }
      income_records: {
        Row: {
          category: string | null
          created_at: string
          currency: string
          customer_name: string
          document_id: string | null
          due_date: string | null
          id: string
          invoice_date: string
          invoice_number: string | null
          net_amount: number
          total_amount: number
          user_id: string
          vat_amount: number
          vat_number: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          currency?: string
          customer_name: string
          document_id?: string | null
          due_date?: string | null
          id?: string
          invoice_date: string
          invoice_number?: string | null
          net_amount?: number
          total_amount?: number
          user_id: string
          vat_amount?: number
          vat_number?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          currency?: string
          customer_name?: string
          document_id?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string | null
          net_amount?: number
          total_amount?: number
          user_id?: string
          vat_amount?: number
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "income_records_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      job_run_history: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          job_id: string
          metadata: Json | null
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          job_id: string
          metadata?: Json | null
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          job_id?: string
          metadata?: Json | null
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_run_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "scheduled_jobs"
            referencedColumns: ["id"]
          },
        ]
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
          type: string
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
      organizations: {
        Row: {
          app_icon: string | null
          created_at: string
          id: string
          import_email_token: string
          logo_dark: string | null
          logo_light: string | null
          name: string
          owner_user_id: string
          primary_color: string | null
          updated_at: string
        }
        Insert: {
          app_icon?: string | null
          created_at?: string
          id?: string
          import_email_token?: string
          logo_dark?: string | null
          logo_light?: string | null
          name: string
          owner_user_id: string
          primary_color?: string | null
          updated_at?: string
        }
        Update: {
          app_icon?: string | null
          created_at?: string
          id?: string
          import_email_token?: string
          logo_dark?: string | null
          logo_light?: string | null
          name?: string
          owner_user_id?: string
          primary_color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      page_content: {
        Row: {
          content: Json
          id: string
          page_slug: string
          updated_at: string
        }
        Insert: {
          content?: Json
          id?: string
          page_slug: string
          updated_at?: string
        }
        Update: {
          content?: Json
          id?: string
          page_slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          job_title: string | null
          language: string | null
          last_name: string | null
          phone: string | null
          status: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          language?: string | null
          last_name?: string | null
          phone?: string | null
          status?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          language?: string | null
          last_name?: string | null
          phone?: string | null
          status?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_jobs: {
        Row: {
          created_at: string
          cron_expression: string
          description: string | null
          enabled: boolean
          function_name: string
          id: string
          last_run_at: string | null
          last_status: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cron_expression?: string
          description?: string | null
          enabled?: boolean
          function_name: string
          id?: string
          last_run_at?: string | null
          last_status?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cron_expression?: string
          description?: string | null
          enabled?: boolean
          function_name?: string
          id?: string
          last_run_at?: string | null
          last_status?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_reply: string | null
          created_at: string
          id: string
          message: string
          priority: string
          replied_at: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_reply?: string | null
          created_at?: string
          id?: string
          message: string
          priority?: string
          replied_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_reply?: string | null
          created_at?: string
          id?: string
          message?: string
          priority?: string
          replied_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          attachments: Json | null
          body: string
          created_at: string
          id: string
          sender_id: string
          sender_role: string
          ticket_id: string
        }
        Insert: {
          attachments?: Json | null
          body: string
          created_at?: string
          id?: string
          sender_id: string
          sender_role?: string
          ticket_id: string
        }
        Update: {
          attachments?: Json | null
          body?: string
          created_at?: string
          id?: string
          sender_id?: string
          sender_role?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_feedback: {
        Row: {
          comment: string | null
          created_at: string
          feedback_type: string
          id: string
          page: string | null
          score: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          feedback_type?: string
          id?: string
          page?: string | null
          score: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          feedback_type?: string
          id?: string
          page?: string | null
          score?: number
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
      find_duplicate_document: {
        Args: {
          _document_id: string
          _invoice_date: string
          _invoice_number: string
          _supplier_name: string
          _total_amount: number
          _user_id: string
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "platform_admin"
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
      app_role: ["admin", "moderator", "user", "platform_admin"],
    },
  },
} as const
