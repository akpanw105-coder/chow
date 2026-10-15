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
  fetchRiderDeliveries,
  RiderDelivery,
  subscribeToRiderDeliveriesRealtime,
} from '@/services/rider';
import { useAuth } from '@/store/authStore';

export default function RiderDeliveriesScreen() {
  const { user } = useAuth();
  const riderId = user?.id || 'usr_calabar_001';

  const [deliveries, setDeliveries] = useState<RiderDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDeliveries = useCallback(async () => {
    try {
      const data = await fetchRiderDeliveries(riderId);
      setDeliveries(data);
    } catch (err) {
      console.error('Failed to load rider deliveries:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [riderId]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchRiderDeliveries(riderId);
        if (active) setDeliveries(data);
      } catch (err) {
        console.error('Failed to load rider deliveries:', err);
      } finally {
        if (active) setLoading(false);
      }
    })();

    const unsubscribe = subscribeToRiderDeliveriesRealtime(riderId, () => {
      loadDeliveries();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [loadDeliveries, riderId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDeliveries();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready_for_pickup':
        return ChowColors.amberStar;
      case 'assigned':
      case 'on_the_way':
        return ChowColors.primary;
      case 'delivered':
        return ChowColors.success;
      default:
        return ChowColors.textSecondary;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={20} color={ChowColors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.title}>Assigned Deliveries</Text>
          <Text style={styles.subtitle}>{deliveries.length} active delivery trips</Text>
        </View>
        <TouchableOpacity style={styles.headerRefreshBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={18} color={ChowColors.textPrimary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={ChowColors.primary} />
          <Text style={styles.loadingText}>Syncing assigned deliveries...</Text>
        </View>
      ) : deliveries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={54} color={ChowColors.textMuted} />
          <Text style={styles.emptyTitle}>No Active Deliveries</Text>
          <Text style={styles.emptyDesc}>
            All assigned deliveries have been completed or no deliveries are currently assigned to you.
          </Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <Ionicons name="refresh" size={16} color={ChowColors.primary} />
            <Text style={styles.refreshBtnText}>Check Queue</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={deliveries}
          keyExtractor={(item) => item.assignmentId}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ChowColors.primary]} />}
          renderItem={({ item }) => {
            const statusColor = getStatusColor(item.orderStatus);
            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => router.push(`/rider/delivery/${item.orderId}` as any)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.orderBadge}>
                    <Text style={styles.orderId}>{item.orderNumber}</Text>
                  </View>
                  <View style={[styles.statusTag, { backgroundColor: `${statusColor}15` }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {item.orderStatus.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Destination */}
                <View style={styles.infoRow}>
                  <Ionicons name="location-sharp" size={18} color={ChowColors.primary} />
                  <Text style={styles.addressText} numberOfLines={2}>
                    {item.deliveryAddress || 'Customer pick up / No address'}
                  </Text>
                </View>

                {item.recipientPhone ? (
                  <View style={styles.infoRow}>
                    <Ionicons name="call-outline" size={16} color={ChowColors.textSecondary} />
                    <Text style={styles.subText}>Contact: {item.recipientPhone}</Text>
                  </View>
                ) : null}

                {/* Card Action Footer */}
                <View style={styles.footerRow}>
                  <Text style={styles.timeText}>
                    Assigned:{' '}
                    {new Date(item.assignedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  <View style={styles.viewAction}>
                    <Text style={styles.actionText}>Open Delivery</Text>
                    <Ionicons name="chevron-forward" size={16} color={ChowColors.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
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
    marginBottom: 12,
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
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    fontWeight: '600',
    color: ChowColors.textPrimary,
    flex: 1,
    lineHeight: 18,
  },
  subText: {
    fontSize: 13,
    color: ChowColors.textSecondary,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: ChowColors.border,
    marginTop: 4,
  },
  timeText: {
    fontSize: 11,
    color: ChowColors.textMuted,
  },
  viewAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
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
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: ChowColors.secondaryLight,
    borderRadius: Radius.button,
  },
  refreshBtnText: {
    color: ChowColors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
});
