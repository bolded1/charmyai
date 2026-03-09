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
          organization_id: string | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          match_field?: string
          match_type?: string
          match_value: string
          organization_id?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          match_field?: string
          match_type?: string
          match_value?: string
          organization_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_category_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          organization_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          organization_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
          {
            foreignKeyName: "expense_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          organization_id: string | null
          row_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          export_name: string
          export_type: string
          format?: string
          id?: string
          organization_id?: string | null
          row_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          export_name?: string
          export_type?: string
          format?: string
          id?: string
          organization_id?: string | null
          row_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "export_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
          {
            foreignKeyName: "income_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          address: string | null
          app_icon: string | null
          archived_at: string | null
          company_logo: string | null
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          default_currency: string
          id: string
          import_email_token: string
          logo_dark: string | null
          logo_light: string | null
          max_client_workspaces: number
          name: string
          owner_user_id: string
          parent_org_id: string | null
          primary_color: string | null
          tax_id: string | null
          trading_name: string | null
          updated_at: string
          vat_number: string | null
          workspace_type: string
        }
        Insert: {
          address?: string | null
          app_icon?: string | null
          archived_at?: string | null
          company_logo?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          default_currency?: string
          id?: string
          import_email_token?: string
          logo_dark?: string | null
          logo_light?: string | null
          max_client_workspaces?: number
          name: string
          owner_user_id: string
          parent_org_id?: string | null
          primary_color?: string | null
          tax_id?: string | null
          trading_name?: string | null
          updated_at?: string
          vat_number?: string | null
          workspace_type?: string
        }
        Update: {
          address?: string | null
          app_icon?: string | null
          archived_at?: string | null
          company_logo?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          default_currency?: string
          id?: string
          import_email_token?: string
          logo_dark?: string | null
          logo_light?: string | null
          max_client_workspaces?: number
          name?: string
          owner_user_id?: string
          parent_org_id?: string | null
          primary_color?: string | null
          tax_id?: string | null
          trading_name?: string | null
          updated_at?: string
          vat_number?: string | null
          workspace_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          active_organization_id: string | null
          avatar_url: string | null
          billing_setup_at: string | null
          created_at: string
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          job_title: string | null
          language: string | null
          last_name: string | null
          onboarding_completed_at: string | null
          phone: string | null
          status: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_organization_id?: string | null
          avatar_url?: string | null
          billing_setup_at?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          language?: string | null
          last_name?: string | null
          onboarding_completed_at?: string | null
          phone?: string | null
          status?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_organization_id?: string | null
          avatar_url?: string | null
          billing_setup_at?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          language?: string | null
          last_name?: string | null
          onboarding_completed_at?: string | null
          phone?: string | null
          status?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_organization_id_fkey"
            columns: ["active_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_code_redemptions: {
        Row: {
          discount_snapshot: Json | null
          id: string
          organization_id: string | null
          promo_code_id: string
          redeemed_at: string
          status: string
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          discount_snapshot?: Json | null
          id?: string
          organization_id?: string | null
          promo_code_id: string
          redeemed_at?: string
          status?: string
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          discount_snapshot?: Json | null
          id?: string
          organization_id?: string | null
          promo_code_id?: string
          redeemed_at?: string
          status?: string
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_redemptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_redemptions_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          active: boolean
          applies_to_billing: string | null
          applies_to_first_only: boolean | null
          applies_to_plans: string[] | null
          code: string
          created_at: string
          currency: string | null
          current_redemptions: number
          description: string | null
          discount_type: string
          discount_value: number
          end_date: string | null
          extra_trial_days: number | null
          free_duration_months: number | null
          id: string
          internal_name: string | null
          max_redemptions: number | null
          max_redemptions_per_org: number | null
          recurring_cycles: number | null
          requires_card: boolean | null
          stacks_with_trial: boolean | null
          start_date: string | null
          stripe_coupon_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          applies_to_billing?: string | null
          applies_to_first_only?: boolean | null
          applies_to_plans?: string[] | null
          code: string
          created_at?: string
          currency?: string | null
          current_redemptions?: number
          description?: string | null
          discount_type?: string
          discount_value?: number
          end_date?: string | null
          extra_trial_days?: number | null
          free_duration_months?: number | null
          id?: string
          internal_name?: string | null
          max_redemptions?: number | null
          max_redemptions_per_org?: number | null
          recurring_cycles?: number | null
          requires_card?: boolean | null
          stacks_with_trial?: boolean | null
          start_date?: string | null
          stripe_coupon_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          applies_to_billing?: string | null
          applies_to_first_only?: boolean | null
          applies_to_plans?: string[] | null
          code?: string
          created_at?: string
          currency?: string | null
          current_redemptions?: number
          description?: string | null
          discount_type?: string
          discount_value?: number
          end_date?: string | null
          extra_trial_days?: number | null
          free_duration_months?: number | null
          id?: string
          internal_name?: string | null
          max_redemptions?: number | null
          max_redemptions_per_org?: number | null
          recurring_cycles?: number | null
          requires_card?: boolean | null
          stacks_with_trial?: boolean | null
          start_date?: string | null
          stripe_coupon_id?: string | null
          updated_at?: string
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
      team_members: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          firm_org_id: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["firm_role"]
          status: string
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          firm_org_id: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["firm_role"]
          status?: string
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          firm_org_id?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["firm_role"]
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_firm_org_id_fkey"
            columns: ["firm_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_workspace_access: {
        Row: {
          created_at: string
          id: string
          team_member_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          team_member_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          team_member_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_workspace_access_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_workspace_access_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      feature_flags_public: {
        Row: {
          created_at: string | null
          description: string | null
          enabled: boolean | null
          id: string | null
          key: string | null
          name: string | null
          segment: string | null
          updated_at: string | null
          user_ids: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string | null
          key?: string | null
          name?: string | null
          segment?: string | null
          updated_at?: string | null
          user_ids?: never
        }
        Update: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string | null
          key?: string | null
          name?: string | null
          segment?: string | null
          updated_at?: string | null
          user_ids?: never
        }
        Relationships: []
      }
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
      has_workspace_access: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_parent_org_owner: {
        Args: { _parent_org_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "platform_admin"
      firm_role: "firm_owner" | "firm_admin" | "accountant" | "staff"
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
      firm_role: ["firm_owner", "firm_admin", "accountant", "staff"],
    },
  },
} as const
