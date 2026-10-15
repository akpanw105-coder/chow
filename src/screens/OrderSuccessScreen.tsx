/**
 * Order Success Screen — Chow
 * Uses the authentic Stitch export order_success_illustration.
 * Displays order confirmation, reference code, receipt summary, and links to tracking.
 */
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
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

export default function OrderSuccessScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { getOrderById, activeOrder } = useOrders();

  const order = (id ? getOrderById(id) : activeOrder) || activeOrder;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>

        {/* ── Order Success Illustration ── */}
        <View style={styles.illustrationWrap}>
          <Image
            source={require('@/assets/images/illustrations/order_success.png')}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Order Placed Successfully!</Text>
        <Text style={styles.subtitle}>
          Your mouth-watering South-South feast is on its way. The kitchen has received your order and started preparation.
        </Text>

        {/* ── Order Summary Box ── */}
        {order && (
          <View style={styles.receiptBox}>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Order Number</Text>
              <Text style={styles.receiptValueBold}>{order.orderNumber}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Estimated Delivery</Text>
              <Text style={styles.receiptValue}>{order.estimatedTime}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Delivery Address</Text>
              <Text style={styles.receiptValue} numberOfLines={1}>
                {order.deliveryAddress}
              </Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Payment Method</Text>
              <Text style={styles.receiptValue}>
                {order.paymentMethod === 'card' ? 'Debit/Credit Card (Stripe)' : order.paymentMethod === 'transfer' ? 'Bank Transfer' : 'Cash on Delivery'}
              </Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Payment Status</Text>
              <Text style={[styles.receiptValueBold, { color: '#059669' }]}>
                Verified & Paid ✓
              </Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Total Paid</Text>
              <Text style={[styles.receiptValueBold, { color: ChowColors.primary }]}>
                {formatPrice(order.total)}
              </Text>
            </View>
          </View>
        )}

        {/* ── Actions ── */}
        <View style={styles.actionCol}>
          <Pressable
            style={styles.trackBtn}
            onPress={() => router.push(order ? `/order-track?id=${order.id}` : '/orders')}>
            <Text style={styles.trackBtnText}>Track Order Live 🛵</Text>
          </Pressable>

          <Pressable
            style={styles.homeBtn}
            onPress={() => router.replace('/')}>
            <Text style={styles.homeBtnText}>Back to Food Menu</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ChowColors.canvas },
  content: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    gap: 16,
  },
  illustrationWrap: {
    width: 200,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  illustration: { width: '100%', height: '100%' },
  title: {
    ...Typography.headlineLg,
    color: ChowColors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.bodyMd,
    color: ChowColors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 12,
    lineHeight: 20,
  },
  receiptBox: {
    width: '100%',
    backgroundColor: ChowColors.surface,
    borderRadius: Radius.DEFAULT,
    padding: 18,
    gap: 12,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: ChowColors.border,
    marginTop: 8,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptLabel: { ...Typography.labelSm, color: ChowColors.textSecondary },
  receiptValue: { ...Typography.labelMd, color: ChowColors.textPrimary },
  receiptValueBold: { ...Typography.labelMd, color: ChowColors.textPrimary, fontWeight: '700' },
  actionCol: { width: '100%', gap: 12, marginTop: 12 },
  trackBtn: {
    width: '100%',
    height: 52,
    borderRadius: Radius.DEFAULT,
    backgroundColor: ChowColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.primaryGlow,
  },
  trackBtnText: { ...Typography.labelLg, color: '#fff' },
  homeBtn: {
    width: '100%',
    height: 52,
    borderRadius: Radius.DEFAULT,
    backgroundColor: ChowColors.surface,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeBtnText: { ...Typography.labelLg, color: ChowColors.textPrimary },
});
