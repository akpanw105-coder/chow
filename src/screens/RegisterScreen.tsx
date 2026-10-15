/**
 * Register / Create Account Screen — Chow
 * Local state registration ready for Supabase Auth integration.
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
import { useAuth } from '@/store/authStore';

export default function RegisterScreen() {
  const { signUp, isLoading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  async function handleRegister() {
    if (!fullName.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      Alert.alert('Required Fields', 'Please complete all registration fields.');
      return;
    }
    const res = await signUp(fullName.trim(), email.trim(), phone.trim(), password);
    if (res.success) {
      Alert.alert('Account Created', 'Welcome to Chow South-South delicacies!', [
        { text: 'Start Ordering', onPress: () => router.replace('/(tabs)') },
      ]);
    } else {
      Alert.alert('Registration Error', res.error || 'Failed to create account.');
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
        <Text style={styles.headerTitle}>Create Account</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>

        <View style={styles.titleWrap}>
          <Text style={styles.title}>Join the Chow Family</Text>
          <Text style={styles.subtitle}>
            Order freshly prepared Calabar & Niger Delta soups, grills, and party dishes.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="e.g. Bassey Ekpenyong"
                placeholderTextColor={ChowColors.textMuted}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="bassey@chow.ng"
                placeholderTextColor={ChowColors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>📞</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+234 800 000 0000"
                placeholderTextColor={ChowColors.textMuted}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Create Password</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                placeholderTextColor={ChowColors.textMuted}
                secureTextEntry
              />
            </View>
          </View>

          <Pressable
            style={[styles.btn, isLoading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.btnText}>Agree & Register</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Already have an account?</Text>
          <Pressable onPress={() => router.push('/login')}>
            <Text style={styles.switchLink}> Sign In</Text>
          </Pressable>
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
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  titleWrap: { gap: 4, marginTop: 4 },
  title: { ...Typography.headlineMd, color: ChowColors.textPrimary },
  subtitle: { ...Typography.bodyMd, color: ChowColors.textSecondary },

  formCard: {
    backgroundColor: ChowColors.surface,
    borderRadius: Radius.DEFAULT,
    padding: 20,
    gap: 14,
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

  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  switchText: { ...Typography.bodyMd, color: ChowColors.textSecondary },
  switchLink: { ...Typography.labelMd, color: ChowColors.primary, fontWeight: '700' },
});
