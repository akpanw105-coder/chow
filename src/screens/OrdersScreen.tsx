/**
 * Orders History & Active Screen — Chow
 * Corresponds to the "Orders" tab in the Stitch navigation bar.
 * Allows users to toggle between Active orders and Completed order history,
 * view order breakdown, reorder favorite dishes, and track on-going deliveries.
 */
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChowColors, Radius, Shadows, Typography } from '@/constants/theme';
import { formatPrice } from '@/data/foods';
import { useCart } from '@/store/cartStore';
import { useOrders } from '@/store/ordersStore';
import { Order, OrderStatus } from '@/types';

function StatusBadge({ status }: { status: OrderStatus }) {
  const config: Record<OrderStatus, { bg: string; text: string; label: string }> = {
    pending: { bg: '#FEF3C7', text: '#B45309', label: 'Pending' },
    confirmed: { bg: '#DBEAFE', text: '#1D4ED8', label: 'Confirmed' },
    preparing: { bg: '#FEE2E2', text: '#B91C1C', label: 'Preparing' },
    on_the_way: { bg: '#FFEDD5', text: '#C2410C', label: 'On The Way' },
    delivered: { bg: '#DCFCE7', text: '#15803D', label: 'Delivered' },
    cancelled: { bg: '#F3F4F6', text: '#6B7280', label: 'Cancelled' },
  };

  const c = config[status] || config.pending;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{c.label}</Text>
    </View>
  );
}

function OrderHistoryCard({ order }: { order: Order }) {
  const { addItem } = useCart();
  const isActive = order.status !== 'delivered' && order.status !== 'cancelled';

  function handleReorder() {
    order.items.forEach((item) => {
      addItem(item.food, item.quantity, item.selectedSwallow, item.selectedPortion);
    });
    router.push('/cart');
  }

  return (
    <View style={styles.card}>
      {/* Top Header */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.restaurantName}>{order.restaurantName}</Text>
          <Text style={styles.orderMeta}>
            {order.orderNumber} • {new Date(order.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <StatusBadge status={order.status} />
      </View>

      {/* Item thumbnails and title summary */}
      <View style={styles.cardBody}>
        <View style={styles.thumbsRow}>
          {order.items.slice(0, 3).map((it, idx) => (
            <Image key={idx} source={it.food.image} style={styles.foodThumb} />
          ))}
          {order.items.length > 3 && (
            <View style={styles.extraThumbCount}>
              <Text style={styles.extraThumbText}>+{order.items.length - 3}</Text>
            </View>
          )}
        </View>
        <Text style={styles.itemsSummary} numberOfLines={2}>
          {order.items.map((it) => `${it.quantity}× ${it.food.shortName}`).join(', ')}
        </Text>
      </View>

      {/* Price and CTA row */}
      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.totalLabel}>Total Price</Text>
          <Text style={styles.totalValue}>{formatPrice(order.total)}</Text>
        </View>

        <View style={styles.actionRow}>
          {isActive ? (
            <Pressable
              style={styles.trackBtn}
              onPress={() => router.push(`/order-track?id=${order.id}`)}>
              <Text style={styles.trackBtnText}>Track Order 🛵</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.reorderBtn} onPress={handleReorder}>
              <Text style={styles.reorderBtnText}>Reorder ↻</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

export default function OrdersScreen() {
  const { orders } = useOrders();
  const [tab, setTab] = useState<'active' | 'completed'>('active');

  const activeOrders = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled');
  const completedOrders = orders.filter((o) => o.status === 'delivered' || o.status === 'cancelled');

  const displayedOrders = tab === 'active' ? activeOrders : completedOrders;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Screen Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      {/* ── Segmented Tab Selector ── */}
      <View style={styles.tabSelector}>
        <Pressable
          style={[styles.tabBtn, tab === 'active' && styles.tabBtnActive]}
          onPress={() => setTab('active')}>
          <Text style={[styles.tabBtnText, tab === 'active' && styles.tabBtnTextActive]}>
            Active Orders ({activeOrders.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, tab === 'completed' && styles.tabBtnActive]}
          onPress={() => setTab('completed')}>
          <Text style={[styles.tabBtnText, tab === 'completed' && styles.tabBtnTextActive]}>
            Completed ({completedOrders.length})
          </Text>
        </Pressable>
      </View>

      {/* ── Orders List ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}>
        {displayedOrders.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={{ fontSize: 44 }}>🧾</Text>
            <Text style={styles.emptyTitle}>
              {tab === 'active' ? 'No active orders' : 'No past orders yet'}
            </Text>
            <Text style={styles.emptySub}>
              {tab === 'active'
                ? "You don't have any meals cooking or on the way."
                : 'Your completed delicious feasts will be listed here.'}
            </Text>
            <Pressable style={styles.browseBtn} onPress={() => router.replace('/')}>
              <Text style={styles.browseBtnText}>Explore Delicacies</Text>
            </Pressable>
          </View>
        ) : (
          displayedOrders.map((order) => (
            <OrderHistoryCard key={order.id} order={order} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ChowColors.canvas },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: ChowColors.border,
  },
  headerTitle: { ...Typography.headlineSm, color: ChowColors.textPrimary },
  tabSelector: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: Radius.full,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.full,
    alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: '#fff', ...Shadows.card },
  tabBtnText: { ...Typography.labelSm, color: ChowColors.textSecondary },
  tabBtnTextActive: { color: ChowColors.textPrimary, fontWeight: '700' },
  listContent: { padding: 16, gap: 14, paddingBottom: 110 },

  // Card
  card: {
    backgroundColor: ChowColors.surface,
    borderRadius: Radius.DEFAULT,
    padding: 16,
    gap: 12,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: ChowColors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  restaurantName: { ...Typography.labelMd, color: ChowColors.textPrimary, fontWeight: '700' },
  orderMeta: { ...Typography.labelSm, color: ChowColors.textMuted, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  badgeText: { fontSize: 10, fontWeight: '700' },
  cardBody: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumbsRow: { flexDirection: 'row', alignItems: 'center' },
  foodThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#fff',
    marginRight: -10,
  },
  extraThumbCount: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  extraThumbText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  itemsSummary: { flex: 1, ...Typography.bodyMd, color: ChowColors.textSecondary, marginLeft: 14 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: ChowColors.border,
    paddingTop: 10,
  },
  totalLabel: { fontSize: 10, color: ChowColors.textMuted, textTransform: 'uppercase' },
  totalValue: { ...Typography.labelLg, color: ChowColors.textPrimary, fontWeight: '800' },
  actionRow: { flexDirection: 'row', gap: 8 },
  trackBtn: {
    backgroundColor: ChowColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    ...Shadows.primaryGlow,
  },
  trackBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  reorderBtn: {
    backgroundColor: ChowColors.secondaryLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: ChowColors.secondary,
  },
  reorderBtnText: { color: ChowColors.primary, fontSize: 12, fontWeight: '700' },

  // Empty
  emptyWrap: { alignItems: 'center', padding: 40, gap: 10, marginTop: 40 },
  emptyTitle: { ...Typography.headlineSm, color: ChowColors.textPrimary },
  emptySub: { ...Typography.bodyMd, color: ChowColors.textSecondary, textAlign: 'center' },
  browseBtn: {
    marginTop: 14,
    backgroundColor: ChowColors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: Radius.full,
    ...Shadows.primaryGlow,
  },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
