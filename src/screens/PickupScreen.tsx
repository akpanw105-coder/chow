/**
 * Pickup & Outlets Screen — Chow
 * Corresponds to the "Pickup" tab in the Stitch navigation bar.
 * Features: restaurant outlets in Calabar & Port Harcourt, ready times,
 * distance indicators, order-for-pickup food filter, and pickup locations.
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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChowColors, Radius, Shadows, Typography } from '@/constants/theme';
import { FOODS, formatPrice } from '@/data/foods';
import { useCart } from '@/store/cartStore';

interface KitchenOutlet {
  id: string;
  name: string;
  address: string;
  distance: string;
  pickupTime: string;
  rating: number;
  isOpen: boolean;
  featuredFoodId: string;
}

const OUTLETS: KitchenOutlet[] = [
  {
    id: 'out_1',
    name: 'Calabar Kitchen — Marian Main',
    address: '14 Marian Road, Calabar',
    distance: '1.2 Km',
    pickupTime: '15-20 min',
    rating: 4.9,
    isOpen: true,
    featuredFoodId: 'bole_fish',
  },
  {
    id: 'out_2',
    name: 'Rivers Aroma — Port Harcourt Hub',
    address: '88 Peter Odili Road, Trans-Amadi, PH',
    distance: '2.5 Km',
    pickupTime: '20-25 min',
    rating: 4.8,
    isOpen: true,
    featuredFoodId: 'jollof_rice',
  },
  {
    id: 'out_3',
    name: 'Delta Flavours — Warri Central',
    address: '12 Airport Road, Warri',
    distance: '3.0 Km',
    pickupTime: '25-30 min',
    rating: 4.7,
    isOpen: true,
    featuredFoodId: 'banga_soup',
  },
  {
    id: 'out_4',
    name: 'Waterside Grill & Fish Bar',
    address: 'Marina Resort Waterfront, Calabar',
    distance: '4.1 Km',
    pickupTime: '30-35 min',
    rating: 4.9,
    isOpen: true,
    featuredFoodId: 'grilled_catfish',
  },
];

export default function PickupScreen() {
  const [selectedOutlet, setSelectedOutlet] = useState<string>('out_1');
  const { addItem } = useCart();

  const outlet = OUTLETS.find((o) => o.id === selectedOutlet) || OUTLETS[0];
  const outletFoods = FOODS.filter((f) => f.restaurant.toLowerCase().includes(outlet.name.split('—')[0].trim().toLowerCase()) || f.isFeatured);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Screen Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>Self-Collection</Text>
          <Text style={styles.headerTitle}>Pickup Near You</Text>
        </View>
        <View style={styles.pickupPill}>
          <Text style={styles.pickupPillText}>0₦ Delivery Fee</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>

        {/* ── Kitchen Outlets Horizontal Selector ── */}
        <Text style={styles.sectionTitle}>Select Kitchen Location</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.outletsRow}>
          {OUTLETS.map((item) => {
            const isSelected = item.id === selectedOutlet;
            return (
              <Pressable
                key={item.id}
                style={[styles.outletCard, isSelected && styles.outletCardSelected]}
                onPress={() => setSelectedOutlet(item.id)}>
                <View style={styles.outletTop}>
                  <Text style={styles.outletPin}>🏪</Text>
                  <View style={[styles.outletDot, { backgroundColor: item.isOpen ? '#22C55E' : '#9CA3AF' }]} />
                </View>
                <Text style={styles.outletName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.outletAddress} numberOfLines={1}>
                  {item.address}
                </Text>
                <View style={styles.outletMeta}>
                  <Text style={styles.outletDistance}>📍 {item.distance}</Text>
                  <Text style={styles.outletTime}>⏱️ {item.pickupTime}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Active Outlet Banner ── */}
        <View style={styles.activeOutletBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.activeLabel}>READY FOR PICKUP AT</Text>
            <Text style={styles.activeName}>{outlet.name}</Text>
            <Text style={styles.activeSub}>{outlet.address} • Ready in {outlet.pickupTime}</Text>
          </View>
          <View style={styles.directionsBtn}>
            <Text style={{ fontSize: 18 }}>🗺️</Text>
          </View>
        </View>

        {/* ── Available Dishes for Pickup ── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.sectionTitle}>Dishes Available for Pickup</Text>
          <Text style={styles.itemCountText}>{outletFoods.length} items</Text>
        </View>

        <View style={{ gap: 12 }}>
          {outletFoods.map((food) => (
            <Pressable
              key={food.id}
              style={styles.foodRow}
              onPress={() => router.push(`/food/${food.id}`)}>
              <Image source={food.image} style={styles.foodImage} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.foodName} numberOfLines={1}>{food.shortName}</Text>
                <Text style={styles.foodRestaurant}>{food.restaurant} • {food.prepTime}</Text>
                <Text style={styles.foodPrice}>{formatPrice(food.basePrice)}</Text>
              </View>
              <Pressable
                style={styles.quickAddBtn}
                onPress={() => addItem(food)}>
                <Text style={styles.quickAddText}>+ Add</Text>
              </Pressable>
            </Pressable>
          ))}
        </View>
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
  pickupPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  pickupPillText: { fontSize: 11, fontWeight: '700', color: '#15803D' },
  content: { padding: 16, gap: 16, paddingBottom: 110 },
  sectionTitle: { ...Typography.labelLg, color: ChowColors.textPrimary },
  itemCountText: { ...Typography.labelSm, color: ChowColors.textMuted },

  // Outlets horizontal
  outletsRow: { gap: 12, paddingVertical: 4 },
  outletCard: {
    width: 220,
    backgroundColor: ChowColors.surface,
    borderRadius: Radius.DEFAULT,
    padding: 14,
    borderWidth: 1.5,
    borderColor: ChowColors.border,
    ...Shadows.card,
    gap: 4,
  },
  outletCardSelected: { borderColor: ChowColors.primary, backgroundColor: ChowColors.secondaryLight },
  outletTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  outletPin: { fontSize: 18 },
  outletDot: { width: 8, height: 8, borderRadius: 4 },
  outletName: { ...Typography.labelMd, color: ChowColors.textPrimary, fontWeight: '700', marginTop: 4 },
  outletAddress: { ...Typography.labelSm, color: ChowColors.textSecondary },
  outletMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  outletDistance: { fontSize: 11, color: ChowColors.textSecondary, fontWeight: '500' },
  outletTime: { fontSize: 11, color: ChowColors.primary, fontWeight: '700' },

  // Active banner
  activeOutletBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E24',
    borderRadius: Radius.DEFAULT,
    padding: 16,
    ...Shadows.card,
  },
  activeLabel: { fontSize: 9, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.8 },
  activeName: { ...Typography.labelLg, color: '#fff', marginTop: 2 },
  activeSub: { fontSize: 11, color: '#D1D5DB', marginTop: 2 },
  directionsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Food row
  foodRow: {
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
  foodImage: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#F3F4F6' },
  foodName: { ...Typography.labelMd, color: ChowColors.textPrimary, fontWeight: '700' },
  foodRestaurant: { ...Typography.labelSm, color: ChowColors.textSecondary },
  foodPrice: { ...Typography.labelMd, color: ChowColors.textPrimary, fontWeight: '800', marginTop: 2 },
  quickAddBtn: {
    backgroundColor: ChowColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    ...Shadows.primaryGlow,
  },
  quickAddText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
