import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ChowColors, Radius, Shadows } from '@/constants/theme';
import {
  fetchRiderDeliveryHistory,
  RiderDelivery,
  subscribeToRiderDeliveriesRealtime,
} from '@/services/rider';
import { useAuth } from '@/store/authStore';

export default function RiderHistoryScreen() {
  const { user } = useAuth();
  const riderId = user?.id || 'usr_calabar_001';

  const [history, setHistory] = useState<RiderDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const data = await fetchRiderDeliveryHistory(riderId);
      setHistory(data);
    } catch (err) {
      console.error('Failed to load rider history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [riderId]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchRiderDeliveryHistory(riderId);
        if (active) setHistory(data);
      } catch (err) {
        console.error('Failed to load rider history:', err);
      } finally {
        if (active) setLoading(false);
      }
    })();

    const unsubscribe = subscribeToRiderDeliveriesRealtime(riderId, () => {
      loadHistory();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [loadHistory, riderId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={20} color={ChowColors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.title}>Delivery Trip History</Text>
          <Text style={styles.subtitle}>{history.length} completed & archived assignments</Text>
        </View>
        <TouchableOpacity style={styles.headerRefreshBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={18} color={ChowColors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Historical Summary Banner */}
      <View style={styles.summaryCard}>
        <View style={styles.statItem}>
          <Text style={styles.statVal}>{history.length}</Text>
          <Text style={styles.statSub}>Total Delivery Trips</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={[styles.statVal, { color: ChowColors.success }]}>
            {history.filter((h) => h.orderStatus === 'delivered').length}
          </Text>
          <Text style={styles.statSub}>Completed Deliveries</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={ChowColors.primary} />
          <Text style={styles.loadingText}>Fetching delivery records...</Text>
        </View>
      ) : history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={54} color={ChowColors.textMuted} />
          <Text style={styles.emptyTitle}>No Completed Deliveries</Text>
          <Text style={styles.emptyDesc}>Deliveries you complete will appear here with delivery timestamps and receipts.</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.assignmentId}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ChowColors.primary]} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => router.push(`/rider/delivery/${item.orderId}` as any)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.orderBadge}>
                  <Text style={styles.orderId}>{item.orderNumber}</Text>
                </View>
                <View style={styles.deliveredBadge}>
                  <Ionicons name="checkmark-done" size={14} color={ChowColors.success} />
                  <Text style={styles.deliveredBadgeText}>
                    {item.orderStatus.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.destinationText} numberOfLines={1}>
                {item.deliveryAddress || 'Delivery destination'}
              </Text>

              <View style={styles.footerRow}>
                <Text style={styles.dateText}>
                  {new Date(item.assignedAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}{' '}
                  •{' '}
                  {new Date(item.assignedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                <Text style={styles.restaurantText}>{item.restaurantName}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChowColors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: ChowColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: ChowColors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.circle,
    backgroundColor: ChowColors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ChowColors.border,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: ChowColors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: ChowColors.textSecondary,
    marginTop: 2,
  },
  headerRefreshBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.circle,
    backgroundColor: ChowColors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ChowColors.border,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: ChowColors.surface,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: ChowColors.border,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 22,
    fontWeight: '800',
    color: ChowColors.textPrimary,
  },
  statSub: {
    fontSize: 11,
    fontWeight: '500',
    color: ChowColors.textSecondary,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: ChowColors.border,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: ChowColors.surface,
    borderRadius: Radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: ChowColors.border,
    ...Shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderBadge: {
    backgroundColor: ChowColors.canvas,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: ChowColors.border,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '800',
    color: ChowColors.textPrimary,
  },
  deliveredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${ChowColors.success}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 4,
  },
  deliveredBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: ChowColors.success,
  },
  destinationText: {
    fontSize: 14,
    fontWeight: '600',
    color: ChowColors.textPrimary,
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: ChowColors.border,
  },
  dateText: {
    fontSize: 12,
    color: ChowColors.textSecondary,
  },
  restaurantText: {
    fontSize: 12,
    fontWeight: '600',
    color: ChowColors.primary,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 13,
    color: ChowColors.textSecondary,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: ChowColors.textPrimary,
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 13,
    color: ChowColors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
