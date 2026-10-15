import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ChowColors, Radius, Shadows } from '@/constants/theme';
import { formatPrice } from '@/data/foods';
import {
  AdminOrderSummary,
  assignDispatchRider,
  fetchAdminOrders,
  fetchAvailableRiders,
  subscribeToAdminOrdersRealtime,
} from '@/services/admin';

export default function AdminDispatchScreen() {
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [riders, setRiders] = useState<{ id: string; name: string; phone: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderSummary | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [allOrders, activeRiders] = await Promise.all([
        fetchAdminOrders(),
        fetchAvailableRiders(),
      ]);
      // Orders that are awaiting or actively in dispatch pipeline
      const dispatchQueue = allOrders.filter(
        (o) =>
          o.status === 'confirmed' ||
          o.status === 'preparing' ||
          o.status === 'on_the_way'
      );
      setOrders(dispatchQueue);
      setRiders(activeRiders);
    } catch (err) {
      console.error('Failed to load dispatch queue:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [allOrders, activeRiders] = await Promise.all([
          fetchAdminOrders(),
          fetchAvailableRiders(),
        ]);
        if (active) {
          const dispatchQueue = allOrders.filter(
            (o) =>
              o.status === 'confirmed' ||
              o.status === 'preparing' ||
              o.status === 'on_the_way'
          );
          setOrders(dispatchQueue);
          setRiders(activeRiders);
        }
      } catch (err) {
        console.error('Failed to load dispatch queue:', err);
      } finally {
        if (active) setLoading(false);
      }
    })();

    const unsub = subscribeToAdminOrdersRealtime(() => {
      loadData();
    });
    return () => {
      active = false;
      unsub();
    };
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleOpenAssign = (order: AdminOrderSummary) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  const handleAssignRider = async (rider: { id: string; name: string; phone: string }) => {
    if (!selectedOrder) return;
    setAssigning(true);
    try {
      const success = await assignDispatchRider(
        selectedOrder.id,
        rider.id,
        `Assigned to rider ${rider.name} via Dispatch Command Desk`
      );
      if (success) {
        Alert.alert('Assignment Successful', `Order ${selectedOrder.orderNumber} assigned to ${rider.name}.`);
        setModalVisible(false);
        setSelectedOrder(null);
        loadData();
      } else {
        Alert.alert('Assignment Failed', 'Could not assign rider. Check database permissions and rider status.');
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred during dispatch assignment.');
    } finally {
      setAssigning(false);
    }
  };

  const unassignedCount = orders.filter((o) => o.status !== 'on_the_way').length;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Overview Stat Strip */}
      <View style={styles.statsStrip}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{unassignedCount}</Text>
          <Text style={styles.statLabel}>Pending Assignment</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: ChowColors.success }]}>{riders.length}</Text>
          <Text style={styles.statLabel}>Active Fleet</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: ChowColors.primary }]}>{orders.length}</Text>
          <Text style={styles.statLabel}>Queue Total</Text>
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={20} color={ChowColors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.title}>Dispatch Command Desk</Text>
          <Text style={styles.subtitle}>Port Harcourt & South-South Logistics</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={18} color={ChowColors.textPrimary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={ChowColors.primary} />
          <Text style={styles.loadingText}>Syncing dispatch telemetry...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bicycle-outline" size={56} color={ChowColors.textMuted} />
          <Text style={styles.emptyTitle}>Dispatch Queue Clear</Text>
          <Text style={styles.emptyDesc}>No orders currently requiring rider dispatch or transit assignment.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ChowColors.primary]} />}
          renderItem={({ item }) => {
            const isAssigned = item.status === 'on_the_way';
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.orderIdGroup}>
                    <Text style={styles.orderNumber}>{item.orderNumber}</Text>
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor:
                            item.status === 'on_the_way'
                              ? `${ChowColors.success}15`
                              : `${ChowColors.amber}20`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          {
                            color:
                              item.status === 'on_the_way'
                                ? ChowColors.success
                                : ChowColors.amberStar,
                          },
                        ]}
                      >
                        {item.status.replace(/_/g, ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.price}>{formatPrice(item.totalNaira)}</Text>
                </View>

                {/* Customer & Address */}
                <View style={styles.detailRow}>
                  <Ionicons name="person-outline" size={15} color={ChowColors.textSecondary} />
                  <Text style={styles.detailText}>{item.customerName}</Text>
                  {item.recipientPhone ? (
                    <Text style={styles.phoneText}>• {item.recipientPhone}</Text>
                  ) : null}
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={15} color={ChowColors.textSecondary} />
                  <Text style={styles.detailText} numberOfLines={2}>
                    {item.deliveryAddress || 'Pick-up point / No address'}
                  </Text>
                </View>

                {/* Action Bar */}
                <View style={styles.actionBar}>
                  <Pressable
                    style={styles.viewLink}
                    onPress={() => router.push(`/admin/order/${item.id}` as any)}
                  >
                    <Text style={styles.viewLinkText}>View Order Details</Text>
                    <Ionicons name="chevron-forward" size={14} color={ChowColors.primary} />
                  </Pressable>

                  <TouchableOpacity
                    style={[styles.assignBtn, isAssigned && styles.reassignBtn]}
                    onPress={() => handleOpenAssign(item)}
                  >
                    <Text style={[styles.assignBtnText, isAssigned && styles.reassignBtnText]}>
                      {isAssigned ? 'Reassign' : 'Assign Courier'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Modal: Select Rider */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Dispatch Courier</Text>
                <Text style={styles.modalSubtitle}>Order {selectedOrder?.orderNumber}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={ChowColors.textSecondary} />
              </TouchableOpacity>
            </View>

            {assigning ? (
              <View style={styles.assigningContainer}>
                <ActivityIndicator size="large" color={ChowColors.primary} />
                <Text style={styles.assigningText}>Executing secure atomic assignment...</Text>
              </View>
            ) : riders.length === 0 ? (
              <View style={styles.noRidersBox}>
                <Ionicons name="alert-circle-outline" size={36} color={ChowColors.amberStar} />
                <Text style={styles.noRidersText}>No couriers currently active in the database.</Text>
              </View>
            ) : (
              <FlatList
                data={riders}
                keyExtractor={(r) => r.id}
                style={{ maxHeight: 360 }}
                renderItem={({ item: rider }) => (
                  <TouchableOpacity
                    style={styles.riderItem}
                    onPress={() => handleAssignRider(rider)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.riderAvatar}>
                      <Ionicons name="bicycle" size={20} color={ChowColors.primary} />
                    </View>
                    <View style={styles.riderMeta}>
                      <Text style={styles.riderName}>{rider.name}</Text>
                      <Text style={styles.riderPhone}>{rider.phone || 'Active Fleet Courier'}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={ChowColors.textMuted} />
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChowColors.canvas,
  },
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: ChowColors.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: ChowColors.border,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: ChowColors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: ChowColors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: ChowColors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: ChowColors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: ChowColors.textSecondary,
    marginTop: 2,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.circle,
    backgroundColor: ChowColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ChowColors.border,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.circle,
    backgroundColor: ChowColors.surface,
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
    marginBottom: 10,
  },
  orderIdGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: ChowColors.textPrimary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: ChowColors.textPrimary,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 5,
  },
  detailText: {
    fontSize: 13,
    color: ChowColors.textSecondary,
    flex: 1,
  },
  phoneText: {
    fontSize: 12,
    color: ChowColors.textMuted,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: ChowColors.border,
  },
  viewLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: ChowColors.primary,
  },
  assignBtn: {
    backgroundColor: ChowColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.button,
  },
  reassignBtn: {
    backgroundColor: ChowColors.secondaryLight,
  },
  assignBtnText: {
    color: ChowColors.surface,
    fontSize: 12,
    fontWeight: '700',
  },
  reassignBtnText: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: ChowColors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ChowColors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: ChowColors.textSecondary,
    marginTop: 2,
  },
  assigningContainer: {
    padding: 40,
    alignItems: 'center',
  },
  assigningText: {
    marginTop: 12,
    fontSize: 13,
    color: ChowColors.textSecondary,
  },
  noRidersBox: {
    padding: 30,
    alignItems: 'center',
  },
  noRidersText: {
    fontSize: 13,
    color: ChowColors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
  },
  riderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: ChowColors.border,
    gap: 12,
  },
  riderAvatar: {
    width: 38,
    height: 38,
    borderRadius: Radius.circle,
    backgroundColor: ChowColors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderMeta: {
    flex: 1,
  },
  riderName: {
    fontSize: 14,
    fontWeight: '700',
    color: ChowColors.textPrimary,
  },
  riderPhone: {
    fontSize: 12,
    color: ChowColors.textSecondary,
    marginTop: 2,
  },
});
