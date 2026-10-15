/**
 * Food Details Screen — Chow
 * Reproduces the "food_details_afang_soup" Stitch export.
 * Circular hero image, swallow selector, portion selector, quantity stepper, Add to Cart.
 */
import { router, useLocalSearchParams } from 'expo-router';
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

import { QuantityStepper } from '@/components/chow-ui';
import { ChowColors, Radius, Shadows, Typography } from '@/constants/theme';
import { formatPrice, getFoodById } from '@/data/foods';
import { useCart } from '@/store/cartStore';
import { useFavourites } from '@/store/favouritesStore';
import { PortionOption, SwallowOption } from '@/types';

export default function FoodDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const food = getFoodById(id ?? '');
  const { addItem } = useCart();
  const { toggleFavourite, isFavourite } = useFavourites();

  const [quantity, setQuantity] = useState(1);
  const [selectedSwallow, setSelectedSwallow] = useState<SwallowOption | undefined>(
    food?.swallowOptions?.[0]
  );
  const [selectedPortion, setSelectedPortion] = useState<PortionOption | undefined>(
    food?.portionOptions?.[0]
  );

  if (!food) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Text style={{ fontSize: 40 }}>🍽️</Text>
          <Text style={styles.errorText}>Dish not found</Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>← Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const unitPrice = selectedPortion ? selectedPortion.price : food.basePrice;
  const totalPrice = unitPrice * quantity;
  const fav = isFavourite(food.id);

  function handleAddToCart() {
    if (!food) return;
    addItem(food, quantity, selectedSwallow, selectedPortion);
    router.push('/cart');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Top Nav Bar ── */}
      <View style={styles.navBar}>
        <Pressable style={styles.navCircleBtn} onPress={() => router.back()}>
          <Text style={{ fontSize: 18, color: ChowColors.textPrimary }}>←</Text>
        </Pressable>
        <Text style={styles.navTitle}>Food Details</Text>
        <Pressable style={styles.navCircleBtn} onPress={() => toggleFavourite(food.id)}>
          <Text style={{ fontSize: 18, color: fav ? ChowColors.primary : ChowColors.textPrimary }}>
            {fav ? '♥' : '♡'}
          </Text>
        </Pressable>
      </View>

      {/* ── Scrollable Content ── */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ── Circular Hero Image ── */}
        <View style={styles.heroSection}>
          <View style={styles.heroAura} />
          <View style={styles.heroCircle}>
            <Image source={food.image} style={styles.heroImage} />
          </View>
        </View>

        {/* ── Product Meta ── */}
        <View style={styles.metaSection}>
          {/* Category tag */}
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText}>{food.restaurant}</Text>
          </View>

          {/* Title + Quantity Stepper */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.yourOrderLabel}>Your Order</Text>
              <Text style={styles.foodTitle}>{food.name}</Text>
            </View>
            <QuantityStepper
              quantity={quantity}
              onIncrement={() => setQuantity((q) => q + 1)}
              onDecrement={() => setQuantity((q) => Math.max(1, q - 1))}
            />
          </View>

          {/* Description */}
          <Text style={styles.description}>{food.description}</Text>

          {/* Metrics Row */}
          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <Text style={styles.metricStar}>★</Text>
              <Text style={styles.metricValue}>{food.rating}</Text>
              <Text style={styles.metricSub}>({food.reviewCount})</Text>
            </View>
            <View style={styles.metric}>
              <Text>🔥</Text>
              <Text style={styles.metricValue}>{food.calories} Kcal</Text>
            </View>
            <View style={styles.metric}>
              <Text>⏱</Text>
              <Text style={styles.metricValue}>{food.prepTime}</Text>
            </View>
          </View>
        </View>

        {/* ── Swallow Selector ── */}
        {food.swallowOptions && food.swallowOptions.length > 0 && (
          <View style={styles.selectorSection}>
            <Text style={styles.selectorLabel}>Choose Swallow</Text>
            <View style={styles.swallowGrid}>
              {food.swallowOptions.map((opt) => {
                const active = selectedSwallow?.id === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    style={[styles.swallowChip, active && styles.swallowChipActive]}
                    onPress={() => setSelectedSwallow(opt)}>
                    <Text
                      style={[styles.swallowChipText, active && styles.swallowChipTextActive]}
                      numberOfLines={2}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Portion Selector ── */}
        {food.portionOptions && food.portionOptions.length > 0 && (
          <View style={styles.selectorSection}>
            <Text style={styles.selectorLabel}>Portion Size</Text>
            <View style={styles.portionRow}>
              {food.portionOptions.map((opt) => {
                const active = selectedPortion?.id === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    style={[styles.portionChip, active && styles.portionChipActive]}
                    onPress={() => setSelectedPortion(opt)}>
                    <Text
                      style={[styles.portionLabel, active && styles.portionLabelActive]}>
                      {opt.label}
                    </Text>
                    <Text style={[styles.portionPrice, active && styles.portionPriceActive]}>
                      {formatPrice(opt.price)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Bottom spacer for sticky footer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Sticky Bottom Bar ── */}
      <View style={styles.bottomBar}>
        <View style={styles.priceSummary}>
          <Text style={styles.totalLabel}>Total Price</Text>
          <Text style={styles.totalValue}>{formatPrice(totalPrice)}</Text>
        </View>
        <Pressable style={styles.addToCartBtn} onPress={handleAddToCart}>
          <Text style={{ fontSize: 16 }}>🛍️</Text>
          <Text style={styles.addToCartText}>Add To Cart</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { ...Typography.headlineSm, color: ChowColors.textPrimary },
  backBtn: {
    backgroundColor: ChowColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  backBtnText: { color: '#fff', fontWeight: '600' },

  // Nav
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    zIndex: 10,
  },
  navCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  navTitle: { ...Typography.headlineSm, color: ChowColors.textPrimary },

  // Content
  content: { paddingHorizontal: 20, paddingTop: 8 },

  // Hero
  heroSection: { alignItems: 'center', justifyContent: 'center', height: 260, marginBottom: 8 },
  heroAura: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(251,191,36,0.12)',
  },
  heroCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 8,
    ...Shadows.float,
    borderWidth: 2,
    borderColor: 'rgba(251,191,36,0.2)',
  },
  heroImage: { width: '100%', height: '100%', borderRadius: 112 },

  // Meta
  metaSection: { gap: 6 },
  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  categoryTagText: { fontSize: 10, fontWeight: '700', color: '#92400E', textTransform: 'uppercase', letterSpacing: 0.8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  yourOrderLabel: { ...Typography.labelSm, color: ChowColors.textSecondary },
  foodTitle: { ...Typography.headlineMd, color: ChowColors.textPrimary, marginTop: 2 },
  description: {
    ...Typography.bodyMd,
    color: ChowColors.textSecondary,
    lineHeight: 20,
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: ChowColors.border,
  },
  metric: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metricStar: { color: ChowColors.amberStar, fontSize: 13, fontWeight: '600' },
  metricValue: { fontSize: 12, fontWeight: '600', color: ChowColors.textPrimary },
  metricSub: { fontSize: 11, color: ChowColors.textMuted },

  // Selectors
  selectorSection: { marginTop: 20 },
  selectorLabel: { ...Typography.labelMd, color: ChowColors.textPrimary, fontWeight: '700', marginBottom: 10 },
  swallowGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  swallowChip: {
    flex: 1,
    minWidth: '20%',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  swallowChipActive: {
    backgroundColor: ChowColors.secondary,
    borderColor: '#FCA5A5',
  },
  swallowChipText: { fontSize: 11, fontWeight: '500', color: ChowColors.textSecondary, textAlign: 'center' },
  swallowChipTextActive: { color: ChowColors.textPrimary, fontWeight: '700' },
  portionRow: { flexDirection: 'row', gap: 10 },
  portionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  portionChipActive: { backgroundColor: ChowColors.secondary, borderColor: '#FCA5A5' },
  portionLabel: { fontSize: 12, fontWeight: '500', color: ChowColors.textSecondary },
  portionLabelActive: { color: ChowColors.textPrimary, fontWeight: '700' },
  portionPrice: { fontSize: 12, fontWeight: '600', color: ChowColors.textMuted },
  portionPriceActive: { color: ChowColors.textPrimary, fontWeight: '700' },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 32,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: ChowColors.border,
    gap: 16,
  },
  priceSummary: { gap: 2 },
  totalLabel: { fontSize: 10, fontWeight: '700', color: ChowColors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  totalValue: { ...Typography.priceLg, color: ChowColors.textPrimary },
  addToCartBtn: {
    flex: 1,
    height: 50,
    backgroundColor: ChowColors.primary,
    borderRadius: Radius.DEFAULT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.primaryGlow,
  },
  addToCartText: { ...Typography.labelLg, color: '#fff' },
});
