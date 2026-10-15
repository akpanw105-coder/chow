import { Stack } from 'expo-router';
import React from 'react';
import { ChowColors } from '@/constants/theme';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: ChowColors.canvas },
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="order/[id]" />
      <Stack.Screen name="dispatch" />
      <Stack.Screen name="menu" />
      <Stack.Screen name="customers" />
    </Stack>
  );
}
