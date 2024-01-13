export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          created_at: string;
          datetime: string;
          id: number;
          is_public: boolean;
        };
        Insert: {
          created_at?: string;
          datetime: string;
          id?: number;
          is_public?: boolean;
        };
        Update: {
          created_at?: string;
          datetime?: string;
          id?: number;
          is_public?: boolean;
        };
        Relationships: [];
      };
      tickets: {
        Row: {
          billing_email: string | null;
          billing_name: string | null;
          billing_phone: string | null;
          created_at: string;
          email: string | null;
          event_id: number;
          group_id: string | null;
          id: string;
          name: string;
          phone: string | null;
          price: number;
          state: string;
          type: string;
        };
        Insert: {
          billing_email?: string | null;
          billing_name?: string | null;
          billing_phone?: string | null;
          created_at?: string;
          email?: string | null;
          event_id: number;
          group_id?: string | null;
          id?: string;
          name: string;
          phone?: string | null;
          price: number;
          state?: string;
          type: string;
        };
        Update: {
          billing_email?: string | null;
          billing_name?: string | null;
          billing_phone?: string | null;
          created_at?: string;
          email?: string | null;
          event_id?: number;
          group_id?: string | null;
          id?: string;
          name?: string;
          phone?: string | null;
          price?: number;
          state?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tickets_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tickets_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "tickets";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never;

// Schema: public
// Tables
export type Events = Database["public"]["Tables"]["events"]["Row"];
export type InsertEvents = Database["public"]["Tables"]["events"]["Insert"];
export type UpdateEvents = Database["public"]["Tables"]["events"]["Update"];

export type Tickets = Database["public"]["Tables"]["tickets"]["Row"];
export type InsertTickets = Database["public"]["Tables"]["tickets"]["Insert"];
export type UpdateTickets = Database["public"]["Tables"]["tickets"]["Update"];
