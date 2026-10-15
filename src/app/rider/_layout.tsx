import { Stack } from 'expo-router';
import React from 'react';
import { ChowColors } from '@/constants/theme';

export default function RiderLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: ChowColors.canvas },
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="deliveries" />
      <Stack.Screen name="delivery/[id]" />
      <Stack.Screen name="history" />
    </Stack>
  );
}
