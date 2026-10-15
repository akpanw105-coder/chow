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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChowColors, Radius, Shadows, Typography } from '@/constants/theme';
import { formatPrice } from '@/data/foods';
import {
  AdminMetrics,
  AdminOrderSummary,
  fetchAdminMetrics,
  fetchAdminOrders,
  subscribeToAdminOrdersRealtime,
} from '@/services/admin';
import { useAuth } from '@/store/authStore';

export default function AdminDashboardScreen() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<AdminOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = React.useCallback(async () => {
    try {
      const [m, orders] = await Promise.all([
        fetchAdminMetrics(),
        fetchAdminOrders(),
      ]);
      setMetrics(m);
      setRecentOrders(orders.slice(0, 5));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsub = subscribeToAdminOrdersRealtime(() => {
      loadData();
    });
    return () => unsub();
  }, [loadData]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Top Header ── */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.badgeRow}>
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>ADMIN COMMAND CENTRE</Text>
            </View>
            <View style={styles.livePulse}>
              <View style={styles.pulseDot} />
              <Text style={styles.liveText}>REALTIME</Text>
            </View>
          </View>
          <Text style={styles.headerTitle}>Operations Control</Text>
          <Text style={styles.headerSub}>Welcome back, {user?.fullName || 'Administrator'}</Text>
        </View>

        <Pressable
          style={styles.closeBtn}
          onPress={() => router.replace('/(tabs)')}
          hitSlop={10}>
          <Text style={styles.closeBtnText}>Exit</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ChowColors.primary} />
        }>
        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={ChowColors.primary} />
            <Text style={styles.loaderText}>Syncing operations with kitchen & dispatch...</Text>
          </View>
        ) : (
          <>
            {/* ── Revenue & Daily Overview ── */}
            <View style={styles.revenueCard}>
              <View>
                <Text style={styles.revenueLabel}>Verified Revenue (Today)</Text>
                <Text style={styles.revenueValue}>
                  {formatPrice(metrics?.revenueTodayNaira || 0)}
                </Text>
                <Text style={styles.revenueMeta}>
                  {metrics?.completedTodayCount || 0} completed & paid deliveries today
                </Text>
              </View>
              <View style={styles.revenueIconWrap}>
                <Text style={{ fontSize: 28 }}>💰</Text>
              </View>
            </View>

            {/* ── Operational Bottleneck Alerts ── */}
            {(metrics?.unassignedReadyCount || 0) > 0 && (
              <Pressable
                style={styles.alertBanner}
                onPress={() => router.push('/admin/dispatch' as any)}>
                <Text style={{ fontSize: 20 }}>⚠️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>
                    {metrics?.unassignedReadyCount} Ready Order{(metrics?.unassignedReadyCount || 0) > 1 ? 's' : ''} Awaiting Courier!
                  </Text>
                  <Text style={styles.alertSub}>Tap to assign available dispatch riders immediately</Text>
                </View>
                <Text style={styles.alertArrow}>→</Text>
              </Pressable>
            )}

            {/* ── Metric Grid ── */}
            <Text style={styles.sectionHeading}>Live Order Pipeline</Text>
            <View style={styles.metricsGrid}>
              <MetricBox
                label="Kitchen Queue"
                count={metrics?.preparingCount || 0}
                icon="🍲"
                color="#EA580C"
                bgColor="#FFF7ED"
                onPress={() => router.push('/admin/orders' as any)}
              />
              <MetricBox
                label="Ready for Pickup"
                count={metrics?.readyForPickupCount || 0}
                icon="🛍️"
                color="#0284C7"
                bgColor="#F0F9FF"
                onPress={() => router.push('/admin/orders' as any)}
              />
              <MetricBox
                label="Active on Road"
                count={metrics?.dispatchedActiveCount || 0}
                icon="🛵"
                color="#16A34A"
                bgColor="#F0FDF4"
                onPress={() => router.push('/admin/dispatch' as any)}
              />
              <MetricBox
                label="Total Today"
                count={metrics?.ordersTodayCount || 0}
                icon="🧾"
                color={ChowColors.primary}
                bgColor={ChowColors.secondaryLight}
                onPress={() => router.push('/admin/orders' as any)}
              />
            </View>

            {/* ── Quick Administrative Navigation ── */}
            <Text style={styles.sectionHeading}>Management Workspaces</Text>
            <View style={styles.navRow}>
              <NavTile
                title="Orders"
                sub="Manage pipeline & statuses"
                icon="📋"
                badge={metrics?.pendingConfirmationCount ? `${metrics.pendingConfirmationCount} new` : undefined}
                onPress={() => router.push('/admin/orders' as any)}
              />
              <NavTile
                title="Dispatch"
                sub="Rider assignment & tracking"
                icon="🛵"
                badge={metrics?.unassignedReadyCount ? `${metrics.unassignedReadyCount} unassigned` : undefined}
                onPress={() => router.push('/admin/dispatch' as any)}
              />
              <NavTile
                title="Menu & Foods"
                sub="Pricing, portions & stock"
                icon="🍲"
                onPress={() => router.push('/admin/menu' as any)}
              />
              <NavTile
                title="Customers"
                sub="Profiles & order accounts"
                icon="👥"
                onPress={() => router.push('/admin/customers' as any)}
              />
            </View>

            {/* ── Recent Activity Feed ── */}
            <View style={styles.activityHeaderRow}>
              <Text style={styles.sectionHeading}>Live Order Activity</Text>
              <Pressable onPress={() => router.push('/admin/orders' as any)}>
                <Text style={styles.seeAllText}>View All ({recentOrders.length})</Text>
              </Pressable>
            </View>

            {recentOrders.length === 0 ? (
              <View style={styles.emptyActivity}>
                <Text style={{ fontSize: 32 }}>📦</Text>
                <Text style={styles.emptyTitle}>No orders in pipeline</Text>
                <Text style={styles.emptySub}>All orders are processed or awaiting customers</Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {recentOrders.map((ord) => (
                  <Pressable
                    key={ord.id}
                    style={styles.orderCard}
                    onPress={() => router.push(`/admin/order/${ord.id}` as any)}>
                    <View style={styles.orderTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.orderNum}>{ord.orderNumber}</Text>
                        <Text style={styles.customerName}>{ord.customerName} • {ord.recipientPhone}</Text>
                      </View>
                      <StatusPill status={ord.status} />
                    </View>
                    <View style={styles.orderBottom}>
                      <Text style={styles.addrText} numberOfLines={1}>📍 {ord.deliveryAddress}</Text>
                      <Text style={styles.priceText}>{formatPrice(ord.totalNaira)}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricBox({
  label,
  count,
  icon,
  color,
  bgColor,
  onPress,
}: {
  label: string;
  count: number;
  icon: string;
  color: string;
  bgColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.metricCard, { backgroundColor: bgColor }]} onPress={onPress}>
      <View style={styles.metricCardTop}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
        <Text style={[styles.metricNumber, { color }]}>{count}</Text>
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
    </Pressable>
  );
}

function NavTile({
  title,
  sub,
  icon,
  badge,
  onPress,
}: {
  title: string;
  sub: string;
  icon: string;
  badge?: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.navTile} onPress={onPress}>
      <View style={styles.navTileTop}>
        <Text style={{ fontSize: 24 }}>{icon}</Text>
        {badge && (
          <View style={styles.navBadge}>
            <Text style={styles.navBadgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.navTileTitle}>{title}</Text>
      <Text style={styles.navTileSub}>{sub}</Text>
    </Pressable>
  );
}

function StatusPill({ status }: { status: string }) {
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
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      <Text style={[styles.pillText, { color: c.text }]}>{c.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ChowColors.canvas },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: ChowColors.border,
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  adminBadge: {
    backgroundColor: '#111827',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  livePulse: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  liveText: { fontSize: 9, fontWeight: '700', color: '#16A34A', letterSpacing: 0.5 },
  headerTitle: { ...Typography.headlineMd, color: ChowColors.textPrimary },
  headerSub: { fontSize: 12, color: ChowColors.textSecondary, marginTop: 2 },
  closeBtn: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  closeBtnText: { fontSize: 12, fontWeight: '600', color: ChowColors.textPrimary },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  loaderWrap: { paddingVertical: 40, alignItems: 'center', gap: 10 },
  loaderText: { fontSize: 13, color: ChowColors.textSecondary },

  // Revenue
  revenueCard: {
    backgroundColor: '#111827',
    borderRadius: Radius.DEFAULT,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Shadows.card,
  },
  revenueLabel: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 },
  revenueValue: { fontSize: 28, fontWeight: '800', color: '#fff', marginVertical: 4 },
  revenueMeta: { fontSize: 11, color: '#D1D5DB' },
  revenueIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Alert
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 14,
    borderRadius: Radius.DEFAULT,
  },
  alertTitle: { fontSize: 13, fontWeight: '700', color: '#991B1B' },
  alertSub: { fontSize: 11, color: '#B91C1C', marginTop: 2 },
  alertArrow: { fontSize: 16, color: '#991B1B', fontWeight: '700' },

  // Metrics
  sectionHeading: { ...Typography.headlineSm, color: ChowColors.textPrimary, marginTop: 4 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: {
    width: '48%',
    padding: 14,
    borderRadius: Radius.DEFAULT,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    gap: 8,
  },
  metricCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricNumber: { fontSize: 24, fontWeight: '800' },
  metricLabel: { fontSize: 12, fontWeight: '600', color: ChowColors.textSecondary },

  // Nav row
  navRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  navTile: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: Radius.DEFAULT,
    padding: 14,
    borderWidth: 1,
    borderColor: ChowColors.border,
    ...Shadows.card,
    gap: 4,
  },
  navTileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  navBadge: { backgroundColor: ChowColors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  navBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  navTileTitle: { fontSize: 14, fontWeight: '700', color: ChowColors.textPrimary },
  navTileSub: { fontSize: 11, color: ChowColors.textSecondary },

  // Activity
  activityHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  seeAllText: { fontSize: 12, fontWeight: '600', color: ChowColors.primary },
  emptyActivity: { backgroundColor: '#fff', borderRadius: Radius.DEFAULT, padding: 24, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: ChowColors.border },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: ChowColors.textPrimary },
  emptySub: { fontSize: 12, color: ChowColors.textSecondary, textAlign: 'center' },

  // Order item
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: Radius.DEFAULT,
    padding: 14,
    borderWidth: 1,
    borderColor: ChowColors.border,
    gap: 8,
    ...Shadows.card,
  },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderNum: { fontSize: 14, fontWeight: '700', color: ChowColors.textPrimary },
  customerName: { fontSize: 12, color: ChowColors.textSecondary, marginTop: 2 },
  orderBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 8 },
  addrText: { fontSize: 11, color: ChowColors.textSecondary, flex: 1, marginRight: 8 },
  priceText: { fontSize: 13, fontWeight: '700', color: ChowColors.textPrimary },

  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  pillText: { fontSize: 10, fontWeight: '700' },
});
