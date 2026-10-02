import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../../../features/cart/CartContext';
import colors from '../../../theme/colors';
import {
  FREE_DELIVERY_VALUE,
  MINIMUM_ORDER_VALUE,
  getDeliveryCharge,
  getFreeDeliveryRemaining,
  getMinimumOrderRemaining,
} from '../../../config/delivery';

const money = value => `₹${value.toLocaleString('en-IN')}`;

export default function CartScreen({ navigation }) {
  const { items, subtotal, updateQuantity, removeFromCart } = useCart();
  const delivery = getDeliveryCharge(subtotal);
  const freeDeliveryRemaining = getFreeDeliveryRemaining(subtotal);
  const minimumOrderRemaining = getMinimumOrderRemaining(subtotal);
  const canCheckout = subtotal >= MINIMUM_ORDER_VALUE;

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.pageTitle}>My cart</Text>
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="cart-outline" size={52} color={colors.accent} />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>
            Add products you love and they will appear here.
          </Text>
          <Pressable
            onPress={() => navigation.navigate('Home')}
            style={styles.shopButton}
          >
            <Text style={styles.shopButtonText}>Start shopping</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>My cart</Text>
          <Text style={styles.itemCount}>{items.length} items</Text>
        </View>

        {items.map(item => (
          <View key={item.id} style={styles.cartItem}>
            <View
              style={[
                styles.productImage,
                { backgroundColor: item.tint ?? '#EDF3FF' },
              ]}
            >
              <Ionicons
                name={item.icon ?? 'bag-handle'}
                size={42}
                color={colors.primaryLight}
              />
            </View>
            <View style={styles.itemInfo}>
              <Text numberOfLines={2} style={styles.itemName}>
                {item.name}
              </Text>
              <Text style={styles.stock}>In stock</Text>
              <Text style={styles.price}>{money(item.priceValue)}</Text>
              <View style={styles.quantityRow}>
                <Pressable
                  onPress={() => updateQuantity(item.id, -1)}
                  style={styles.quantityButton}
                >
                  <Ionicons name="remove" size={17} color={colors.primary} />
                </Pressable>
                <Text style={styles.quantity}>{item.quantity}</Text>
                <Pressable
                  onPress={() => updateQuantity(item.id, 1)}
                  style={styles.quantityButton}
                >
                  <Ionicons name="add" size={17} color={colors.primary} />
                </Pressable>
              </View>
            </View>
            <Pressable
              accessibilityLabel={`Remove ${item.name}`}
              onPress={() => removeFromCart(item.id)}
              style={styles.removeButton}
            >
              <Ionicons
                name="trash-outline"
                size={19}
                color={colors.textMuted}
              />
            </Pressable>
          </View>
        ))}

        <View style={styles.deliveryCard}>
          <View style={styles.deliveryIcon}>
            <Ionicons
              name={freeDeliveryRemaining ? 'car-outline' : 'checkmark'}
              size={20}
              color={freeDeliveryRemaining ? colors.accent : '#179A63'}
            />
          </View>
          <View style={styles.deliveryCopy}>
            <Text style={styles.deliveryTitle}>
              {freeDeliveryRemaining
                ? `Add ${money(
                    freeDeliveryRemaining,
                  )} more to get FREE delivery`
                : 'You unlocked FREE delivery'}
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(
                      100,
                      (subtotal / FREE_DELIVERY_VALUE) * 100,
                    )}%`,
                  },
                ]}
              />
            </View>
            {minimumOrderRemaining > 0 && (
              <Text style={styles.minimumText}>
                Minimum order is {money(MINIMUM_ORDER_VALUE)} · Add{' '}
                {money(minimumOrderRemaining)} to checkout
              </Text>
            )}
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Price details</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{money(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery</Text>
            <Text
              style={[styles.summaryValue, delivery === 0 && styles.freeText]}
            >
              {delivery === 0 ? 'FREE' : money(delivery)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{money(subtotal + delivery)}</Text>
          </View>
        </View>
      </ScrollView>
      <View style={styles.checkoutBar}>
        <View>
          <Text style={styles.checkoutLabel}>Total amount</Text>
          <Text style={styles.checkoutTotal}>{money(subtotal + delivery)}</Text>
        </View>
        <Pressable
          disabled={!canCheckout}
          onPress={() => navigation.navigate('CheckoutAddress')}
          style={[
            styles.checkoutButton,
            !canCheckout && styles.checkoutDisabled,
          ]}
        >
          <Text style={styles.checkoutButtonText}>
            {canCheckout ? 'Checkout' : `Add ${money(minimumOrderRemaining)}`}
          </Text>
          <Ionicons name="arrow-forward" size={18} color={colors.background} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 20, paddingBottom: 205 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  pageTitle: {
    paddingHorizontal: 20,
    paddingTop: 10,
    color: colors.primary,
    fontSize: 28,
    fontWeight: '800',
  },
  itemCount: { color: colors.textMuted, fontSize: 12 },
  cartItem: {
    flexDirection: 'row',
    marginBottom: 13,
    padding: 12,
    borderRadius: 18,
    backgroundColor: colors.background,
  },
  productImage: {
    width: 86,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  itemInfo: { flex: 1, marginLeft: 13 },
  itemName: {
    paddingRight: 25,
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  stock: { marginTop: 4, color: '#179A63', fontSize: 10, fontWeight: '600' },
  price: {
    marginTop: 7,
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  quantityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 9 },
  quantityButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: colors.surface,
  },
  quantity: {
    minWidth: 31,
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  removeButton: { position: 'absolute', top: 11, right: 11, padding: 4 },
  deliveryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFE0CF',
    borderRadius: 17,
    backgroundColor: '#FFF8F4',
  },
  deliveryIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: colors.background,
  },
  deliveryCopy: { flex: 1, marginLeft: 11 },
  deliveryTitle: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  progressTrack: {
    overflow: 'hidden',
    height: 5,
    marginTop: 9,
    borderRadius: 3,
    backgroundColor: '#F1D8CB',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  minimumText: { marginTop: 7, color: colors.textMuted, fontSize: 8 },
  summaryCard: {
    marginTop: 8,
    padding: 17,
    borderRadius: 18,
    backgroundColor: colors.background,
  },
  summaryTitle: {
    marginBottom: 14,
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
  freeText: { color: '#179A63' },
  divider: { height: 1, marginVertical: 10, backgroundColor: colors.border },
  totalLabel: { color: colors.primary, fontSize: 15, fontWeight: '800' },
  totalValue: { color: colors.primary, fontSize: 17, fontWeight: '800' },
  checkoutBar: {
    position: 'absolute',
    right: 0,
    bottom: 102,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  checkoutLabel: { color: colors.textMuted, fontSize: 10 },
  checkoutTotal: {
    marginTop: 2,
    color: colors.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  checkoutButton: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 23,
    borderRadius: 15,
    backgroundColor: colors.accent,
  },
  checkoutDisabled: { opacity: 0.45 },
  checkoutButtonText: {
    marginRight: 9,
    color: colors.background,
    fontSize: 14,
    fontWeight: '800',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 90,
  },
  emptyIcon: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 55,
    backgroundColor: '#FFF0E8',
  },
  emptyTitle: {
    marginTop: 22,
    color: colors.primary,
    fontSize: 21,
    fontWeight: '800',
  },
  emptyText: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  shopButton: {
    marginTop: 22,
    paddingHorizontal: 25,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: colors.accent,
  },
  shopButtonText: { color: colors.background, fontSize: 13, fontWeight: '800' },
});
