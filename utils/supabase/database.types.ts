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
      contacts: {
        Row: {
          address: string | null;
          created_at: string;
          email: string | null;
          id: number;
          name: string | null;
          phone: string | null;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          email?: string | null;
          id?: number;
          name?: string | null;
          phone?: string | null;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          email?: string | null;
          id?: number;
          name?: string | null;
          phone?: string | null;
        };
        Relationships: [];
      };
      coupons: {
        Row: {
          amount: number;
          code: string;
          created_at: string;
          id: number;
          note: string | null;
          original_amount: number;
          temp_id: string | null;
          user_id: string;
          valid_until: string | null;
        };
        Insert: {
          amount: number;
          code: string;
          created_at?: string;
          id?: number;
          note?: string | null;
          original_amount: number;
          temp_id?: string | null;
          user_id?: string;
          valid_until?: string | null;
        };
        Update: {
          amount?: number;
          code?: string;
          created_at?: string;
          id?: number;
          note?: string | null;
          original_amount?: number;
          temp_id?: string | null;
          user_id?: string;
          valid_until?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "coupons_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          created_at: string;
          datetime: string;
          id: number;
          is_public: boolean;
          service_id: number;
        };
        Insert: {
          created_at?: string;
          datetime: string;
          id?: number;
          is_public?: boolean;
          service_id: number;
        };
        Update: {
          created_at?: string;
          datetime?: string;
          id?: number;
          is_public?: boolean;
          service_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "events_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      services: {
        Row: {
          created_at: string;
          id: number;
          name: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          name: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          name?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "services_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      tickets: {
        Row: {
          arrived: boolean;
          billing_id: number;
          coupon_created_id: number | null;
          coupon_redeemed_id: number | null;
          created_at: string;
          event_id: number;
          guest_id: number;
          id: string;
          note: string | null;
          payment_status: string;
          price: number;
          type: string;
        };
        Insert: {
          arrived?: boolean;
          billing_id: number;
          coupon_created_id?: number | null;
          coupon_redeemed_id?: number | null;
          created_at?: string;
          event_id: number;
          guest_id: number;
          id?: string;
          note?: string | null;
          payment_status?: string;
          price: number;
          type: string;
        };
        Update: {
          arrived?: boolean;
          billing_id?: number;
          coupon_created_id?: number | null;
          coupon_redeemed_id?: number | null;
          created_at?: string;
          event_id?: number;
          guest_id?: number;
          id?: string;
          note?: string | null;
          payment_status?: string;
          price?: number;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tickets_billing_id_fkey";
            columns: ["billing_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tickets_coupon_created_id_fkey";
            columns: ["coupon_created_id"];
            isOneToOne: false;
            referencedRelation: "coupons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tickets_coupon_redeemed_id_fkey";
            columns: ["coupon_redeemed_id"];
            isOneToOne: false;
            referencedRelation: "coupons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tickets_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tickets_guest_id_fkey";
            columns: ["guest_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          business_name: string | null;
          created_at: string;
          id: string;
        };
        Insert: {
          business_name?: string | null;
          created_at?: string;
          id: string;
        };
        Update: {
          business_name?: string | null;
          created_at?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "users_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
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
export type Contacts = Database["public"]["Tables"]["contacts"]["Row"];
export type InsertContacts = Database["public"]["Tables"]["contacts"]["Insert"];
export type UpdateContacts = Database["public"]["Tables"]["contacts"]["Update"];

export type Coupons = Database["public"]["Tables"]["coupons"]["Row"];
export type InsertCoupons = Database["public"]["Tables"]["coupons"]["Insert"];
export type UpdateCoupons = Database["public"]["Tables"]["coupons"]["Update"];

export type Events = Database["public"]["Tables"]["events"]["Row"];
export type InsertEvents = Database["public"]["Tables"]["events"]["Insert"];
export type UpdateEvents = Database["public"]["Tables"]["events"]["Update"];

export type Services = Database["public"]["Tables"]["services"]["Row"];
export type InsertServices = Database["public"]["Tables"]["services"]["Insert"];
export type UpdateServices = Database["public"]["Tables"]["services"]["Update"];

export type Tickets = Database["public"]["Tables"]["tickets"]["Row"];
export type InsertTickets = Database["public"]["Tables"]["tickets"]["Insert"];
export type UpdateTickets = Database["public"]["Tables"]["tickets"]["Update"];

export type Users = Database["public"]["Tables"]["users"]["Row"];
export type InsertUsers = Database["public"]["Tables"]["users"]["Insert"];
export type UpdateUsers = Database["public"]["Tables"]["users"]["Update"];
