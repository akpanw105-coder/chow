/**
 * Cart Screen — Chow
 * Reproduces the "shopping_cart_my_cart_list" Stitch export.
 * Cart items with stepper, promo code, order summary, and Checkout CTA.
 */
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
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
import { useCart } from '@/store/cartStore';
import { CartItem } from '@/types';

// ─── Cart Item Card ───────────────────────────────────────────────────────────
function CartItemCard({ item }: { item: CartItem }) {
  const { increment, decrement, removeItem } = useCart();

  return (
    <View style={styles.itemCard}>
      {/* Thumbnail */}
      <View style={styles.itemThumb}>
        <Image source={item.food.image} style={styles.itemImage} />
      </View>
      {/* Details */}
      <View style={styles.itemContent}>
        <View style={styles.itemTopRow}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.food.shortName}
          </Text>
          <Pressable onPress={() => removeItem(item.food.id)} hitSlop={10}>
            <Text style={styles.removeBtn}>✕</Text>
          </Pressable>
        </View>
        {item.selectedSwallow && (
          <Text style={styles.itemMeta}>{item.selectedSwallow.label}</Text>
        )}
        <Text style={styles.itemMeta}>
          ★ {item.food.rating}
          {'  '}•{'  '}
          {item.food.restaurant}, {item.food.distance}
        </Text>
        <View style={styles.itemPriceRow}>
          <Text style={styles.itemPrice}>{formatPrice(item.unitPrice)}</Text>
          {/* Stepper */}
          <View style={styles.stepper}>
            <Pressable
              style={styles.stepMinus}
              onPress={() => decrement(item.food.id)}
              hitSlop={8}>
              <Text style={styles.stepMinusText}>−</Text>
            </Pressable>
            <Text style={styles.stepCount}>{item.quantity}</Text>
            <Pressable
              style={styles.stepPlus}
              onPress={() => increment(item.food.id)}
              hitSlop={8}>
              <Text style={styles.stepPlusText}>+</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Empty Cart ───────────────────────────────────────────────────────────────
function EmptyCart() {
  return (
    <View style={styles.empty}>
      <Image
        source={require('@/assets/images/illustrations/empty_cart.png')}
        style={styles.emptyIllustration}
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>Your cart is empty</Text>
      <Text style={styles.emptySubtitle}>
        Discover delicious South-South Nigerian dishes and add them to your cart.
      </Text>
      <Pressable style={styles.emptyBtn} onPress={() => router.replace('/(tabs)/shop')}>
        <Text style={styles.emptyBtnText}>Browse Food</Text>
      </Pressable>
    </View>
  );
}

// ─── Cart Screen ──────────────────────────────────────────────────────────────
export default function CartScreen() {
  const { state, subtotal, total, applyPromo } = useCart();
  const [promoInput, setPromoInput] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  function handleApplyPromo() {
    if (promoInput.toUpperCase() === 'CHOW10') {
      applyPromo('CHOW10', 1000);
      setPromoApplied(true);
    } else {
      Alert.alert('Invalid Code', 'That promo code is not valid. Try CHOW10!');
    }
  }

  function handleCheckout() {
    router.push('/checkout');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={ChowColors.canvas} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={{ fontSize: 20, color: ChowColors.textPrimary }}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>My Cart</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{state.items.length}</Text>
        </View>
      </View>

      {state.items.length === 0 ? (
        <EmptyCart />
      ) : (
        <>
          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>

            {/* ── Cart Items ── */}
            <View style={{ gap: 12 }}>
              {state.items.map((item) => (
                <CartItemCard key={item.food.id} item={item} />
              ))}
            </View>

            {/* ── Promo Code Banner ── */}
            <View style={styles.promoBanner}>
              <View style={styles.promoLeft}>
                <View style={styles.promoIcon}>
                  <Text style={{ fontSize: 14 }}>🏷️</Text>
                </View>
                {promoApplied ? (
                  <Text style={styles.promoText}>
                    Code <Text style={{ fontWeight: '700', color: ChowColors.primary }}>CHOW10</Text> applied! −₦1,000
                  </Text>
                ) : (
                  <TextInput
                    style={styles.promoInput}
                    placeholder="Enter discount code (CHOW10)"
                    placeholderTextColor={ChowColors.textMuted}
                    value={promoInput}
                    onChangeText={setPromoInput}
                    autoCapitalize="characters"
                  />
                )}
              </View>
              {!promoApplied && (
                <Pressable style={styles.promoApplyBtn} onPress={handleApplyPromo}>
                  <Text style={styles.promoApplyText}>Apply</Text>
                </Pressable>
              )}
            </View>

            {/* ── Order Summary ── */}
            <View style={styles.summaryCard}>
              <SummaryRow label="Order Amount" value={formatPrice(subtotal)} />
              <SummaryRow label="Delivery Fee" value={formatPrice(state.deliveryFee)} />
              <SummaryRow label="Packaging & Service" value={formatPrice(state.packagingFee)} />
              {state.promoDiscount > 0 && (
                <SummaryRow
                  label="Discount (Promo)"
                  value={`−${formatPrice(state.promoDiscount)}`}
                  accent
                />
              )}
              <View style={styles.summaryDivider} />
              <View style={styles.summaryTotalRow}>
                <Text style={styles.summaryTotalLabel}>Total Payment</Text>
                <Text style={styles.summaryTotalValue}>{formatPrice(total)}</Text>
              </View>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* ── Checkout CTA ── */}
          <View style={styles.checkoutBar}>
            <View style={styles.checkoutTotal}>
              <Text style={styles.checkoutTotalLabel}>Total</Text>
              <Text style={styles.checkoutTotalValue}>{formatPrice(total)}</Text>
            </View>
            <Pressable style={styles.checkoutBtn} onPress={handleCheckout}>
              <Text style={styles.checkoutBtnText}>Proceed To Checkout</Text>
              <Text style={{ fontSize: 16 }}>→</Text>
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

function SummaryRow({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, accent && { color: ChowColors.primary }]}>{label}</Text>
      <Text style={[styles.summaryValue, accent && { color: ChowColors.primary }]}>{value}</Text>
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
    gap: 10,
    backgroundColor: ChowColors.canvas,
  },
  headerTitle: { ...Typography.headlineMd, color: ChowColors.textPrimary, flex: 1 },
  headerBadge: {
    backgroundColor: ChowColors.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 4, gap: 12 },

  // Item card
  itemCard: {
    flexDirection: 'row',
    backgroundColor: ChowColors.surface,
    borderRadius: Radius.DEFAULT,
    padding: 12,
    gap: 12,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: ChowColors.border,
  },
  itemThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  itemImage: { width: '100%', height: '100%' },
  itemContent: { flex: 1, justifyContent: 'space-between' },
  itemTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemName: { ...Typography.labelMd, color: ChowColors.textPrimary, fontWeight: '700', flex: 1, marginRight: 8 },
  removeBtn: { fontSize: 13, color: ChowColors.textMuted },
  itemMeta: { fontSize: 11, color: ChowColors.textSecondary, marginTop: 2 },
  itemPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  itemPrice: { ...Typography.labelMd, fontWeight: '700', color: ChowColors.textPrimary },

  // Stepper
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 8,
    borderWidth: 1,
    borderColor: ChowColors.border,
  },
  stepMinus: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  stepMinusText: { fontSize: 16, color: ChowColors.textSecondary, fontWeight: '600' },
  stepCount: { fontSize: 12, fontWeight: '700', color: ChowColors.textPrimary, minWidth: 14, textAlign: 'center' },
  stepPlus: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ChowColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPlusText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // Promo
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF4EE',
    borderWidth: 1,
    borderColor: '#FDE6D9',
    borderRadius: Radius.DEFAULT,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  promoLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  promoIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(251,191,36,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoText: { fontSize: 12, color: ChowColors.textSecondary },
  promoInput: { flex: 1, fontSize: 12, color: ChowColors.textPrimary, padding: 0 },
  promoApplyBtn: {
    backgroundColor: ChowColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  promoApplyText: { fontSize: 12, fontWeight: '600', color: '#fff' },

  // Summary
  summaryCard: {
    backgroundColor: ChowColors.surface,
    borderRadius: Radius.DEFAULT,
    padding: 16,
    gap: 10,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: ChowColors.border,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 12, fontWeight: '500', color: ChowColors.textSecondary },
  summaryValue: { fontSize: 12, fontWeight: '600', color: ChowColors.textPrimary },
  summaryDivider: { borderTopWidth: 1, borderTopColor: ChowColors.border, marginVertical: 4 },
  summaryTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryTotalLabel: { ...Typography.labelMd, fontWeight: '600', color: ChowColors.textPrimary },
  summaryTotalValue: { ...Typography.headlineMd, color: ChowColors.textPrimary },

  // Checkout
  checkoutBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderTopWidth: 1,
    borderTopColor: ChowColors.border,
    gap: 12,
    ...Shadows.nav,
  },
  checkoutTotal: { gap: 2 },
  checkoutTotalLabel: { fontSize: 10, color: ChowColors.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  checkoutTotalValue: { ...Typography.headlineMd, color: ChowColors.textPrimary },
  checkoutBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 52,
    backgroundColor: ChowColors.primary,
    borderRadius: Radius.DEFAULT,
    ...Shadows.primaryGlow,
  },
  checkoutBtnText: { ...Typography.labelLg, color: '#fff' },

  // Empty
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 14 },
  emptyIllustration: { width: 200, height: 200 },
  emptyTitle: { ...Typography.headlineSm, color: ChowColors.textPrimary },
  emptySubtitle: { ...Typography.bodyMd, color: ChowColors.textSecondary, textAlign: 'center' },
  emptyBtn: {
    backgroundColor: ChowColors.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: Radius.full,
    ...Shadows.primaryGlow,
  },
  emptyBtnText: { ...Typography.labelLg, color: '#fff' },
});
