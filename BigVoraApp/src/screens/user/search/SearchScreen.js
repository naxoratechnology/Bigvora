import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchCatalog } from '../../../services/catalog/search.service';
import { useCart } from '../../../features/cart/CartContext';
import CartQuantityControl from '../../../components/cart/CartQuantityControl';
import colors from '../../../theme/colors';

const sortOptions = [
  { id: 'relevance', label: 'Relevant' },
  { id: 'newest', label: 'Newest' },
  { id: 'priceAsc', label: 'Price: low' },
  { id: 'priceDesc', label: 'Price: high' },
  { id: 'discount', label: 'Discount' },
];
const money = value => '\u20B9' + Number(value || 0).toLocaleString('en-IN');
const mapProduct = product => ({
  ...product,
  priceValue: Number(product.price),
  price: money(product.price),
  oldPrice:
    Number(product.mrp) > Number(product.price) ? money(product.mrp) : '',
  icon: 'cube-outline',
  tint: '#EDF3FF',
});

export default function SearchScreen({ navigation, route }) {
  const { items, addToCart, updateQuantity, favourites, toggleFavourite } =
    useCart();
  const inputRef = useRef(null);
  const requestId = useRef(0);
  const [query, setQuery] = useState(route.params?.query || '');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [sort, setSort] = useState('relevance');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStock, setInStock] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    hasMore: false,
  });
  const activeFilters = Boolean(
    categoryId || minPrice || maxPrice || inStock || sort !== 'relevance',
  );
  const fetchResults = useCallback(
    async (page = 1, append = false) => {
      const id = ++requestId.current;
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setProducts([]);
        setSuggestions([]);
        setPagination(current => ({...current, total: 0, hasMore: false}));
      }
      setError('');
      try {
        const data = await searchCatalog({
          q: query.trim(),
          categoryId,
          minPrice,
          maxPrice,
          inStock: inStock || undefined,
          sort,
          page,
          limit: 20,
        });
        if (id !== requestId.current) return;
        setProducts(current =>
          append
            ? [...current, ...data.products.map(mapProduct)]
            : data.products.map(mapProduct),
        );
        setCategories(data.categories || []);
        setSuggestions(data.suggestions || []);
        setPagination(data.pagination);
      } catch (e) {
        if (id === requestId.current) setError(e.message);
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [categoryId, inStock, maxPrice, minPrice, query, sort],
  );
  useEffect(() => {
    const timer = setTimeout(() => fetchResults(), 350);
    return () => clearTimeout(timer);
  }, [fetchResults]);
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(timer);
  }, []);
  const clearFilters = () => {
    setCategoryId('');
    setMinPrice('');
    setMaxPrice('');
    setInStock(false);
    setSort('relevance');
  };
  const resetSearch = () => {
    setQuery('');
    clearFilters();
    setSuggestions([]);
    setFiltersOpen(false);
    inputRef.current?.focus();
  };
  const selectSuggestion = value => {
    setQuery(value);
    setSuggestions([]);
    inputRef.current?.blur();
  };
  const openProduct = product =>
    navigation.navigate('ProductDetails', { product });
  const renderProduct = ({ item }) => {
    const quantity =
      items.find(product => product.id === item.id)?.quantity || 0;
    const saved = favourites.some(product => product.id === item.id);
    return (
      <Pressable onPress={() => openProduct(item)} style={styles.productCard}>
        <View style={styles.visual}>
          {item.images?.[0] ? (
            <Image
              source={{ uri: item.images[0] }}
              resizeMode="contain"
              style={styles.productImage}
            />
          ) : (
            <Ionicons
              name="cube-outline"
              size={54}
              color={colors.primaryLight}
            />
          )}
          <Pressable onPress={() => toggleFavourite(item)} style={styles.heart}>
            <Ionicons
              name={saved ? 'heart' : 'heart-outline'}
              size={18}
              color={saved ? colors.accent : colors.primary}
            />
          </Pressable>
          {item.discountPercent > 0 && (
            <View style={styles.discount}>
              <Text style={styles.discountText}>
                {item.discountPercent}% OFF
              </Text>
            </View>
          )}
        </View>
        <Text numberOfLines={2} style={styles.productName}>
          {item.name}
        </Text>
        <Text numberOfLines={1} style={styles.category}>
          {item.category}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{item.price}</Text>
          {Boolean(item.oldPrice) && (
            <Text style={styles.oldPrice}>{item.oldPrice}</Text>
          )}
        </View>
        <CartQuantityControl
          compact
          quantity={quantity}
          onIncrease={() => addToCart(item)}
          onDecrease={() => updateQuantity(item.id, -1)}
          style={styles.cartControl}
        />
      </Pressable>
    );
  };
  const header = (
    <>
      <View style={styles.searchWrap}>
        <View style={styles.search}>
          <Ionicons name="search" size={21} color={colors.textMuted} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={() => {
              setSuggestions([]);
              inputRef.current?.blur();
            }}
            placeholder="Search products and categories"
            placeholderTextColor={colors.textMuted}
            autoCorrect={false}
            style={styles.input}
          />
          {Boolean(query) && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.textMuted}
              />
            </Pressable>
          )}
        </View>
        <Pressable
          onPress={() => setFiltersOpen(value => !value)}
          style={[
            styles.filterButton,
            (filtersOpen || activeFilters) && styles.filterButtonActive,
          ]}
        >
          <Ionicons
            name="options-outline"
            size={22}
            color={
              filtersOpen || activeFilters ? colors.background : colors.accent
            }
          />
          {activeFilters && <View style={styles.filterDot} />}
        </Pressable>
      </View>
      {Boolean(query.trim() && suggestions.length) && (
        <View style={styles.suggestions}>
          {suggestions.map(value => (
            <Pressable
              key={value}
              onPress={() => selectSuggestion(value)}
              style={styles.suggestion}
            >
              <Ionicons
                name="search-outline"
                size={17}
                color={colors.textMuted}
              />
              <Text numberOfLines={1} style={styles.suggestionText}>
                {value}
              </Text>
              <Ionicons
                name="arrow-up-outline"
                size={16}
                color={colors.textMuted}
                style={styles.suggestionArrow}
              />
            </Pressable>
          ))}
        </View>
      )}
      {filtersOpen && (
        <View style={styles.filterPanel}>
          <View style={styles.filterHead}>
            <Text style={styles.filterTitle}>Filter products</Text>
            {activeFilters && (
              <Pressable onPress={clearFilters}>
                <Text style={styles.clear}>Clear all</Text>
              </Pressable>
            )}
          </View>
          <Text style={styles.filterLabel}>Price range</Text>
          <View style={styles.priceInputs}>
            <TextInput
              value={minPrice}
              onChangeText={value => setMinPrice(value.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="Minimum"
              placeholderTextColor={colors.textMuted}
              style={styles.priceInput}
            />
            <Text style={styles.to}>to</Text>
            <TextInput
              value={maxPrice}
              onChangeText={value => setMaxPrice(value.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="Maximum"
              placeholderTextColor={colors.textMuted}
              style={styles.priceInput}
            />
          </View>
          <View style={styles.stockRow}>
            <View>
              <Text style={styles.filterLabel}>Available products only</Text>
              <Text style={styles.filterHint}>
                Hide items that are out of stock
              </Text>
            </View>
            <Switch
              value={inStock}
              onValueChange={setInStock}
              trackColor={{ false: colors.border, true: '#FFC7A8' }}
              thumbColor={inStock ? colors.accent : '#999'}
            />
          </View>
        </View>
      )}
      <Text style={styles.label}>Categories</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        <Pressable
          onPress={() => setCategoryId('')}
          style={[styles.chip, !categoryId && styles.chipActive]}
        >
          <Text style={[styles.chipText, !categoryId && styles.chipTextActive]}>
            All
          </Text>
        </Pressable>
        {categories.map(item => (
          <Pressable
            key={item.id}
            onPress={() => setCategoryId(item.id)}
            style={[styles.chip, categoryId === item.id && styles.chipActive]}
          >
            <Text
              style={[
                styles.chipText,
                categoryId === item.id && styles.chipTextActive,
              ]}
            >
              {item.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={styles.label}>Sort by</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {sortOptions.map(item => (
          <Pressable
            key={item.id}
            onPress={() => setSort(item.id)}
            style={[styles.chip, sort === item.id && styles.chipActive]}
          >
            <Text
              style={[
                styles.chipText,
                sort === item.id && styles.chipTextActive,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.resultHead}>
        <Text style={styles.resultTitle}>
          {query.trim() ? `Results for: ${query.trim()}` : 'Explore products'}
        </Text>
        <Text style={styles.resultCount}>{pagination.total} found</Text>
      </View>
    </>
  );
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={navigation.goBack} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <Text style={styles.title}>Search</Text>
        <View style={styles.space} />
      </View>
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        ListHeaderComponent={header}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        onEndReachedThreshold={0.3}
        onEndReached={() => {
          if (pagination.hasMore && !loadingMore)
            fetchResults(pagination.page + 1, true);
        }}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator color={colors.accent} style={styles.loader} />
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.empty}>
              <ActivityIndicator color={colors.accent} />
              <Text style={styles.emptyText}>Searching products...</Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name={error ? 'cloud-offline-outline' : 'search-outline'}
                  size={38}
                  color={colors.accent}
                />
              </View>
              <Text style={styles.emptyTitle}>
                {error ? 'Search unavailable' : 'No results found'}
              </Text>
              <Text style={styles.emptyText}>
                {error ||
                  (query.trim()
                    ? `We could not find any products matching "${query.trim()}". Check the spelling or try another search.`
                    : 'No products match the selected filters. Try clearing them.')}
              </Text>
              <Pressable
                onPress={() => (error ? fetchResults() : resetSearch())}
                style={styles.retry}
              >
                <Text style={styles.retryText}>
                  {error ? 'Try again' : 'Clear search & filters'}
                </Text>
              </Pressable>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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
  title: { color: colors.primary, fontSize: 19, fontWeight: '800' },
  space: { width: 40 },
  content: { padding: 16, paddingBottom: 40 },
  searchWrap: { flexDirection: 'row', alignItems: 'center' },
  search: {
    height: 52,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.background,
  },
  input: { flex: 1, marginHorizontal: 9, color: colors.text, fontSize: 13 },
  filterButton: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 9,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 16,
    backgroundColor: colors.background,
  },
  filterButtonActive: { backgroundColor: colors.accent },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.background,
  },
  suggestions: {
    marginTop: 8,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.background,
  },
  suggestion: {
    height: 45,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  suggestionText: { flex: 1, marginLeft: 9, color: colors.text, fontSize: 12 },
  suggestionArrow: { transform: [{ rotate: '45deg' }] },
  filterPanel: {
    marginTop: 10,
    padding: 15,
    borderRadius: 17,
    backgroundColor: colors.background,
  },
  filterHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  filterTitle: { color: colors.primary, fontSize: 15, fontWeight: '800' },
  clear: { color: colors.accent, fontSize: 11, fontWeight: '800' },
  filterLabel: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  priceInputs: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  priceInput: {
    height: 44,
    flex: 1,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    color: colors.text,
    fontSize: 11,
  },
  to: { marginHorizontal: 9, color: colors.textMuted, fontSize: 10 },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  filterHint: { marginTop: 3, color: colors.textMuted, fontSize: 9 },
  label: {
    marginTop: 18,
    marginBottom: 9,
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  chips: { paddingRight: 12 },
  chip: {
    marginRight: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.background,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipText: { color: colors.textMuted, fontSize: 10, fontWeight: '700' },
  chipTextActive: { color: colors.background },
  resultHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 23,
    marginBottom: 12,
  },
  resultTitle: {
    flex: 1,
    color: colors.primary,
    fontSize: 17,
    fontWeight: '800',
  },
  resultCount: { marginLeft: 8, color: colors.textMuted, fontSize: 10 },
  gridRow: { justifyContent: 'space-between' },
  productCard: {
    width: '48.5%',
    marginBottom: 14,
    paddingBottom: 11,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    backgroundColor: colors.background,
  },
  visual: {
    height: 132,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#EDF3FF',
  },
  productImage: { width: '100%', height: 116 },
  heart: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 31,
    height: 31,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.background,
  },
  discount: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: colors.accent,
  },
  discountText: { color: colors.background, fontSize: 8, fontWeight: '800' },
  productName: {
    minHeight: 36,
    marginTop: 9,
    paddingHorizontal: 10,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  category: { paddingHorizontal: 10, color: colors.textMuted, fontSize: 9 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 10,
  },
  price: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  oldPrice: {
    marginLeft: 5,
    color: colors.textMuted,
    fontSize: 9,
    textDecorationLine: 'line-through',
  },
  cartControl: { alignSelf: 'flex-end', marginTop: 8, marginRight: 9 },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 25 },
  emptyIcon: {
    width: 82,
    height: 82,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 41,
    backgroundColor: '#FFF0E8',
  },
  emptyTitle: {
    marginTop: 15,
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  emptyText: {
    marginTop: 7,
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
  },
  retry: {
    marginTop: 15,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.accent,
  },
  retryText: { color: colors.background, fontSize: 11, fontWeight: '800' },
  loader: { marginVertical: 18 },
});
