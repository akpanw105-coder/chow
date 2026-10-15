/**
 * Checkout Screen — Chow
 * Complete server-authoritative checkout with:
 * - Address & contact validation
 * - Dynamic order summary recalculated from database
 * - Payment method selection (Card via Stripe, Bank Transfer, Cash on Delivery)
 * - Stripe Payment lifecycle integration with idempotency, processing modals,
 *   authoritative webhook confirmation wait, and retry safety.
 */
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChowColors, Radius, Shadows } from '@/constants/theme';
import { formatPrice } from '@/data/foods';
import { createPaymentIntentForOrder, waitForPaymentConfirmation } from '@/services/payments';
import { useAuth } from '@/store/authStore';
import { useCart } from '@/store/cartStore';
import { useOrders } from '@/store/ordersStore';

type PaymentMethodType = 'card' | 'transfer' | 'cash';

const PAYMENT_METHODS: { id: PaymentMethodType; label: string; icon: string; subtitle: string }[] = [
  { id: 'card', label: 'Debit / Credit Card', icon: '💳', subtitle: 'Secure checkout via Stripe' },
  { id: 'transfer', label: 'Bank Transfer', icon: '🏦', subtitle: 'Direct bank payment / USSD' },
  { id: 'cash', label: 'Cash on Delivery', icon: '💵', subtitle: 'Pay rider upon arrival' },
];

function generateIdempotencyKey(suffix?: string): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 7);
  return suffix ? `chow_chk_${ts}_${suffix}` : `chow_chk_${ts}_${rand}`;
}

export default function CheckoutScreen() {
  const { user } = useAuth();
  const { total, subtotal, state, clearCart } = useCart();
  const { placeOrder } = useOrders();

  const defaultAddr =
    user?.savedAddresses?.find((a) => a.isDefault)?.street ||
    user?.savedAddresses?.[0]?.street ||
    '14 Marian Road, Calabar';
  const defaultPhone = user?.phone || '+234 803 456 7890';

  const [address, setAddress] = useState(defaultAddr);
  const [phone, setPhone] = useState(defaultPhone);
  const [note, setNote] = useState('');
  const [payment, setPayment] = useState<PaymentMethodType>('card');

  // Checkout submission states
  const [loading, setLoading] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<
    'idle' | 'creating_order' | 'initializing_stripe' | 'verifying_payment' | 'completed' | 'failed'
  >('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [activePaymentIntentId, setActivePaymentIntentId] = useState<string | null>(null);

  // Idempotency token to guard repeated taps and network hiccups
  const idempotencyKeyRef = useRef<string | null>(null);

  const validate = React.useCallback((): boolean => {
    if (!address.trim()) {
      Alert.alert('Required', 'Please enter your delivery address.');
      return false;
    }
    if (!phone.trim() || phone.length < 10) {
      Alert.alert('Required', 'Please enter a valid phone number.');
      return false;
    }
    if (state.items.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before checking out.');
      return false;
    }
    return true;
  }, [address, phone, state.items.length]);

  const retryPayment = React.useCallback(async () => {
    if (!createdOrderId) return;
    setLoading(true);
    setCheckoutStep('initializing_stripe');
    setStatusMessage('Re-attempting secure Stripe payment...');

    try {
      // Rotate idempotency key for explicit retry
      idempotencyKeyRef.current = generateIdempotencyKey('retry');
      const piRes = await createPaymentIntentForOrder(createdOrderId, idempotencyKeyRef.current);
      setActivePaymentIntentId(piRes.paymentIntentId);

      setCheckoutStep('verifying_payment');
      setStatusMessage('Re-verifying payment with bank...');

      const verifyOutcome = await waitForPaymentConfirmation(createdOrderId, 6000, 1500);
      if (verifyOutcome === 'paid') {
        clearCart();
        setLoading(false);
        router.replace(`/order-success?id=${createdOrderId}`);
      } else {
        setLoading(false);
        Alert.alert('Still Pending', 'Your payment is still being processed. Track it in your Orders tab.');
        router.replace(`/order-track?id=${createdOrderId}`);
      }
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Payment Error', err.message || 'Retry failed.');
    }
  }, [clearCart, createdOrderId]);

  const handlePlaceOrder = React.useCallback(async () => {
    if (!validate() || loading) return;

    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = generateIdempotencyKey();
    }

    setLoading(true);
    setCheckoutStep('creating_order');
    setStatusMessage('Securing order with restaurant kitchen...');

    try {
      // 1. Authoritative order creation via server RPC
      const newOrder = await placeOrder({
        items: [...state.items],
        subtotal,
        deliveryFee: state.deliveryFee,
        packagingFee: state.packagingFee,
        discount: state.promoDiscount,
        total,
        paymentMethod: payment,
        deliveryAddress: address,
        recipientPhone: phone,
        deliveryNote: note,
      });

      setCreatedOrderId(newOrder.id);

      // If Cash on delivery, order is immediately placeable without Stripe
      if (payment === 'cash') {
        setCheckoutStep('completed');
        clearCart();
        setLoading(false);
        router.replace(`/order-success?id=${newOrder.id}`);
        return;
      }

      // If Card or Transfer via Stripe gateway
      setCheckoutStep('initializing_stripe');
      setStatusMessage('Connecting to secure Stripe payment gateway...');

      const piRes = await createPaymentIntentForOrder(newOrder.id, idempotencyKeyRef.current);
      setActivePaymentIntentId(piRes.paymentIntentId);

      setCheckoutStep('verifying_payment');
      setStatusMessage('Processing payment and awaiting authoritative confirmation...');

      // 3. Authoritatively wait for webhook verification
      const verifyOutcome = await waitForPaymentConfirmation(newOrder.id, 8000, 1500);

      if (verifyOutcome === 'paid') {
        setCheckoutStep('completed');
        clearCart();
        setLoading(false);
        router.replace(`/order-success?id=${newOrder.id}`);
      } else if (verifyOutcome === 'failed') {
        setCheckoutStep('failed');
        setLoading(false);
        Alert.alert(
          'Payment Not Completed',
          'Your payment could not be verified. You can retry paying now or track order status.',
          [
            { text: 'Track Order', onPress: () => router.replace(`/order-track?id=${newOrder.id}`) },
            { text: 'Retry Payment', onPress: () => retryPayment() },
          ]
        );
      } else {
        // Pending state (webhook latency)
        setCheckoutStep('completed');
        clearCart();
        setLoading(false);
        router.replace(`/order-track?id=${newOrder.id}`);
      }
    } catch (err: any) {
      setLoading(false);
      setCheckoutStep('failed');
      Alert.alert('Checkout Error', err.message || 'Could not complete your checkout attempt.');
    }
  }, [address, clearCart, loading, note, payment, phone, placeOrder, retryPayment, state.deliveryFee, state.items, state.packagingFee, state.promoDiscount, subtotal, total, validate]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => (loading ? null : router.back())}
          hitSlop={10}
          disabled={loading}>
          <Text style={{ fontSize: 20 }}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* ── Delivery Details ── */}
        <SectionCard title="Delivery Details">
          <InputField
            label="Delivery Address"
            value={address}
            onChangeText={setAddress}
            placeholder="Street, City"
            icon="📍"
          />
          <InputField
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="+234 800 000 0000"
            keyboardType="phone-pad"
            icon="📞"
          />
          <InputField
            label="Delivery Note (Optional)"
            value={note}
            onChangeText={setNote}
            placeholder="Gate colour, landmark..."
            icon="📝"
            multiline
          />
        </SectionCard>

        {/* ── Order Summary ── */}
        <SectionCard title="Order Summary">
          {state.items.map((item) => (
            <View key={item.food.id} style={styles.orderItem}>
              <Text style={styles.orderItemName} numberOfLines={1}>
                {item.quantity}× {item.food.shortName}
              </Text>
              <Text style={styles.orderItemPrice}>
                {formatPrice(item.unitPrice * item.quantity)}
              </Text>
            </View>
          ))}
          <View style={styles.divider} />
          <SummaryRow
            label="Subtotal"
            value={formatPrice(state.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0))}
          />
          <SummaryRow label="Delivery Fee" value={formatPrice(state.deliveryFee)} />
          <SummaryRow label="Packaging" value={formatPrice(state.packagingFee)} />
          {state.promoDiscount > 0 && (
            <SummaryRow label="Promo Discount" value={`−${formatPrice(state.promoDiscount)}`} accent />
          )}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>
        </SectionCard>

        {/* ── Payment Method ── */}
        <SectionCard title="Payment Method">
          {PAYMENT_METHODS.map((m) => (
            <Pressable
              key={m.id}
              style={[styles.payMethod, payment === m.id && styles.payMethodActive]}
              onPress={() => (loading ? null : setPayment(m.id))}>
              <Text style={{ fontSize: 24 }}>{m.icon}</Text>
              <View style={{ flex: 1, marginLeft: 4 }}>
                <Text
                  style={[styles.payMethodLabel, payment === m.id && { color: ChowColors.primary, fontWeight: '700' }]}>
                  {m.label}
                </Text>
                <Text style={styles.payMethodSubtitle}>{m.subtitle}</Text>
              </View>
              <View style={[styles.radio, payment === m.id && styles.radioActive]}>
                {payment === m.id && <View style={styles.radioInner} />}
              </View>
            </Pressable>
          ))}
        </SectionCard>

        {payment === 'card' && (
          <View style={styles.stripeNotice}>
            <Text style={styles.stripeNoticeIcon}>🔒</Text>
            <Text style={styles.stripeNoticeText}>
              Payments are processed through Stripe with end-to-end encryption. Your card details are never stored on our servers.
            </Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Place Order Bar ── */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomLabel}>Total Payment</Text>
          <Text style={styles.bottomTotal}>{formatPrice(total)}</Text>
        </View>
        <Pressable
          style={[styles.placeOrderBtn, loading && { opacity: 0.7 }]}
          onPress={handlePlaceOrder}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.placeOrderText}>
              {payment === 'card' ? 'Pay with Stripe' : 'Place Order'}
            </Text>
          )}
        </Pressable>
      </View>

      {/* ── Payment Processing Modal ── */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ActivityIndicator size="large" color={ChowColors.primary} />
            <Text style={styles.modalTitle}>
              {checkoutStep === 'creating_order'
                ? 'Confirming Order...'
                : checkoutStep === 'initializing_stripe'
                ? 'Securing Payment...'
                : 'Verifying Transaction...'}
            </Text>
            <Text style={styles.modalStatus}>{statusMessage}</Text>
            {activePaymentIntentId && (
              <Text style={styles.modalRef}>Stripe Ref: {activePaymentIntentId}</Text>
            )}
            <Text style={styles.modalSafety}>
              Please do not close the app. We are finalizing your order securely.
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={{ gap: 12, marginTop: 12 }}>{children}</View>
    </View>
  );
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  icon: string;
  keyboardType?: 'default' | 'phone-pad';
  multiline?: boolean;
}) {
  return (
    <View>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputRow, multiline && { alignItems: 'flex-start', paddingVertical: 12 }]}>
        <Text style={{ fontSize: 16, marginTop: multiline ? 2 : 0 }}>{icon}</Text>
        <TextInput
          style={[styles.input, multiline && { height: 64, textAlignVertical: 'top' }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={ChowColors.textMuted}
          keyboardType={keyboardType ?? 'default'}
          multiline={multiline}
        />
      </View>
    </View>
  );
}

function SummaryRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
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
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ChowColors.surface,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: ChowColors.textDark,
  },
  content: { padding: 16, gap: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: 16,
    ...Shadows.subtle,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ChowColors.textDark,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: ChowColors.textDark,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: ChowColors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    backgroundColor: ChowColors.surface,
    gap: 8,
  },
  input: {
    flex: 1,
    height: 46,
    fontSize: 14,
    color: ChowColors.textDark,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  orderItemName: {
    fontSize: 14,
    color: ChowColors.textDark,
    flex: 1,
    marginRight: 8,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: ChowColors.textDark,
  },
  divider: {
    height: 1,
    backgroundColor: ChowColors.border,
    marginVertical: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  summaryLabel: {
    fontSize: 14,
    color: ChowColors.textMuted,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: ChowColors.textDark,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: ChowColors.textDark,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: ChowColors.primary,
  },
  payMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: ChowColors.border,
    borderRadius: Radius.md,
    padding: 14,
    gap: 12,
  },
  payMethodActive: {
    borderColor: ChowColors.primary,
    backgroundColor: ChowColors.primaryLight,
  },
  payMethodLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: ChowColors.textDark,
  },
  payMethodSubtitle: {
    fontSize: 12,
    color: ChowColors.textMuted,
    marginTop: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: ChowColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: ChowColors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ChowColors.primary,
  },
  stripeNotice: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: Radius.md,
    gap: 10,
    alignItems: 'center',
  },
  stripeNoticeIcon: {
    fontSize: 18,
  },
  stripeNoticeText: {
    flex: 1,
    fontSize: 12,
    color: ChowColors.textMuted,
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: ChowColors.border,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.card,
  },
  bottomLabel: {
    fontSize: 12,
    color: ChowColors.textMuted,
  },
  bottomTotal: {
    fontSize: 20,
    fontWeight: '800',
    color: ChowColors.textDark,
  },
  placeOrderBtn: {
    backgroundColor: ChowColors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: Radius.full,
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    gap: 12,
    ...Shadows.card,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ChowColors.textDark,
    marginTop: 4,
  },
  modalStatus: {
    fontSize: 14,
    color: ChowColors.textDark,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalRef: {
    fontSize: 11,
    color: ChowColors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  modalSafety: {
    fontSize: 12,
    color: ChowColors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
});


