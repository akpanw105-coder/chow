/**
 * Admin Service — Chow
 * Business administration operations for order coordination,
 * menu management, and dispatch rider assignment.
 */
import { OrderStatus } from '@/types';

import { isSupabaseConfigured, supabase } from './supabase';

export interface AdminOrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  recipientPhone: string;
  deliveryAddress: string;
  status: OrderStatus;
  totalNaira: number;
  itemsCount: number;
  createdAt: string;
  restaurantName: string;
}

export async function fetchAdminOrders(statusFilter?: OrderStatus): Promise<AdminOrderSummary[]> {
  if (!isSupabaseConfigured) return [];

  try {
    let query = supabase
      .from('orders')
      .select('id, order_number, recipient_phone, delivery_address_snapshot, status, total_kobo, created_at, restaurant_name, customer_id, profiles(full_name)')
      .order('created_at', { ascending: false });

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      orderNumber: d.order_number,
      customerName: d.profiles?.full_name || 'Customer',
      recipientPhone: d.recipient_phone,
      deliveryAddress: d.delivery_address_snapshot,
      status: d.status as OrderStatus,
      totalNaira: Number(d.total_kobo) / 100,
      itemsCount: 1,
      createdAt: d.created_at,
      restaurantName: d.restaurant_name,
    }));
  } catch {
    return [];
  }
}

export async function updateOrderStatusByAdmin(
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

export async function assignDispatchRider(
  orderId: string,
  riderId: string,
  notes?: string
): Promise<boolean> {
  if (!isSupabaseConfigured) return true;

  try {
    const { error } = await supabase.rpc('assign_dispatch_rider_secure', {
      p_order_id: orderId,
      p_rider_id: riderId,
      p_notes: notes,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function fetchAvailableRiders(): Promise<{ id: string; name: string; phone: string }[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone_number')
      .eq('role', 'dispatch_rider')
      .eq('is_active', true);

    if (error || !data) return [];

    return data.map((r) => ({
      id: r.id,
      name: r.full_name,
      phone: r.phone_number || '',
    }));
  } catch {
    return [];
  }
}

export async function updateProductAvailability(productId: string, isAvailable: boolean): Promise<boolean> {
  if (!isSupabaseConfigured) return true;

  try {
    const { error } = await supabase
      .from('products')
      .update({ is_available: isAvailable })
      .eq('id', productId);

    return !error;
  } catch {
    return false;
  }
}

export interface AdminMetrics {
  ordersTodayCount: number;
  revenueTodayNaira: number;
  pendingConfirmationCount: number;
  preparingCount: number;
  readyForPickupCount: number;
  dispatchedActiveCount: number;
  completedTodayCount: number;
  unassignedReadyCount: number;
  cancelledTodayCount: number;
}

export interface AdminOrderDetail extends AdminOrderSummary {
  paymentStatus: string;
  paymentMethod: string;
  subtotalNaira: number;
  deliveryFeeNaira: number;
  packagingFeeNaira: number;
  discountNaira: number;
  customerNotes?: string;
  estimatedDeliveryTime?: string;
  confirmedAt?: string;
  preparedAt?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  assignedRiderId?: string;
  assignedRiderName?: string;
  assignedRiderPhone?: string;
  items: {
    id: string;
    productName: string;
    quantity: number;
    unitPriceNaira: number;
    lineTotalNaira: number;
    selectedOptions?: Record<string, any>;
  }[];
  statusHistory: {
    id: string;
    previousStatus: string | null;
    newStatus: string;
    changedAt: string;
    notes?: string;
    changedByName?: string;
  }[];
}

export interface AdminProductPayload {
  id?: string;
  name: string;
  shortName: string;
  categoryId: string;
  priceNaira: number;
  description: string;
  restaurantName: string;
  isAvailable: boolean;
  isFeatured?: boolean;
  calories?: number;
  prepTimeText?: string;
  badge?: string;
  imageUrl?: string;
}

export interface AdminCustomerSummary {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  ordersCount: number;
  totalSpentNaira: number;
}

/**
 * Fetch real aggregated operational metrics from Supabase
 */
export async function fetchAdminMetrics(): Promise<AdminMetrics> {
  const fallback: AdminMetrics = {
    ordersTodayCount: 0,
    revenueTodayNaira: 0,
    pendingConfirmationCount: 0,
    preparingCount: 0,
    readyForPickupCount: 0,
    dispatchedActiveCount: 0,
    completedTodayCount: 0,
    unassignedReadyCount: 0,
    cancelledTodayCount: 0,
  };

  if (!isSupabaseConfigured) return fallback;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, status, payment_status, total_kobo, created_at, dispatch_assignments(id, status)');

    if (error || !orders) return fallback;

    let revenueToday = 0;
    let ordersToday = 0;
    let pendingConfirmation = 0;
    let preparing = 0;
    let readyForPickup = 0;
    let dispatchedActive = 0;
    let completedToday = 0;
    let unassignedReady = 0;
    let cancelledToday = 0;

    for (const o of orders) {
      const isToday = o.created_at >= todayIso;
      if (isToday) {
        ordersToday++;
        if (o.status === 'delivered' && o.payment_status === 'paid') {
          revenueToday += Number(o.total_kobo) / 100;
          completedToday++;
        }
        if (o.status === 'cancelled') {
          cancelledToday++;
        }
      }

      if (o.status === 'pending' || o.status === 'confirmed') pendingConfirmation++;
      if (o.status === 'preparing') preparing++;
      if (o.status === 'ready_for_pickup') {
        readyForPickup++;
        const hasActiveAssignment = (o.dispatch_assignments || []).some((a: any) => a.status !== 'cancelled');
        if (!hasActiveAssignment) unassignedReady++;
      }
      if (o.status === 'assigned' || o.status === 'picked_up' || o.status === 'out_for_delivery') {
        dispatchedActive++;
      }
    }

    return {
      ordersTodayCount: ordersToday,
      revenueTodayNaira: revenueToday,
      pendingConfirmationCount: pendingConfirmation,
      preparingCount: preparing,
      readyForPickupCount: readyForPickup,
      dispatchedActiveCount: dispatchedActive,
      completedTodayCount: completedToday,
      unassignedReadyCount: unassignedReady,
      cancelledTodayCount: cancelledToday,
    };
  } catch {
    return fallback;
  }
}

/**
 * Fetch detailed order information with line items and status history
 */
export async function fetchAdminOrderDetail(orderId: string): Promise<AdminOrderDetail | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        profiles!orders_customer_id_fkey(full_name, phone_number, email),
        order_items(*),
        dispatch_assignments(
          id, status, rider_id,
          profiles!dispatch_assignments_rider_id_fkey(full_name, phone_number)
        ),
        order_status_history(
          id, previous_status, new_status, created_at, notes,
          profiles!order_status_history_changed_by_fkey(full_name)
        )
      `)
      .eq('id', orderId)
      .maybeSingle();

    if (error || !order) return null;

    const activeAssignment = (order.dispatch_assignments || []).find((a: any) => a.status !== 'cancelled');
    const rider = activeAssignment?.profiles;

    return {
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.profiles?.full_name || 'Customer',
      recipientPhone: order.recipient_phone,
      deliveryAddress: order.delivery_address_snapshot,
      status: order.status as OrderStatus,
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method,
      totalNaira: Number(order.total_kobo) / 100,
      subtotalNaira: Number(order.subtotal_kobo) / 100,
      deliveryFeeNaira: Number(order.delivery_fee_kobo) / 100,
      packagingFeeNaira: Number(order.packaging_fee_kobo) / 100,
      discountNaira: Number(order.discount_kobo) / 100,
      customerNotes: order.customer_notes,
      estimatedDeliveryTime: order.estimated_delivery_time,
      confirmedAt: order.confirmed_at,
      preparedAt: order.prepared_at,
      dispatchedAt: order.dispatched_at,
      deliveredAt: order.delivered_at,
      cancelledAt: order.cancelled_at,
      cancellationReason: order.cancellation_reason,
      restaurantName: order.restaurant_name,
      itemsCount: (order.order_items || []).length,
      createdAt: order.created_at,
      assignedRiderId: activeAssignment?.rider_id,
      assignedRiderName: rider?.full_name,
      assignedRiderPhone: rider?.phone_number,
      items: (order.order_items || []).map((it: any) => ({
        id: it.id,
        productName: it.product_name,
        quantity: it.quantity,
        unitPriceNaira: Number(it.unit_price_kobo) / 100,
        lineTotalNaira: Number(it.line_total_kobo) / 100,
        selectedOptions: it.selected_options,
      })),
      statusHistory: (order.order_status_history || [])
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((h: any) => ({
          id: h.id,
          previousStatus: h.previous_status,
          newStatus: h.new_status,
          changedAt: h.created_at,
          notes: h.notes,
          changedByName: h.profiles?.full_name || 'System',
        })),
    };
  } catch {
    return null;
  }
}

/**
 * Fetch products list for Admin Menu Manager
 */
export async function fetchAdminProducts(): Promise<any[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .order('name', { ascending: true });

    if (error || !data) return [];
    return data.map((p) => ({
      id: p.id,
      name: p.name,
      shortName: p.short_name,
      categoryId: p.category_id,
      categoryName: p.categories?.name || 'General',
      priceNaira: Number(p.price_kobo) / 100,
      rating: p.rating,
      reviewCount: p.review_count,
      isAvailable: p.is_available,
      isFeatured: p.is_featured,
      restaurantName: p.restaurant_name,
      description: p.description,
      badge: p.badge,
      prepTimeText: p.prep_time_text,
    }));
  } catch {
    return [];
  }
}

/**
 * Create or update product in Supabase catalog
 */
export async function saveAdminProduct(payload: AdminProductPayload): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: true };

  try {
    const priceKobo = Math.round(payload.priceNaira * 100);
    const slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const record = {
      name: payload.name,
      short_name: payload.shortName || payload.name,
      slug,
      category_id: payload.categoryId,
      price_kobo: priceKobo,
      description: payload.description,
      restaurant_name: payload.restaurantName || 'Calabar Kitchen',
      is_available: payload.isAvailable,
      is_featured: payload.isFeatured ?? false,
      calories: payload.calories ?? 450,
      prep_time_text: payload.prepTimeText || '25 min',
      badge: payload.badge || null,
      image_url: payload.imageUrl || null,
    };

    if (payload.id) {
      const { error } = await supabase.from('products').update(record).eq('id', payload.id);
      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase.from('products').insert(record);
      if (error) return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Fetch customer list with order summaries for Admin
 */
export async function fetchAdminCustomers(): Promise<AdminCustomerSummary[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone_number, role, is_active, created_at, orders(id, total_kobo, status)')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((p) => {
      const userOrders = p.orders || [];
      const totalSpentKobo = userOrders
        .filter((o: any) => o.status === 'delivered')
        .reduce((sum: number, o: any) => sum + Number(o.total_kobo || 0), 0);

      return {
        id: p.id,
        fullName: p.full_name,
        email: p.email || 'No email',
        phone: p.phone_number || 'No phone',
        role: p.role,
        isActive: p.is_active ?? true,
        createdAt: p.created_at,
        ordersCount: userOrders.length,
        totalSpentNaira: totalSpentKobo / 100,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Subscribe to realtime orders for instant live admin dashboard updates
 */
export function subscribeToAdminOrdersRealtime(onUpdate: () => void): () => void {
  if (!isSupabaseConfigured) return () => {};

  const channel = supabase
    .channel('admin_orders_live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
      onUpdate();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'dispatch_assignments' }, () => {
      onUpdate();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

