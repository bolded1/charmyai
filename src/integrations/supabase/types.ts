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
      documents: {
        Row: {
          category: string | null
          confidence_score: number | null
          created_at: string
          currency: string | null
          customer_name: string | null
          document_type: string | null
          due_date: string | null
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
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
