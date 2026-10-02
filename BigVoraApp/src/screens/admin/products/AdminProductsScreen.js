import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAdminData } from '../../../features/admin/AdminDataContext';
import colors from '../../../theme/colors';

const filters = ['All', 'In stock', 'Low stock', 'Out of stock'];

export default function AdminProductsScreen({ navigation }) {
  const { products, productsLoading, productsError, refreshProducts } =
    useAdminData();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const visibleProducts = useMemo(() => {
    const search = query.trim().toLowerCase();
    return products.filter(
      product =>
        (filter === 'All' || product.status === filter) &&
        `${product.name} ${product.category} ${product.sku}`
          .toLowerCase()
          .includes(search),
    );
  }, [products, query, filter]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Products</Text>
          <Text style={styles.subtitle}>
            {products.length} product{products.length === 1 ? '' : 's'} in
            catalogue
          </Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('AddProduct')}
          style={styles.add}
        >
          <Ionicons name={'add'} size={21} color={colors.background} />
          <Text style={styles.addText}>Add</Text>
        </Pressable>
      </View>

      <View style={styles.search}>
        <Ionicons name={'search-outline'} size={20} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={'Search name, category or SKU'}
          placeholderTextColor={colors.textMuted}
          returnKeyType={'search'}
          style={styles.input}
        />
        {Boolean(query) && (
          <Pressable onPress={() => setQuery('')} style={styles.clear}>
            <Ionicons
              name={'close-circle'}
              size={19}
              color={colors.textMuted}
            />
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        style={styles.filterScroll}
        contentContainerStyle={styles.filters}
        showsHorizontalScrollIndicator={false}
      >
        {filters.map(item => (
          <Pressable
            key={item}
            onPress={() => setFilter(item)}
            style={[styles.filter, filter === item && styles.filterActive]}
          >
            <Text
              style={[
                styles.filterText,
                filter === item && styles.filterTextActive,
              ]}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.resultRow}>
        <Text style={styles.resultTitle}>
          {filter === 'All' ? 'All products' : filter}
        </Text>
        <Text style={styles.resultCount}>
          {visibleProducts.length} result
          {visibleProducts.length === 1 ? '' : 's'}
        </Text>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={productsLoading}
            onRefresh={refreshProducts}
            colors={[colors.accent]}
            tintColor={colors.accent}
          />
        }
        contentContainerStyle={[
          styles.list,
          !visibleProducts.length && styles.emptyList,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {productsLoading && !products.length && (
          <View style={styles.state}>
            <ActivityIndicator size={'large'} color={colors.accent} />
            <Text style={styles.stateText}>Loading products...</Text>
          </View>
        )}

        {Boolean(productsError) && !productsLoading && (
          <View style={styles.state}>
            <View style={styles.errorIcon}>
              <Ionicons
                name={'cloud-offline-outline'}
                size={30}
                color={'#C83E3E'}
              />
            </View>
            <Text style={styles.stateTitle}>Unable to load products</Text>
            <Text style={styles.stateText}>{productsError}</Text>
            <Pressable onPress={refreshProducts} style={styles.retry}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        )}

        {!productsLoading && !productsError && !visibleProducts.length && (
          <View style={styles.state}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name={query ? 'search-outline' : 'cube-outline'}
                size={31}
                color={colors.accent}
              />
            </View>
            <Text style={styles.stateTitle}>No products found</Text>
            <Text style={styles.stateText}>
              {query
                ? 'Try another product name, category or SKU.'
                : 'No products match this stock status.'}
            </Text>
          </View>
        )}

        {!productsError &&
          visibleProducts.map(product => {
            const image = product.images?.[0] || product.image;
            const statusStyle =
              product.status === 'In stock'
                ? styles.inStock
                : product.status === 'Low stock'
                ? styles.lowStock
                : styles.outStock;
            return (
              <Pressable
                key={product.id}
                onPress={() =>
                  navigation.navigate('AdminProductDetails', {
                    id: product.id,
                  })
                }
                style={({ pressed }) => [
                  styles.card,
                  pressed && styles.cardPressed,
                ]}
              >
                {image ? (
                  <Image
                    source={{ uri: image }}
                    resizeMode={'cover'}
                    style={styles.image}
                  />
                ) : (
                  <View style={styles.imageEmpty}>
                    <Ionicons
                      name={'cube-outline'}
                      size={25}
                      color={colors.primaryLight}
                    />
                  </View>
                )}
                <View style={styles.copy}>
                  <Text numberOfLines={1} style={styles.name}>
                    {product.name}
                  </Text>
                  <Text numberOfLines={1} style={styles.category}>
                    {product.category || 'Uncategorised'}
                  </Text>
                  <View style={styles.skuRow}>
                    <Text style={styles.skuLabel}>SKU:</Text>
                    <Text numberOfLines={1} style={styles.sku}>
                      {product.sku || 'Not assigned'}
                    </Text>
                  </View>
                </View>
                <View style={styles.trailing}>
                  <View style={[styles.status, statusStyle]}>
                    <View style={[styles.statusDot, statusStyle]} />
                    <Text style={styles.statusText}>{product.status}</Text>
                  </View>
                  <Ionicons
                    name={'chevron-forward'}
                    size={18}
                    color={colors.textMuted}
                  />
                </View>
              </Pressable>
            );
          })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  headerCopy: { flex: 1 },
  title: { color: colors.primary, fontSize: 27, fontWeight: '800' },
  subtitle: { marginTop: 3, color: colors.textMuted, fontSize: 10 },
  add: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 13,
    backgroundColor: colors.accent,
  },
  addText: {
    marginLeft: 4,
    color: colors.background,
    fontSize: 11,
    fontWeight: '800',
  },
  search: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.background,
  },
  input: { flex: 1, marginLeft: 9, color: colors.text, fontSize: 12 },
  clear: { padding: 4 },
  filterScroll: { flexGrow: 0 },
  filters: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    gap: 7,
  },
  filter: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    backgroundColor: colors.background,
  },
  filterActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  filterText: { color: colors.textMuted, fontSize: 9, fontWeight: '700' },
  filterTextActive: { color: colors.background },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 2,
    marginBottom: 8,
  },
  resultTitle: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  resultCount: { color: colors.textMuted, fontSize: 8 },
  list: { paddingHorizontal: 20, paddingBottom: 110 },
  emptyList: { flexGrow: 1 },
  card: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 11,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    backgroundColor: colors.background,
  },
  cardPressed: { opacity: 0.86 },
  image: {
    width: 62,
    height: 62,
    borderRadius: 13,
    backgroundColor: colors.surface,
  },
  imageEmpty: {
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#EDF2FF',
  },
  copy: { flex: 1, marginLeft: 11 },
  name: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  category: { marginTop: 4, color: colors.textMuted, fontSize: 9 },
  skuRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  skuLabel: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: '800',
  },
  sku: {
    flex: 1,
    marginLeft: 3,
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: '600',
  },
  trailing: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 55,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
  },
  statusDot: {
    width: 6,
    height: 6,
    marginRight: 5,
    borderRadius: 3,
  },
  inStock: { backgroundColor: '#EAF7F1' },
  lowStock: { backgroundColor: '#FFF3E5' },
  outStock: { backgroundColor: '#FFF0F0' },
  statusText: { color: colors.primary, fontSize: 7, fontWeight: '800' },
  state: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 45,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  errorIcon: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#FFF1F1',
  },
  emptyIcon: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: '#FFF0E8',
  },
  stateTitle: {
    marginTop: 13,
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  stateText: {
    marginTop: 7,
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
  },
  retry: {
    marginTop: 15,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 11,
    backgroundColor: '#FFF0E8',
  },
  retryText: { color: colors.accent, fontSize: 10, fontWeight: '800' },
});
