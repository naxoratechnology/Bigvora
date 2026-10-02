import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../features/auth/AuthContext';
import { listOrders } from '../../../services/orders/order.service';
import colors from '../../../theme/colors';

const money = value =>
  '\u20B9' +
  Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const statusLabel = order => {
  if (order.status === 'cancelled') return 'Cancelled';
  if (order.status === 'payment_pending') return 'Payment pending';
  if (order.shipment.status === 'booked') return 'Shipment booked';
  if (order.shipment.status === 'booking_failed') return 'Shipment pending';
  return 'Order confirmed';
};
export default function OrdersScreen({ navigation }) {
  const { token } = useAuth(),
    [orders, setOrders] = useState([]),
    [loading, setLoading] = useState(true),
    [refreshing, setRefreshing] = useState(false),
    [error, setError] = useState('');
  const load = useCallback(
    async (refresh = false) => {
      refresh ? setRefreshing(true) : setLoading(true);
      try {
        const data = await listOrders(token);
        setOrders(data.orders || []);
        setError('');
      } catch (e) {
        setError(e.message || 'Unable to load your orders.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  const render = ({ item }) => (
    <Pressable
      accessibilityRole="button"
      onPress={() => navigation.navigate('OrderDetails', { order: item })}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.top}>
        <View>
          <Text style={styles.orderNumber}>{item.orderNumber}</Text>
          <Text style={styles.date}>
            {new Date(item.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </View>
        <Text style={styles.total}>{money(item.total)}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.statusRow}>
        <View style={styles.statusDot} />
        <Text style={styles.status}>{statusLabel(item)}</Text>
        <Text style={styles.method}>
          {item.payment.method === 'cod' ? 'COD' : 'PREPAID'}
        </Text>
      </View>
      <View style={styles.products}>
        {item.items.slice(0, 3).map(product => (
          <View key={product.productId + product.sku} style={styles.productRow}>
            {product.image ? (
              <Image source={{ uri: product.image }} style={styles.image} />
            ) : (
              <View style={styles.imageFallback}>
                <Ionicons name="cube-outline" size={21} color={colors.accent} />
              </View>
            )}
            <View style={styles.productCopy}>
              <Text numberOfLines={1} style={styles.productName}>
                {product.name}
              </Text>
              <Text style={styles.quantity}>
                Qty {product.quantity} {'\u00B7'} {money(product.lineTotal)}
              </Text>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.footer}>
        <Text style={styles.itemCount}>
          {item.itemCount} {item.itemCount === 1 ? 'item' : 'items'}
        </Text>
        {Boolean(item.shipment.awb) && (
          <Text style={styles.awb}>AWB {item.shipment.awb}</Text>
        )}
        <View style={styles.detailsLink}>
          <Text style={styles.detailsText}>View order details</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.accent} />
        </View>
      </View>
    </Pressable>
  );
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={navigation.goBack} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <View>
          <Text style={styles.title}>My orders</Text>
          <Text style={styles.subtitle}>{orders.length} recent orders</Text>
        </View>
        <View style={styles.spacer} />
      </View>
      {loading && !orders.length ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading your orders?</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.id}
          renderItem={render}
          contentContainerStyle={[
            styles.content,
            !orders.length && styles.emptyContent,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              colors={[colors.accent]}
              tintColor={colors.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name={error ? 'cloud-offline-outline' : 'cube-outline'}
                  size={46}
                  color={colors.accent}
                />
              </View>
              <Text style={styles.emptyTitle}>
                {error ? 'Could not load orders' : 'No orders yet'}
              </Text>
              <Text style={styles.emptyText}>
                {error ||
                  'Completed purchases and delivery updates will appear here.'}
              </Text>
              {Boolean(error) && (
                <Pressable onPress={() => load()} style={styles.retry}>
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              )}
            </View>
          }
          ListFooterComponent={
            error && orders.length ? (
              <Pressable onPress={() => load(true)} style={styles.inlineError}>
                <Text style={styles.inlineErrorText}>
                  Refresh failed. Tap to retry.
                </Text>
              </Pressable>
            ) : null
          }
        />
      )}
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
    marginRight: 13,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  title: { color: colors.primary, fontSize: 19, fontWeight: '800' },
  subtitle: { marginTop: 2, color: colors.textMuted, fontSize: 10 },
  spacer: { marginLeft: 'auto', width: 42 },
  content: { padding: 20, paddingBottom: 40 },
  emptyContent: { flexGrow: 1 },
  card: {
    marginBottom: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  cardPressed: { opacity: 0.75 },
  top: { flexDirection: 'row', justifyContent: 'space-between' },
  orderNumber: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  date: { marginTop: 4, color: colors.textMuted, fontSize: 10 },
  total: { color: colors.primary, fontSize: 16, fontWeight: '800' },
  divider: { height: 1, marginVertical: 13, backgroundColor: colors.border },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusDot: {
    width: 8,
    height: 8,
    marginRight: 7,
    borderRadius: 4,
    backgroundColor: '#179A63',
  },
  status: { color: '#179A63', fontSize: 11, fontWeight: '700' },
  method: {
    marginLeft: 'auto',
    color: colors.accent,
    fontSize: 9,
    fontWeight: '800',
  },
  products: { marginTop: 12 },
  productRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  image: { width: 42, height: 42, borderRadius: 11 },
  imageFallback: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: '#FFF0E8',
  },
  productCopy: { flex: 1, marginLeft: 10 },
  productName: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  quantity: { marginTop: 3, color: colors.textMuted, fontSize: 9 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itemCount: { color: colors.textMuted, fontSize: 10 },
  awb: { color: colors.primary, fontSize: 9, fontWeight: '700' },
  detailsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  detailsText: {
    marginRight: 3,
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 11, color: colors.textMuted, fontSize: 12 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 35,
  },
  emptyIcon: {
    width: 94,
    height: 94,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 47,
    backgroundColor: '#FFF0E8',
  },
  emptyTitle: {
    marginTop: 18,
    color: colors.primary,
    fontSize: 19,
    fontWeight: '800',
  },
  emptyText: {
    marginTop: 7,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  retry: {
    marginTop: 17,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 13,
    backgroundColor: colors.accent,
  },
  retryText: { color: colors.background, fontSize: 12, fontWeight: '800' },
  inlineError: { alignItems: 'center', padding: 12 },
  inlineErrorText: { color: '#B5473C', fontSize: 10, fontWeight: '700' },
});
