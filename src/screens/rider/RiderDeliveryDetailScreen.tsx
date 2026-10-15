import { router } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ChowColors, Radius, Shadows } from '@/constants/theme';
import { formatPrice } from '@/data/foods';
import {
  fetchRiderDeliveryDetail,
  RiderDeliveryDetail,
} from '@/services/rider';
import { updateOrderStatus } from '@/services/orders';
import { useAuth } from '@/store/authStore';
import { OrderStatus } from '@/types';

interface Props {
  orderId: string;
}

export default function RiderDeliveryDetailScreen({ orderId }: Props) {
  const { user } = useAuth();
  const riderId = user?.id || 'usr_calabar_001';

  const [delivery, setDelivery] = useState<RiderDeliveryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const loadDetail = useCallback(async () => {
    try {
      const data = await fetchRiderDeliveryDetail(orderId, riderId);
      setDelivery(data);
    } catch (err) {
      console.error('Failed to load delivery detail:', err);
    } finally {
      setLoading(false);
    }
  }, [orderId, riderId]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchRiderDeliveryDetail(orderId, riderId);
        if (active) setDelivery(data);
      } catch (err) {
        console.error('Failed to load delivery detail:', err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [orderId, riderId]);

  const handleOpenMaps = () => {
    if (!delivery?.deliveryAddress) {
      Alert.alert('Address Missing', 'No delivery address recorded for this order.');
      return;
    }
    const query = encodeURIComponent(delivery.deliveryAddress);
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });
    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Navigation Error', 'Could not open map application.');
      });
    }
  };

  const handleCallCustomer = () => {
    if (!delivery?.recipientPhone) {
      Alert.alert('Phone Missing', 'No customer phone number available.');
      return;
    }
    Linking.openURL(`tel:${delivery.recipientPhone}`).catch(() => {
      Alert.alert('Dialer Error', 'Could not trigger phone dialer.');
    });
  };

  const handleAdvanceStatus = async (nextStatus: OrderStatus) => {
    const actionLabel =
      nextStatus === 'on_the_way'
        ? 'Confirm Food Picked Up from Kitchen & Head Out'
        : 'Confirm Order Delivered to Customer';

    Alert.alert('Confirm Status Change', `${actionLabel}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          setUpdating(true);
          try {
            const success = await updateOrderStatus(
              orderId,
              nextStatus,
              `Rider transition to ${nextStatus}`
            );
            if (success) {
              Alert.alert('Updated', `Delivery status transitioned to ${nextStatus.replace(/_/g, ' ')}.`);
              loadDetail();
            } else {
              Alert.alert('Action Failed', 'Status update was rejected by the database.');
            }
          } catch {
            Alert.alert('Error', 'An unexpected error occurred.');
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={ChowColors.primary} />
        <Text style={styles.loadingText}>Loading delivery telemetry...</Text>
      </View>
    );
  }

  if (!delivery) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={54} color={ChowColors.amberStar} />
        <Text style={styles.errorTitle}>Delivery Record Not Found</Text>
        <Text style={styles.errorSub}>This delivery may belong to another courier or was cancelled.</Text>
      </View>
    );
  }

  const isCOD = delivery.paymentMethod === 'cash_on_delivery';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Spotlight Banner */}
        <View style={styles.spotlightBanner}>
          <View style={styles.spotlightTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => router.back()}
                hitSlop={10}>
                <Ionicons name="arrow-back" size={20} color={ChowColors.surface} />
              </TouchableOpacity>
              <Text style={styles.orderIdHeader}>{delivery.orderNumber}</Text>
            </View>
            <View style={styles.currentStatusBadge}>
              <Text style={styles.currentStatusText}>
                {delivery.orderStatus.replace(/_/g, ' ').toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.totalAmountText}>{formatPrice(delivery.totalNaira)}</Text>
          <Text style={styles.payStatusText}>
            Payment: {delivery.paymentMethod?.replace(/_/g, ' ').toUpperCase() || 'ONLINE'} (
            {delivery.paymentStatus?.toUpperCase() || 'PAID'})
          </Text>
        </View>

        {/* COD Warning Box if Applicable */}
        {isCOD && (
          <View style={styles.codCard}>
            <Ionicons name="cash" size={24} color={ChowColors.amberStar} />
            <View style={styles.codTextGroup}>
              <Text style={styles.codTitle}>Cash on Delivery Required</Text>
              <Text style={styles.codDesc}>
                Collect exactly {formatPrice(delivery.totalNaira)} in physical cash before handing over package.
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons: Phone & Navigation */}
        <View style={styles.commsGrid}>
          <TouchableOpacity style={styles.navButton} onPress={handleOpenMaps}>
            <Ionicons name="navigate" size={22} color={ChowColors.surface} />
            <Text style={styles.navBtnText}>Open GPS Navigation</Text>
          </TouchableOpacity>

          {delivery.recipientPhone ? (
            <TouchableOpacity style={styles.callButton} onPress={handleCallCustomer}>
              <Ionicons name="call" size={22} color={ChowColors.primary} />
              <Text style={styles.callBtnText}>Call Customer</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Location & Instructions Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Delivery Destination</Text>
          <View style={styles.addressRow}>
            <Ionicons name="location-sharp" size={22} color={ChowColors.primary} />
            <Text style={styles.destinationAddress}>
              {delivery.deliveryAddress || 'Customer pick up / No address'}
            </Text>
          </View>

          {delivery.customerNotes ? (
            <View style={styles.instructionsBox}>
              <Text style={styles.instructionsTitle}>Customer Note:</Text>
              <Text style={styles.instructionsText}>{delivery.customerNotes}</Text>
            </View>
          ) : null}
        </View>

        {/* Order Items Preview */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Order Contents</Text>
          {delivery.items && delivery.items.length > 0 ? (
            delivery.items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View style={styles.qtyBox}>
                  <Text style={styles.qtyText}>{item.quantity}x</Text>
                </View>
                <View style={styles.itemMeta}>
                  <Text style={styles.itemName}>{item.productName}</Text>
                </View>
                <Text style={styles.itemPrice}>{formatPrice(item.lineTotalNaira)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noItemsText}>Food package prepared & sealed by kitchen.</Text>
          )}
        </View>

        {/* Lifecycle Progression Action Hub */}
        <View style={styles.lifecycleCard}>
          <Text style={styles.cardSectionTitle}>Next Operational Step</Text>

          {delivery.orderStatus === 'confirmed' || delivery.orderStatus === 'preparing' ? (
            <TouchableOpacity
              style={[styles.stepBtn, { backgroundColor: ChowColors.primary }]}
              onPress={() => handleAdvanceStatus('on_the_way')}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color={ChowColors.surface} />
              ) : (
                <>
                  <Ionicons name="bicycle" size={20} color={ChowColors.surface} />
                  <Text style={styles.stepBtnText}>Confirm Pickup & Start Delivery</Text>
                </>
              )}
            </TouchableOpacity>
          ) : delivery.orderStatus === 'on_the_way' ? (
            <TouchableOpacity
              style={[styles.stepBtn, { backgroundColor: ChowColors.success }]}
              onPress={() => handleAdvanceStatus('delivered')}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color={ChowColors.surface} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color={ChowColors.surface} />
                  <Text style={styles.stepBtnText}>Confirm Package Delivered to Customer</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.deliveredNotice}>
              <Ionicons name="checkmark-done-circle" size={32} color={ChowColors.success} />
              <Text style={styles.deliveredNoticeText}>This delivery is completed.</Text>
            </View>
          )}
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
    paddingBottom: 40,
  },
  spotlightBanner: {
    backgroundColor: ChowColors.textPrimary,
    borderRadius: Radius.card,
    padding: 20,
    marginBottom: 16,
    ...Shadows.card,
  },
  spotlightTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.circle,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderIdHeader: {
    color: ChowColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  currentStatusBadge: {
    backgroundColor: ChowColors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  currentStatusText: {
    color: ChowColors.surface,
    fontSize: 11,
    fontWeight: '800',
  },
  totalAmountText: {
    fontSize: 28,
    fontWeight: '800',
    color: ChowColors.surface,
  },
  payStatusText: {
    fontSize: 12,
    color: ChowColors.textMuted,
    marginTop: 4,
  },
  codCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${ChowColors.amber}20`,
    borderRadius: Radius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: `${ChowColors.amberStar}40`,
    gap: 12,
    marginBottom: 16,
  },
  codTextGroup: {
    flex: 1,
  },
  codTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: ChowColors.amberStar,
  },
  codDesc: {
    fontSize: 12,
    color: ChowColors.textPrimary,
    marginTop: 2,
    lineHeight: 16,
  },
  commsGrid: {
    gap: 10,
    marginBottom: 16,
  },
  navButton: {
    flexDirection: 'row',
    backgroundColor: ChowColors.primary,
    height: 52,
    borderRadius: Radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  navBtnText: {
    color: ChowColors.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  callButton: {
    flexDirection: 'row',
    backgroundColor: ChowColors.secondaryLight,
    height: 50,
    borderRadius: Radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: `${ChowColors.primary}30`,
  },
  callBtnText: {
    color: ChowColors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  card: {
    backgroundColor: ChowColors.surface,
    borderRadius: Radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: ChowColors.border,
    marginBottom: 16,
    ...Shadows.card,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: ChowColors.textPrimary,
    marginBottom: 12,
  },
  addressRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  destinationAddress: {
    fontSize: 15,
    fontWeight: '600',
    color: ChowColors.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
  instructionsBox: {
    marginTop: 12,
    padding: 10,
    backgroundColor: ChowColors.canvas,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: ChowColors.border,
  },
  instructionsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: ChowColors.textSecondary,
    marginBottom: 2,
  },
  instructionsText: {
    fontSize: 13,
    color: ChowColors.textPrimary,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: ChowColors.border,
  },
  qtyBox: {
    backgroundColor: ChowColors.canvas,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.chip,
    marginRight: 10,
    borderWidth: 1,
    borderColor: ChowColors.border,
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '700',
    color: ChowColors.textPrimary,
  },
  itemMeta: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: ChowColors.textPrimary,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: ChowColors.textPrimary,
  },
  noItemsText: {
    fontSize: 13,
    color: ChowColors.textMuted,
    fontStyle: 'italic',
  },
  lifecycleCard: {
    backgroundColor: ChowColors.surface,
    borderRadius: Radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: ChowColors.border,
    marginBottom: 16,
    ...Shadows.card,
  },
  stepBtn: {
    flexDirection: 'row',
    height: 54,
    borderRadius: Radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stepBtnText: {
    color: ChowColors.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  deliveredNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  deliveredNoticeText: {
    fontSize: 15,
    fontWeight: '700',
    color: ChowColors.success,
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
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ChowColors.textPrimary,
    marginTop: 14,
  },
  errorSub: {
    fontSize: 13,
    color: ChowColors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
});
