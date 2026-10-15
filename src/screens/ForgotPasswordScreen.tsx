/**
 * Forgot & Reset Password Screen — Chow
 * Mock state flow for password reset ready for Supabase Auth resetPasswordForEmail.
 */
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { resetPasswordForEmail } from '@/services/auth';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset() {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    setLoading(true);
    const res = await resetPasswordForEmail(email.trim());
    setLoading(false);
    if (res.success) {
      setSent(true);
    } else {
      Alert.alert('Reset Error', res.error || 'Failed to send reset link.');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
          <Text style={{ fontSize: 20 }}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Reset Password</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        {sent ? (
          <View style={styles.successCard}>
            <Text style={{ fontSize: 44 }}>📬</Text>
            <Text style={styles.successTitle}>Check Your Inbox</Text>
            <Text style={styles.successDesc}>
              We have sent password reset instructions to <Text style={{ fontWeight: '700' }}>{email}</Text>.
            </Text>
            <Pressable
              style={styles.backToLoginBtn}
              onPress={() => router.replace('/login')}>
              <Text style={styles.backToLoginText}>Return to Sign In</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            <View style={{ gap: 6 }}>
              <Text style={styles.title}>Forgot your password?</Text>
              <Text style={styles.subtitle}>
                Enter the email address registered with your Chow account and we&apos;ll send you a recovery link.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrap}>
                <Text style={{ fontSize: 16 }}>✉️</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@chow.ng"
                  placeholderTextColor={ChowColors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <Pressable
                style={[styles.btn, loading && { opacity: 0.7 }]}
                onPress={handleReset}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.btnText}>Send Reset Link</Text>
                )}
              </Pressable>
            </View>
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
  content: { padding: 20, justifyContent: 'center', flexGrow: 1 },
  title: { ...Typography.headlineMd, color: ChowColors.textPrimary },
  subtitle: { ...Typography.bodyMd, color: ChowColors.textSecondary, lineHeight: 20 },
  card: {
    backgroundColor: ChowColors.surface,
    borderRadius: Radius.DEFAULT,
    padding: 20,
    gap: 12,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: ChowColors.border,
    marginTop: 10,
  },
  label: { ...Typography.labelSm, color: ChowColors.textPrimary, fontWeight: '700' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ChowColors.canvas,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: ChowColors.border,
    gap: 10,
  },
  input: { flex: 1, fontSize: 14, color: ChowColors.textPrimary, padding: 0 },
  btn: {
    height: 52,
    borderRadius: Radius.DEFAULT,
    backgroundColor: ChowColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.primaryGlow,
    marginTop: 6,
  },
  btnText: { ...Typography.labelLg, color: '#fff' },
  successCard: {
    alignItems: 'center',
    backgroundColor: ChowColors.surface,
    borderRadius: Radius.DEFAULT,
    padding: 28,
    gap: 12,
    ...Shadows.card,
  },
  successTitle: { ...Typography.headlineSm, color: ChowColors.textPrimary },
  successDesc: { ...Typography.bodyMd, color: ChowColors.textSecondary, textAlign: 'center', lineHeight: 20 },
  backToLoginBtn: {
    marginTop: 12,
    backgroundColor: ChowColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.full,
    ...Shadows.primaryGlow,
  },
  backToLoginText: { color: '#fff', fontWeight: '700' },
});
