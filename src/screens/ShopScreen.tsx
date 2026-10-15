/**
 * Shop & Menu Catalog Screen — Chow
 * Corresponds to the "Shop" tab in the Stitch navigation bar.
 * Full category filtering, search, dietary sorting, and direct cart manipulation.
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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChowColors, Radius, Shadows, Typography } from '@/constants/theme';
import { CATEGORIES, formatPrice, getFoodsByCategory } from '@/data/foods';
import { useCart } from '@/store/cartStore';
import { useFavourites } from '@/store/favouritesStore';
import { FoodCategory } from '@/types';

export default function ShopScreen() {
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'priceAsc' | 'priceDesc'>('popular');

  const { addItem, getQuantity } = useCart();
  const { toggleFavourite, isFavourite } = useFavourites();

  const categoryFoods = getFoodsByCategory(selectedCategory);

  const filtered = categoryFoods
    .filter((f) =>
      search.trim().length === 0
        ? true
        : f.name.toLowerCase().includes(search.toLowerCase()) ||
          f.shortName.toLowerCase().includes(search.toLowerCase()) ||
          f.description.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'priceAsc') return a.basePrice - b.basePrice;
      if (sortBy === 'priceDesc') return b.basePrice - a.basePrice;
      return b.rating - a.rating;
    });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Screen Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>Full Menu</Text>
          <Text style={styles.headerTitle}>Shop & Delicacies</Text>
        </View>
        <Pressable
          style={styles.cartIconBtn}
          onPress={() => router.push('/cart')}>
          <Text style={{ fontSize: 18 }}>🛍️</Text>
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Afang, Jollof, Banga, Catfish..."
            placeholderTextColor={ChowColors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={10}>
              <Text style={{ color: ChowColors.textMuted, fontSize: 14 }}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Categories Horizontal Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}>
        {CATEGORIES.map((cat) => {
          const isActive = cat.id === selectedCategory;
          return (
            <Pressable
              key={cat.id}
              style={[styles.categoryPill, isActive && styles.categoryPillActive]}
              onPress={() => setSelectedCategory(cat.id)}>
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={[styles.categoryLabel, isActive && styles.categoryLabelActive]}>
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Sort Options Bar */}
      <View style={styles.sortBar}>
        <Text style={styles.resultsCount}>
          {filtered.length} dish{filtered.length !== 1 ? 'es' : ''} available
        </Text>
        <View style={styles.sortRow}>
          <Pressable
            style={[styles.sortChip, sortBy === 'popular' && styles.sortChipActive]}
            onPress={() => setSortBy('popular')}>
            <Text style={[styles.sortChipText, sortBy === 'popular' && styles.sortChipTextActive]}>
              Top Rated
            </Text>
          </Pressable>
          <Pressable
            style={[styles.sortChip, sortBy === 'priceAsc' && styles.sortChipActive]}
            onPress={() => setSortBy('priceAsc')}>
            <Text style={[styles.sortChipText, sortBy === 'priceAsc' && styles.sortChipTextActive]}>
              ₦ Low
            </Text>
          </Pressable>
          <Pressable
            style={[styles.sortChip, sortBy === 'priceDesc' && styles.sortChipActive]}
            onPress={() => setSortBy('priceDesc')}>
            <Text style={[styles.sortChipText, sortBy === 'priceDesc' && styles.sortChipTextActive]}>
              ₦ High
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Grid of Dishes */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridContent}>
        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 40 }}>🍲</Text>
            <Text style={styles.emptyTitle}>No dishes found</Text>
            <Text style={styles.emptySub}>Try searching for another term or change category.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filtered.map((food) => {
              const fav = isFavourite(food.id);
              const qty = getQuantity(food.id);

              return (
                <Pressable
                  key={food.id}
                  style={styles.gridCard}
                  onPress={() => router.push(`/food/${food.id}`)}>
                  {/* Food Image with Fav button */}
                  <View style={styles.cardImageContainer}>
                    <Image source={food.image} style={styles.cardImage} />
                    <Pressable
                      style={styles.favBtn}
                      onPress={() => toggleFavourite(food.id)}
                      hitSlop={8}>
                      <Text style={{ fontSize: 13, color: fav ? ChowColors.primary : '#fff' }}>
                        {fav ? '♥' : '♡'}
                      </Text>
                    </Pressable>
                    {food.badge && (
                      <View style={styles.badgeWrap}>
                        <Text style={styles.badgeText}>{food.badge}</Text>
                      </View>
                    )}
                  </View>

                  {/* Card Content */}
                  <View style={styles.cardBody}>
                    <View style={styles.ratingRow}>
                      <Text style={styles.star}>★ {food.rating}</Text>
                      <Text style={styles.prep}>{food.prepTime}</Text>
                    </View>
                    <Text style={styles.cardName} numberOfLines={2}>
                      {food.shortName}
                    </Text>
                    <Text style={styles.cardRestaurant} numberOfLines={1}>
                      {food.restaurant}
                    </Text>

                    <View style={styles.cardBottom}>
                      <Text style={styles.cardPrice}>{formatPrice(food.basePrice)}</Text>
                      <Pressable
                        style={[styles.addBtn, qty > 0 && styles.addBtnActive]}
                        onPress={() => addItem(food)}
                        hitSlop={6}>
                        <Text style={styles.addBtnText}>{qty > 0 ? `${qty}` : '+'}</Text>
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ChowColors.canvas },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: ChowColors.border,
  },
  headerSub: { ...Typography.labelSm, color: ChowColors.textMuted, textTransform: 'uppercase' },
  headerTitle: { ...Typography.headlineSm, color: ChowColors.textPrimary },
  cartIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ChowColors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSection: { paddingHorizontal: 16, paddingTop: 12 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAE8E3',
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon: { fontSize: 14, color: ChowColors.textMuted },
  searchInput: { flex: 1, fontSize: 13, color: ChowColors.textPrimary, padding: 0 },
  categoryRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: ChowColors.surface,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryPillActive: { backgroundColor: ChowColors.primary, borderColor: ChowColors.primary },
  categoryIcon: { fontSize: 13 },
  categoryLabel: { ...Typography.labelSm, color: ChowColors.textSecondary },
  categoryLabelActive: { color: '#fff', fontWeight: '700' },
  sortBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  resultsCount: { ...Typography.labelSm, color: ChowColors.textSecondary },
  sortRow: { flexDirection: 'row', gap: 6 },
  sortChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: ChowColors.surface,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sortChipActive: { backgroundColor: ChowColors.secondaryLight, borderColor: ChowColors.primary },
  sortChipText: { fontSize: 10, color: ChowColors.textSecondary, fontWeight: '500' },
  sortChipTextActive: { color: ChowColors.primary, fontWeight: '700' },
  gridContent: { paddingHorizontal: 16, paddingBottom: 110 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  gridCard: {
    width: '48%',
    backgroundColor: ChowColors.surface,
    borderRadius: Radius.DEFAULT,
    overflow: 'hidden',
    ...Shadows.card,
    borderWidth: 1,
    borderColor: ChowColors.border,
  },
  cardImageContainer: { height: 120, width: '100%', backgroundColor: '#F3F4F6', position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  favBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeWrap: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: { fontSize: 9, fontWeight: '700', color: '#EA580C' },
  cardBody: { padding: 10, gap: 4 },
  ratingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  star: { fontSize: 10, fontWeight: '700', color: ChowColors.amberStar },
  prep: { fontSize: 10, color: ChowColors.textMuted },
  cardName: { ...Typography.labelMd, color: ChowColors.textPrimary, fontWeight: '700', minHeight: 34 },
  cardRestaurant: { fontSize: 11, color: ChowColors.textSecondary },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: ChowColors.border,
  },
  cardPrice: { ...Typography.labelMd, color: ChowColors.textPrimary, fontWeight: '800' },
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ChowColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.primaryGlow,
  },
  addBtnActive: { backgroundColor: '#111827' },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', padding: 48, gap: 8 },
  emptyTitle: { ...Typography.headlineSm, color: ChowColors.textPrimary },
  emptySub: { ...Typography.bodyMd, color: ChowColors.textSecondary, textAlign: 'center' },
});
