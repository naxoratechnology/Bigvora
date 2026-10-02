import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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

function DetailRow({ label, value, last = false }) {
  return (
    <View style={[styles.detailRow, !last && styles.divider]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text selectable style={styles.detailValue}>
        {value}
      </Text>
    </View>
  );
}

export default function AdminProductDetailsScreen({ navigation, route }) {
  const { products, fetchProduct, deleteProduct, refreshProducts } =
    useAdminData();
  const product = products.find(item => item.id === route.params.id);
  const [loading, setLoading] = useState(!product);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async refresh => {
      refresh ? setRefreshing(true) : setLoading(true);
      setError('');
      try {
        await fetchProduct(route.params.id);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetchProduct, route.params.id],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  const remove = () =>
    Alert.alert(
      'Delete product?',
      'This permanently removes the product from the catalogue.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (deleting || !product) return;
            setDeleting(true);
            setError('');
            try {
              await deleteProduct(product.id, product.version);
              navigation.goBack();
            } catch (requestError) {
              setError(requestError.message);
              if (requestError.status === 409) await refreshProducts();
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );

  if (loading && !product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={navigation.goBack} style={styles.back}>
            <Ionicons name={'arrow-back'} size={22} color={colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Product details</Text>
          <View style={styles.headerSpace} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size={'large'} color={colors.accent} />
          <Text style={styles.centerText}>Loading product...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons name={'cube-outline'} size={45} color={colors.accent} />
          <Text style={styles.emptyTitle}>Product not found</Text>
          <Text style={styles.centerText}>{error}</Text>
          <Pressable onPress={() => load(false)} style={styles.retry}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
          <Pressable onPress={navigation.goBack}>
            <Text style={styles.goBack}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const image = product.images?.[0] || product.image;
  const discount = Math.max(
    0,
    Math.round(
      ((Number(product.mrp) - Number(product.price)) /
        Math.max(Number(product.mrp), 1)) *
        100,
    ),
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={navigation.goBack} style={styles.back}>
          <Ionicons name={'arrow-back'} size={22} color={colors.primary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Product details</Text>
          <Text style={styles.headerSubtitle}>{product.sku}</Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('AddProduct', { id: product.id })}
          style={styles.headerEdit}
        >
          <Ionicons name={'create-outline'} size={20} color={colors.accent} />
        </Pressable>
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
              name={'alert-circle-outline'}
              size={18}
              color={'#C83E3E'}
            />
            <Text style={styles.errorText}>{error} Tap to refresh.</Text>
          </Pressable>
        )}

        <View style={styles.summaryCard}>
          {image ? (
            <Image
              source={{ uri: image }}
              resizeMode={'cover'}
              style={styles.productImage}
            />
          ) : (
            <View style={styles.imageEmpty}>
              <Ionicons
                name={'cube-outline'}
                size={37}
                color={colors.primaryLight}
              />
            </View>
          )}
          <View style={styles.summaryCopy}>
            <View style={styles.status}>
              <Text style={styles.statusText}>{product.status}</Text>
            </View>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.category}>{product.category}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{money(product.price)}</Text>
              {Number(product.mrp) > Number(product.price) && (
                <>
                  <Text style={styles.mrp}>{money(product.mrp)}</Text>
                  <Text style={styles.discount}>{discount}% off</Text>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={styles.quickActions}>
          <Pressable
            onPress={() =>
              navigation.navigate('AddProduct', { id: product.id })
            }
            style={styles.action}
          >
            <View style={styles.actionIcon}>
              <Ionicons
                name={'create-outline'}
                size={21}
                color={colors.accent}
              />
            </View>
            <Text style={styles.actionText}>Edit product</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              navigation.navigate('AdjustStock', { id: product.id })
            }
            style={styles.action}
          >
            <View style={styles.actionIcon}>
              <Ionicons
                name={'swap-vertical-outline'}
                size={21}
                color={colors.accent}
              />
            </View>
            <Text style={styles.actionText}>Adjust stock</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Product information</Text>
        <View style={styles.card}>
          <DetailRow label={'SKU'} value={product.sku} />
          <DetailRow label={'Category'} value={product.category} />
          <DetailRow label={'Selling price'} value={money(product.price)} />
          <DetailRow label={'MRP'} value={money(product.mrp)} />
          <DetailRow
            label={'Cost price'}
            value={money(product.costPrice)}
            last
          />
        </View>

        <Text style={styles.sectionTitle}>Inventory</Text>
        <View style={styles.card}>
          <DetailRow
            label={'Available stock'}
            value={`${product.stock} ${product.unit}`}
          />
          <DetailRow
            label={'Low-stock alert'}
            value={`${product.reorderLevel} ${product.unit}`}
          />
          <DetailRow label={'Current status'} value={product.status} />
          <DetailRow label={'Last updated'} value={product.updated} last />
        </View>

        <Text style={styles.sectionTitle}>Description</Text>
        <View style={styles.descriptionCard}>
          <Text style={styles.description}>{product.description}</Text>
        </View>

        {Boolean(product.rules?.length) && (
          <>
            <Text style={styles.sectionTitle}>Customer promises</Text>
            <View style={styles.card}>
              {product.rules.map((rule, index) => (
                <View
                  key={rule.id}
                  style={[
                    styles.ruleRow,
                    index < product.rules.length - 1 && styles.divider,
                  ]}
                >
                  <View style={styles.ruleIcon}>
                    <Ionicons
                      name={rule.icon || 'checkmark-circle-outline'}
                      size={21}
                      color={colors.accent}
                    />
                  </View>
                  <View style={styles.ruleCopy}>
                    <Text style={styles.ruleTitle}>{rule.title}</Text>
                    <Text style={styles.ruleText}>{rule.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <Pressable
          disabled={deleting}
          onPress={remove}
          style={styles.deleteButton}
        >
          <Ionicons name={'trash-outline'} size={19} color={'#C83E3E'} />
          <Text style={styles.deleteText}>
            {deleting ? 'Deleting...' : 'Delete product'}
          </Text>
        </Pressable>
      </ScrollView>
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
  headerEdit: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#FFF0E8',
  },
  content: { padding: 20, paddingBottom: 45 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  centerText: { marginTop: 9, color: colors.textMuted, fontSize: 11 },
  emptyTitle: {
    marginTop: 12,
    color: colors.primary,
    fontSize: 17,
    fontWeight: '800',
  },
  retry: {
    marginTop: 17,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: colors.accent,
  },
  retryText: { color: colors.background, fontSize: 10, fontWeight: '800' },
  goBack: {
    marginTop: 16,
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
    padding: 12,
    borderRadius: 13,
    backgroundColor: '#FFF1F1',
  },
  errorText: { flex: 1, marginLeft: 7, color: '#C83E3E', fontSize: 9 },
  summaryCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  productImage: {
    width: 104,
    height: 118,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  imageEmpty: {
    width: 104,
    height: 118,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#EDF2FF',
  },
  summaryCopy: { flex: 1, marginLeft: 14 },
  status: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#EAF7F1',
  },
  statusText: { color: colors.primary, fontSize: 8, fontWeight: '800' },
  productName: {
    marginTop: 9,
    color: colors.primary,
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '800',
  },
  category: { marginTop: 4, color: colors.textMuted, fontSize: 10 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  price: { color: colors.primary, fontSize: 17, fontWeight: '800' },
  mrp: {
    marginLeft: 7,
    color: colors.textMuted,
    fontSize: 9,
    textDecorationLine: 'line-through',
  },
  discount: { marginLeft: 7, color: '#179A63', fontSize: 8, fontWeight: '800' },
  quickActions: { flexDirection: 'row', marginTop: 11, gap: 10 },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 15,
    backgroundColor: colors.background,
  },
  actionIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: '#FFF0E8',
  },
  actionText: {
    marginLeft: 8,
    color: colors.primary,
    fontSize: 9,
    fontWeight: '800',
  },
  sectionTitle: {
    marginTop: 22,
    marginBottom: 10,
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  card: {
    overflow: 'hidden',
    paddingHorizontal: 15,
    borderRadius: 18,
    backgroundColor: colors.background,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  detailLabel: { color: colors.textMuted, fontSize: 10 },
  detailValue: {
    flex: 1,
    marginLeft: 18,
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'right',
  },
  descriptionCard: {
    padding: 15,
    borderRadius: 18,
    backgroundColor: colors.background,
  },
  description: { color: colors.text, fontSize: 10, lineHeight: 17 },
  ruleRow: { flexDirection: 'row', paddingVertical: 14 },
  ruleIcon: {
    width: 39,
    height: 39,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#FFF0E8',
  },
  ruleCopy: { flex: 1, marginLeft: 10 },
  ruleTitle: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  ruleText: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 14,
  },
  deleteButton: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    borderWidth: 1,
    borderColor: '#F1CACA',
    borderRadius: 14,
    backgroundColor: '#FFF7F7',
  },
  deleteText: {
    marginLeft: 7,
    color: '#C83E3E',
    fontSize: 10,
    fontWeight: '800',
  },
});
