/**
 * Login Screen — Chow
 * Clean authentication interface ready for future Supabase Auth integration.
 * Features: email/password validation, demo quick login, password recovery link,
 * and switch to register.
 */
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useAuth } from '@/store/authStore';

export default function LoginScreen() {
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState('bassey.ekpenyong@chow.ng');
  const [password, setPassword] = useState('Password123!');
  const [showPass, setShowPass] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required Fields', 'Please enter your email and password.');
      return;
    }
    const res = await signIn(email.trim(), password);
    if (res.success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Login Error', res.error || 'Invalid credentials.');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>

        {/* ── Brand Header ── */}
        <View style={styles.brandSection}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome Back to Chow</Text>
          <Text style={styles.subtitle}>
            Order Calabar & South-South culinary delicacies delivered fast.
          </Text>
        </View>

        {/* ── Form Card ── */}
        <View style={styles.formCard}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>✉️</Text>
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
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={ChowColors.textMuted}
                secureTextEntry={!showPass}
              />
              <Pressable onPress={() => setShowPass(!showPass)} hitSlop={10}>
                <Text style={styles.eyeIcon}>{showPass ? '👁️' : '🙈'}</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.forgotRow}>
            <Pressable onPress={() => router.push('/forgot-password')}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>
          </View>

          <Pressable
            style={[styles.loginBtn, isLoading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </Pressable>
        </View>

        {/* ── Switch to Register ── */}
        <View style={styles.registerPrompt}>
          <Text style={styles.promptText}>Don&apos;t have an account?</Text>
          <Pressable onPress={() => router.push('/register')}>
            <Text style={styles.registerLink}> Create Account</Text>
          </Pressable>
        </View>

        {/* ── Guest Browse ── */}
        <Pressable style={styles.guestBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.guestBtnText}>Continue as Guest →</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ChowColors.canvas },
  content: {
    padding: 24,
    justifyContent: 'center',
    flexGrow: 1,
    gap: 20,
  },
  brandSection: { alignItems: 'center', gap: 8, marginTop: 16 },
  logoImage: { width: 80, height: 80, borderRadius: 20 },
  title: { ...Typography.headlineLg, color: ChowColors.textPrimary, textAlign: 'center' },
  subtitle: { ...Typography.bodyMd, color: ChowColors.textSecondary, textAlign: 'center', paddingHorizontal: 16 },

  formCard: {
    backgroundColor: ChowColors.surface,
    borderRadius: Radius.DEFAULT,
    padding: 20,
    gap: 16,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: ChowColors.border,
  },
  fieldGroup: { gap: 6 },
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
  inputIcon: { fontSize: 16 },
  input: { flex: 1, fontSize: 14, color: ChowColors.textPrimary, padding: 0 },
  eyeIcon: { fontSize: 16 },
  forgotRow: { alignItems: 'flex-end' },
  forgotText: { ...Typography.labelSm, color: ChowColors.primary, fontWeight: '600' },
  loginBtn: {
    height: 52,
    borderRadius: Radius.DEFAULT,
    backgroundColor: ChowColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.primaryGlow,
    marginTop: 4,
  },
  loginBtnText: { ...Typography.labelLg, color: '#fff' },

  registerPrompt: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  promptText: { ...Typography.bodyMd, color: ChowColors.textSecondary },
  registerLink: { ...Typography.labelMd, color: ChowColors.primary, fontWeight: '700' },
  guestBtn: { alignItems: 'center', paddingVertical: 10 },
  guestBtnText: { ...Typography.labelSm, color: ChowColors.textMuted },
});
