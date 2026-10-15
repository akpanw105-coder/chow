import { router, Stack, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';

import { ChowColors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/store/authStore';
import { CartProvider } from '@/store/cartStore';
import { FavouritesProvider } from '@/store/favouritesStore';
import { OrdersProvider } from '@/store/ordersStore';

SplashScreen.preventAutoHideAsync().catch(() => {});

// ── Protected route segments that require authentication ─────────────────────
const PROTECTED_SEGMENTS = ['(tabs)', 'checkout', 'order-success', 'order-track', 'admin', 'rider'];
// ── Auth-only segments (redirect away if already authed) ─────────────────────
const AUTH_ONLY_SEGMENTS = ['login', 'register'];

/**
 * Route guard: watches auth state, role, and segments, redirects appropriately.
 * Must be rendered inside <AuthProvider> so it can call useAuth().
 */
function AuthGuard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    // Wait until auth state is resolved before making routing decisions
    if (isLoading) return;

    const currentSegment = segments[0] as string | undefined;
    const inProtected = currentSegment ? PROTECTED_SEGMENTS.includes(currentSegment) : false;
    const inAuthOnly = currentSegment ? AUTH_ONLY_SEGMENTS.includes(currentSegment) : false;

    if (!isAuthenticated && inProtected) {
      // Unauthenticated user trying to access protected area → send to login
      router.replace('/login');
      return;
    }

    if (isAuthenticated && inAuthOnly) {
      // Already authenticated user visiting login/register → send to main app
      router.replace('/(tabs)');
      return;
    }

    // Role-based route guard
    if (isAuthenticated && currentSegment === 'admin') {
      const role = user?.role || 'customer';
      if (role !== 'admin') {
        router.replace('/(tabs)');
        return;
      }
    }

    if (isAuthenticated && currentSegment === 'rider') {
      const role = user?.role || 'customer';
      if (role !== 'dispatch_rider' && role !== 'admin') {
        router.replace('/(tabs)');
        return;
      }
    }
  }, [isAuthenticated, isLoading, segments, user?.role]);

  return null;
}

export default function RootLayout() {
  useEffect(() => {
    // Hide native splash screen once UI mounts
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <AuthProvider>
      <FavouritesProvider>
        <CartProvider>
          <OrdersProvider>
            <StatusBar barStyle="dark-content" backgroundColor={ChowColors.canvas} />
            {/* Route guard must live inside providers so it can access auth state */}
            <AuthGuard />
            <View style={styles.webOuter}>
              <View style={styles.webContainer}>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: ChowColors.canvas },
                    animation: 'slide_from_right',
                  }}>
                  {/* Main Tabs Group */}
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

                  {/* Food & Cart Flows */}
                  <Stack.Screen name="food/[id]" options={{ headerShown: false }} />
                  <Stack.Screen name="cart" options={{ headerShown: false }} />
                  <Stack.Screen name="checkout" options={{ headerShown: false }} />
                  <Stack.Screen name="order-success" options={{ headerShown: false, gestureEnabled: false }} />
                  <Stack.Screen name="order-track" options={{ headerShown: false }} />

                  {/* Operational Portals */}
                  <Stack.Screen name="admin" options={{ headerShown: false }} />
                  <Stack.Screen name="rider" options={{ headerShown: false }} />

                  {/* User Shortcuts */}
                  <Stack.Screen name="favourites" options={{ headerShown: false }} />
                  <Stack.Screen name="notifications" options={{ headerShown: false }} />

                  {/* Authentication Flows */}
                  <Stack.Screen name="login" options={{ headerShown: false }} />
                  <Stack.Screen name="register" options={{ headerShown: false }} />
                  <Stack.Screen name="forgot-password" options={{ headerShown: false }} />

                  {/* System Screens */}
                  <Stack.Screen name="offline" options={{ headerShown: false }} />
                </Stack>
              </View>
            </View>
          </OrdersProvider>
        </CartProvider>
      </FavouritesProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  webOuter: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  webContainer: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 820 : undefined,
    alignSelf: 'center',
    backgroundColor: ChowColors.canvas,
    overflow: 'hidden',
  },
});
