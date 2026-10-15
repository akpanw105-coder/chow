/**
 * Notifications Screen — Chow
 * Order status alerts, kitchen discounts, and system notices.
 */
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChowColors, Radius, Shadows, Typography } from '@/constants/theme';
import { ChowNotification } from '@/types';

const INITIAL_NOTIFICATIONS: ChowNotification[] = [
  {
    id: 'notif_1',
    title: 'Rider is on the way! 🛵',
    message: 'Idris has picked up your Calabar Bole & Grilled Mackerel. Estimated arrival in 15 mins.',
    timestamp: '5 mins ago',
    read: false,
    type: 'order',
  },
  {
    id: 'notif_2',
    title: 'Weekend Special: ₦1,000 Off 🍲',
    message: 'Use promo code BITE1000 on all traditional soup platters this weekend.',
    timestamp: '2 hours ago',
    read: false,
    type: 'promo',
  },
  {
    id: 'notif_3',
    title: 'Order CHOW-7614 Delivered 🎉',
    message: 'Your Afang Soup & Swallow order was delivered. How was the meal? Leave a review!',
    timestamp: 'Yesterday',
    read: true,
    type: 'order',
  },
  {
    id: 'notif_4',
    title: 'Welcome to Chow South-South! 👑',
    message: 'Explore premium Calabar and Niger Delta cuisines crafted with authenticity.',
    timestamp: '3 days ago',
    read: true,
    type: 'system',
  },
];

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<ChowNotification[]>(INITIAL_NOTIFICATIONS);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
          <Text style={{ fontSize: 20 }}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Pressable onPress={markAllRead}>
          <Text style={styles.markReadText}>Read All</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={{ gap: 12 }}>
          {notifications.map((n) => {
            const iconMap = {
              order: '🛵',
              promo: '🏷️',
              system: '📢',
            };

            return (
              <View
                key={n.id}
                style={[styles.card, !n.read && styles.cardUnread]}>
                <View style={styles.iconCircle}>
                  <Text style={{ fontSize: 18 }}>{iconMap[n.type]}</Text>
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.title}>{n.title}</Text>
                    <Text style={styles.time}>{n.timestamp}</Text>
                  </View>
                  <Text style={styles.message}>{n.message}</Text>
                </View>
                {!n.read && <View style={styles.unreadDot} />}
              </View>
            );
          })}
        </View>
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
  markReadText: { ...Typography.labelSm, color: ChowColors.primary, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 60 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: ChowColors.surface,
    borderRadius: Radius.DEFAULT,
    padding: 14,
    gap: 12,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: ChowColors.border,
    position: 'relative',
  },
  cardUnread: {
    borderColor: ChowColors.secondary,
    backgroundColor: '#FFFBF9',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ChowColors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...Typography.labelMd, color: ChowColors.textPrimary, fontWeight: '700', flex: 1, marginRight: 8 },
  time: { fontSize: 10, color: ChowColors.textMuted },
  message: { ...Typography.bodyMd, color: ChowColors.textSecondary, lineHeight: 18 },
  unreadDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ChowColors.primary,
  },
});
