import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ChowColors, Radius, Shadows } from '@/constants/theme';
import {
  fetchRiderDeliveries,
  fetchRiderDeliveryHistory,
  RiderDelivery,
  setRiderAvailability,
  subscribeToRiderDeliveriesRealtime,
} from '@/services/rider';
import { useAuth } from '@/store/authStore';

export default function RiderHomeScreen() {
  const { user } = useAuth();
  const riderId = user?.id || 'usr_calabar_001';

  const [activeDeliveries, setActiveDeliveries] = useState<RiderDelivery[]>([]);
  const [history, setHistory] = useState<RiderDelivery[]>([]);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadRiderData = useCallback(async () => {
    try {
      const [deliveries, pastDeliveries] = await Promise.all([
        fetchRiderDeliveries(riderId),
        fetchRiderDeliveryHistory(riderId),
      ]);
      setActiveDeliveries(deliveries);
      setHistory(pastDeliveries);
    } catch (err) {
      console.error('Failed to load rider home data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [riderId]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [deliveries, pastDeliveries] = await Promise.all([
          fetchRiderDeliveries(riderId),
          fetchRiderDeliveryHistory(riderId),
        ]);
        if (active) {
          setActiveDeliveries(deliveries);
          setHistory(pastDeliveries);
        }
      } catch (err) {
        console.error('Failed to load rider home data:', err);
      } finally {
        if (active) setLoading(false);
      }
    })();

    const unsubscribe = subscribeToRiderDeliveriesRealtime(riderId, () => {
      loadRiderData();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [loadRiderData, riderId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRiderData();
  };

  const handleToggleAvailability = async (val: boolean) => {
    setUpdatingStatus(true);
    setIsAvailable(val);
    try {
      const success = await setRiderAvailability(riderId, val);
      if (!success) {
        setIsAvailable(!val);
        Alert.alert('Status Error', 'Failed to update availability status on server.');
      }
    } catch {
      setIsAvailable(!val);
      Alert.alert('Status Error', 'Could not sync availability status with server.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const currentDelivery = activeDeliveries[0];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ChowColors.primary]} />}
      >
        {/* Header Rider Status Banner */}
        <View style={styles.riderBanner}>
          <View style={styles.riderInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={styles.greeting}>Welcome back,</Text>
              <TouchableOpacity
                style={styles.exitBtn}
                onPress={() => router.replace('/(tabs)')}
                hitSlop={8}>
                <Text style={styles.exitBtnText}>Exit to App →</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.riderName}>{user?.fullName || 'Dispatch Courier'}</Text>
            <Text style={styles.zoneTag}>Port Harcourt Delivery Zone</Text>
          </View>

          <View style={styles.availabilityBox}>
            <Text style={[styles.statusLabel, { color: isAvailable ? ChowColors.success : ChowColors.textMuted }]}>
              {isAvailable ? 'ONLINE' : 'OFFLINE'}
            </Text>
            <Switch
              value={isAvailable}
              onValueChange={handleToggleAvailability}
              disabled={updatingStatus}
              trackColor={{ false: ChowColors.border, true: `${ChowColors.success}80` }}
              thumbColor={isAvailable ? ChowColors.success : ChowColors.surface}
            />
          </View>
        </View>

        {/* Quick Shift Summary Cards */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <View style={[styles.iconCircle, { backgroundColor: ChowColors.secondaryLight }]}>
              <Ionicons name="bicycle" size={20} color={ChowColors.primary} />
            </View>
            <Text style={styles.metricVal}>{activeDeliveries.length}</Text>
            <Text style={styles.metricLabel}>Active Deliveries</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.iconCircle, { backgroundColor: `${ChowColors.success}15` }]}>
              <Ionicons name="checkmark-done" size={20} color={ChowColors.success} />
            </View>
            <Text style={[styles.metricVal, { color: ChowColors.success }]}>{history.length}</Text>
            <Text style={styles.metricLabel}>Completed Trips</Text>
          </View>
        </View>

        {/* Current Urgent Delivery Banner */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Current Assignment</Text>
          <TouchableOpacity onPress={() => router.push('/rider/deliveries' as any)}>
            <Text style={styles.seeAllText}>View All ({activeDeliveries.length})</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={ChowColors.primary} />
            <Text style={styles.loadingSub}>Checking dispatch queue...</Text>
          </View>
        ) : currentDelivery ? (
          <View style={styles.activeDeliveryCard}>
            <View style={styles.urgentHeader}>
              <View style={styles.orderBadge}>
                <Ionicons name="radio" size={12} color={ChowColors.surface} />
                <Text style={styles.orderBadgeText}>IN PROGRESS</Text>
              </View>
              <Text style={styles.orderNum}>{currentDelivery.orderNumber}</Text>
            </View>

            <View style={styles.addressBlock}>
              <Ionicons name="location" size={22} color={ChowColors.primary} />
              <View style={styles.addressInfo}>
                <Text style={styles.addressTitle}>Destination Address</Text>
                <Text style={styles.addressText} numberOfLines={2}>
                  {currentDelivery.deliveryAddress || 'Customer pick up location'}
                </Text>
              </View>
            </View>

            {currentDelivery.recipientPhone ? (
              <View style={styles.phoneBlock}>
                <Ionicons name="call" size={16} color={ChowColors.textSecondary} />
                <Text style={styles.phoneText}>Recipient: {currentDelivery.recipientPhone}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.openTripBtn}
              onPress={() => router.push(`/rider/delivery/${currentDelivery.orderId}` as any)}
            >
              <Text style={styles.openTripBtnText}>Open Delivery Terminal</Text>
              <Ionicons name="arrow-forward" size={18} color={ChowColors.surface} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.idleCard}>
            <Ionicons name="cafe-outline" size={44} color={ChowColors.textMuted} />
            <Text style={styles.idleTitle}>No Active Deliveries</Text>
            <Text style={styles.idleSub}>
              {isAvailable
                ? "You're online! New dispatch assignments will appear here instantly."
                : 'You are currently offline. Toggle online to receive new food delivery assignments.'}
            </Text>
          </View>
        )}

        {/* Quick Actions Navigation */}
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionTile}
            onPress={() => router.push('/rider/deliveries' as any)}
          >
            <Ionicons name="list" size={24} color={ChowColors.primary} />
            <Text style={styles.actionTileTitle}>All Deliveries</Text>
            <Text style={styles.actionTileSub}>View queue & pending pickups</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionTile}
            onPress={() => router.push('/rider/history' as any)}
          >
            <Ionicons name="time" size={24} color={ChowColors.textPrimary} />
            <Text style={styles.actionTileTitle}>Trip History</Text>
            <Text style={styles.actionTileSub}>Past completed deliveries</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChowColors.canvas,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  riderBanner: {
    backgroundColor: ChowColors.surface,
    borderRadius: Radius.card,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ChowColors.border,
    marginBottom: 16,
    ...Shadows.card,
  },
  riderInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 12,
    color: ChowColors.textSecondary,
    fontWeight: '500',
  },
  exitBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: ChowColors.canvas,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: ChowColors.border,
  },
  exitBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: ChowColors.primary,
  },
  riderName: {
    fontSize: 18,
    fontWeight: '800',
    color: ChowColors.textPrimary,
    marginTop: 2,
  },
  zoneTag: {
    fontSize: 11,
    fontWeight: '600',
    color: ChowColors.primary,
    marginTop: 4,
  },
  availabilityBox: {
    alignItems: 'center',
    gap: 4,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: ChowColors.surface,
    borderRadius: Radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: ChowColors.border,
    ...Shadows.card,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: Radius.circle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  metricVal: {
    fontSize: 24,
    fontWeight: '800',
    color: ChowColors.textPrimary,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: ChowColors.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ChowColors.textPrimary,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: ChowColors.primary,
  },
  activeDeliveryCard: {
    backgroundColor: ChowColors.surface,
    borderRadius: Radius.card,
    padding: 18,
    borderWidth: 1.5,
    borderColor: ChowColors.primary,
    marginBottom: 20,
    ...Shadows.card,
  },
  urgentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  orderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ChowColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 5,
  },
  orderBadgeText: {
    color: ChowColors.surface,
    fontSize: 10,
    fontWeight: '800',
  },
  orderNum: {
    fontSize: 16,
    fontWeight: '800',
    color: ChowColors.textPrimary,
  },
  addressBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  addressInfo: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: ChowColors.textSecondary,
    textTransform: 'uppercase',
  },
  addressText: {
    fontSize: 14,
    fontWeight: '600',
    color: ChowColors.textPrimary,
    marginTop: 2,
  },
  phoneBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  phoneText: {
    fontSize: 13,
    color: ChowColors.textSecondary,
  },
  openTripBtn: {
    flexDirection: 'row',
    backgroundColor: ChowColors.primary,
    height: 48,
    borderRadius: Radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  openTripBtnText: {
    color: ChowColors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  idleCard: {
    backgroundColor: ChowColors.surface,
    borderRadius: Radius.card,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ChowColors.border,
    marginBottom: 20,
  },
  idleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ChowColors.textPrimary,
    marginTop: 12,
  },
  idleSub: {
    fontSize: 13,
    color: ChowColors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionTile: {
    flex: 1,
    backgroundColor: ChowColors.surface,
    borderRadius: Radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: ChowColors.border,
    ...Shadows.card,
  },
  actionTileTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: ChowColors.textPrimary,
    marginTop: 10,
  },
  actionTileSub: {
    fontSize: 11,
    color: ChowColors.textSecondary,
    marginTop: 2,
  },
  loadingBox: {
    padding: 24,
    alignItems: 'center',
  },
  loadingSub: {
    fontSize: 12,
    color: ChowColors.textSecondary,
    marginTop: 8,
  },
});
