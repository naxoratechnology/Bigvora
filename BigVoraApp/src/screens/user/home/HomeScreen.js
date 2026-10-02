import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../../../features/cart/CartContext';
import { request } from '../../../services/api/client';
import colors from '../../../theme/colors';
import CartQuantityControl from '../../../components/cart/CartQuantityControl';

function SectionHeader({ title, onPress }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable hitSlop={8} onPress={onPress}>
        <Text style={styles.seeAll}>See all</Text>
      </Pressable>
    </View>
  );
}

function HomeScreen({ navigation }) {
  const { items, addToCart, updateQuantity, favourites, toggleFavourite } =
    useCart();
  const { width } = useWindowDimensions();
  const carouselRef = useRef(null);
  const [activeBanner, setActiveBanner] = useState(0);
  const [banners, setBanners] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [priceFilter, setPriceFilter] = useState('All');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [catalogError, setCatalogError] = useState('');
  const loadCatalog = async () => {
    try {
      const data = await request('/catalog/home');
      setCategories(
        data.categories.map(x => ({
          ...x,
          title: x.name,
          icon: 'grid-outline',
          color: '#FFF0E8',
        })),
      );
      setProducts(
        data.products.map(x => ({
          ...x,
          priceValue: x.price,
          price: '₹' + Number(x.price).toLocaleString('en-IN'),
          oldPrice: '',
          icon: 'cube-outline',
          tint: '#EAF1FF',
        })),
      );
      setBanners(
        (data.banners || [])
          .filter(item => Boolean(item.image))
          .map(item => ({ id: item.id, image: item.image })),
      );
      setActiveBanner(0);
      setCatalogError('');
    } catch (e) {
      setCatalogError(e.message);
    }
  };
  useEffect(() => {
    void loadCatalog();
  }, []);
  const bannerWidth = width - 40;
  const searchResults = products.filter(product => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase());
    const matchesPrice =
      priceFilter === 'All' ||
      (priceFilter === 'Under ₹1,000'
        ? product.priceValue < 1000
        : product.priceValue < 1500);
    return matchesSearch && matchesPrice;
  });

  const openCategories = () => navigation.getParent()?.navigate('Categories');
  const openProduct = product =>
    navigation.navigate('ProductDetails', { product });

  useEffect(() => {
    if (banners.length < 2) return undefined;
    const timer = setInterval(() => {
      setActiveBanner(current => {
        const next = (current + 1) % banners.length;
        carouselRef.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length, width]);

  const handleCarouselScroll = event => {
    setActiveBanner(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Image
              accessibilityLabel="Big Vora logo"
              resizeMode="contain"
              source={require('../../../assets/logo-transparent.png')}
              style={styles.logo}
            />
            <View>
              <Text style={styles.deliverLabel}>Deliver to</Text>
              <Pressable
                onPress={() => navigation.navigate('AddAddress')}
                style={styles.locationRow}
              >
                <Ionicons name="location" size={15} color={colors.accent} />
                <Text style={styles.locationText}>Your location</Text>
                <Ionicons
                  name="chevron-down"
                  size={14}
                  color={colors.primary}
                />
              </Pressable>
            </View>
          </View>
          <Pressable
            accessibilityLabel="Notifications"
            onPress={() => navigation.navigate('Notifications')}
            style={styles.headerButton}
          >
            <Ionicons
              name="notifications-outline"
              size={23}
              color={colors.primary}
            />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={21} color={colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() =>
              navigation.navigate('Search', { query: searchQuery })
            }
            placeholder="Search products, categories and more"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
          <View style={styles.searchDivider} />
          <Pressable
            hitSlop={10}
            onPress={() => setFilterOpen(value => !value)}
          >
            <Ionicons name="options-outline" size={21} color={colors.accent} />
          </Pressable>
        </View>

        {filterOpen && (
          <View style={styles.filterRow}>
            {['All', 'Under ₹1,000', 'Under ₹1,500'].map(filter => (
              <Pressable
                key={filter}
                onPress={() => setPriceFilter(filter)}
                style={[
                  styles.filterChip,
                  priceFilter === filter && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    priceFilter === filter && styles.filterTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {Boolean(searchQuery.trim()) && (
          <View style={styles.searchResults}>
            <View style={styles.searchResultHeader}>
              <Text style={styles.searchResultTitle}>Search results</Text>
              <Text style={styles.searchResultCount}>
                {searchResults.length} found
              </Text>
            </View>
            {searchResults.length ? (
              searchResults.map(product => (
                <Pressable
                  key={product.id}
                  onPress={() => openProduct(product)}
                  style={styles.searchResultItem}
                >
                  <View
                    style={[
                      styles.searchResultIcon,
                      { backgroundColor: product.tint },
                    ]}
                  >
                    <Ionicons
                      name={product.icon}
                      size={27}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.searchResultCopy}>
                    <Text style={styles.searchResultName}>{product.name}</Text>
                    <Text style={styles.searchResultPrice}>
                      {product.price}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.textMuted}
                  />
                </Pressable>
              ))
            ) : (
              <Text style={styles.noResults}>
                No matching products. Try another search.
              </Text>
            )}
          </View>
        )}

        <ScrollView
          ref={carouselRef}
          horizontal
          pagingEnabled
          decelerationRate="fast"
          onMomentumScrollEnd={handleCarouselScroll}
          showsHorizontalScrollIndicator={false}
          style={[styles.carousel, !banners.length && styles.hidden]}
          contentContainerStyle={styles.carouselContent}
        >
          {banners.map(banner => (
            <View key={banner.id} style={{ width }}>
              <View
                style={[
                  styles.banner,
                  {
                    width: bannerWidth,
                  },
                ]}
              >
                {banner.image && (
                  <Image
                    source={{ uri: banner.image }}
                    resizeMode="cover"
                    style={styles.bannerImage}
                  />
                )}
                <View style={styles.bannerCopy}>
                  <Text
                    style={[
                      styles.bannerEyebrow,
                      { color: banner.accentColor },
                    ]}
                  >
                    {banner.eyebrow}
                  </Text>
                  <Text style={styles.bannerTitle}>{banner.title}</Text>
                  {Boolean(banner.subtitle) && (
                    <Text numberOfLines={2} style={styles.bannerSubtitle}>
                      {banner.subtitle}
                    </Text>
                  )}
                  {Boolean(banner.action) && (
                    <Pressable
                      style={[
                        styles.bannerButton,
                        { backgroundColor: banner.accentColor },
                      ]}
                    >
                      <Text style={styles.bannerButtonText}>
                        {banner.action}
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={15}
                        color={colors.background}
                      />
                    </Pressable>
                  )}
                </View>
                <View
                  style={[
                    styles.bannerGlow,
                    { backgroundColor: banner.accentColor },
                  ]}
                />
                {!banner.image && (
                  <Ionicons
                    name={banner.icon || 'images'}
                    size={104}
                    color={banner.accentColor}
                    style={styles.bannerIcon}
                  />
                )}
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={[styles.pagination, !banners.length && styles.hidden]}>
          {banners.map((banner, index) => (
            <View
              key={banner.id}
              style={[
                styles.paginationDot,
                index === activeBanner && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>

        {Boolean(catalogError) && (
          <Pressable onPress={loadCatalog}>
            <Text style={styles.noResults}>{catalogError} Tap to retry.</Text>
          </Pressable>
        )}
        <SectionHeader title="Shop by category" onPress={openCategories} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
        >
          {categories.map(category => (
            <Pressable
              key={category.id}
              onPress={() =>
                navigation.navigate('CategoryProducts', {
                  products,
                  categoryId: category.id,
                  title: category.title,
                })
              }
              style={styles.categoryItem}
            >
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: category.color },
                ]}
              >
                {category.image ? (
                  <Image
                    source={{ uri: category.image }}
                    style={{ width: 54, height: 54, borderRadius: 16 }}
                  />
                ) : (
                  <Ionicons
                    name={category.icon}
                    size={27}
                    color={colors.primary}
                  />
                )}
              </View>
              <Text numberOfLines={1} style={styles.categoryTitle}>
                {category.title}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <SectionHeader
          title="Popular products"
          onPress={() =>
            navigation.navigate('CategoryProducts', {
              products,
              categoryId: 'popular',
              title: 'Popular products',
            })
          }
        />
        <View style={styles.productGrid}>
          {products.map(product => (
            <Pressable
              key={product.id}
              onPress={() => openProduct(product)}
              style={styles.productCard}
            >
              <View
                style={[
                  styles.productVisual,
                  { backgroundColor: product.tint },
                ]}
              >
                {product.images?.[0] ? (
                  <Image
                    source={{ uri: product.images[0] }}
                    resizeMode="contain"
                    style={{ width: '100%', height: 100 }}
                  />
                ) : (
                  <Ionicons
                    name={product.icon}
                    size={58}
                    color={colors.primaryLight}
                  />
                )}
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
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>SALE</Text>
                </View>
              </View>
              <Text numberOfLines={2} style={styles.productName}>
                {product.name}
              </Text>
              <View style={styles.priceRow}>
                <Text style={styles.productPrice}>{product.price}</Text>
                <Text style={styles.oldPrice}>{product.oldPrice}</Text>
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

        <SectionHeader
          title="New arrivals"
          onPress={() =>
            navigation.navigate('CategoryProducts', {
              products,
              categoryId: 'new',
              title: 'New arrivals',
            })
          }
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.compactRow}
        >
          {[...products].reverse().map(product => (
            <Pressable
              key={`new-${product.id}`}
              onPress={() => openProduct(product)}
              style={styles.compactCard}
            >
              <View
                style={[
                  styles.compactVisual,
                  { backgroundColor: product.tint },
                ]}
              >
                {product.images?.[0] ? (
                  <Image
                    source={{ uri: product.images[0] }}
                    resizeMode="contain"
                    style={{ width: '100%', height: 100 }}
                  />
                ) : (
                  <Ionicons
                    name={product.icon}
                    size={43}
                    color={colors.primaryLight}
                  />
                )}
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              </View>
              <Text numberOfLines={1} style={styles.compactName}>
                {product.name}
              </Text>
              <Text style={styles.compactPrice}>{product.price}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.dealStrip}>
          <View>
            <Text style={styles.dealEyebrow}>LIMITED TIME</Text>
            <Text style={styles.dealTitle}>Weekend deals</Text>
            <Text style={styles.dealText}>
              Extra savings on selected products
            </Text>
          </View>
          <Pressable
            onPress={() =>
              navigation.navigate('CategoryProducts', {
                products,
                categoryId: 'deals',
                title: 'Weekend deals',
              })
            }
            style={styles.dealButton}
          >
            <Text style={styles.dealButtonText}>View deals</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  pageContent: { paddingBottom: 116 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 48, height: 48, marginRight: 10 },
  deliverLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '500' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  locationText: {
    marginHorizontal: 3,
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  headerButton: {
    width: 43,
    height: 43,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.background,
    backgroundColor: colors.accent,
  },
  searchBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, marginLeft: 10, color: colors.text, fontSize: 14 },
  searchDivider: {
    width: 1,
    height: 24,
    marginHorizontal: 12,
    backgroundColor: colors.border,
  },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 12 },
  filterChip: {
    marginRight: 8,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    backgroundColor: colors.background,
  },
  filterChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  filterText: { color: colors.textMuted, fontSize: 10, fontWeight: '700' },
  filterTextActive: { color: colors.background },
  searchResults: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.background,
  },
  searchResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  searchResultTitle: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  searchResultCount: { color: colors.textMuted, fontSize: 10 },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
  },
  searchResultIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  searchResultCopy: { flex: 1, marginLeft: 10 },
  searchResultName: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  searchResultPrice: {
    marginTop: 3,
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
  },
  noResults: {
    paddingVertical: 15,
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  carousel: { marginTop: 20 },
  hidden: { display: 'none' },
  carouselContent: { alignItems: 'center' },
  banner: {
    height: 190,
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: 24,
    padding: 0,
    backgroundColor: 'transparent',
  },
  bannerCopy: { display: 'none' },
  bannerImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 1,
  },
  bannerEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  bannerTitle: {
    marginTop: 8,
    color: colors.background,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  bannerSubtitle: {
    maxWidth: '68%',
    marginTop: 5,
    color: '#E7ECF3',
    fontSize: 9,
    lineHeight: 13,
  },
  bannerButton: {
    width: 106,
    height: 35,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 17,
    borderRadius: 18,
    backgroundColor: colors.accent,
  },
  bannerButtonText: {
    marginRight: 6,
    color: colors.background,
    fontSize: 12,
    fontWeight: '700',
  },
  bannerGlow: {
    display: 'none',
    position: 'absolute',
    width: 180,
    height: 180,
    right: -48,
    bottom: -50,
    borderRadius: 90,
    opacity: 0.2,
  },
  bannerIcon: {
    display: 'none',
    position: 'absolute',
    right: 18,
    bottom: 23,
    opacity: 0.95,
    transform: [{ rotate: '-8deg' }],
  },
  pagination: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  paginationDot: {
    width: 6,
    height: 6,
    marginHorizontal: 3,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  paginationDotActive: { width: 20, backgroundColor: colors.accent },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 25,
    marginBottom: 14,
    paddingHorizontal: 20,
  },
  sectionTitle: { color: colors.primary, fontSize: 19, fontWeight: '800' },
  seeAll: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  categoriesRow: { paddingHorizontal: 16 },
  categoryItem: { width: 78, alignItems: 'center', marginHorizontal: 3 },
  categoryIcon: {
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  categoryTitle: {
    width: 76,
    marginTop: 8,
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
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
    height: 138,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 17,
    borderTopRightRadius: 17,
  },
  heartButton: {
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
  discountText: { color: colors.background, fontSize: 9, fontWeight: '800' },
  productName: {
    minHeight: 38,
    marginTop: 11,
    paddingHorizontal: 11,
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
  },
  productPrice: { color: colors.primary, fontSize: 15, fontWeight: '800' },
  oldPrice: {
    marginLeft: 6,
    color: colors.textMuted,
    fontSize: 10,
    textDecorationLine: 'line-through',
  },
  addButton: { position: 'absolute', right: 9, bottom: 8 },
  compactRow: { paddingHorizontal: 16 },
  compactCard: {
    width: 145,
    marginHorizontal: 4,
    paddingBottom: 11,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    backgroundColor: colors.background,
  },
  compactVisual: {
    height: 105,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  newBadgeText: { color: colors.background, fontSize: 8, fontWeight: '800' },
  compactName: {
    marginTop: 9,
    paddingHorizontal: 10,
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  compactPrice: {
    marginTop: 5,
    paddingHorizontal: 10,
    color: colors.accent,
    fontSize: 13,
    fontWeight: '800',
  },
  dealStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 26,
    padding: 18,
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  dealEyebrow: {
    color: colors.accentLight,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  dealTitle: {
    marginTop: 5,
    color: colors.background,
    fontSize: 18,
    fontWeight: '800',
  },
  dealText: { marginTop: 4, color: '#C8D3E2', fontSize: 9 },
  dealButton: {
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.accent,
  },
  dealButtonText: { color: colors.background, fontSize: 10, fontWeight: '800' },
});

export default HomeScreen;
