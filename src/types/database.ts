/**
 * Hand-written TypeScript definitions matching the Supabase Postgres schema.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "customer" | "tailor";
export type ConsentStatus = "pending" | "active" | "revoked" | "declined";
export type ConsentScope = "measurements" | "orders" | "saved_looks";

export type FitCategory = "men" | "women" | "boys" | "girls";
export type PreferredUnit = "in" | "cm";
export type FamilyRelation =
  "spouse" | "son" | "daughter" | "father" | "mother" | "brother" | "sister" | "other";
export type GarmentType =
  "kameez" | "shirt" | "shalwar" | "trouser" | "waistcoat" | "sherwani" | "coat";
export type FitPreference = "slim" | "regular" | "loose";
export type MeasurementSource = "self" | "tailor";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          full_name: string;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: UserRole;
          full_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          user_id: string;
          city: string | null;
          qr_token: string;
          qr_token_rotated_at: string | null;
          fit_category: FitCategory | null;
          preferred_unit: PreferredUnit;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          city?: string | null;
          qr_token?: string;
          qr_token_rotated_at?: string | null;
          fit_category?: FitCategory | null;
          preferred_unit?: PreferredUnit;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          city?: string | null;
          qr_token?: string;
          qr_token_rotated_at?: string | null;
          fit_category?: FitCategory | null;
          preferred_unit?: PreferredUnit;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customers_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      family_members: {
        Row: {
          id: string;
          customer_id: string;
          full_name: string;
          relation: FamilyRelation;
          fit_category: FitCategory;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          full_name: string;
          relation: FamilyRelation;
          fit_category: FitCategory;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          full_name?: string;
          relation?: FamilyRelation;
          fit_category?: FitCategory;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "family_members_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      measurement_sets: {
        Row: {
          id: string;
          customer_id: string;
          family_member_id: string | null;
          garment_type: GarmentType;
          values: Record<string, number>;
          fit_preference: FitPreference | null;
          notes: string | null;
          source: MeasurementSource;
          shop_id: string | null;
          taken_on: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          family_member_id?: string | null;
          garment_type: GarmentType;
          values: Record<string, number>;
          fit_preference?: FitPreference | null;
          notes?: string | null;
          source?: MeasurementSource;
          shop_id?: string | null;
          taken_on?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          family_member_id?: string | null;
          garment_type?: GarmentType;
          values?: Record<string, number>;
          fit_preference?: FitPreference | null;
          notes?: string | null;
          source?: MeasurementSource;
          shop_id?: string | null;
          taken_on?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "measurement_sets_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_measurement_sets_family_member";
            columns: ["family_member_id", "customer_id"];
            isOneToOne: false;
            referencedRelation: "family_members";
            referencedColumns: ["id", "customer_id"];
          },
          {
            foreignKeyName: "measurement_sets_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "tailor_shops";
            referencedColumns: ["id"];
          },
        ];
      };
      tailor_shops: {
        Row: {
          id: string;
          owner_id: string;
          shop_name: string;
          city: string | null;
          address: string | null;
          phone: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          shop_name: string;
          city?: string | null;
          address?: string | null;
          phone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          shop_name?: string;
          city?: string | null;
          address?: string | null;
          phone?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tailor_shops_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      consents: {
        Row: {
          id: string;
          customer_id: string;
          shop_id: string;
          scopes: ConsentScope[];
          status: ConsentStatus;
          granted_at: string | null;
          revoked_at: string | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          shop_id: string;
          scopes?: ConsentScope[];
          status?: ConsentStatus;
          granted_at?: string | null;
          revoked_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          shop_id?: string;
          scopes?: ConsentScope[];
          status?: ConsentStatus;
          granted_at?: string | null;
          revoked_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "consents_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "consents_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "tailor_shops";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      rotate_my_qr_token: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      is_customer_owner: {
        Args: { p_customer_id: string };
        Returns: boolean;
      };
      is_shop_owner: {
        Args: { p_shop_id: string };
        Returns: boolean;
      };
      has_active_consent: {
        Args: {
          p_shop_id: string;
          p_customer_id: string;
          p_scope: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
