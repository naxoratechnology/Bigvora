import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../../../features/cart/CartContext';
import colors from '../../../theme/colors';
import CartQuantityControl from '../../../components/cart/CartQuantityControl';

const productIcons = [
  'bag-handle',
  'shirt',
  'watch',
  'headset',
  'footsteps',
  'gift',
];
const productTints = [
  '#FFF0E8',
  '#EDF3FF',
  '#EAF8F4',
  '#FFF0F5',
  '#F2F0FF',
  '#FFF7E5',
];

function CategoryProductsScreen({ navigation, route }) {
  const { items, addToCart, updateQuantity, favourites, toggleFavourite } =
    useCart();
  const title = route.params?.title ?? 'Products';
  const [sortBy, setSortBy] = useState('popular');
  const [priceOrder, setPriceOrder] = useState('asc');
  const [filterOpen, setFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState('all');
  const products = useMemo(
    () =>
      route.params?.products
        ? route.params.products.filter(
            product =>
              ['popular', 'new', 'deals'].includes(route.params?.categoryId) ||
              product.categoryId === route.params?.categoryId,
          )
        : productIcons.map((icon, index) => ({
            id: `${route.params?.categoryId ?? 'product'}-${index}`,
            name: `${title} ${index + 1}`,
            price: `₹${799 + index * 250}`,
            priceValue: 799 + index * 250,
            oldPrice: `₹${1099 + index * 300}`,
            rating: 4.3 + (index % 4) * 0.1,
            newestRank: productIcons.length - index,
            icon,
            tint: productTints[index],
          })),
    [route.params?.categoryId, route.params?.products, title],
  );

  const visibleProducts = useMemo(() => {
    const filtered = products.filter(product => {
      if (priceRange === 'under1000') return product.priceValue < 1000;
      if (priceRange === '1000to1500')
        return product.priceValue >= 1000 && product.priceValue <= 1500;
      if (priceRange === 'above1500') return product.priceValue > 1500;
      return true;
    });

    return [...filtered].sort((first, second) => {
      if (sortBy === 'newest') return second.newestRank - first.newestRank;
      if (sortBy === 'price')
        return priceOrder === 'asc'
          ? first.priceValue - second.priceValue
          : second.priceValue - first.priceValue;
      return second.rating - first.rating;
    });
  }, [priceOrder, priceRange, products, sortBy]);

  const selectPriceSort = () => {
    if (sortBy === 'price')
      setPriceOrder(current => (current === 'asc' ? 'desc' : 'asc'));
    setSortBy('price');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Go back"
          onPress={navigation.goBack}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
          <Text style={styles.resultCount}>
            {visibleProducts.length} products
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Filter products"
          onPress={() => setFilterOpen(value => !value)}
          style={[styles.headerButton, filterOpen && styles.filterButtonActive]}
        >
          <Ionicons name="options-outline" size={22} color={colors.accent} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.chipRow}>
          <Pressable
            onPress={() => setSortBy('popular')}
            style={[styles.chip, sortBy === 'popular' && styles.activeChip]}
          >
            <Text
              style={[
                styles.chipText,
                sortBy === 'popular' && styles.activeChipText,
              ]}
            >
              Popular
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSortBy('newest')}
            style={[styles.chip, sortBy === 'newest' && styles.activeChip]}
          >
            <Text
              style={[
                styles.chipText,
                sortBy === 'newest' && styles.activeChipText,
              ]}
            >
              Newest
            </Text>
          </Pressable>
          <Pressable
            onPress={selectPriceSort}
            style={[styles.chip, sortBy === 'price' && styles.activeChip]}
          >
            <Text
              style={[
                styles.chipText,
                sortBy === 'price' && styles.activeChipText,
              ]}
            >
              Price{' '}
              {sortBy === 'price' ? (priceOrder === 'asc' ? '↑' : '↓') : ''}
            </Text>
          </Pressable>
        </View>

        {filterOpen && (
          <View style={styles.filterPanel}>
            <View style={styles.filterHeader}>
              <View>
                <Text style={styles.filterTitle}>Price range</Text>
                <Text style={styles.filterSubtitle}>
                  Choose a range to narrow results
                </Text>
              </View>
              {priceRange !== 'all' && (
                <Pressable onPress={() => setPriceRange('all')}>
                  <Text style={styles.clearText}>Clear</Text>
                </Pressable>
              )}
            </View>
            <View style={styles.rangeGrid}>
              {[
                { id: 'all', label: 'All prices' },
                { id: 'under1000', label: 'Under ₹1,000' },
                { id: '1000to1500', label: '₹1,000–₹1,500' },
                { id: 'above1500', label: 'Above ₹1,500' },
              ].map(range => (
                <Pressable
                  key={range.id}
                  onPress={() => setPriceRange(range.id)}
                  style={[
                    styles.rangeOption,
                    priceRange === range.id && styles.rangeOptionActive,
                  ]}
                >
                  <View
                    style={[
                      styles.rangeRadio,
                      priceRange === range.id && styles.rangeRadioActive,
                    ]}
                  >
                    {priceRange === range.id && (
                      <View style={styles.rangeRadioDot} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.rangeText,
                      priceRange === range.id && styles.rangeTextActive,
                    ]}
                  >
                    {range.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View style={styles.grid}>
          {visibleProducts.map(product => (
            <Pressable
              key={product.id}
              onPress={() => navigation.navigate('ProductDetails', { product })}
              style={styles.productCard}
            >
              <View
                style={[
                  styles.productVisual,
                  { backgroundColor: product.tint },
                ]}
              >
                <Ionicons
                  name={product.icon}
                  size={60}
                  color={colors.primaryLight}
                />
                <Pressable
                  accessibilityLabel={`Save ${product.name}`}
                  onPress={() => toggleFavourite(product)}
                  style={styles.heartButton}
                >
                  <Ionicons
                    name={
                      favourites.some(item => item.id === product.id)
                        ? 'heart'
                        : 'heart-outline'
                    }
                    size={19}
                    color={
                      favourites.some(item => item.id === product.id)
                        ? colors.accent
                        : colors.primary
                    }
                  />
                </Pressable>
              </View>
              <Text numberOfLines={2} style={styles.productName}>
                {product.name}
              </Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>
                  {'\u20B9'}
                  {Number(product.priceValue).toLocaleString('en-IN')}
                </Text>
                <Text style={styles.oldPrice}>{product.oldPrice}</Text>
              </View>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color="#F4A900" />
                <Text style={styles.rating}>
                  {product.rating.toFixed(1)} · Free delivery over ₹499
                </Text>
              </View>
              <CartQuantityControl
                compact
                quantity={
                  items.find(item => item.id === product.id)?.quantity || 0
                }
                onIncrease={() => addToCart(product)}
                onDecrease={() => updateQuantity(product.id, -1)}
                style={styles.addButton}
              />
            </Pressable>
          ))}
        </View>
        {!visibleProducts.length && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="search-outline" size={42} color={colors.accent} />
            </View>
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptyText}>Try a different price range.</Text>
            <Pressable
              onPress={() => setPriceRange('all')}
              style={styles.resetButton}
            >
              <Text style={styles.resetText}>Clear filters</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  filterButtonActive: { backgroundColor: '#FFF0E8' },
  headerCopy: { flex: 1, marginHorizontal: 13 },
  title: { color: colors.primary, fontSize: 20, fontWeight: '800' },
  resultCount: { marginTop: 2, color: colors.textMuted, fontSize: 11 },
  content: { padding: 20, paddingBottom: 36 },
  chipRow: { flexDirection: 'row', marginBottom: 20 },
  chip: {
    marginRight: 9,
    paddingHorizontal: 17,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.background,
  },
  activeChip: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  activeChipText: { color: colors.background, fontSize: 12, fontWeight: '700' },
  filterPanel: {
    marginBottom: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },
  filterTitle: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  filterSubtitle: { marginTop: 3, color: colors.textMuted, fontSize: 9 },
  clearText: { color: colors.accent, fontSize: 11, fontWeight: '800' },
  rangeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  rangeOption: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  rangeOptionActive: { borderColor: colors.accent, backgroundColor: '#FFF8F4' },
  rangeRadio: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
  },
  rangeRadioActive: { borderColor: colors.accent },
  rangeRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  rangeText: { color: colors.textMuted, fontSize: 9, fontWeight: '600' },
  rangeTextActive: { color: colors.primary },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    marginBottom: 18,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.background,
  },
  productVisual: {
    height: 145,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 17,
    borderTopRightRadius: 17,
  },
  heartButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.background,
  },
  productName: {
    minHeight: 39,
    marginTop: 11,
    paddingHorizontal: 11,
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
  },
  price: { color: colors.primary, fontSize: 15, fontWeight: '800' },
  oldPrice: {
    marginLeft: 6,
    color: colors.textMuted,
    fontSize: 10,
    textDecorationLine: 'line-through',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
    paddingHorizontal: 11,
  },
  rating: { marginLeft: 4, color: colors.textMuted, fontSize: 9 },
  addButton: { position: 'absolute', right: 9, bottom: 9 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: {
    width: 86,
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 43,
    backgroundColor: '#FFF0E8',
  },
  emptyTitle: {
    marginTop: 17,
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  emptyText: { marginTop: 6, color: colors.textMuted, fontSize: 12 },
  resetButton: {
    marginTop: 17,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.accent,
  },
  resetText: { color: colors.background, fontSize: 11, fontWeight: '800' },
});

export default CategoryProductsScreen;
