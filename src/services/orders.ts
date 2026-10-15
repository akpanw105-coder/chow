/**
 * Orders Service — Chow
 * Manages order creation via PostgreSQL RPC `create_order_secure`,
 * order history queries, status tracking, and Supabase Realtime updates.
 */
import { CartItem, Order, OrderStatus } from '@/types';

import { isSupabaseConfigured, supabase } from './supabase';

export interface PlaceOrderParams {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  packagingFee: number;
  discount: number;
  total: number;
  paymentMethod: 'card' | 'transfer' | 'cash';
  deliveryAddress: string;
  recipientPhone: string;
  deliveryNote?: string;
  restaurantName?: string;
  addressId?: string;
}

export async function placeOrderInBackend(params: PlaceOrderParams): Promise<Order> {
  const generateSimulatedOrder = (): Order => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return {
      id: `ord_${Date.now()}`,
      orderNumber: `CHOW-${randomSuffix}`,
      items: params.items,
      subtotal: params.subtotal,
      deliveryFee: params.deliveryFee,
      packagingFee: params.packagingFee,
      discount: params.discount,
      total: params.total,
      status: 'confirmed',
      paymentMethod: params.paymentMethod,
      createdAt: new Date().toISOString(),
      deliveryAddress: params.deliveryAddress,
      recipientPhone: params.recipientPhone,
      deliveryNote: params.deliveryNote,
      estimatedTime: '25-35 min',
      restaurantName: params.restaurantName || params.items[0]?.food.restaurant || 'Calabar Kitchen',
    };
  };

  if (!isSupabaseConfigured) {
    return generateSimulatedOrder();
  }

  // Check if there is an active authenticated Supabase session
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData?.session;

  if (!session?.user) {
    console.warn('No active Supabase auth session found. Creating simulated demo order.');
    return generateSimulatedOrder();
  }

  try {
    // Format items for PostgreSQL RPC function
    const payloadItems = params.items.map((it) => ({
      product_id: it.food.id,
      quantity: it.quantity,
      selected_options: {
        swallow_id: it.selectedSwallow?.id,
        portion_id: it.selectedPortion?.id,
        swallow_label: it.selectedSwallow?.label,
        portion_label: it.selectedPortion?.label,
      },
    }));

    // Call secure atomic RPC
    const { data, error } = await supabase.rpc('create_order_secure', {
      p_address_id: params.addressId || null,
      p_delivery_address: params.deliveryAddress,
      p_recipient_phone: params.recipientPhone,
      p_customer_notes: params.deliveryNote || null,
      p_items: payloadItems as any,
      p_payment_method: params.paymentMethod,
    });

    if (error || !data) {
      console.warn('RPC create_order_secure failed, falling back:', error?.message);
      throw new Error(error?.message || 'Failed to create order on server.');
    }

    const created = data as any;
    return {
      id: created.order_id,
      orderNumber: created.order_number,
      items: params.items,
      subtotal: Number(created.subtotal_kobo ? created.subtotal_kobo / 100 : params.subtotal),
      deliveryFee: Number(created.delivery_fee_kobo ? created.delivery_fee_kobo / 100 : params.deliveryFee),
      packagingFee: Number(created.packaging_fee_kobo ? created.packaging_fee_kobo / 100 : params.packagingFee),
      discount: params.discount,
      total: Number(created.total_kobo ? created.total_kobo / 100 : params.total),
      status: (created.status as OrderStatus) || 'confirmed',
      paymentMethod: params.paymentMethod,
      createdAt: new Date().toISOString(),
      deliveryAddress: params.deliveryAddress,
      recipientPhone: params.recipientPhone,
      deliveryNote: params.deliveryNote,
      estimatedTime: '25-35 min',
      restaurantName: params.restaurantName || 'Calabar Kitchen',
    };
  } catch (err: any) {
    console.error('Order creation error:', err);
    throw err;
  }
}

export async function fetchCustomerOrders(customerId: string): Promise<Order[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data: ordersData, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error || !ordersData) return [];

    return ordersData.map((ord: any) => ({
      id: ord.id,
      orderNumber: ord.order_number,
      items: (ord.order_items || []).map((it: any) => ({
        food: {
          id: it.product_id,
          name: it.product_name,
          shortName: it.product_name,
          description: '',
          category: 'soups' as any,
          basePrice: Number(it.unit_price_kobo) / 100,
          rating: 4.8,
          reviewCount: '1k+',
          calories: 500,
          prepTime: '25 min',
          restaurant: ord.restaurant_name,
          distance: '1.5 Km',
          image: require('@/assets/images/food/bole_fish.png'),
        },
        quantity: it.quantity,
        unitPrice: Number(it.unit_price_kobo) / 100,
      })),
      subtotal: Number(ord.subtotal_kobo) / 100,
      deliveryFee: Number(ord.delivery_fee_kobo) / 100,
      packagingFee: Number(ord.packaging_fee_kobo) / 100,
      discount: Number(ord.discount_kobo) / 100,
      total: Number(ord.total_kobo) / 100,
      status: ord.status as OrderStatus,
      paymentMethod: ord.payment_method as any,
      createdAt: ord.created_at,
      deliveryAddress: ord.delivery_address_snapshot,
      recipientPhone: ord.recipient_phone,
      deliveryNote: ord.customer_notes || undefined,
      estimatedTime: ord.estimated_delivery_time || '25-35 min',
      restaurantName: ord.restaurant_name,
    }));
  } catch {
    return [];
  }
}

/**
 * Subscribe to real-time status updates for an order using Supabase Realtime channel
 */
export function subscribeToOrderRealtime(
  orderId: string,
  onStatusChange: (newStatus: OrderStatus) => void
): () => void {
  if (!isSupabaseConfigured) {
    return () => {};
  }

  const channel = supabase
    .channel(`order_tracking_${orderId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      },
      (payload) => {
        if (payload.new && (payload.new as any).status) {
          onStatusChange((payload.new as any).status as OrderStatus);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Update order status securely via Supabase RPC `update_order_status_secure`
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  notes?: string
): Promise<boolean> {
  if (!isSupabaseConfigured) return true;

  try {
    const { error } = await supabase.rpc('update_order_status_secure', {
      p_order_id: orderId,
      p_new_status: newStatus,
      p_notes: notes,
    });
    return !error;
  } catch {
    return false;
  }
}
