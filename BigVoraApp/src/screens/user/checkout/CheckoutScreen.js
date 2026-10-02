import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { useState } from 'react';
import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../../../features/cart/CartContext';
import colors from '../../../theme/colors';
import { useAuth } from '../../../features/auth/AuthContext';
import {
  createCheckout,
  verifyPayment,
} from '../../../services/orders/order.service';
import {
  FREE_DELIVERY_VALUE,
  MINIMUM_ORDER_VALUE,
  getDeliveryCharge,
  getFreeDeliveryRemaining,
} from '../../../config/delivery';

const money = value => `₹${value.toLocaleString('en-IN')}`;

export default function CheckoutScreen({ navigation }) {
  const {
    addresses,
    selectedAddressId,
    setSelectedAddressId,
    subtotal,
    items,
    clearCart,
  } = useCart();
  const { token, user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [submitting, setSubmitting] = useState(false);
  const delivery = getDeliveryCharge(subtotal);
  const freeDeliveryRemaining = getFreeDeliveryRemaining(subtotal);
  const canPlaceOrder = Boolean(
    selectedAddressId && subtotal >= MINIMUM_ORDER_VALUE,
  );

  const placeOrder = async () => {
    if (!token) {
      navigation.navigate('Login');
      return;
    }
    const address = addresses.find(item => item.id === selectedAddressId);
    if (!canPlaceOrder || submitting) return;
    setSubmitting(true);
    try {
      const data = await createCheckout(token, {
        paymentMethod,
        address,
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      });
      let order = data.order;
      if (paymentMethod === 'razorpay') {
        const result = await RazorpayCheckout.open({
          key: data.payment.keyId,
          order_id: data.payment.razorpayOrderId,
          amount: data.payment.amount,
          currency: data.payment.currency,
          name: 'Big Vora',
          description: 'Order ' + order.orderNumber,
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
            contact: user?.phone || address.phone,
          },
          theme: { color: colors.accent },
        });
        const verified = await verifyPayment(token, {
          orderId: order.id,
          razorpayPaymentId: result.razorpay_payment_id,
          razorpaySignature: result.razorpay_signature,
        });
        order = verified.order;
      }
      clearCart();
      navigation.replace('OrderSuccess', {
        orderId: order.orderNumber,
        paymentMethod,
      });
    } catch (error) {
      Alert.alert(
        paymentMethod === 'razorpay'
          ? 'Payment not completed'
          : 'Order not placed',
        error?.description ||
          error?.message ||
          'Checkout could not be completed.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={navigation.goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.steps}>
          <View style={styles.stepActive}>
            <Text style={styles.stepNumber}>1</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.stepActive}>
            <Text style={styles.stepNumber}>2</Text>
          </View>
          <View style={styles.stepLineMuted} />
          <View style={styles.stepMuted}>
            <Text style={styles.stepMutedText}>3</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Delivery address</Text>
          <Pressable onPress={() => navigation.navigate('AddAddress')}>
            <Text style={styles.addAddress}>+ Add new</Text>
          </Pressable>
        </View>
        {addresses.map(address => {
          const selected = address.id === selectedAddressId;
          return (
            <Pressable
              key={address.id}
              onPress={() => setSelectedAddressId(address.id)}
              style={[styles.addressCard, selected && styles.selectedCard]}
            >
              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected && <View style={styles.radioDot} />}
              </View>
              <View style={styles.addressCopy}>
                <View style={styles.addressTitleRow}>
                  <Text style={styles.addressLabel}>{address.label}</Text>
                  <Ionicons
                    name="home-outline"
                    size={17}
                    color={colors.accent}
                  />
                </View>
                <Text style={styles.addressName}>
                  {address.name} · {address.phone}
                </Text>
                <Text style={styles.addressLine}>{address.line}</Text>
              </View>
            </Pressable>
          );
        })}

        <Text style={styles.sectionTitle}>Payment method</Text>
        <Pressable
          onPress={() => setPaymentMethod('cod')}
          style={[
            styles.paymentCard,
            paymentMethod === 'cod' && styles.selectedCard,
          ]}
        >
          <View style={styles.paymentIcon}>
            <Ionicons name="cash-outline" size={25} color={colors.accent} />
          </View>
          <View style={styles.paymentCopy}>
            <Text style={styles.paymentTitle}>Cash on Delivery</Text>
            <Text style={styles.paymentSubtitle}>
              Pay when your order arrives
            </Text>
          </View>
          <View
            style={[
              styles.radio,
              paymentMethod === 'cod' && styles.radioSelected,
            ]}
          >
            {paymentMethod === 'cod' && <View style={styles.radioDot} />}
          </View>
        </Pressable>
        <Pressable
          onPress={() => setPaymentMethod('razorpay')}
          style={[
            styles.paymentCard,
            paymentMethod === 'razorpay' && styles.selectedCard,
          ]}
        >
          <View style={styles.paymentIcon}>
            <Ionicons name="card-outline" size={25} color={colors.accent} />
          </View>
          <View style={styles.paymentCopy}>
            <Text style={styles.paymentTitle}>Pay securely online</Text>
            <Text style={styles.paymentSubtitle}>
              UPI, cards, netbanking and wallets via Razorpay
            </Text>
          </View>
          <View
            style={[
              styles.radio,
              paymentMethod === 'razorpay' && styles.radioSelected,
            ]}
          >
            {paymentMethod === 'razorpay' && <View style={styles.radioDot} />}
          </View>
        </Pressable>

        <View
          style={[
            styles.deliveryNotice,
            !freeDeliveryRemaining && styles.deliveryUnlocked,
          ]}
        >
          <Ionicons
            name={freeDeliveryRemaining ? 'car-outline' : 'checkmark-circle'}
            size={21}
            color={freeDeliveryRemaining ? colors.accent : '#179A63'}
          />
          <View style={styles.deliveryNoticeCopy}>
            <Text style={styles.deliveryNoticeTitle}>
              {freeDeliveryRemaining
                ? `Add ${money(freeDeliveryRemaining)} more for FREE delivery`
                : 'FREE delivery applied'}
            </Text>
            <View style={styles.checkoutProgress}>
              <View
                style={[
                  styles.checkoutProgressFill,
                  {
                    width: `${Math.min(
                      100,
                      (subtotal / FREE_DELIVERY_VALUE) * 100,
                    )}%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{money(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery fee</Text>
            <Text style={[styles.summaryValue, delivery === 0 && styles.free]}>
              {delivery === 0 ? 'FREE' : money(delivery)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Amount payable</Text>
            <Text style={styles.totalValue}>{money(subtotal + delivery)}</Text>
          </View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Pressable
          disabled={!canPlaceOrder || submitting}
          onPress={placeOrder}
          style={[
            styles.placeOrderButton,
            (!canPlaceOrder || submitting) && styles.disabledButton,
          ]}
        >
          <Text style={styles.placeOrderText}>
            {submitting
              ? 'Processing...'
              : paymentMethod === 'cod'
              ? 'Place COD order'
              : 'Pay securely'}
          </Text>
          <Ionicons
            name="shield-checkmark-outline"
            size={19}
            color={colors.background}
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  headerTitle: { color: colors.primary, fontSize: 19, fontWeight: '800' },
  headerSpacer: { width: 42 },
  content: { padding: 20, paddingBottom: 110 },
  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
  stepActive: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.accent,
  },
  stepMuted: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.border,
  },
  stepNumber: { color: colors.background, fontSize: 12, fontWeight: '800' },
  stepMutedText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  stepLine: { width: 55, height: 3, backgroundColor: colors.accent },
  stepLineMuted: { width: 55, height: 3, backgroundColor: colors.border },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    marginBottom: 13,
    color: colors.primary,
    fontSize: 17,
    fontWeight: '800',
  },
  addAddress: {
    marginBottom: 13,
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
  },
  addressCard: {
    flexDirection: 'row',
    marginBottom: 12,
    padding: 15,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.background,
  },
  selectedCard: { borderColor: colors.accent },
  radio: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
  },
  radioSelected: { borderColor: colors.accent },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  addressCopy: { flex: 1, marginLeft: 12 },
  addressTitleRow: { flexDirection: 'row', alignItems: 'center' },
  addressLabel: {
    marginRight: 7,
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  addressName: {
    marginTop: 6,
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  addressLine: {
    marginTop: 5,
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 17,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 23,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.background,
  },
  paymentIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: '#FFF0E8',
  },
  paymentCopy: { flex: 1, marginLeft: 12 },
  paymentTitle: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  paymentSubtitle: { marginTop: 3, color: colors.textMuted, fontSize: 11 },
  deliveryNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFE0CF',
    borderRadius: 16,
    backgroundColor: '#FFF8F4',
  },
  deliveryUnlocked: {
    borderColor: '#CDECDD',
    backgroundColor: '#F2FBF7',
  },
  deliveryNoticeCopy: { flex: 1, marginLeft: 10 },
  deliveryNoticeTitle: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  checkoutProgress: {
    overflow: 'hidden',
    height: 5,
    marginTop: 8,
    borderRadius: 3,
    backgroundColor: '#E8DDD7',
  },
  checkoutProgressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  summaryCard: {
    padding: 17,
    borderRadius: 18,
    backgroundColor: colors.background,
  },
  summaryTitle: {
    marginBottom: 12,
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  summaryLabel: { color: colors.textMuted, fontSize: 13 },
  summaryValue: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  free: { color: '#179A63' },
  divider: { height: 1, marginVertical: 10, backgroundColor: colors.border },
  totalLabel: { color: colors.primary, fontSize: 15, fontWeight: '800' },
  totalValue: { color: colors.primary, fontSize: 18, fontWeight: '800' },
  footer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  placeOrderButton: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.accent,
  },
  disabledButton: { opacity: 0.45 },
  placeOrderText: {
    marginRight: 9,
    color: colors.background,
    fontSize: 15,
    fontWeight: '800',
  },
});
