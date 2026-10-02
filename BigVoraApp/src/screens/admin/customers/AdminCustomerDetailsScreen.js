import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
const date = value =>
  value
    ? new Date(value).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Not available';
const words = value =>
  String(value || 'Not available')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());

function DetailRow({ label, value, last = false }) {
  return (
    <View style={[styles.detailRow, !last && styles.divider]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text selectable style={styles.detailValue}>
        {value || 'Not available'}
      </Text>
    </View>
  );
}

export default function AdminCustomerDetailsScreen({ navigation, route }) {
  const { customers, fetchCustomer } = useAdminData();
  const cached = customers.find(item => item.id === route.params.id);
  const [customer, setCustomer] = useState(cached?.addresses ? cached : null);
  const [loading, setLoading] = useState(!customer);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async refresh => {
      refresh ? setRefreshing(true) : setLoading(true);
      setError('');
      try {
        setCustomer(await fetchCustomer(route.params.id));
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetchCustomer, route.params.id],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  if (loading && !customer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={navigation.goBack} style={styles.back}>
            <Ionicons name={'arrow-back'} size={22} color={colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Customer details</Text>
          <View style={styles.headerSpace} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size={'large'} color={colors.accent} />
          <Text style={styles.centerText}>Loading customer details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!customer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons
            name={'person-circle-outline'}
            size={48}
            color={colors.accent}
          />
          <Text style={styles.emptyTitle}>Unable to load customer</Text>
          <Text style={styles.centerText}>
            {error || 'Customer not found.'}
          </Text>
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={navigation.goBack} style={styles.back}>
          <Ionicons name={'arrow-back'} size={22} color={colors.primary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Customer details</Text>
          <Text style={styles.headerSubtitle}>
            Joined {date(customer.joinedAt)}
          </Text>
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

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {customer.name
                .split(' ')
                .slice(0, 2)
                .map(part => part[0])
                .join('')
                .toUpperCase()}
            </Text>
          </View>
          <Text style={styles.customerName}>{customer.name}</Text>
          <Text style={styles.customerContact}>
            {customer.email || customer.mobile || 'No contact information'}
          </Text>
          <View
            style={[
              styles.accountBadge,
              !customer.isActive && styles.inactiveBadge,
            ]}
          >
            <View
              style={[
                styles.accountDot,
                !customer.isActive && styles.inactiveDot,
              ]}
            />
            <Text style={styles.accountText}>
              {customer.isActive ? 'Active account' : 'Inactive account'}
            </Text>
          </View>
        </View>

        <View style={styles.stats}>
          <View style={styles.statCard}>
            <Ionicons
              name={'receipt-outline'}
              size={21}
              color={colors.accent}
            />
            <Text style={styles.statValue}>{customer.orderCount}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name={'wallet-outline'} size={21} color={colors.accent} />
            <Text numberOfLines={1} style={styles.statValue}>
              {money(customer.totalSpent)}
            </Text>
            <Text style={styles.statLabel}>Total spent</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons
              name={'analytics-outline'}
              size={21}
              color={colors.accent}
            />
            <Text numberOfLines={1} style={styles.statValue}>
              {money(customer.averageOrderValue)}
            </Text>
            <Text style={styles.statLabel}>Avg. order</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Account information</Text>
        <View style={styles.card}>
          <DetailRow label={'Full name'} value={customer.name} />
          <DetailRow label={'Email'} value={customer.email} />
          <DetailRow label={'Mobile'} value={customer.mobile} />
          <DetailRow label={'Last order'} value={date(customer.lastOrderAt)} />
          <DetailRow
            label={'Member since'}
            value={date(customer.joinedAt)}
            last
          />
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Saved addresses</Text>
          <Text style={styles.countBadge}>
            {customer.addresses?.length || 0}
          </Text>
        </View>
        {customer.addresses?.length ? (
          customer.addresses.map(address => (
            <View key={address.id} style={styles.addressCard}>
              <View style={styles.addressIcon}>
                <Ionicons
                  name={
                    address.label === 'Work'
                      ? 'business-outline'
                      : 'home-outline'
                  }
                  size={21}
                  color={colors.accent}
                />
              </View>
              <View style={styles.addressCopy}>
                <View style={styles.addressHead}>
                  <Text style={styles.addressLabel}>{address.label}</Text>
                  {address.isDefault && (
                    <Text style={styles.defaultBadge}>DEFAULT</Text>
                  )}
                </View>
                <Text style={styles.addressName}>
                  {address.name} · {address.phone}
                </Text>
                <Text style={styles.addressText}>
                  {[address.line, address.city, address.state, address.pincode]
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons
              name={'location-outline'}
              size={29}
              color={colors.textMuted}
            />
            <Text style={styles.emptyText}>No saved addresses</Text>
          </View>
        )}

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Recent orders</Text>
          <Text style={styles.countBadge}>
            {customer.recentOrders?.length || 0}
          </Text>
        </View>
        {customer.recentOrders?.length ? (
          <View style={styles.card}>
            {customer.recentOrders.map((order, index) => (
              <Pressable
                key={order.id}
                onPress={() =>
                  navigation.navigate('AdminOrderDetails', { id: order.id })
                }
                style={[
                  styles.orderRow,
                  index < customer.recentOrders.length - 1 && styles.divider,
                ]}
              >
                <View style={styles.orderIcon}>
                  <Ionicons
                    name={'receipt-outline'}
                    size={20}
                    color={colors.accent}
                  />
                </View>
                <View style={styles.orderCopy}>
                  <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                  <Text style={styles.orderMeta}>
                    {order.itemCount} item{order.itemCount === 1 ? '' : 's'} ·{' '}
                    {date(order.createdAt)}
                  </Text>
                </View>
                <View style={styles.orderRight}>
                  <Text style={styles.orderTotal}>{money(order.total)}</Text>
                  <Text style={styles.orderStatus}>{words(order.status)}</Text>
                </View>
                <Ionicons
                  name={'chevron-forward'}
                  size={17}
                  color={colors.textMuted}
                />
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons
              name={'cube-outline'}
              size={29}
              color={colors.textMuted}
            />
            <Text style={styles.emptyText}>No orders placed yet</Text>
          </View>
        )}
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
  content: { padding: 20, paddingBottom: 45 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  centerText: {
    marginTop: 9,
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  emptyTitle: {
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
  goBack: {
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
  profileCard: {
    alignItems: 'center',
    padding: 21,
    borderRadius: 22,
    backgroundColor: colors.primary,
  },
  avatar: {
    width: 66,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.accent,
  },
  avatarText: { color: colors.background, fontSize: 23, fontWeight: '800' },
  customerName: {
    marginTop: 12,
    color: colors.background,
    fontSize: 19,
    fontWeight: '800',
  },
  customerContact: { marginTop: 4, color: '#CAD4E1', fontSize: 9 },
  accountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(58,190,137,0.18)',
  },
  inactiveBadge: { backgroundColor: 'rgba(255,255,255,0.12)' },
  accountDot: {
    width: 7,
    height: 7,
    marginRight: 6,
    borderRadius: 4,
    backgroundColor: '#55D6A3',
  },
  inactiveDot: { backgroundColor: '#CAD4E1' },
  accountText: { color: colors.background, fontSize: 8, fontWeight: '800' },
  stats: { flexDirection: 'row', marginTop: 13, gap: 9 },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 5,
    borderRadius: 16,
    backgroundColor: colors.background,
  },
  statValue: {
    marginTop: 7,
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  statLabel: { marginTop: 3, color: colors.textMuted, fontSize: 8 },
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
  countBadge: {
    marginTop: 13,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9,
    backgroundColor: '#FFF0E8',
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
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  detailLabel: { color: colors.textMuted, fontSize: 10 },
  detailValue: {
    flex: 1,
    marginLeft: 20,
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'right',
  },
  addressCard: {
    flexDirection: 'row',
    marginBottom: 10,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.background,
  },
  addressIcon: {
    width: 43,
    height: 43,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#FFF0E8',
  },
  addressCopy: { flex: 1, marginLeft: 11 },
  addressHead: { flexDirection: 'row', alignItems: 'center' },
  addressLabel: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  defaultBadge: {
    marginLeft: 7,
    color: '#179A63',
    fontSize: 7,
    fontWeight: '800',
  },
  addressName: {
    marginTop: 5,
    color: colors.primary,
    fontSize: 9,
    fontWeight: '700',
  },
  addressText: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 14,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 25,
    borderRadius: 18,
    backgroundColor: colors.background,
  },
  emptyText: { marginTop: 8, color: colors.textMuted, fontSize: 10 },
  orderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  orderIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#FFF0E8',
  },
  orderCopy: { flex: 1, marginLeft: 10 },
  orderNumber: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  orderMeta: { marginTop: 4, color: colors.textMuted, fontSize: 8 },
  orderRight: { alignItems: 'flex-end', marginRight: 8 },
  orderTotal: { color: colors.primary, fontSize: 10, fontWeight: '800' },
  orderStatus: {
    marginTop: 4,
    color: colors.accent,
    fontSize: 8,
    fontWeight: '700',
  },
});
