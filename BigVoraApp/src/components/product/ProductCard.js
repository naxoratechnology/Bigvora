import React from 'react';
import {Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {Ionicons} from '@react-native-vector-icons/ionicons/static';
import CartQuantityControl from '../cart/CartQuantityControl';
import colors from '../../theme/colors';

const money = value => `\u20B9${Number(value).toLocaleString('en-IN')}`;

function ProductCard({
  product,
  onPress,
  isFavourite,
  onToggleFavourite,
  quantity,
  onIncrease,
  onDecrease,
  horizontal = false,
}) {
  const price = Number(product.priceValue ?? product.price);
  const mrp = Number(product.mrp || price);
  const discount =
    Number(product.discountPercent) ||
    (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);
  const rating = Number(product.ratingAverage ?? product.rating);
  const hasRating = Number(product.ratingCount) > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${product.name}`}
      onPress={onPress}
      style={[styles.card, horizontal && styles.horizontalCard]}
    >
      <View style={[styles.visual, {backgroundColor: product.tint || '#EAF1FF'}]}>
        {product.images?.[0] ? (
          <Image
            source={{uri: product.images[0]}}
            resizeMode="contain"
            resizeMethod="resize"
            fadeDuration={0}
            style={styles.image}
          />
        ) : (
          <Ionicons
            name={product.icon || 'cube-outline'}
            size={58}
            color={colors.primaryLight}
          />
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${isFavourite ? 'Remove' : 'Save'} ${product.name} ${isFavourite ? 'from' : 'to'} favourites`}
          onPress={onToggleFavourite}
          style={styles.heart}
        >
          <Ionicons
            name={isFavourite ? 'heart' : 'heart-outline'}
            size={19}
            color={isFavourite ? colors.accent : colors.primary}
          />
        </Pressable>
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}% OFF</Text>
          </View>
        )}
      </View>
      <Text numberOfLines={2} style={styles.name}>
        {product.name}
      </Text>
      <View style={styles.priceRow}>
        <Text style={styles.price}>{money(price)}</Text>
        {mrp > price && <Text style={styles.mrp}>{money(mrp)}</Text>}
      </View>
      <View style={styles.footer}>
        {hasRating && (
          <View style={styles.rating}>
            <Ionicons name="star" size={11} color="#F6A21A" />
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
          </View>
        )}
        <CartQuantityControl
          compact
          quantity={quantity}
          onIncrease={onIncrease}
          onDecrease={onDecrease}
          style={styles.cartControl}
        />
      </View>
    </Pressable>
  );
}

export default React.memo(ProductCard, (previous, next) =>
  previous.product === next.product &&
  previous.isFavourite === next.isFavourite &&
  previous.quantity === next.quantity &&
  previous.horizontal === next.horizontal,
);

const styles = StyleSheet.create({
  card: {
    width: '48%',
    marginBottom: 18,
    paddingBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.background,
  },
  horizontalCard: {width: 175, marginHorizontal: 4},
  visual: {
    height: 138,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {width: '100%', height: '100%'},
  heart: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.background,
  },
  discountBadge: {
    position: 'absolute',
    left: 9,
    bottom: 9,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: colors.accent,
  },
  discountText: {color: colors.background, fontSize: 9, fontWeight: '800'},
  name: {
    minHeight: 38,
    marginTop: 11,
    paddingHorizontal: 11,
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  priceRow: {
    minHeight: 23,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
  },
  price: {color: colors.primary, fontSize: 15, fontWeight: '800'},
  mrp: {
    marginLeft: 6,
    color: colors.textMuted,
    fontSize: 10,
    textDecorationLine: 'line-through',
  },
  footer: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5,
    paddingHorizontal: 10,
  },
  rating: {flexDirection: 'row', alignItems: 'center'},
  ratingText: {marginLeft: 3, color: colors.textMuted, fontSize: 9, fontWeight: '700'},
  cartControl: {marginLeft: 'auto'},
});
