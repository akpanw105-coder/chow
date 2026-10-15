/**
 * Offline & Error State Screen — Chow
 * Uses the authentic Stitch export no_internet_illustration.
 */
import { router } from 'expo-router';
import React from 'react';
import {
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChowColors, Radius, Shadows, Typography } from '@/constants/theme';

export default function OfflineScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        <Image
          source={require('@/assets/images/illustrations/no_internet.png')}
          style={styles.image}
          resizeMode="contain"
        />
        <Text style={styles.title}>No Internet Connection</Text>
        <Text style={styles.subtitle}>
          Please check your mobile data or Wi-Fi settings to connect to Chow and place your culinary order.
        </Text>
        <Pressable style={styles.btn} onPress={() => router.replace('/')}>
          <Text style={styles.btnText}>Try Again ↻</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ChowColors.canvas },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 14,
  },
  image: { width: 220, height: 180 },
  title: { ...Typography.headlineMd, color: ChowColors.textPrimary, textAlign: 'center' },
  subtitle: { ...Typography.bodyMd, color: ChowColors.textSecondary, textAlign: 'center', lineHeight: 20 },
  btn: {
    marginTop: 14,
    backgroundColor: ChowColors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: Radius.full,
    ...Shadows.primaryGlow,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
