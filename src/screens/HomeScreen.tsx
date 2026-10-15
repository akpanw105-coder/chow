/**
 * Home Screen — Chow
 * Faithfully reproduces the "home_food_discovery" Stitch export.
 * Features: location header, search bar, filter chips, hero carousel, recommendations.
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
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HeroFoodCard, SectionHeader } from '@/components/chow-ui';
import { ChowColors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { CATEGORIES, FOODS, getFoodsByCategory, HERO_BANNERS } from '@/data/foods';
import { useAuth } from '@/store/authStore';
import { useCart } from '@/store/cartStore';
import { FoodCategory, FoodItem } from '@/types';

// ─── Search Bar ───────────────────────────────────────────────────────────────
function SearchBar({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (t: string) => void;
}) {
  return (
    <View style={styles.searchRow}>
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search bole, soups, grills..."
          placeholderTextColor={ChowColors.textMuted}
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
        />
      </View>
      <Pressable style={styles.filterBtn}>
        <Text style={{ color: '#fff', fontSize: 16 }}>⊞</Text>
      </Pressable>
    </View>
  );
}

// ─── Category Chips ───────────────────────────────────────────────────────────
function CategoryChips({
  selected,
  onSelect,
}: {
  selected: FoodCategory;
  onSelect: (c: FoodCategory) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipsRow}>
      {CATEGORIES.map((cat) => (
        <Pressable
          key={cat.id}
          style={[styles.chip, selected === cat.id && styles.chipActive]}
          onPress={() => onSelect(cat.id)}>
          <Text style={styles.chipIcon}>{cat.icon}</Text>
          <Text style={[styles.chipLabel, selected === cat.id && styles.chipLabelActive]}>
            {cat.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

// ─── Quick Filter Chips ───────────────────────────────────────────────────────
function QuickFilters() {
  const filters = ['Pickup', 'Under 30 min', 'Price ▾'];
  const [active, setActive] = useState<string | null>(null);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingVertical: 2 }}>
      {filters.map((f) => (
        <Pressable
          key={f}
          style={[styles.quickChip, active === f && styles.quickChipActive]}
          onPress={() => setActive(active === f ? null : f)}>
          <Text style={[styles.quickChipLabel, active === f && { color: ChowColors.primary }]}>
            {f}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

// ─── Recommendation Card ──────────────────────────────────────────────────────
function RecommendCard({ food, onPress }: { food: FoodItem; onPress: () => void }) {
  const { addItem } = useCart();
  return (
    <Pressable style={styles.recCard} onPress={onPress}>
      <View style={styles.recThumb}>
        <Image source={food.image} style={styles.recImage} />
      </View>
      <View style={styles.recContent}>
        <View style={styles.recTopRow}>
          {food.badge && (
            <View style={styles.recBadge}>
              <Text style={styles.recBadgeText}>{food.badge}</Text>
            </View>
          )}
          <Text style={styles.recRating}>
            ★ {food.rating}{' '}
            <Text style={styles.recRatingCount}>({food.reviewCount})</Text>
          </Text>
        </View>
        <Text style={styles.recName} numberOfLines={1}>
          {food.shortName}
        </Text>
        <Text style={styles.recPrice}>₦{food.basePrice.toLocaleString()}</Text>
      </View>
      <Pressable style={styles.recAddBtn} onPress={() => addItem(food)} hitSlop={8}>
        <Text style={styles.recAddBtnText}>+</Text>
      </Pressable>
    </Pressable>
  );
}

// ─── Hero Carousel Dot ────────────────────────────────────────────────────────
function HeroDots({ count, active }: { count: number; active: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[styles.dot, i === active && styles.dotActive]}
        />
      ))}
    </View>
  );
}

// ─── Home Screen ─────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const { user } = useAuth();
  const { itemCount } = useCart();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<FoodCategory>('all');
  const [heroDotIndex, setHeroDotIndex] = useState(0);

  const defaultAddress =
    user?.savedAddresses?.find((a) => a.isDefault)?.street ||
    user?.savedAddresses?.[0]?.street ||
    '14 Marian Road, Calabar';

  const filteredFoods = getFoodsByCategory(category).filter((f) =>
    search.length === 0 ||
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.shortName.toLowerCase().includes(search.toLowerCase())
  );

  const heroFoods = HERO_BANNERS.map((b) => ({
    banner: b,
    food: FOODS.find((f) => f.id === b.foodId)!,
  }));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={ChowColors.canvas} />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>

        {/* ── Header Row ── */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.locationLabel}>Delivery Location</Text>
            <Pressable
              style={styles.locationRow}
              onPress={() => router.push('/(tabs)/profile')}>
              <Text style={styles.locationPin}>📍</Text>
              <Text style={styles.locationText}>{defaultAddress}</Text>
              <Text style={styles.locationChevron}>▾</Text>
            </Pressable>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.iconBtn}
              onPress={() => router.push('/cart')}>
              <Text style={{ fontSize: 18 }}>🛍️</Text>
              {itemCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{itemCount > 9 ? '9+' : itemCount}</Text>
                </View>
              )}
            </Pressable>
            <Pressable
              style={styles.iconBtn}
              onPress={() => router.push('/notifications')}>
              <Text style={{ fontSize: 18 }}>🔔</Text>
              <View style={styles.notifDot} />
            </Pressable>
          </View>
        </View>

        {/* ── Search ── */}
        <SearchBar value={search} onChangeText={setSearch} />

        {/* ── Search Results or normal content ── */}
        {search.length > 0 ? (
          <View style={{ gap: 10, marginTop: 8 }}>
            <Text style={styles.searchResultLabel}>
              {filteredFoods.length} result{filteredFoods.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;
            </Text>
            {filteredFoods.length === 0 ? (
              <View style={styles.emptySearch}>
                <Text style={{ fontSize: 40 }}>🍽️</Text>
                <Text style={styles.emptySearchText}>No dishes found</Text>
                <Text style={styles.emptySearchSub}>Try a different name or browse categories</Text>
              </View>
            ) : (
              filteredFoods.map((food) => (
                <RecommendCard
                  key={food.id}
                  food={food}
                  onPress={() => router.push(`/food/${food.id}`)}
                />
              ))
            )}
          </View>
        ) : (
          <>
            {/* ── Hero Featured Carousel ── */}
            <View>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const itemWidth = windowWidth;
                  const idx = Math.round(
                    e.nativeEvent.contentOffset.x / itemWidth
                  );
                  setHeroDotIndex(idx);
                }}
                style={{ marginHorizontal: -Spacing.margin }}>
                {heroFoods.map(({ banner, food }) => (
                  <View
                    key={banner.id}
                    style={{ width: windowWidth, paddingHorizontal: Spacing.margin }}>
                    <HeroFoodCard
                      food={food}
                      heroImage={banner.image}
                      onPress={() => router.push(`/food/${food.id}`)}
                    />
                  </View>
                ))}
              </ScrollView>
              <HeroDots count={heroFoods.length} active={heroDotIndex} />
            </View>

            {/* ── Quick Filters ── */}
            <QuickFilters />

            {/* ── Category Chips ── */}
            <CategoryChips selected={category} onSelect={setCategory} />

            {/* ── Recommendations ── */}
            <SectionHeader
              title="Recommend For You"
              actionLabel="See all"
              onAction={() => router.push('/(tabs)/shop')}
            />
            <View style={{ gap: 10 }}>
              {filteredFoods.slice(0, 8).map((food) => (
                <RecommendCard
                  key={food.id}
                  food={food}
                  onPress={() => router.push(`/food/${food.id}`)}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ChowColors.canvas },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.margin,
    paddingTop: 8,
    paddingBottom: 100,
    gap: 16,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  locationLabel: {
    ...Typography.labelSm,
    color: ChowColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationPin: { fontSize: 14, color: ChowColors.primary },
  locationText: { ...Typography.labelMd, color: ChowColors.textPrimary, fontWeight: '700' },
  locationChevron: { fontSize: 12, color: ChowColors.textMuted, marginLeft: 2 },
  headerActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ChowColors.surface,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: ChowColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: ChowColors.canvas,
  },
  cartBadgeText: { fontSize: 8, fontWeight: '700', color: '#fff' },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ChowColors.primary,
    borderWidth: 1.5,
    borderColor: '#fff',
  },

  // Search
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234,232,227,0.6)',
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon: { fontSize: 14, color: ChowColors.textMuted },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: ChowColors.textPrimary,
    padding: 0,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ChowColors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Chips
  chipsRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: ChowColors.surface,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Shadows.card,
  },
  chipActive: { backgroundColor: ChowColors.primary, borderColor: ChowColors.primary },
  chipIcon: { fontSize: 13 },
  chipLabel: { ...Typography.labelSm, color: ChowColors.textSecondary },
  chipLabelActive: { color: '#fff', fontWeight: '700' },

  // Quick filters
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: ChowColors.surface,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickChipActive: { borderColor: ChowColors.primary, backgroundColor: ChowColors.secondaryLight },
  quickChipLabel: { fontSize: 11, fontWeight: '500', color: ChowColors.textSecondary },

  // Hero dots
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },
  dotActive: { backgroundColor: ChowColors.primary, width: 18 },

  // Recommendation card
  recCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ChowColors.surface,
    borderRadius: Radius.DEFAULT,
    padding: 10,
    gap: 12,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: ChowColors.border,
  },
  recThumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  recImage: { width: '100%', height: '100%' },
  recContent: { flex: 1 },
  recTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  recBadge: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  recBadgeText: { fontSize: 9, fontWeight: '600', color: '#EA580C' },
  recRating: { fontSize: 10, color: ChowColors.amberStar, fontWeight: '600' },
  recRatingCount: { color: ChowColors.textMuted, fontWeight: '400' },
  recName: { ...Typography.labelMd, color: ChowColors.textPrimary, fontWeight: '700' },
  recPrice: { ...Typography.labelMd, color: ChowColors.textPrimary, marginTop: 3 },
  recAddBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: ChowColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.primaryGlow,
  },
  recAddBtnText: { color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 24 },

  // Search results
  searchResultLabel: {
    ...Typography.labelSm,
    color: ChowColors.textSecondary,
  },
  emptySearch: { alignItems: 'center', gap: 8, paddingVertical: 32 },
  emptySearchText: { ...Typography.headlineSm, color: ChowColors.textPrimary },
  emptySearchSub: { ...Typography.bodyMd, color: ChowColors.textSecondary, textAlign: 'center' },
});
