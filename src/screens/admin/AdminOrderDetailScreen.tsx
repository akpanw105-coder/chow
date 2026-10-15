import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import { formatPrice } from '@/data/foods';
import {
  AdminOrderDetail,
  fetchAdminOrderDetail,
  fetchAvailableRiders,
  assignDispatchRider,
  updateOrderStatusByAdmin,
} from '@/services/admin';
import { OrderStatus } from '@/types';

export default function AdminOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [riderModalVisible, setRiderModalVisible] = useState(false);
  const [statusNotes, setStatusNotes] = useState('');
  const [riders, setRiders] = useState<{ id: string; name: string; phone: string }[]>([]);

  const loadDetail = React.useCallback(async () => {
    if (!id) return;
    try {
      const data = await fetchAdminOrderDetail(id);
      setOrder(data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  async function handleOpenRiderModal() {
    setActionLoading(true);
    const available = await fetchAvailableRiders();
    setRiders(available);
    setActionLoading(false);
    setRiderModalVisible(true);
  }

  async function handleAssignRider(riderId: string) {
    if (!order) return;
    setRiderModalVisible(false);
    setActionLoading(true);
    const success = await assignDispatchRider(order.id, riderId, 'Assigned via Admin Command Centre');
    setActionLoading(false);
    if (success) {
      Alert.alert('Rider Assigned', 'Dispatch assignment has been recorded atomically.');
      loadDetail();
    } else {
      Alert.alert('Assignment Error', 'Could not assign rider. Check database permissions.');
    }
  }

  async function handleUpdateStatus(newStatus: OrderStatus) {
    if (!order) return;
    setStatusModalVisible(false);
    setActionLoading(true);
    const success = await updateOrderStatusByAdmin(order.id, newStatus, statusNotes || undefined);
    setActionLoading(false);
    setStatusNotes('');
    if (success) {
      Alert.alert('Status Updated', `Order transition to "${newStatus}" confirmed.`);
      loadDetail();
    } else {
      Alert.alert('Transition Error', 'Status change rejected by business rules or permission.');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Top Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Text style={{ fontSize: 20 }}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{order?.orderNumber || 'Order Detail'}</Text>
          <Text style={styles.headerSub}>Admin Inspection Workspace</Text>
        </View>
        <Pressable
          style={styles.refreshBtn}
          onPress={loadDetail}
          disabled={loading || actionLoading}>
          <Text style={{ fontSize: 16 }}>↻</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={ChowColors.primary} />
          <Text style={styles.loadingText}>Fetching authoritative order records...</Text>
        </View>
      ) : !order ? (
        <View style={styles.centerWrap}>
          <Text style={{ fontSize: 40 }}>⚠️</Text>
          <Text style={styles.errorTitle}>Order Record Not Found</Text>
          <Text style={styles.errorSub}>The requested order ID does not exist in the database.</Text>
          <Pressable style={styles.backHomeBtn} onPress={() => router.back()}>
            <Text style={styles.backHomeText}>Return to Orders</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* ── Status & Primary Operational Actions ── */}
          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View>
                <Text style={styles.heroLabel}>CURRENT FULFILLMENT STATUS</Text>
                <Text style={styles.heroStatus}>{order.status.toUpperCase()}</Text>
              </View>
              <View style={styles.paymentPill}>
                <Text style={styles.paymentPillText}>
                  {order.paymentStatus === 'paid' ? 'PAID ✓' : order.paymentStatus.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <Pressable
                style={styles.actionBtnPrimary}
                onPress={() => setStatusModalVisible(true)}
                disabled={actionLoading}>
                <Text style={styles.actionBtnPrimaryText}>Change Status ▾</Text>
              </Pressable>

              <Pressable
                style={styles.actionBtnSecondary}
                onPress={handleOpenRiderModal}
                disabled={actionLoading}>
                <Text style={styles.actionBtnSecondaryText}>
                  {order.assignedRiderName ? 'Reassign Rider 🛵' : 'Assign Rider 🛵'}
                </Text>
              </Pressable>
            </View>

            {order.assignedRiderName && (
              <View style={styles.riderCallout}>
                <Text style={{ fontSize: 16 }}>🛵</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.riderCalloutTitle}>Assigned Dispatch Courier</Text>
                  <Text style={styles.riderCalloutName}>
                    {order.assignedRiderName} ({order.assignedRiderPhone || 'No phone'})
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* ── Customer & Destination ── */}
          <SectionCard title="Customer & Delivery Destination">
            <DetailRow label="Customer Name" value={order.customerName} />
            <DetailRow label="Phone Number" value={order.recipientPhone} highlight />
            <DetailRow label="Delivery Address" value={order.deliveryAddress} />
            {order.customerNotes ? (
              <DetailRow label="Delivery Instructions" value={order.customerNotes} />
            ) : null}
            <DetailRow label="Restaurant Kitchen" value={order.restaurantName} />
            <DetailRow label="Payment Method" value={order.paymentMethod === 'card' ? 'Debit/Credit Card (Stripe)' : order.paymentMethod === 'transfer' ? 'Bank Transfer' : 'Cash on Delivery'} />
          </SectionCard>

          {/* ── Ordered Food Items ── */}
          <SectionCard title={`Order Line Items (${order.items.length})`}>
            {order.items.map((item, idx) => (
              <View key={item.id || idx} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.quantity}× {item.productName}</Text>
                  {item.selectedOptions?.swallow_label ? (
                    <Text style={styles.itemMeta}>Swallow: {item.selectedOptions.swallow_label}</Text>
                  ) : null}
                </View>
                <Text style={styles.itemPrice}>{formatPrice(item.lineTotalNaira)}</Text>
              </View>
            ))}

            <View style={styles.divider} />

            <SummaryRow label="Item Subtotal" value={formatPrice(order.subtotalNaira)} />
            <SummaryRow label="Delivery Fee" value={formatPrice(order.deliveryFeeNaira)} />
            <SummaryRow label="Packaging Fee" value={formatPrice(order.packagingFeeNaira)} />
            {order.discountNaira > 0 && (
              <SummaryRow label="Discount" value={`−${formatPrice(order.discountNaira)}`} accent />
            )}
            <View style={[styles.divider, { marginVertical: 6 }]} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Customer Payment</Text>
              <Text style={styles.totalValue}>{formatPrice(order.totalNaira)}</Text>
            </View>
          </SectionCard>

          {/* ── Authoritative Status History ── */}
          <SectionCard title="Audit Trail & Status History">
            {order.statusHistory.length === 0 ? (
              <Text style={styles.emptyHistoryText}>No transition log recorded.</Text>
            ) : (
              <View style={styles.timeline}>
                {order.statusHistory.map((step, idx) => (
                  <View key={step.id || idx} style={styles.timelineStep}>
                    <View style={styles.timelineDot} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.timelineTitle}>
                        Transition to <Text style={{ fontWeight: '700' }}>{step.newStatus.toUpperCase()}</Text>
                      </Text>
                      <Text style={styles.timelineMeta}>
                        By: {step.changedByName || 'System'} • {new Date(step.changedAt).toLocaleString()}
                      </Text>
                      {step.notes ? <Text style={styles.timelineNotes}>&ldquo;{step.notes}&rdquo;</Text> : null}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </SectionCard>
        </ScrollView>
      )}

      {/* ── Status Transition Modal ── */}
      <Modal visible={statusModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeading}>Update Fulfillment Status</Text>
            <Text style={styles.modalSub}>Select verified operational transition</Text>

            <View style={{ gap: 8, marginVertical: 14 }}>
              {(['confirmed', 'preparing', 'ready_for_pickup', 'assigned', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled'] as OrderStatus[]).map((st) => (
                <Pressable
                  key={st}
                  style={[styles.statusSelectBtn, order?.status === st && styles.statusSelectBtnActive]}
                  onPress={() => handleUpdateStatus(st)}>
                  <Text style={[styles.statusSelectText, order?.status === st && styles.statusSelectTextActive]}>
                    {st.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={styles.notesInput}
              placeholder="Operational notes (e.g. Kitchen completed cooking)"
              value={statusNotes}
              onChangeText={setStatusNotes}
            />

            <Pressable style={styles.modalCancelBtn} onPress={() => setStatusModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Rider Assignment Modal ── */}
      <Modal visible={riderModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeading}>Assign Dispatch Rider</Text>
            <Text style={styles.modalSub}>Select an active, verified courier</Text>

            {riders.length === 0 ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <Text style={{ color: ChowColors.textSecondary }}>No available riders found in system.</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 280, marginVertical: 12 }}>
                {riders.map((r) => (
                  <Pressable
                    key={r.id}
                    style={styles.riderOption}
                    onPress={() => handleAssignRider(r.id)}>
                    <Text style={{ fontSize: 18 }}>🛵</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.riderOptionName}>{r.name}</Text>
                      <Text style={styles.riderOptionPhone}>{r.phone}</Text>
                    </View>
                    <Text style={styles.assignActionText}>Assign →</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            <Pressable style={styles.modalCancelBtn} onPress={() => setRiderModalVisible(false)}>
              <Text style={styles.modalCancelText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={{ gap: 8, marginTop: 10 }}>{children}</View>
    </View>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, highlight && { color: ChowColors.primary, fontWeight: '700' }]}>
        {value}
      </Text>
    </View>
  );
}

function SummaryRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, accent && { color: ChowColors.primary }]}>{label}</Text>
      <Text style={[styles.summaryValue, accent && { color: ChowColors.primary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ChowColors.canvas },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: ChowColors.border,
    gap: 12,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...Typography.headlineMd, color: ChowColors.textPrimary },
  headerSub: { fontSize: 11, color: ChowColors.textSecondary },
  refreshBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 14, paddingBottom: 60 },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  loadingText: { fontSize: 13, color: ChowColors.textSecondary },
  errorTitle: { fontSize: 16, fontWeight: '700', color: ChowColors.textPrimary },
  errorSub: { fontSize: 13, color: ChowColors.textSecondary, textAlign: 'center' },
  backHomeBtn: { backgroundColor: ChowColors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.full, marginTop: 8 },
  backHomeText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Hero
  heroCard: { backgroundColor: '#111827', borderRadius: Radius.DEFAULT, padding: 18, gap: 14, ...Shadows.card },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.8 },
  heroStatus: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 2 },
  paymentPill: { backgroundColor: '#059669', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  paymentPillText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtnPrimary: { flex: 1, backgroundColor: ChowColors.primary, height: 44, borderRadius: Radius.DEFAULT, alignItems: 'center', justifyContent: 'center' },
  actionBtnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  actionBtnSecondary: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', height: 44, borderRadius: Radius.DEFAULT, alignItems: 'center', justifyContent: 'center' },
  actionBtnSecondaryText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  riderCallout: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.08)', padding: 12, borderRadius: Radius.DEFAULT },
  riderCalloutTitle: { fontSize: 11, color: '#9CA3AF' },
  riderCalloutName: { fontSize: 13, fontWeight: '700', color: '#fff', marginTop: 1 },

  // Section card
  sectionCard: { backgroundColor: '#fff', borderRadius: Radius.DEFAULT, padding: 16, borderWidth: 1, borderColor: ChowColors.border, ...Shadows.card },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: ChowColors.textPrimary },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  detailLabel: { fontSize: 12, color: ChowColors.textSecondary, flex: 1 },
  detailValue: { fontSize: 12, fontWeight: '600', color: ChowColors.textPrimary, flex: 1.5, textAlign: 'right' },

  // Items
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  itemName: { fontSize: 13, fontWeight: '600', color: ChowColors.textPrimary },
  itemMeta: { fontSize: 11, color: ChowColors.textSecondary, marginTop: 2 },
  itemPrice: { fontSize: 13, fontWeight: '700', color: ChowColors.textPrimary },
  divider: { height: 1, backgroundColor: ChowColors.border, marginVertical: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  summaryLabel: { fontSize: 12, color: ChowColors.textSecondary },
  summaryValue: { fontSize: 12, fontWeight: '600', color: ChowColors.textPrimary },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 },
  totalLabel: { fontSize: 13, fontWeight: '700', color: ChowColors.textPrimary },
  totalValue: { fontSize: 18, fontWeight: '800', color: ChowColors.primary },

  // Timeline
  emptyHistoryText: { fontSize: 12, color: ChowColors.textSecondary, paddingVertical: 8 },
  timeline: { gap: 14, marginTop: 4 },
  timelineStep: { flexDirection: 'row', gap: 12 },
  timelineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ChowColors.primary, marginTop: 4 },
  timelineTitle: { fontSize: 13, color: ChowColors.textPrimary },
  timelineMeta: { fontSize: 11, color: ChowColors.textMuted },
  timelineNotes: { fontSize: 11, color: ChowColors.textSecondary, fontStyle: 'italic', marginTop: 2 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalHeading: { fontSize: 18, fontWeight: '800', color: ChowColors.textPrimary },
  modalSub: { fontSize: 12, color: ChowColors.textSecondary, marginTop: 2 },
  statusSelectBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: Radius.DEFAULT, backgroundColor: '#F3F4F6' },
  statusSelectBtnActive: { backgroundColor: ChowColors.primary },
  statusSelectText: { fontSize: 12, fontWeight: '700', color: ChowColors.textPrimary, textAlign: 'center' },
  statusSelectTextActive: { color: '#fff' },
  notesInput: { borderWidth: 1, borderColor: ChowColors.border, borderRadius: Radius.DEFAULT, padding: 12, fontSize: 13, marginTop: 8 },
  modalCancelBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  modalCancelText: { fontSize: 13, fontWeight: '700', color: ChowColors.textSecondary },

  // Rider modal
  riderOption: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  riderOptionName: { fontSize: 13, fontWeight: '700', color: ChowColors.textPrimary },
  riderOptionPhone: { fontSize: 11, color: ChowColors.textSecondary },
  assignActionText: { fontSize: 12, fontWeight: '700', color: ChowColors.primary },
});
