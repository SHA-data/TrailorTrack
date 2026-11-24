/**
 * Hand-written TypeScript definitions matching the Supabase Postgres schema.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "customer" | "tailor";
export type ConsentStatus = "pending" | "active" | "revoked" | "declined";
export type ConsentScope = "measurements" | "orders" | "saved_looks";
export type AccessAction = "viewed_profile" | "viewed_measurements" | "viewed_family";

export type FitCategory = "men" | "women" | "boys" | "girls";
export type PreferredUnit = "in" | "cm";
export type FamilyRelation =
  "spouse" | "son" | "daughter" | "father" | "mother" | "brother" | "sister" | "other";
export type GarmentType =
  "kameez" | "shirt" | "shalwar" | "trouser" | "waistcoat" | "sherwani" | "coat";
export type FitPreference = "slim" | "regular" | "loose";
export type MeasurementSource = "self" | "tailor";

export type OrderStatus =
  "received" | "cutting" | "stitching" | "ready" | "delivered" | "cancelled";

export type FabricSource = "customer" | "shop";

export type OrderEventKind =
  "created" | "status_changed" | "delivery_rescheduled" | "price_changed" | "payment_recorded";

export type NotificationKind =
  "order_created" | "order_status" | "order_rescheduled" | "order_price_changed" | "order_payment";

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
          requested_scopes: ConsentScope[];
          scopes: ConsentScope[];
          status: ConsentStatus;
          granted_at: string | null;
          revoked_at: string | null;
          expires_at: string | null;
          responded_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          shop_id: string;
          requested_scopes?: ConsentScope[];
          scopes?: ConsentScope[];
          status?: ConsentStatus;
          granted_at?: string | null;
          revoked_at?: string | null;
          expires_at?: string | null;
          responded_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          shop_id?: string;
          requested_scopes?: ConsentScope[];
          scopes?: ConsentScope[];
          status?: ConsentStatus;
          granted_at?: string | null;
          revoked_at?: string | null;
          expires_at?: string | null;
          responded_at?: string | null;
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
      access_log: {
        Row: {
          id: string;
          customer_id: string;
          shop_id: string;
          action: AccessAction;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          shop_id: string;
          action: AccessAction;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          shop_id?: string;
          action?: AccessAction;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "access_log_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "access_log_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "tailor_shops";
            referencedColumns: ["id"];
          },
        ];
      };
      qr_lookup_attempts: {
        Row: {
          id: string;
          shop_id: string;
          succeeded: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          succeeded: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          succeeded?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "qr_lookup_attempts_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "tailor_shops";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          shop_id: string;
          customer_id: string;
          family_member_id: string | null;
          person_label: string;
          shop_name: string;
          shop_city: string | null;
          shop_phone: string | null;
          order_seq: number;
          consent_id: string | null;
          status: OrderStatus;
          total_pkr: number;
          paid_pkr: number;
          delivery_date: string;
          created_at: string;
          updated_at: string;
          status_changed_at: string;
          closed_at: string | null;
        };
        Insert: {
          id?: string;
          shop_id: string;
          customer_id: string;
          family_member_id?: string | null;
          person_label: string;
          shop_name: string;
          shop_city?: string | null;
          shop_phone?: string | null;
          order_seq: number;
          consent_id?: string | null;
          status?: OrderStatus;
          total_pkr: number;
          paid_pkr?: number;
          delivery_date: string;
          created_at?: string;
          updated_at?: string;
          status_changed_at?: string;
          closed_at?: string | null;
        };
        Update: {
          id?: string;
          shop_id?: string;
          customer_id?: string;
          family_member_id?: string | null;
          person_label?: string;
          shop_name?: string;
          shop_city?: string | null;
          shop_phone?: string | null;
          order_seq?: number;
          consent_id?: string | null;
          status?: OrderStatus;
          total_pkr?: number;
          paid_pkr?: number;
          delivery_date?: string;
          created_at?: string;
          updated_at?: string;
          status_changed_at?: string;
          closed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "orders_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "tailor_shops";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          position: number;
          garment_type: GarmentType;
          quantity: number;
          fabric_source: FabricSource;
          fabric_details: string | null;
          fabric_metres: number | null;
          design_notes: string | null;
          has_snapshot: boolean;
        };
        Insert: {
          id?: string;
          order_id: string;
          position: number;
          garment_type: GarmentType;
          quantity?: number;
          fabric_source: FabricSource;
          fabric_details?: string | null;
          fabric_metres?: number | null;
          design_notes?: string | null;
          has_snapshot?: boolean;
        };
        Update: {
          id?: string;
          order_id?: string;
          position?: number;
          garment_type?: GarmentType;
          quantity?: number;
          fabric_source?: FabricSource;
          fabric_details?: string | null;
          fabric_metres?: number | null;
          design_notes?: string | null;
          has_snapshot?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      order_item_measurements: {
        Row: {
          item_id: string;
          source_set_id: string | null;
          values: Record<string, number>;
          fit_preference: FitPreference | null;
          taken_on: string | null;
          created_at: string;
        };
        Insert: {
          item_id: string;
          source_set_id?: string | null;
          values: Record<string, number>;
          fit_preference?: FitPreference | null;
          taken_on?: string | null;
          created_at?: string;
        };
        Update: {
          item_id?: string;
          source_set_id?: string | null;
          values?: Record<string, number>;
          fit_preference?: FitPreference | null;
          taken_on?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_item_measurements_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: true;
            referencedRelation: "order_items";
            referencedColumns: ["id"];
          },
        ];
      };
      order_events: {
        Row: {
          id: string;
          order_id: string;
          kind: OrderEventKind;
          from_value: string | null;
          to_value: string | null;
          note: string | null;
          actor_user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          kind: OrderEventKind;
          from_value?: string | null;
          to_value?: string | null;
          note?: string | null;
          actor_user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          kind?: OrderEventKind;
          from_value?: string | null;
          to_value?: string | null;
          note?: string | null;
          actor_user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_events_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          kind: NotificationKind;
          data: Json;
          order_id: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind: NotificationKind;
          data?: Json;
          order_id?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          kind?: NotificationKind;
          data?: Json;
          order_id?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      shop_order_counters: {
        Row: {
          shop_id: string;
          last_seq: number;
        };
        Insert: {
          shop_id: string;
          last_seq?: number;
        };
        Update: {
          shop_id?: string;
          last_seq?: number;
        };
        Relationships: [
          {
            foreignKeyName: "shop_order_counters_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: true;
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
      get_caller_shop_id: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
      };
      get_caller_customer_id: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
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
      lookup_passport: {
        Args: { p_token: string };
        Returns: {
          masked_name: string;
          status: "none" | "pending" | "active" | "expired" | "declined" | "revoked";
          consent_id: string | null;
          cooldown_until: string | null;
        } | null;
      };
      request_access: {
        Args: {
          p_token: string;
          p_scopes: string[];
        };
        Returns: string;
      };
      respond_to_consent: {
        Args: {
          p_consent_id: string;
          p_decision: "approve" | "decline";
          p_scopes: string[] | null;
          p_duration_days?: number;
        };
        Returns: boolean;
      };
      revoke_consent: {
        Args: { p_consent_id: string };
        Returns: boolean;
      };
      my_consent_status: {
        Args: { p_consent_id: string };
        Returns: {
          id: string;
          status: ConsentStatus;
          scopes: ConsentScope[];
          expires_at: string | null;
          customer_id: string | null;
        } | null;
      };
      list_my_consented_customers: {
        Args: Record<PropertyKey, never>;
        Returns: {
          customer_id: string;
          full_name: string;
          phone: string | null;
          city: string | null;
          fit_category: FitCategory | null;
          scopes: ConsentScope[];
          expires_at: string;
        }[];
      };
      get_consented_customer: {
        Args: { p_customer_id: string };
        Returns: {
          customer_id: string;
          full_name: string;
          phone: string | null;
          city: string | null;
          fit_category: FitCategory | null;
          scopes: ConsentScope[];
          expires_at: string;
        };
      };
      log_measurement_view: {
        Args: {
          p_customer_id: string;
          p_what: "viewed_measurements" | "viewed_family";
        };
        Returns: boolean;
      };
      list_pending_requests: {
        Args: Record<PropertyKey, never>;
        Returns: {
          consent_id: string;
          shop_id: string;
          shop_name: string;
          shop_city: string | null;
          shop_address: string | null;
          shop_phone: string | null;
          requested_scopes: ConsentScope[];
          created_at: string;
        }[];
      };
      list_my_access: {
        Args: Record<PropertyKey, never>;
        Returns: {
          consent_id: string;
          shop_id: string;
          shop_name: string;
          shop_city: string | null;
          shop_phone: string | null;
          status: "active" | "expired" | "declined" | "revoked";
          scopes: ConsentScope[];
          requested_scopes: ConsentScope[];
          granted_at: string | null;
          expires_at: string | null;
          revoked_at: string | null;
          responded_at: string | null;
        }[];
      };
      create_order: {
        Args: {
          p_customer_id: string;
          p_family_member_id: string | null;
          p_delivery_date: string;
          p_total_pkr: number;
          p_advance_pkr: number;
          p_items: Json;
        };
        Returns: string;
      };
      update_order_status: {
        Args: {
          p_order_id: string;
          p_new_status: OrderStatus;
          p_note?: string | null;
        };
        Returns: boolean;
      };
      reschedule_order: {
        Args: {
          p_order_id: string;
          p_new_date: string;
          p_note?: string | null;
        };
        Returns: boolean;
      };
      change_order_price: {
        Args: {
          p_order_id: string;
          p_new_total: number;
          p_note?: string | null;
        };
        Returns: boolean;
      };
      record_payment: {
        Args: {
          p_order_id: string;
          p_amount: number;
        };
        Returns: boolean;
      };
      mark_notifications_read: {
        Args: {
          p_ids?: string[] | null;
        };
        Returns: number;
      };
      shop_dashboard_stats: {
        Args: Record<PropertyKey, never>;
        Returns: ShopDashboardStats;
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

export interface ShopDashboardStats {
  received_count: number;
  cutting_count: number;
  stitching_count: number;
  ready_count: number;
  delivered_count: number;
  cancelled_count: number;
  due_today: number;
  due_next_7_days: number;
  overdue: number;
  outstanding_balance_pkr: number;
  created_this_month: number;
  delivered_this_month: number;
  active_consented_customers: number;
}
