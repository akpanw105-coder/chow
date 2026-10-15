/**
 * Shared UI components for Chow.
 */
import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ChowColors, Radius, Shadows, Typography } from '@/constants/theme';
import { formatPrice } from '@/data/foods';
import { useCart } from '@/store/cartStore';
import { useFavourites } from '@/store/favouritesStore';
import { FoodItem } from '@/types';

// ─── Rating Stars ─────────────────────────────────────────────────────────────
export function RatingBadge({
  rating,
  reviewCount,
  size = 'sm',
}: {
  rating: number;
  reviewCount?: string;
  size?: 'sm' | 'md';
}) {
  const fontSize = size === 'sm' ? 10 : 12;
  return (
    <View style={styles.ratingRow}>
      <Text style={[styles.star, { fontSize }]}>★</Text>
      <Text style={[styles.ratingValue, { fontSize }]}>{rating}</Text>
      {reviewCount && (
        <Text style={[styles.ratingCount, { fontSize }]}>({reviewCount})</Text>
      )}
    </View>
  );
}

// ─── Badge Pill ───────────────────────────────────────────────────────────────
export function BadgePill({
  label,
  variant = 'default',
}: {
  label: string;
  variant?: 'default' | 'primary' | 'amber';
}) {
  const bgMap = {
    default: ChowColors.secondaryLight,
    primary: ChowColors.primary,
    amber: '#FFF3CD',
  };
  const textMap = {
    default: '#92400E',
    primary: '#fff',
    amber: '#92400E',
  };
  return (
    <View style={[styles.badge, { backgroundColor: bgMap[variant] }]}>
      <Text style={[styles.badgeText, { color: textMap[variant] }]}>{label}</Text>
    </View>
  );
}

// ─── Food Card (List Row) ─────────────────────────────────────────────────────
export function FoodCardRow({
  food,
  onPress,
}: {
  food: FoodItem;
  onPress: () => void;
}) {
  const { addItem, removeItem, decrement, getQuantity } = useCart();
  const qty = getQuantity(food.id);

  return (
    <Pressable style={styles.foodRow} onPress={onPress} android_ripple={{ color: '#f0f0f0' }}>
      <View style={styles.foodRowThumb}>
        <Image source={food.image} style={styles.foodRowImage} />
      </View>
      <View style={styles.foodRowContent}>
        <View style={styles.foodRowTop}>
          {food.badge && <BadgePill label={food.badge} />}
          <RatingBadge rating={food.rating} reviewCount={food.reviewCount} />
        </View>
        <Text style={styles.foodRowName} numberOfLines={1}>
          {food.shortName}
        </Text>
        <View style={styles.foodRowBottom}>
          <Text style={styles.foodRowPrice}>{formatPrice(food.basePrice)}</Text>
          {qty === 0 ? (
            <Pressable
              style={styles.addBtn}
              onPress={() => addItem(food)}
              hitSlop={8}>
              <Text style={styles.addBtnText}>+</Text>
            </Pressable>
          ) : (
            <View style={styles.stepperSmall}>
              <Pressable
                onPress={() => (qty === 1 ? removeItem(food.id) : decrement(food.id))}
                style={styles.stepperMinus}
                hitSlop={8}>
                <Text style={styles.stepperMinusText}>−</Text>
              </Pressable>
              <Text style={styles.stepperCount}>{qty}</Text>
              <Pressable
                onPress={() => addItem(food)}
                style={styles.stepperPlus}
                hitSlop={8}>
                <Text style={styles.stepperPlusText}>+</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

// ─── Featured Hero Card ───────────────────────────────────────────────────────
export function HeroFoodCard({
  food,
  heroImage,
  onPress,
}: {
  food: FoodItem;
  heroImage?: ReturnType<typeof require>;
  onPress: () => void;
}) {
  const { addItem } = useCart();
  const { toggleFavourite, isFavourite } = useFavourites();
  const fav = isFavourite(food.id);

  return (
    <Pressable style={styles.heroCard} onPress={onPress}>
      <Image
        source={heroImage ?? food.image}
        style={styles.heroImage}
        resizeMode="cover"
      />
      {/* Price badge top-left */}
      <View style={styles.heroPriceBadge}>
        <Text style={styles.heroPriceText}>{formatPrice(food.basePrice)}</Text>
      </View>
      {/* Favourite top-right */}
      <Pressable
        style={styles.heroFavBtn}
        onPress={() => toggleFavourite(food.id)}
        hitSlop={8}>
        <Text style={{ fontSize: 16, color: fav ? ChowColors.primary : '#fff' }}>♥</Text>
      </Pressable>
      {/* Glass bottom bar */}
      <View style={styles.heroGlassBar}>
        <View style={styles.heroGlassLeft}>
          <View style={styles.heroIconCircle}>
            <Text style={{ fontSize: 14 }}>🍽️</Text>
          </View>
          <View>
            <Text style={styles.heroFoodName}>{food.shortName}</Text>
            <RatingBadge rating={food.rating} reviewCount={food.reviewCount} />
          </View>
        </View>
        <Pressable
          style={styles.heroAddBtn}
          onPress={() => {
            addItem(food);
          }}>
          <Text style={styles.heroAddBtnText}>Add to Cart</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

// ─── Circular Quantity Stepper ────────────────────────────────────────────────
export function QuantityStepper({
  quantity,
  onIncrement,
  onDecrement,
}: {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable style={styles.stepperMinusFull} onPress={onDecrement} hitSlop={6}>
        <Text style={styles.stepperMinusFullText}>−</Text>
      </Pressable>
      <Text style={styles.stepperCountFull}>{quantity}</Text>
      <Pressable style={styles.stepperPlusFull} onPress={onIncrement} hitSlop={6}>
        <Text style={styles.stepperPlusFullText}>+</Text>
      </Pressable>
    </View>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── Primary Button ───────────────────────────────────────────────────────────
export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  icon,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
}) {
  return (
    <Pressable
      style={[styles.primaryBtn, disabled && { opacity: 0.6 }]}
      onPress={onPress}
      disabled={disabled || loading}>
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {icon && <Text style={{ fontSize: 16 }}>{icon}</Text>}
          <Text style={styles.primaryBtnText}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Rating
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  star: { color: ChowColors.amberStar, fontWeight: '600' },
  ratingValue: { color: ChowColors.textPrimary, fontWeight: '700' },
  ratingCount: { color: ChowColors.textMuted },

  // Badge
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  badgeText: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Food Row
  foodRow: {
    flexDirection: 'row',
    backgroundColor: ChowColors.surface,
    borderRadius: Radius.DEFAULT,
    padding: 10,
    gap: 12,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: ChowColors.border,
  },
  foodRowThumb: {
    width: 68,
    height: 68,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  foodRowImage: { width: '100%', height: '100%' },
  foodRowContent: { flex: 1, justifyContent: 'space-between' },
  foodRowTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  foodRowName: {
    ...Typography.labelLg,
    color: ChowColors.textPrimary,
    marginTop: 2,
  },
  foodRowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  foodRowPrice: {
    ...Typography.headlineSm,
    color: ChowColors.textPrimary,
  },

  // Add button
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ChowColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.primaryGlow,
  },
  addBtnText: { color: '#fff', fontSize: 18, fontWeight: '600', lineHeight: 22 },

  // Small stepper on cards
  stepperSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: Radius.full,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stepperMinus: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperMinusText: { color: ChowColors.textSecondary, fontSize: 16, fontWeight: '600' },
  stepperCount: { fontSize: 12, fontWeight: '700', color: ChowColors.textPrimary, minWidth: 14, textAlign: 'center' },
  stepperPlus: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ChowColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperPlusText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Hero Card
  heroCard: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    ...Shadows.card,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  heroImage: { width: '100%', height: 220 },
  heroPriceBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(230, 212, 159, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  heroPriceText: { fontSize: 12, fontWeight: '700', color: '#5E470E' },
  heroFavBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGlassBar: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 16,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  heroGlassLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroFoodName: { fontSize: 12, fontWeight: '700', color: '#fff', marginBottom: 2 },
  heroAddBtn: {
    backgroundColor: ChowColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  heroAddBtnText: { fontSize: 11, fontWeight: '600', color: '#fff' },

  // Full Stepper
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: Radius.full,
    padding: 4,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stepperMinusFull: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: ChowColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  stepperMinusFullText: { color: ChowColors.textSecondary, fontSize: 18, fontWeight: '600' },
  stepperCountFull: {
    fontSize: 14,
    fontWeight: '700',
    color: ChowColors.textPrimary,
    minWidth: 18,
    textAlign: 'center',
  },
  stepperPlusFull: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: ChowColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperPlusFullText: { color: '#fff', fontSize: 18, fontWeight: '700' },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { ...Typography.headlineSm, color: ChowColors.textPrimary },
  sectionAction: { fontSize: 12, fontWeight: '600', color: ChowColors.primary },

  // Primary button
  primaryBtn: {
    backgroundColor: ChowColors.primary,
    borderRadius: Radius.DEFAULT,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.primaryGlow,
  },
  primaryBtnText: { ...Typography.labelLg, color: '#fff' },
});
