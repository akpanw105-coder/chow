/**
 * Favourites Screen — Chow
 * Displays all liked delicacies with quick Add-to-Cart and detail access.
 */
import { router } from 'expo-router';
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
import { FOODS, formatPrice } from '@/data/foods';
import { useCart } from '@/store/cartStore';
import { useFavourites } from '@/store/favouritesStore';

export default function FavouritesScreen() {
  const { favourites, toggleFavourite } = useFavourites();
  const { addItem } = useCart();

  const favFoods = FOODS.filter((f) => favourites.has(f.id));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
          <Text style={{ fontSize: 20 }}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>My Favourites</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        {favFoods.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 44 }}>💔</Text>
            <Text style={styles.emptyTitle}>No favourites saved</Text>
            <Text style={styles.emptySub}>
              Tap the heart icon on any dish to save it here for quick ordering.
            </Text>
            <Pressable style={styles.browseBtn} onPress={() => router.replace('/')}>
              <Text style={styles.browseBtnText}>Explore Delicacies</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <Text style={styles.countText}>{favFoods.length} saved dishes</Text>
            {favFoods.map((food) => (
              <Pressable
                key={food.id}
                style={styles.card}
                onPress={() => router.push(`/food/${food.id}`)}>
                <Image source={food.image} style={styles.thumb} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.name} numberOfLines={1}>{food.shortName}</Text>
                  <Text style={styles.restaurant}>{food.restaurant} • ★ {food.rating}</Text>
                  <Text style={styles.price}>{formatPrice(food.basePrice)}</Text>
                </View>

                <View style={styles.actions}>
                  <Pressable
                    style={styles.removeFavBtn}
                    onPress={() => toggleFavourite(food.id)}
                    hitSlop={8}>
                    <Text style={{ fontSize: 16, color: ChowColors.primary }}>♥</Text>
                  </Pressable>
                  <Pressable
                    style={styles.addBtn}
                    onPress={() => addItem(food)}
                    hitSlop={8}>
                    <Text style={styles.addBtnText}>+ Add</Text>
                  </Pressable>
                </View>
              </Pressable>
            ))}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: ChowColors.border,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  headerTitle: { ...Typography.headlineSm, color: ChowColors.textPrimary },
  content: { padding: 16, paddingBottom: 60 },
  countText: { ...Typography.labelSm, color: ChowColors.textSecondary, marginBottom: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ChowColors.surface,
    borderRadius: Radius.DEFAULT,
    padding: 12,
    gap: 12,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: ChowColors.border,
  },
  thumb: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#F3F4F6' },
  name: { ...Typography.labelMd, color: ChowColors.textPrimary, fontWeight: '700' },
  restaurant: { fontSize: 11, color: ChowColors.textSecondary },
  price: { ...Typography.labelMd, color: ChowColors.textPrimary, fontWeight: '800', marginTop: 2 },
  actions: { alignItems: 'flex-end', gap: 8 },
  removeFavBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ChowColors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    backgroundColor: ChowColors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    ...Shadows.primaryGlow,
  },
  addBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', padding: 48, gap: 10, marginTop: 40 },
  emptyTitle: { ...Typography.headlineSm, color: ChowColors.textPrimary },
  emptySub: { ...Typography.bodyMd, color: ChowColors.textSecondary, textAlign: 'center' },
  browseBtn: {
    marginTop: 12,
    backgroundColor: ChowColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.full,
    ...Shadows.primaryGlow,
  },
  browseBtnText: { color: '#fff', fontWeight: '700' },
});
