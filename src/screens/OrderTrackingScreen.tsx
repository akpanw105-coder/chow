/**
 * Order Tracking & Status Screen — Chow
 * Live simulated tracking for South-South delicacies delivery.
 * Features: live status steppers, estimated arrival time, courier details,
 * delivery route map representation, and order items summary.
 */
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { useOrders } from '@/store/ordersStore';
import { OrderStatus } from '@/types';

const STATUS_STEPS: { key: OrderStatus; label: string; desc: string; icon: string }[] = [
  { key: 'confirmed', label: 'Order Confirmed', desc: 'The kitchen accepted your order', icon: '✓' },
  { key: 'preparing', label: 'Kitchen Preparing', desc: 'Cooking with authentic fresh ingredients', icon: '🍲' },
  { key: 'on_the_way', label: 'Rider on the Way', desc: 'Courier is heading to your address', icon: '🛵' },
  { key: 'delivered', label: 'Delivered', desc: 'Enjoy your delicious South-South meal!', icon: '🎉' },
];

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { getOrderById, activeOrder, simulateAdvanceStatus } = useOrders();

  const order = (id ? getOrderById(id) : activeOrder) || activeOrder;
  const [, setTick] = useState(0);

  // Auto update / re-render
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(timer);
  }, []);

  if (!order) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerError}>
          <Text style={{ fontSize: 44 }}>📦</Text>
          <Text style={styles.errorTitle}>No Active Order Found</Text>
          <Text style={styles.errorSub}>You don&apos;t have an order currently in progress.</Text>
          <Pressable style={styles.actionBtn} onPress={() => router.replace('/')}>
            <Text style={styles.actionBtnText}>Start Browsing</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const currentIdx = STATUS_STEPS.findIndex((s) => s.key === order.status);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Top Header ── */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
          <Text style={{ fontSize: 20 }}>←</Text>
        </Pressable>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Order Tracking</Text>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        </View>
        <Pressable
          style={styles.simulatePill}
          onPress={() => simulateAdvanceStatus(order.id)}>
          <Text style={styles.simulateText}>Simulate ⏩</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>

        {/* ── Delivery Map & ETA Card ── */}
        <View style={styles.mapCard}>
          <View style={styles.mapGraphic}>
            {/* Visual simulation of city map route */}
            <View style={styles.mapGridLine1} />
            <View style={styles.mapGridLine2} />
            <View style={styles.mapRouteLine} />

            {/* Restaurant Pin */}
            <View style={[styles.mapPin, { top: 28, left: 36, backgroundColor: '#111827' }]}>
              <Text style={{ fontSize: 13 }}>🏪</Text>
            </View>

            {/* Rider moving Pin */}
            <View
              style={[
                styles.mapPin,
                styles.mapRiderPin,
                {
                  top: order.status === 'delivered' ? 108 : 64,
                  left: order.status === 'delivered' ? 240 : 130,
                },
              ]}>
              <Text style={{ fontSize: 14 }}>🛵</Text>
            </View>

            {/* Destination Pin */}
            <View style={[styles.mapPin, { bottom: 24, right: 36, backgroundColor: ChowColors.primary }]}>
              <Text style={{ fontSize: 13, color: '#fff' }}>📍</Text>
            </View>
          </View>

          <View style={styles.etaInfo}>
            <View>
              <Text style={styles.etaLabel}>Estimated Arrival</Text>
              <Text style={styles.etaValue}>
                {order.status === 'delivered' ? 'Delivered' : order.estimatedTime}
              </Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>
                {order.status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Courier Info Card ── */}
        <View style={styles.courierCard}>
          <View style={styles.courierAvatar}>
            <Text style={{ fontSize: 24 }}>👨🏾‍🍳</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.courierName}>Idris Mohammed</Text>
            <Text style={styles.courierRole}>Chow Speed Rider • ★ 4.9</Text>
          </View>
          <Pressable style={styles.callBtn}>
            <Text style={{ fontSize: 16 }}>📞</Text>
          </Pressable>
        </View>

        {/* ── Status Timeline Stepper ── */}
        <View style={styles.timelineCard}>
          <Text style={styles.sectionHeading}>Order Status</Text>
          <View style={styles.timelineList}>
            {STATUS_STEPS.map((step, idx) => {
              const isPast = currentIdx >= idx;
              const isCurrent = currentIdx === idx;
              const isLast = idx === STATUS_STEPS.length - 1;

              return (
                <View key={step.key} style={styles.timelineStep}>
                  <View style={styles.stepIndicatorCol}>
                    <View
                      style={[
                        styles.stepDot,
                        isPast && styles.stepDotDone,
                        isCurrent && styles.stepDotActive,
                      ]}>
                      <Text
                        style={[
                          styles.stepDotText,
                          isPast && { color: '#fff' },
                        ]}>
                        {step.icon}
                      </Text>
                    </View>
                    {!isLast && (
                      <View
                        style={[
                          styles.stepLine,
                          currentIdx > idx && styles.stepLineDone,
                        ]}
                      />
                    )}
                  </View>

                  <View style={styles.stepContent}>
                    <Text
                      style={[
                        styles.stepTitle,
                        isPast && { color: ChowColors.textPrimary, fontWeight: '700' },
                      ]}>
                      {step.label}
                    </Text>
                    <Text style={styles.stepDesc}>{step.desc}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Delivery Details ── */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionHeading}>Delivery Address</Text>
          <View style={styles.addressRow}>
            <Text style={{ fontSize: 18 }}>📍</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.addressText}>{order.deliveryAddress}</Text>
              {order.deliveryNote && (
                <Text style={styles.noteText}>Note: {order.deliveryNote}</Text>
              )}
            </View>
          </View>
        </View>

        {/* ── Ordered Dishes ── */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionHeading}>Order Summary ({order.items.length} items)</Text>
          <View style={{ gap: 10, marginTop: 10 }}>
            {order.items.map((it, i) => (
              <View key={i} style={styles.itemRow}>
                <Image source={it.food.image} style={styles.itemThumb} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {it.quantity}× {it.food.shortName}
                  </Text>
                  {it.selectedSwallow && (
                    <Text style={styles.itemSub}>{it.selectedSwallow.label}</Text>
                  )}
                </View>
                <Text style={styles.itemPrice}>
                  {formatPrice(it.unitPrice * it.quantity)}
                </Text>
              </View>
            ))}
            <View style={styles.totalDivider} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
              <Text style={{ fontSize: 13, color: ChowColors.textMuted }}>Payment Method</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: ChowColors.textDark }}>
                {order.paymentMethod === 'card' ? 'Card (Stripe)' : order.paymentMethod === 'transfer' ? 'Bank Transfer' : 'Cash on Delivery'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
              <Text style={{ fontSize: 13, color: ChowColors.textMuted }}>Payment Status</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#059669' }}>
                Verified & Paid ✓
              </Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total Paid</Text>
              <Text style={styles.grandTotalValue}>{formatPrice(order.total)}</Text>
            </View>
          </View>
        </View>

        <Pressable
          style={styles.doneBtn}
          onPress={() => router.replace('/')}>
          <Text style={styles.doneBtnText}>Back to Food Discovery</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ChowColors.canvas },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: ChowColors.border,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...Typography.labelLg, color: ChowColors.textPrimary },
  orderNumber: { ...Typography.labelSm, color: ChowColors.textMuted },
  simulatePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  simulateText: { fontSize: 11, fontWeight: '700', color: '#1D4ED8' },
  content: { padding: 16, gap: 16, paddingBottom: 60 },

  // Map Card
  mapCard: {
    backgroundColor: ChowColors.surface,
    borderRadius: Radius.DEFAULT,
    overflow: 'hidden',
    ...Shadows.card,
    borderWidth: 1,
    borderColor: ChowColors.border,
  },
  mapGraphic: {
    height: 150,
    backgroundColor: '#E5E7EB',
    position: 'relative',
    overflow: 'hidden',
  },
  mapGridLine1: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: '#D1D5DB',
    transform: [{ rotate: '-8deg' }],
  },
  mapGridLine2: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 140,
    width: 14,
    backgroundColor: '#D1D5DB',
  },
  mapRouteLine: {
    position: 'absolute',
    top: 50,
    left: 55,
    width: 210,
    height: 60,
    borderStyle: 'dashed',
    borderWidth: 3,
    borderColor: ChowColors.primary,
    borderRadius: 30,
  },
  mapPin: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.float,
  },
  mapRiderPin: {
    backgroundColor: ChowColors.primary,
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 10,
  },
  etaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  etaLabel: { ...Typography.labelSm, color: ChowColors.textMuted, textTransform: 'uppercase' },
  etaValue: { ...Typography.headlineMd, color: ChowColors.textPrimary },
  statusPill: {
    backgroundColor: ChowColors.secondaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  statusPillText: { fontSize: 11, fontWeight: '700', color: ChowColors.primary },

  // Courier Card
  courierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ChowColors.surface,
    borderRadius: Radius.DEFAULT,
    padding: 14,
    gap: 12,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: ChowColors.border,
  },
  courierAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  courierName: { ...Typography.labelMd, color: ChowColors.textPrimary, fontWeight: '700' },
  courierRole: { ...Typography.labelSm, color: ChowColors.textSecondary, marginTop: 2 },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },

  // Timeline
  timelineCard: {
    backgroundColor: ChowColors.surface,
    borderRadius: Radius.DEFAULT,
    padding: 16,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: ChowColors.border,
  },
  sectionHeading: { ...Typography.labelLg, color: ChowColors.textPrimary, marginBottom: 12 },
  timelineList: { paddingLeft: 6 },
  timelineStep: { flexDirection: 'row', minHeight: 52 },
  stepIndicatorCol: { alignItems: 'center', width: 28 },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stepDotDone: { backgroundColor: ChowColors.primary },
  stepDotActive: {
    backgroundColor: ChowColors.primary,
    ...Shadows.primaryGlow,
    borderWidth: 2,
    borderColor: '#fff',
  },
  stepDotText: { fontSize: 10, color: '#9CA3AF', fontWeight: '700' },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 2,
  },
  stepLineDone: { backgroundColor: ChowColors.primary },
  stepContent: { flex: 1, paddingLeft: 12, paddingBottom: 16 },
  stepTitle: { ...Typography.labelMd, color: ChowColors.textMuted },
  stepDesc: { ...Typography.labelSm, color: ChowColors.textSecondary, marginTop: 2 },

  // Details
  detailsCard: {
    backgroundColor: ChowColors.surface,
    borderRadius: Radius.DEFAULT,
    padding: 16,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: ChowColors.border,
  },
  addressRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  addressText: { ...Typography.bodyMd, color: ChowColors.textPrimary, fontWeight: '600' },
  noteText: { ...Typography.labelSm, color: ChowColors.textSecondary, marginTop: 4 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemThumb: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#F3F4F6' },
  itemName: { ...Typography.labelMd, color: ChowColors.textPrimary },
  itemSub: { fontSize: 11, color: ChowColors.textSecondary },
  itemPrice: { ...Typography.labelMd, color: ChowColors.textPrimary, fontWeight: '700' },
  totalDivider: { borderTopWidth: 1, borderTopColor: ChowColors.border, marginVertical: 6 },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grandTotalLabel: { ...Typography.labelLg, color: ChowColors.textPrimary },
  grandTotalValue: { ...Typography.headlineSm, color: ChowColors.primary, fontWeight: '800' },

  // Done button
  doneBtn: {
    height: 52,
    borderRadius: Radius.DEFAULT,
    backgroundColor: ChowColors.surface,
    borderWidth: 1.5,
    borderColor: ChowColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: { ...Typography.labelLg, color: ChowColors.primary },

  // Empty
  centerError: { alignItems: 'center', padding: 32, gap: 12, marginTop: 60 },
  errorTitle: { ...Typography.headlineSm, color: ChowColors.textPrimary },
  errorSub: { ...Typography.bodyMd, color: ChowColors.textSecondary, textAlign: 'center' },
  actionBtn: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.full,
    backgroundColor: ChowColors.primary,
  },
  actionBtnText: { color: '#fff', fontWeight: '700' },
});
