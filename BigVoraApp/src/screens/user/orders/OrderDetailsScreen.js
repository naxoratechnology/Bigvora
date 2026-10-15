import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import { SafeAreaView } from 'react-native-safe-area-context';
import {useAuth} from '../../../features/auth/AuthContext';
import {cancelOrder} from '../../../services/orders/order.service';
import {rateProduct} from '../../../services/reviews/review.service';
import colors from '../../../theme/colors';

const money = value =>
  '\u20B9' +
  Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const readable = value =>
  String(value || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());

const dateOnly = value => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '';
};

const deliveryDuration = shipment => {
  const days = Number(shipment?.deliveryDays);
  return days > 0 ? `${days} ${days === 1 ? 'day' : 'days'}` : '';
};

function Row({ label, value, strong }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, strong && styles.strong]}>{label}</Text>
      <Text style={[styles.rowValue, strong && styles.strong]}>{value}</Text>
    </View>
  );
}

function Header({ navigation }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={navigation.goBack} style={styles.back}>
        <Ionicons name="arrow-back" size={22} color={colors.primary} />
      </Pressable>
      <Text style={styles.headerTitle}>Order details</Text>
      <View style={styles.headerSpace} />
    </View>
  );
}

export default function OrderDetailsScreen({ navigation, route }) {
  const order = route.params?.order;
  const {token} = useAuth();
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [ratedItems, setRatedItems] = useState({});
  const [ratingItem, setRatingItem] = useState(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <Header navigation={navigation} />
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={45} color={colors.accent} />
          <Text style={styles.emptyTitle}>Order details unavailable</Text>
          <Text style={styles.emptyText}>
            Return to My orders and try again.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const address = order.address || {};
  const shipment = order.shipment || {};
  const payment = order.payment || {};
  const canCancel = ['payment_pending', 'confirmed', 'processing'].includes(
    order.status,
  );
  const cancel = () => {
    if (cancelling) return;
    Alert.alert(
      'Cancel this order?',
      'This action cannot be undone. Your reserved items will be returned to stock.',
      [
        {text: 'Keep order', style: 'cancel'},
        {
          text: 'Cancel order',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            setCancelError('');
            try {
              await cancelOrder(token, order.id);
              Alert.alert('Order cancelled', 'Your order has been cancelled.');
              navigation.goBack();
            } catch (error) {
              setCancelError(error.message || 'Unable to cancel this order.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ],
    );
  };
  const rateItem = async (item, rating) => {
    setRatingSubmitting(true);
    try {
      await rateProduct(token, item.productId, rating);
      setRatedItems(current => ({...current, [item.productId]: rating}));
      Alert.alert('Thanks for your rating', 'Your rating has been submitted.');
      setRatingItem(null);
      setSelectedRating(0);
    } catch (error) { Alert.alert('Rating unavailable', error.message); }
    finally { setRatingSubmitting(false); }
  };
  const openRating = item => { setRatingItem(item); setSelectedRating(ratedItems[item.productId] || 0); };

  return (
    <SafeAreaView style={styles.container}>
      <Header navigation={navigation} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summary}>
          <View style={styles.summaryIcon}>
            <Ionicons name="checkmark-circle" size={28} color="#179A63" />
          </View>
          <View style={styles.summaryCopy}>
            <Text style={styles.orderNumber}>{order.orderNumber}</Text>
            <Text style={styles.date}>
              Placed on{' '}
              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
          <Text style={styles.status}>{readable(order.status)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Items</Text>
        <View style={styles.card}>
          {(order.items || []).map(item => (
            <View key={item.productId + item.sku} style={styles.item}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.image} />
              ) : (
                <View style={styles.imageFallback}>
                  <Ionicons
                    name="cube-outline"
                    size={24}
                    color={colors.accent}
                  />
                </View>
              )}
              <View style={styles.itemCopy}>
                <Text numberOfLines={2} style={styles.itemName}>
                  {item.name}
                </Text>
                <Text style={styles.itemMeta}>
                  Qty {item.quantity}
                  {item.sku ? '  •  SKU ' + item.sku : ''}
                </Text>
                <Text style={styles.unitPrice}>
                  {money(item.unitPrice)} each
                </Text>
              </View>
              <Text style={styles.lineTotal}>{money(item.lineTotal)}</Text>
              {order.status === 'delivered' && <Pressable onPress={() => openRating(item)} style={styles.rateItem}><Ionicons name="star-outline" size={15} color={colors.accent}/><Text style={styles.rateItemLabel}>{ratedItems[item.productId] ? 'Edit rating' : 'Rate product'}</Text></Pressable>}
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Delivery address</Text>
        <View style={styles.card}>
          <Text style={styles.addressName}>{address.name}</Text>
          <Text style={styles.addressText}>
            {[address.line, address.city, address.state, address.pincode]
              .filter(Boolean)
              .join(', ')}
          </Text>
          <Text style={styles.addressPhone}>{address.phone}</Text>
        </View>

        <Text style={styles.sectionTitle}>Payment summary</Text>
        <View style={styles.card}>
          <Row label="Items subtotal" value={money(order.subtotal)} />
          <Row
            label="Delivery"
            value={
              Number(order.deliveryFee) ? money(order.deliveryFee) : 'FREE'
            }
          />
          <View style={styles.separator} />
          <Row label="Order total" value={money(order.total)} strong />
          <View style={styles.paymentBadge}>
            <Ionicons
              name={payment.method === 'cod' ? 'cash-outline' : 'card-outline'}
              size={17}
              color={colors.accent}
            />
            <Text style={styles.paymentText}>
              {payment.method === 'cod' ? 'Cash on delivery' : 'Online payment'}
              {' · '}
              {readable(payment.status)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Delivery status</Text>
        <View style={styles.card}>
          <Row
            label="Shipment"
            value={readable(shipment.currentStatus || shipment.status || 'not ready')}
            strong
          />
          {Boolean(shipment.awb) && (
            <Row label="AWB number" value={shipment.awb} />
          )}
          {shipment.expectedDeliveryDate && !deliveryDuration(shipment) ? (
            <Row
              label="Expected delivery"
              value={dateOnly(shipment.expectedDeliveryDate)}
            />
          ) : null}
          {deliveryDuration(shipment) ? (
            <>
              <Row
                label="Delivered on"
                value={dateOnly(shipment.deliveredAt)}
              />
              <Row
                label="Delivery time"
                value={`Delivered in ${deliveryDuration(shipment)}`}
              />
            </>
          ) : null}
          {shipment.lastLocation ? (
            <Row label="Last location" value={shipment.lastLocation} />
          ) : null}
        </View>

        {canCancel ? (
          <>
            {Boolean(cancelError) && (
              <Text style={styles.cancelError}>{cancelError}</Text>
            )}
            <Pressable
              disabled={cancelling}
              onPress={cancel}
              style={[styles.cancelButton, cancelling && styles.cancelDisabled]}
            >
              {cancelling ? (
                <ActivityIndicator size="small" color="#C83E3E" />
              ) : (
                <Ionicons name="close-circle-outline" size={18} color="#C83E3E" />
              )}
              <Text style={styles.cancelButtonText}>
                {cancelling ? 'Cancelling order...' : 'Cancel order'}
              </Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
      <Modal transparent visible={Boolean(ratingItem)} animationType="fade" onRequestClose={() => setRatingItem(null)}><View style={styles.ratingOverlay}><View style={styles.ratingSheet}><Pressable onPress={() => setRatingItem(null)} style={styles.closeRating}><Ionicons name="close" size={21} color={colors.textMuted}/></Pressable><View style={styles.ratingIcon}><Ionicons name="star" size={30} color="#F4A900"/></View><Text style={styles.ratingTitle}>Rate your purchase</Text><Text numberOfLines={2} style={styles.ratingProduct}>{ratingItem?.name}</Text><Text style={styles.ratingQuestion}>How would you rate this product?</Text><View style={styles.largeStars}>{[1,2,3,4,5].map(value=><Pressable key={value} onPress={() => setSelectedRating(value)} hitSlop={8}><Ionicons name={value<=selectedRating?'star':'star-outline'} size={42} color="#F4A900"/></Pressable>)}</View><Text style={styles.ratingCaption}>{selectedRating ? ['','Poor','Fair','Good','Very good','Excellent'][selectedRating] : 'Tap a star to choose your rating'}</Text><Pressable disabled={!selectedRating || ratingSubmitting} onPress={() => rateItem(ratingItem, selectedRating)} style={[styles.submitRating,(!selectedRating || ratingSubmitting)&&styles.submitRatingDisabled]}>{ratingSubmitting?<ActivityIndicator color={colors.background}/>:<Text style={styles.submitRatingText}>Submit rating</Text>}</Pressable></View></View></Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: colors.background,
  },
  back: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    flex: 1,
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  headerSpace: { width: 42 },
  content: { padding: 20, paddingBottom: 40 },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  summaryIcon: {
    width: 45,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: '#EAF8F2',
  },
  summaryCopy: { flex: 1, marginLeft: 12 },
  orderNumber: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  date: { marginTop: 4, color: colors.textMuted, fontSize: 9 },
  status: {
    maxWidth: 90,
    color: '#179A63',
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'right',
  },
  sectionTitle: {
    marginTop: 22,
    marginBottom: 9,
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  card: {
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 19,
    backgroundColor: colors.background,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  image: { width: 56, height: 56, borderRadius: 13 },
  imageFallback: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#FFF0E8',
  },
  itemCopy: { flex: 1, marginHorizontal: 11 },
  itemName: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  itemMeta: { marginTop: 4, color: colors.textMuted, fontSize: 9 },
  unitPrice: { marginTop: 3, color: colors.textMuted, fontSize: 9 },
  lineTotal: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  rateItem: { position: 'absolute', right: 0, bottom: 6, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10, backgroundColor: '#FFF0E8' },
  rateItemLabel: { marginLeft: 4, color: colors.accent, fontSize: 9, fontWeight: '800' },
  ratingOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#10284A99' },
  ratingSheet: { width: '100%', alignItems: 'center', padding: 24, borderRadius: 24, backgroundColor: colors.background },
  closeRating: { position: 'absolute', top: 12, right: 12, padding: 8 },
  ratingIcon: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: '#FFF5DE' },
  ratingTitle: { marginTop: 14, color: colors.primary, fontSize: 20, fontWeight: '800' },
  ratingProduct: { marginTop: 7, color: colors.textMuted, fontSize: 12, textAlign: 'center' },
  ratingQuestion: { marginTop: 20, color: colors.primary, fontSize: 13, fontWeight: '700' },
  largeStars: { flexDirection: 'row', marginTop: 12 },
  ratingCaption: { minHeight: 18, marginTop: 7, color: colors.accent, fontSize: 11, fontWeight: '700' },
  submitRating: { width: '100%', height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 17, borderRadius: 15, backgroundColor: colors.accent },
  submitRatingDisabled: { opacity: 0.45 },
  submitRatingText: { color: colors.background, fontSize: 14, fontWeight: '800' },
  addressName: {
    marginTop: 15,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  addressText: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 17,
  },
  addressPhone: {
    marginTop: 7,
    marginBottom: 15,
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },
  rowLabel: { color: colors.textMuted, fontSize: 11 },
  rowValue: { color: colors.primary, fontSize: 11, fontWeight: '600' },
  strong: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  separator: { height: 1, marginVertical: 5, backgroundColor: colors.border },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
    marginBottom: 14,
    padding: 11,
    borderRadius: 12,
    backgroundColor: '#FFF5EF',
  },
  paymentText: {
    marginLeft: 7,
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  cancelError: {
    marginTop: 14,
    color: '#C83E3E',
    fontSize: 11,
    textAlign: 'center',
  },
  cancelButton: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#F0B9B9',
    borderRadius: 14,
    backgroundColor: '#FFF7F7',
  },
  cancelDisabled: {opacity: 0.65},
  cancelButtonText: {
    marginLeft: 7,
    color: '#C83E3E',
    fontSize: 12,
    fontWeight: '800',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyTitle: {
    marginTop: 15,
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  emptyText: { marginTop: 7, color: colors.textMuted, fontSize: 12 },
});
