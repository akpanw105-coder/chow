import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChowColors, Radius, Shadows, Typography } from '@/constants/theme';
import { formatPrice } from '@/data/foods';
import {
  AdminOrderSummary,
  fetchAdminOrders,
  subscribeToAdminOrdersRealtime,
} from '@/services/admin';
import { OrderStatus } from '@/types';

const STATUS_FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'All Orders' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'ready_for_pickup', label: 'Ready' },
  { id: 'assigned', label: 'Assigned' },
  { id: 'on_the_way', label: 'On Route' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = React.useCallback(async () => {
    try {
      const data = await fetchAdminOrders();
      setOrders(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    const unsub = subscribeToAdminOrdersRealtime(() => {
      loadOrders();
    });
    return () => unsub();
  }, [loadOrders]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadOrders();
  }, [loadOrders]);

  const filteredOrders = orders.filter((o) => {
    const matchesFilter =
      selectedFilter === 'all'
        ? true
        : o.status === selectedFilter;

    const matchesSearch =
      search.trim().length === 0 ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.recipientPhone.includes(search) ||
      o.deliveryAddress.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Text style={{ fontSize: 20 }}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Order Pipeline</Text>
          <Text style={styles.headerSub}>{orders.length} total orders recorded</Text>
        </View>
        <Pressable
          style={styles.dispatchShortcutBtn}
          onPress={() => router.push('/admin/dispatch' as any)}>
          <Text style={styles.dispatchShortcutText}>Dispatch 🛵</Text>
        </Pressable>
      </View>

      {/* ── Search Bar ── */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Text style={{ fontSize: 16 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search order ref, customer, phone, address..."
            placeholderTextColor={ChowColors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={10}>
              <Text style={{ fontSize: 14, color: ChowColors.textMuted }}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Filter Chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}>
        {STATUS_FILTERS.map((f) => {
          const active = selectedFilter === f.id;
          return (
            <Pressable
              key={f.id}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setSelectedFilter(f.id)}>
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── Orders List ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ChowColors.primary} />
        }>
        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={ChowColors.primary} />
            <Text style={styles.loaderText}>Loading live orders...</Text>
          </View>
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={{ fontSize: 40 }}>🧾</Text>
            <Text style={styles.emptyTitle}>No matching orders</Text>
            <Text style={styles.emptySub}>
              {search ? 'Try clearing search filters.' : 'There are currently no orders in this category.'}
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <Text style={styles.countText}>
              Showing {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
            </Text>
            {filteredOrders.map((ord) => (
              <Pressable
                key={ord.id}
                style={styles.card}
                onPress={() => router.push(`/admin/order/${ord.id}` as any)}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderNumber}>{ord.orderNumber}</Text>
                    <Text style={styles.timeText}>{new Date(ord.createdAt).toLocaleString()}</Text>
                  </View>
                  <StatusBadge status={ord.status} />
                </View>

                <View style={styles.customerRow}>
                  <Text style={{ fontSize: 14 }}>👤</Text>
                  <Text style={styles.customerText}>
                    {ord.customerName} • <Text style={{ fontWeight: '600' }}>{ord.recipientPhone}</Text>
                  </Text>
                </View>

                <View style={styles.addressRow}>
                  <Text style={{ fontSize: 14 }}>📍</Text>
                  <Text style={styles.addressText} numberOfLines={1}>
                    {ord.deliveryAddress}
                  </Text>
                </View>

                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.totalLabel}>Total Amount</Text>
                    <Text style={styles.totalValue}>{formatPrice(ord.totalNaira)}</Text>
                  </View>

                  <View style={styles.actionBtn}>
                    <Text style={styles.actionBtnText}>Manage Order →</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const configs: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: '#FEF3C7', text: '#B45309', label: 'Pending' },
    confirmed: { bg: '#DBEAFE', text: '#1D4ED8', label: 'Confirmed' },
    preparing: { bg: '#FFF7ED', text: '#C2410C', label: 'Preparing' },
    ready_for_pickup: { bg: '#F0F9FF', text: '#0284C7', label: 'Ready' },
    assigned: { bg: '#EDE9FE', text: '#6D28D9', label: 'Assigned' },
    picked_up: { bg: '#FCE7F3', text: '#BE185D', label: 'Picked Up' },
    out_for_delivery: { bg: '#E0E7FF', text: '#3730A3', label: 'On The Way' },
    delivered: { bg: '#DCFCE7', text: '#15803D', label: 'Delivered' },
    cancelled: { bg: '#F3F4F6', text: '#6B7280', label: 'Cancelled' },
  };

  const c = configs[status] || configs.pending;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{c.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ChowColors.canvas },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: ChowColors.border,
    gap: 12,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...Typography.headlineMd, color: ChowColors.textPrimary },
  headerSub: { fontSize: 11, color: ChowColors.textSecondary },
  dispatchShortcutBtn: {
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
  },
  dispatchShortcutText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  // Search
  searchSection: { paddingHorizontal: 16, paddingTop: 12 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: Radius.DEFAULT,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: ChowColors.border,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 13, color: ChowColors.textPrimary, padding: 0 },

  // Filters
  filterRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: ChowColors.border,
  },
  filterChipActive: { backgroundColor: ChowColors.primary, borderColor: ChowColors.primary },
  filterChipText: { fontSize: 12, fontWeight: '600', color: ChowColors.textSecondary },
  filterChipTextActive: { color: '#fff' },

  // List
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  countText: { fontSize: 12, color: ChowColors.textSecondary, marginBottom: 4 },
  loaderWrap: { paddingVertical: 60, alignItems: 'center', gap: 10 },
  loaderText: { fontSize: 13, color: ChowColors.textSecondary },
  emptyWrap: { paddingVertical: 60, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: ChowColors.textPrimary },
  emptySub: { fontSize: 13, color: ChowColors.textSecondary, textAlign: 'center' },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: Radius.DEFAULT,
    padding: 16,
    borderWidth: 1,
    borderColor: ChowColors.border,
    gap: 10,
    ...Shadows.card,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderNumber: { fontSize: 16, fontWeight: '800', color: ChowColors.textPrimary },
  timeText: { fontSize: 11, color: ChowColors.textMuted, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  customerText: { fontSize: 13, color: ChowColors.textPrimary },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addressText: { fontSize: 12, color: ChowColors.textSecondary, flex: 1 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
    marginTop: 2,
  },
  totalLabel: { fontSize: 10, color: ChowColors.textMuted, textTransform: 'uppercase', fontWeight: '600' },
  totalValue: { fontSize: 16, fontWeight: '800', color: ChowColors.textPrimary },
  actionBtn: {
    backgroundColor: ChowColors.canvas,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: ChowColors.border,
  },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: ChowColors.primary },
});
