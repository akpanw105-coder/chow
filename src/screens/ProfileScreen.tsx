/**
 * User Profile & Account Settings Screen — Chow
 * Corresponds to the "Profile" tab in the Stitch navigation bar.
 * Features: Profile overview, saved addresses manager, payment methods,
 * notification preferences, favourites shortcut, and authentication integration points.
 */
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
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
import { useAuth } from '@/store/authStore';
import { useFavourites } from '@/store/favouritesStore';

export default function ProfileScreen() {
  const { user, signOut, addAddress, removeAddress, setDefaultAddress, switchRoleInDev } = useAuth();
  const { favourites } = useFavourites();

  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [addrTitle, setAddrTitle] = useState('Home');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrLandmark, setAddrLandmark] = useState('');

  function handleSaveAddress() {
    if (!addrStreet.trim()) {
      Alert.alert('Required', 'Please enter your street address.');
      return;
    }
    addAddress({
      title: addrTitle,
      street: addrStreet.trim(),
      city: 'Calabar, Cross River State',
      landmark: addrLandmark.trim(),
      isDefault: false,
    });
    setAddrStreet('');
    setAddrLandmark('');
    setAddressModalVisible(false);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Screen Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <Pressable
          style={styles.settingsIconBtn}
          onPress={() => router.push('/notifications')}>
          <Text style={{ fontSize: 18 }}>🔔</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>

        {/* ── User Overview Card ── */}
        <View style={styles.userCard}>
          <View style={styles.avatarWrap}>
            <Text style={{ fontSize: 32 }}>👑</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.userName}>{user?.fullName ?? 'Bassey Ekpenyong'}</Text>
            <Text style={styles.userEmail}>{user?.email ?? 'bassey@chow.ng'}</Text>
            <Text style={styles.userPhone}>{user?.phone ?? '+234 803 456 7890'}</Text>
          </View>
          <View style={styles.vipBadge}>
            <Text style={styles.vipBadgeText}>VIP Foodie</Text>
          </View>
        </View>

        {/* ── Quick Stats Bar ── */}
        <View style={styles.statsRow}>
          <Pressable style={styles.statBox} onPress={() => router.push('/favourites')}>
            <Text style={styles.statNumber}>{favourites.size}</Text>
            <Text style={styles.statLabel}>Favourites ♥</Text>
          </Pressable>
          <View style={styles.statDivider} />
          <Pressable style={styles.statBox} onPress={() => router.push('/orders')}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </Pressable>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: ChowColors.primary }]}>₦2,500</Text>
            <Text style={styles.statLabel}>Wallet Coins</Text>
          </View>
        </View>

        {/* ── Saved Delivery Addresses ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeading}>Saved Delivery Addresses</Text>
            <Pressable onPress={() => setAddressModalVisible(true)}>
              <Text style={styles.sectionAddText}>+ Add New</Text>
            </Pressable>
          </View>

          <View style={{ gap: 10, marginTop: 8 }}>
            {user?.savedAddresses.map((addr) => {
              const isDef = user.defaultAddressId === addr.id;
              return (
                <View key={addr.id} style={styles.addressItem}>
                  <Text style={{ fontSize: 18 }}>📍</Text>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.addressTitle}>{addr.title}</Text>
                      {isDef && (
                        <View style={styles.defaultPill}>
                          <Text style={styles.defaultPillText}>DEFAULT</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.addressStreet}>{addr.street}</Text>
                    {addr.landmark ? (
                      <Text style={styles.addressLandmark}>Landmark: {addr.landmark}</Text>
                    ) : null}
                  </View>
                  {!isDef && (
                    <Pressable
                      style={styles.setDefaultBtn}
                      onPress={() => setDefaultAddress(addr.id)}>
                      <Text style={styles.setDefaultText}>Set</Text>
                    </Pressable>
                  )}
                  {user.savedAddresses.length > 1 && (
                    <Pressable onPress={() => removeAddress(addr.id)} hitSlop={8}>
                      <Text style={styles.deleteAddressText}>✕</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Preferences & Shortcuts ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Account Settings</Text>

          <View style={styles.menuList}>
            <Pressable
              style={styles.menuItem}
              onPress={() => router.push('/favourites')}>
              <Text style={styles.menuIcon}>❤️</Text>
              <Text style={styles.menuLabel}>My Favourite Dishes</Text>
              <Text style={styles.menuArrow}>›</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => router.push('/notifications')}>
              <Text style={styles.menuIcon}>🔔</Text>
              <Text style={styles.menuLabel}>Notifications & Alerts</Text>
              <Text style={styles.menuArrow}>›</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => Alert.alert('Payment Methods', 'Debit cards, USSD, and Bank Transfer managed during checkout.')}>
              <Text style={styles.menuIcon}>💳</Text>
              <Text style={styles.menuLabel}>Saved Payment Cards</Text>
              <Text style={styles.menuArrow}>›</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => Alert.alert('Customer Care', 'Need help with your food order?\nCall or WhatsApp: +234 800 2469 2469')}>
              <Text style={styles.menuIcon}>💬</Text>
              <Text style={styles.menuLabel}>Help & Live Support</Text>
              <Text style={styles.menuArrow}>›</Text>
            </Pressable>

            {/* Operational Portal Access */}
            <Pressable
              style={[styles.menuItem, { backgroundColor: '#FFF5F5' }]}
              onPress={() => {
                if (user?.role === 'admin') {
                  router.push('/admin' as any);
                } else {
                  Alert.alert(
                    'Admin Access Restricted',
                    'Your account role is customer. In development mode, you can switch roles below to inspect the Admin Dashboard.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Switch to Admin (Dev)', onPress: () => { switchRoleInDev('admin'); router.push('/admin' as any); } },
                    ]
                  );
                }
              }}>
              <Text style={styles.menuIcon}>⚡</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: ChowColors.primary, fontWeight: '700' }]}>
                  Chow Admin Dashboard
                </Text>
                <Text style={{ fontSize: 11, color: ChowColors.textSecondary }}>
                  Orders, dispatching, products, and metrics
                </Text>
              </View>
              <Text style={[styles.menuArrow, { color: ChowColors.primary }]}>›</Text>
            </Pressable>

            <Pressable
              style={[styles.menuItem, { backgroundColor: '#F0FDF4' }]}
              onPress={() => {
                if (user?.role === 'dispatch_rider' || user?.role === 'admin') {
                  router.push('/rider' as any);
                } else {
                  Alert.alert(
                    'Rider Access Restricted',
                    'Your account role is customer. In development mode, you can switch roles below to inspect the Dispatch Rider Portal.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Switch to Rider (Dev)', onPress: () => { switchRoleInDev('dispatch_rider'); router.push('/rider' as any); } },
                    ]
                  );
                }
              }}>
              <Text style={styles.menuIcon}>🛵</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: '#16A34A', fontWeight: '700' }]}>
                  Dispatch Rider Portal
                </Text>
                <Text style={{ fontSize: 11, color: ChowColors.textSecondary }}>
                  Assigned deliveries, map actions, and proof of delivery
                </Text>
              </View>
              <Text style={[styles.menuArrow, { color: '#16A34A' }]}>›</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => router.push('/login')}>
              <Text style={styles.menuIcon}>🔐</Text>
              <Text style={styles.menuLabel}>Sign In / Switch Account</Text>
              <Text style={styles.menuArrow}>›</Text>
            </Pressable>
          </View>
        </View>

        {/* ── Sign Out Button ── */}
        <Pressable
          style={styles.logoutBtn}
          onPress={() => {
            signOut();
            router.replace('/login');
          }}>
          <Text style={styles.logoutBtnText}>Sign Out of Chow</Text>
        </Pressable>

        <Text style={styles.appVersion}>Chow Native App • Version 1.0.0 (Expo SDK 57)</Text>
      </ScrollView>

      {/* ── Add Address Modal ── */}
      <Modal visible={addressModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Delivery Address</Text>

            <View style={{ gap: 12, marginTop: 14 }}>
              <View>
                <Text style={styles.inputLabel}>Label (e.g. Home, Office, Gym)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={addrTitle}
                  onChangeText={setAddrTitle}
                  placeholder="Home"
                />
              </View>

              <View>
                <Text style={styles.inputLabel}>Street & Building Address</Text>
                <TextInput
                  style={styles.modalInput}
                  value={addrStreet}
                  onChangeText={setAddrStreet}
                  placeholder="e.g. 18 Atekong Drive, Calabar"
                />
              </View>

              <View>
                <Text style={styles.inputLabel}>Landmark / Nearest Junction</Text>
                <TextInput
                  style={styles.modalInput}
                  value={addrLandmark}
                  onChangeText={setAddrLandmark}
                  placeholder="Opposite Calabar Mall"
                />
              </View>
            </View>

            <View style={styles.modalActionRow}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setAddressModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSaveBtn} onPress={handleSaveAddress}>
                <Text style={styles.modalSaveText}>Save Address</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  headerTitle: { ...Typography.headlineSm, color: ChowColors.textPrimary },
  settingsIconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 16, paddingBottom: 110 },

  // User card
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ChowColors.surface,
    borderRadius: Radius.DEFAULT,
    padding: 16,
    gap: 14,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: ChowColors.border,
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: ChowColors.secondaryLight,
    borderWidth: 2,
    borderColor: ChowColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: { ...Typography.labelLg, color: ChowColors.textPrimary, fontWeight: '700' },
  userEmail: { ...Typography.labelSm, color: ChowColors.textSecondary },
  userPhone: { fontSize: 11, color: ChowColors.textMuted },
  vipBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  vipBadgeText: { fontSize: 9, fontWeight: '700', color: '#B45309' },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: ChowColors.surface,
    borderRadius: Radius.DEFAULT,
    paddingVertical: 14,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: ChowColors.border,
  },
  statBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statDivider: { width: 1, backgroundColor: ChowColors.border },
  statNumber: { ...Typography.labelLg, color: ChowColors.textPrimary, fontWeight: '800' },
  statLabel: { fontSize: 11, color: ChowColors.textSecondary, marginTop: 2 },

  // Section card
  sectionCard: {
    backgroundColor: ChowColors.surface,
    borderRadius: Radius.DEFAULT,
    padding: 16,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: ChowColors.border,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionHeading: { ...Typography.labelLg, color: ChowColors.textPrimary },
  sectionAddText: { ...Typography.labelSm, color: ChowColors.primary, fontWeight: '700' },

  // Address
  addressItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: ChowColors.border,
  },
  addressTitle: { ...Typography.labelMd, color: ChowColors.textPrimary, fontWeight: '700' },
  defaultPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  defaultPillText: { fontSize: 8, fontWeight: '800', color: '#15803D' },
  addressStreet: { ...Typography.labelSm, color: ChowColors.textSecondary, marginTop: 2 },
  addressLandmark: { fontSize: 11, color: ChowColors.textMuted, marginTop: 1 },
  setDefaultBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: ChowColors.canvas,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  setDefaultText: { fontSize: 10, fontWeight: '600', color: ChowColors.textSecondary },
  deleteAddressText: { color: ChowColors.textMuted, fontSize: 14, paddingHorizontal: 4 },

  // Menu list
  menuList: { marginTop: 8 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: ChowColors.border,
    gap: 12,
  },
  menuIcon: { fontSize: 18 },
  menuLabel: { ...Typography.labelMd, color: ChowColors.textPrimary, flex: 1 },
  menuArrow: { fontSize: 18, color: ChowColors.textMuted },

  // Logout
  logoutBtn: {
    height: 50,
    borderRadius: Radius.DEFAULT,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtnText: { ...Typography.labelMd, color: '#DC2626', fontWeight: '700' },
  appVersion: { textAlign: 'center', fontSize: 11, color: ChowColors.textMuted, marginTop: 4 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 8,
  },
  modalTitle: { ...Typography.headlineSm, color: ChowColors.textPrimary },
  inputLabel: { ...Typography.labelSm, color: ChowColors.textSecondary, marginBottom: 4 },
  modalInput: {
    backgroundColor: ChowColors.canvas,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: ChowColors.border,
    fontSize: 13,
    color: ChowColors.textPrimary,
  },
  modalActionRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.DEFAULT,
    backgroundColor: ChowColors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: { ...Typography.labelMd, color: ChowColors.textSecondary },
  modalSaveBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.DEFAULT,
    backgroundColor: ChowColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.primaryGlow,
  },
  modalSaveText: { ...Typography.labelMd, color: '#fff', fontWeight: '700' },
});
