/**
 * Dispatch Rider Service — Chow
 * Delivers assigned order management and real-time delivery status updates.
 */
import { OrderStatus } from '@/types';

import { isSupabaseConfigured, supabase } from './supabase';

export interface RiderDelivery {
  assignmentId: string;
  orderId: string;
  orderNumber: string;
  deliveryAddress: string;
  recipientPhone: string;
  restaurantName: string;
  orderStatus: OrderStatus;
  deliveryNotes?: string;
  assignedAt: string;
}

export async function fetchRiderDeliveries(riderId: string): Promise<RiderDelivery[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('dispatch_assignments')
      .select('id, order_id, status, assigned_at, delivery_notes, orders(id, order_number, delivery_address_snapshot, recipient_phone, restaurant_name, status)')
      .eq('rider_id', riderId)
      .neq('status', 'completed')
      .order('assigned_at', { ascending: false });

    if (error || !data) return [];

    return data.map((d: any) => ({
      assignmentId: d.id,
      orderId: d.order_id,
      orderNumber: d.orders?.order_number || '',
      deliveryAddress: d.orders?.delivery_address_snapshot || '',
      recipientPhone: d.orders?.recipient_phone || '',
      restaurantName: d.orders?.restaurant_name || 'Calabar Kitchen',
      orderStatus: d.orders?.status as OrderStatus,
      deliveryNotes: d.delivery_notes || undefined,
      assignedAt: d.assigned_at,
    }));
  } catch {
    return [];
  }
}

export interface RiderDeliveryDetail extends RiderDelivery {
  paymentMethod: string;
  paymentStatus: string;
  totalNaira: number;
  customerNotes?: string;
  customerName?: string;
  items: {
    productName: string;
    quantity: number;
    unitPriceNaira: number;
    lineTotalNaira: number;
  }[];
}

export async function fetchRiderDeliveryDetail(orderId: string, riderId: string): Promise<RiderDeliveryDetail | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const { data: assignment, error } = await supabase
      .from('dispatch_assignments')
      .select(`
        id, order_id, status, assigned_at, delivery_notes,
        orders(
          id, order_number, delivery_address_snapshot, recipient_phone, restaurant_name, status,
          payment_method, payment_status, total_kobo, customer_notes,
          profiles!orders_customer_id_fkey(full_name),
          order_items(product_name, quantity, unit_price_kobo, line_total_kobo)
        )
      `)
      .eq('order_id', orderId)
      .eq('rider_id', riderId)
      .maybeSingle();

    if (error || !assignment || !assignment.orders) return null;

    const ord = assignment.orders as any;
    return {
      assignmentId: assignment.id,
      orderId: assignment.order_id,
      orderNumber: ord.order_number,
      deliveryAddress: ord.delivery_address_snapshot,
      recipientPhone: ord.recipient_phone,
      restaurantName: ord.restaurant_name,
      orderStatus: ord.status as OrderStatus,
      deliveryNotes: assignment.delivery_notes || undefined,
      assignedAt: assignment.assigned_at,
      paymentMethod: ord.payment_method,
      paymentStatus: ord.payment_status,
      totalNaira: Number(ord.total_kobo) / 100,
      customerNotes: ord.customer_notes,
      customerName: ord.profiles?.full_name || 'Customer',
      items: (ord.order_items || []).map((it: any) => ({
        productName: it.product_name,
        quantity: it.quantity,
        unitPriceNaira: Number(it.unit_price_kobo) / 100,
        lineTotalNaira: Number(it.line_total_kobo) / 100,
      })),
    };
  } catch {
    return null;
  }
}

export async function fetchRiderDeliveryHistory(riderId: string): Promise<RiderDelivery[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('dispatch_assignments')
      .select('id, order_id, status, assigned_at, delivery_notes, orders(id, order_number, delivery_address_snapshot, recipient_phone, restaurant_name, status)')
      .eq('rider_id', riderId)
      .order('assigned_at', { ascending: false });

    if (error || !data) return [];

    return data.map((d: any) => ({
      assignmentId: d.id,
      orderId: d.order_id,
      orderNumber: d.orders?.order_number || '',
      deliveryAddress: d.orders?.delivery_address_snapshot || '',
      recipientPhone: d.orders?.recipient_phone || '',
      restaurantName: d.orders?.restaurant_name || 'Calabar Kitchen',
      orderStatus: d.orders?.status as OrderStatus,
      deliveryNotes: d.delivery_notes || undefined,
      assignedAt: d.assigned_at,
    }));
  } catch {
    return [];
  }
}

export async function setRiderAvailability(riderId: string, isAvailable: boolean): Promise<boolean> {
  if (!isSupabaseConfigured) return true;

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: isAvailable })
      .eq('id', riderId);

    return !error;
  } catch {
    return false;
  }
}

export function subscribeToRiderDeliveriesRealtime(riderId: string, onUpdate: () => void): () => void {
  if (!isSupabaseConfigured) return () => {};

  const channel = supabase
    .channel(`rider_${riderId}_live`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'dispatch_assignments', filter: `rider_id=eq.${riderId}` },
      () => {
        onUpdate();
      }
    )
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
      onUpdate();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
