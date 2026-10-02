import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAdminData } from '../../../features/admin/AdminDataContext';
import colors from '../../../theme/colors';

const money = value => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const words = value =>
  String(value || 'Not available')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
const dateTime = value =>
  value
    ? new Date(value).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Not available';
const orderStatuses = [
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'delivered',
];

function InfoRow({ label, value, last = false }) {
  return (
    <View style={[styles.infoRow, !last && styles.divider]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text selectable style={styles.infoValue}>
        {value || 'Not available'}
      </Text>
    </View>
  );
}

export default function AdminOrderDetailsScreen({ navigation, route }) {
  const { orders, fetchOrder, updateOrderStatus, syncOrderShipment } =
    useAdminData();
  const [order, setOrder] = useState(
    orders.find(item => item.id === route.params.id) || null,
  );
  const [loading, setLoading] = useState(!order);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [statusModal, setStatusModal] = useState(false);
  const [action, setAction] = useState('');

  const load = useCallback(
    async refresh => {
      refresh ? setRefreshing(true) : setLoading(true);
      setError('');
      try {
        setOrder(await fetchOrder(route.params.id));
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetchOrder, route.params.id],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  const changeStatus = async status => {
    if (action) return;
    setAction('status');
    setError('');
    try {
      setOrder(await updateOrderStatus(route.params.id, status));
      setStatusModal(false);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setAction('');
    }
  };

  const syncDelivery = async () => {
    if (action) return;
    setAction('sync');
    setError('');
    try {
      setOrder(await syncOrderShipment(route.params.id));
      Alert.alert(
        'Delivery synced',
        'The latest shipment status is now available.',
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setAction('');
    }
  };

  if (loading && !order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={navigation.goBack} style={styles.back}>
            <Ionicons name={'arrow-back'} size={22} color={colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Order details</Text>
          <View style={styles.headerSpace} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size={'large'} color={colors.accent} />
          <Text style={styles.centerText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons
            name={'alert-circle-outline'}
            size={44}
            color={colors.accent}
          />
          <Text style={styles.errorTitle}>Unable to load order</Text>
          <Text style={styles.centerText}>{error || 'Order not found.'}</Text>
          <Pressable onPress={() => load(false)} style={styles.retry}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
          <Pressable onPress={navigation.goBack}>
            <Text style={styles.backText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const address = order.address || {};
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={navigation.goBack} style={styles.back}>
          <Ionicons name={'arrow-back'} size={22} color={colors.primary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Order details</Text>
          <Text style={styles.headerSubtitle}>{order.orderNumber}</Text>
        </View>
        <View style={styles.headerSpace} />
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            colors={[colors.accent]}
            tintColor={colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {Boolean(error) && (
          <Pressable onPress={() => load(true)} style={styles.errorBanner}>
            <Ionicons
              name={'cloud-offline-outline'}
              size={18}
              color={'#C83E3E'}
            />
            <Text style={styles.errorText}>{error} Tap to retry.</Text>
          </Pressable>
        )}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <Ionicons
                name={'receipt-outline'}
                size={27}
                color={colors.background}
              />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.orderNumber}>{order.orderNumber}</Text>
              <Text style={styles.orderDate}>
                Placed {dateTime(order.createdAt)}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{words(order.status)}</Text>
            </View>
          </View>
          <View style={styles.heroBottom}>
            <Text style={styles.totalLabel}>Order total</Text>
            <Text style={styles.total}>{money(order.total)}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            disabled={Boolean(action)}
            onPress={() => setStatusModal(true)}
            style={styles.statusButton}
          >
            <Ionicons
              name={'swap-vertical-outline'}
              size={18}
              color={colors.primary}
            />
            <Text style={styles.statusButtonText}>Update status</Text>
          </Pressable>
          <Pressable
            disabled={Boolean(action) || !order.shipment?.awb}
            onPress={syncDelivery}
            style={[
              styles.syncButton,
              (!order.shipment?.awb || action) && styles.disabledButton,
            ]}
          >
            {action === 'sync' ? (
              <ActivityIndicator size={'small'} color={colors.background} />
            ) : (
              <Ionicons name={'sync'} size={18} color={colors.background} />
            )}
            <Text style={styles.syncButtonText}>
              {action === 'sync' ? 'Syncing...' : 'Sync delivery'}
            </Text>
          </Pressable>
        </View>
        {!order.shipment?.awb && (
          <Text style={styles.syncHint}>
            Delivery sync becomes available after an AWB is assigned.
          </Text>
        )}

        <Text style={styles.sectionTitle}>Customer</Text>
        <View style={styles.card}>
          <InfoRow label={'Full name'} value={order.customer?.name} />
          <InfoRow label={'Email'} value={order.customer?.email} />
          <InfoRow label={'Mobile'} value={order.customer?.mobile} last />
        </View>

        <Text style={styles.sectionTitle}>Delivery address</Text>
        <View style={styles.card}>
          <View style={styles.addressRow}>
            <View style={styles.sectionIcon}>
              <Ionicons
                name={'location-outline'}
                size={21}
                color={colors.accent}
              />
            </View>
            <View style={styles.addressCopy}>
              <Text style={styles.addressName}>{address.name}</Text>
              <Text style={styles.addressText}>
                {[address.line, address.city, address.state, address.pincode]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
              <Text style={styles.addressPhone}>{address.phone}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Items</Text>
          <Text style={styles.itemCount}>{order.itemCount} total</Text>
        </View>
        <View style={styles.card}>
          {order.items.map((item, index) => (
            <View
              key={`${item.productId}-${index}`}
              style={[
                styles.productRow,
                index < order.items.length - 1 && styles.divider,
              ]}
            >
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={styles.productImage}
                />
              ) : (
                <View style={styles.productImageEmpty}>
                  <Ionicons
                    name={'cube-outline'}
                    size={22}
                    color={colors.textMuted}
                  />
                </View>
              )}
              <View style={styles.productCopy}>
                <Text numberOfLines={2} style={styles.productName}>
                  {item.name}
                </Text>
                <Text style={styles.productMeta}>
                  {item.sku ? `SKU: ${item.sku} · ` : ''}Qty: {item.quantity}
                </Text>
                <Text style={styles.unitPrice}>
                  {money(item.unitPrice)} each
                </Text>
              </View>
              <Text style={styles.lineTotal}>{money(item.lineTotal)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Payment and delivery</Text>
        <View style={styles.card}>
          <InfoRow
            label={'Payment method'}
            value={
              order.payment?.method === 'cod' ? 'Cash on delivery' : 'Razorpay'
            }
          />
          <InfoRow
            label={'Payment status'}
            value={words(order.payment?.status)}
          />
          <InfoRow
            label={'Shipment status'}
            value={words(order.shipment?.status)}
          />
          <InfoRow label={'AWB number'} value={order.shipment?.awb} />
          <InfoRow
            label={'Expected delivery'}
            value={order.shipment?.expectedDeliveryDate}
          />
          <InfoRow
            label={'Last location'}
            value={order.shipment?.lastLocation}
          />
          <InfoRow
            label={'Last synced'}
            value={dateTime(order.shipment?.syncedAt)}
            last
          />
        </View>

        <Text style={styles.sectionTitle}>Price summary</Text>
        <View style={styles.card}>
          <InfoRow label={'Subtotal'} value={money(order.subtotal)} />
          <InfoRow
            label={'Delivery fee'}
            value={
              Number(order.deliveryFee) ? money(order.deliveryFee) : 'Free'
            }
          />
          <InfoRow label={'Total'} value={money(order.total)} last />
        </View>

        <Text style={styles.sectionTitle}>Timeline</Text>
        <View style={styles.card}>
          <InfoRow label={'Created'} value={dateTime(order.createdAt)} />
          <InfoRow
            label={'Last updated'}
            value={dateTime(order.updatedAt)}
            last
          />
        </View>
      </ScrollView>
      <Modal
        animationType={'fade'}
        onRequestClose={() => !action && setStatusModal(false)}
        transparent
        visible={statusModal}
      >
        <Pressable
          onPress={() => !action && setStatusModal(false)}
          style={styles.modalBackdrop}
        >
          <Pressable style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Update order status</Text>
                <Text style={styles.modalText}>
                  Select the current fulfilment stage.
                </Text>
              </View>
              <Pressable
                disabled={Boolean(action)}
                onPress={() => setStatusModal(false)}
                style={styles.modalClose}
              >
                <Ionicons name={'close'} size={21} color={colors.primary} />
              </Pressable>
            </View>
            {orderStatuses.map(status => {
              const selected = order.status === status;
              return (
                <Pressable
                  key={status}
                  disabled={Boolean(action) || selected}
                  onPress={() => changeStatus(status)}
                  style={[
                    styles.statusOption,
                    selected && styles.selectedOption,
                  ]}
                >
                  <View
                    style={[styles.statusDot, selected && styles.selectedDot]}
                  />
                  <Text
                    style={[
                      styles.statusOptionText,
                      selected && styles.selectedText,
                    ]}
                  >
                    {words(status)}
                  </Text>
                  {selected ? (
                    <Ionicons
                      name={'checkmark-circle'}
                      size={21}
                      color={colors.accent}
                    />
                  ) : (
                    <Ionicons
                      name={'chevron-forward'}
                      size={17}
                      color={colors.textMuted}
                    />
                  )}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    height: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: colors.background,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: colors.surface,
  },
  headerCopy: { flex: 1, alignItems: 'center' },
  headerTitle: { color: colors.primary, fontSize: 18, fontWeight: '800' },
  headerSubtitle: { marginTop: 2, color: colors.textMuted, fontSize: 9 },
  headerSpace: { width: 40 },
  content: { padding: 20, paddingBottom: 45 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  centerText: {
    marginTop: 10,
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  errorTitle: {
    marginTop: 12,
    color: colors.primary,
    fontSize: 17,
    fontWeight: '800',
  },
  retry: {
    marginTop: 18,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 13,
    backgroundColor: colors.accent,
  },
  retryText: { color: colors.background, fontSize: 11, fontWeight: '800' },
  backText: {
    marginTop: 17,
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    padding: 12,
    borderRadius: 13,
    backgroundColor: '#FFF1F1',
  },
  errorText: { flex: 1, marginLeft: 8, color: '#C83E3E', fontSize: 10 },
  hero: { padding: 17, borderRadius: 21, backgroundColor: colors.primary },
  heroTop: { flexDirection: 'row', alignItems: 'center' },
  heroIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: colors.accent,
  },
  heroCopy: { flex: 1, marginHorizontal: 12 },
  orderNumber: { color: colors.background, fontSize: 15, fontWeight: '800' },
  orderDate: { marginTop: 4, color: '#CAD4E1', fontSize: 8 },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  statusText: { color: colors.background, fontSize: 8, fontWeight: '800' },
  heroBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 19,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  totalLabel: { color: '#CAD4E1', fontSize: 9 },
  total: { color: colors.background, fontSize: 23, fontWeight: '800' },
  sectionTitle: {
    marginTop: 23,
    marginBottom: 10,
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemCount: {
    marginTop: 13,
    color: colors.accent,
    fontSize: 9,
    fontWeight: '800',
  },
  card: {
    overflow: 'hidden',
    paddingHorizontal: 15,
    borderRadius: 18,
    backgroundColor: colors.background,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { color: colors.textMuted, fontSize: 10 },
  infoValue: {
    flex: 1,
    marginLeft: 20,
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'right',
  },
  addressRow: { flexDirection: 'row', paddingVertical: 15 },
  sectionIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#FFF0E8',
  },
  addressCopy: { flex: 1, marginLeft: 12 },
  addressName: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  addressText: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 15,
  },
  addressPhone: {
    marginTop: 5,
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  productImage: {
    width: 58,
    height: 58,
    borderRadius: 13,
    backgroundColor: colors.surface,
  },
  productImageEmpty: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: colors.surface,
  },
  productCopy: { flex: 1, marginHorizontal: 11 },
  productName: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  productMeta: { marginTop: 4, color: colors.textMuted, fontSize: 8 },
  unitPrice: { marginTop: 4, color: colors.textMuted, fontSize: 8 },
  lineTotal: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  actionRow: { flexDirection: 'row', marginTop: 13 },
  statusButton: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.background,
  },
  statusButtonText: {
    marginLeft: 7,
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  syncButton: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 7,
    borderRadius: 14,
    backgroundColor: colors.accent,
  },
  syncButtonText: {
    marginLeft: 7,
    color: colors.background,
    fontSize: 10,
    fontWeight: '800',
  },
  disabledButton: { opacity: 0.45 },
  syncHint: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 8,
    textAlign: 'right',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(3,20,40,0.5)',
  },
  modalCard: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: { color: colors.primary, fontSize: 17, fontWeight: '800' },
  modalText: { marginTop: 3, color: colors.textMuted, fontSize: 9 },
  modalClose: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  statusOption: {
    height: 51,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
  },
  selectedOption: {
    borderColor: colors.accent,
    backgroundColor: '#FFF5EF',
  },
  statusDot: {
    width: 9,
    height: 9,
    marginRight: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
  },
  selectedDot: { backgroundColor: colors.accent },
  statusOptionText: {
    flex: 1,
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  selectedText: { color: colors.accent },
});
