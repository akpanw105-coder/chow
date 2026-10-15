export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'customer' | 'admin' | 'dispatch_rider';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'assigned'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type AssignmentStatus =
  | 'assigned'
  | 'accepted'
  | 'picked_up'
  | 'completed'
  | 'cancelled';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string | null;
          phone_number: string | null;
          avatar_url: string | null;
          role: UserRole;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email?: string | null;
          phone_number?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string | null;
          phone_number?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      addresses: {
        Row: {
          id: string;
          customer_id: string;
          label: string;
          recipient_name: string | null;
          recipient_phone: string | null;
          address_line: string;
          city: string;
          state: string;
          delivery_instructions: string | null;
          latitude: number | null;
          longitude: number | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          label?: string;
          recipient_name?: string | null;
          recipient_phone?: string | null;
          address_line: string;
          city?: string;
          state?: string;
          delivery_instructions?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          label?: string;
          recipient_name?: string | null;
          recipient_phone?: string | null;
          address_line?: string;
          city?: string;
          state?: string;
          delivery_instructions?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          icon: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          icon?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          image_url?: string | null;
          icon?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          short_name: string;
          slug: string;
          description: string;
          image_url: string | null;
          price_kobo: number;
          rating: number;
          review_count: string;
          calories: number;
          preparation_time_minutes: number;
          prep_time_text: string;
          badge: string | null;
          restaurant_name: string;
          distance_text: string;
          is_available: boolean;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          category_id: string;
          name: string;
          short_name: string;
          slug: string;
          description: string;
          image_url?: string | null;
          price_kobo: number;
          rating?: number;
          review_count?: string;
          calories?: number;
          preparation_time_minutes?: number;
          prep_time_text?: string;
          badge?: string | null;
          restaurant_name?: string;
          distance_text?: string;
          is_available?: boolean;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          name?: string;
          short_name?: string;
          slug?: string;
          description?: string;
          image_url?: string | null;
          price_kobo?: number;
          rating?: number;
          review_count?: string;
          calories?: number;
          preparation_time_minutes?: number;
          prep_time_text?: string;
          badge?: string | null;
          restaurant_name?: string;
          distance_text?: string;
          is_available?: boolean;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_id: string;
          address_id: string | null;
          delivery_address_snapshot: string;
          recipient_phone: string;
          customer_notes: string | null;
          status: OrderStatus;
          payment_status: PaymentStatus;
          payment_method: string;
          stripe_payment_intent_id: string | null;
          stripe_client_secret: string | null;
          currency: string;
          subtotal_kobo: number;
          delivery_fee_kobo: number;
          packaging_fee_kobo: number;
          discount_kobo: number;
          total_kobo: number;
          restaurant_name: string;
          estimated_delivery_time: string | null;
          confirmed_at: string | null;
          prepared_at: string | null;
          dispatched_at: string | null;
          delivered_at: string | null;
          cancelled_at: string | null;
          cancellation_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          customer_id: string;
          address_id?: string | null;
          delivery_address_snapshot: string;
          recipient_phone: string;
          customer_notes?: string | null;
          status?: OrderStatus;
          payment_status?: PaymentStatus;
          payment_method?: string;
          stripe_payment_intent_id?: string | null;
          stripe_client_secret?: string | null;
          currency?: string;
          subtotal_kobo: number;
          delivery_fee_kobo?: number;
          packaging_fee_kobo?: number;
          discount_kobo?: number;
          total_kobo: number;
          restaurant_name?: string;
          estimated_delivery_time?: string | null;
          confirmed_at?: string | null;
          prepared_at?: string | null;
          dispatched_at?: string | null;
          delivered_at?: string | null;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          customer_id?: string;
          address_id?: string | null;
          delivery_address_snapshot?: string;
          recipient_phone?: string;
          customer_notes?: string | null;
          status?: OrderStatus;
          payment_status?: PaymentStatus;
          payment_method?: string;
          stripe_payment_intent_id?: string | null;
          stripe_client_secret?: string | null;
          currency?: string;
          subtotal_kobo?: number;
          delivery_fee_kobo?: number;
          packaging_fee_kobo?: number;
          discount_kobo?: number;
          total_kobo?: number;
          restaurant_name?: string;
          estimated_delivery_time?: string | null;
          confirmed_at?: string | null;
          prepared_at?: string | null;
          dispatched_at?: string | null;
          delivered_at?: string | null;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_name: string;
          quantity: number;
          unit_price_kobo: number;
          selected_options: Json;
          line_total_kobo: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_name: string;
          quantity: number;
          unit_price_kobo: number;
          selected_options?: Json;
          line_total_kobo: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          product_name?: string;
          quantity?: number;
          unit_price_kobo?: number;
          selected_options?: Json;
          line_total_kobo?: number;
          created_at?: string;
        };
      };
      dispatch_assignments: {
        Row: {
          id: string;
          order_id: string;
          rider_id: string;
          assigned_by: string | null;
          status: AssignmentStatus;
          assigned_at: string;
          accepted_at: string | null;
          picked_up_at: string | null;
          delivered_at: string | null;
          delivery_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          rider_id: string;
          assigned_by?: string | null;
          status?: AssignmentStatus;
          assigned_at?: string;
          accepted_at?: string | null;
          picked_up_at?: string | null;
          delivered_at?: string | null;
          delivery_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          rider_id?: string;
          assigned_by?: string | null;
          status?: AssignmentStatus;
          assigned_at?: string;
          accepted_at?: string | null;
          picked_up_at?: string | null;
          delivered_at?: string | null;
          delivery_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          changed_by: string | null;
          previous_status: OrderStatus | null;
          new_status: OrderStatus;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          changed_by?: string | null;
          previous_status?: OrderStatus | null;
          new_status: OrderStatus;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          changed_by?: string | null;
          previous_status?: OrderStatus | null;
          new_status?: OrderStatus;
          notes?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_order_secure: {
        Args: {
          p_delivery_address: string;
          p_recipient_phone: string;
          p_payment_method?: string;
          p_customer_notes?: string;
          p_items?: Json;
          p_address_id?: string;
        };
        Returns: Json;
      };
      update_order_status_secure: {
        Args: {
          p_order_id: string;
          p_new_status: OrderStatus;
          p_notes?: string;
        };
        Returns: Json;
      };
      assign_dispatch_rider_secure: {
        Args: {
          p_order_id: string;
          p_rider_id: string;
          p_notes?: string;
        };
        Returns: Json;
      };
    };
  };
}
