import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import { SafeAreaView } from 'react-native-safe-area-context';
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
            value={readable(shipment.status || 'not ready')}
            strong
          />
          {Boolean(shipment.awb) && (
            <Row label="AWB number" value={shipment.awb} />
          )}
        </View>
      </ScrollView>
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
