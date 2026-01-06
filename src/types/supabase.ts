export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      submissions: {
        Row: {
          id: string
          guest_name: string | null
          message: string
          photo_url: string
          table_number: number | null
          created_at: string
        }
        Insert: {
          id?: string
          guest_name?: string | null
          message: string
          photo_url: string
          table_number?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          guest_name?: string | null
          message?: string
          photo_url?: string
          table_number?: number | null
          created_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          value: Json
          updated_at: string
        }
        Insert: {
          key: string
          value: Json
          updated_at?: string
        }
        Update: {
          key?: string
          value?: Json
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Submission = Database['public']['Tables']['submissions']['Row']
export type NewSubmission = Database['public']['Tables']['submissions']['Insert']
