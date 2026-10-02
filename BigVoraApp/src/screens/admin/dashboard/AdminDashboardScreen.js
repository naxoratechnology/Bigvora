import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useAuth } from '../../../features/auth/AuthContext';
import { getDashboard } from '../../../services/admin/dashboard.service';
import colors from '../../../theme/colors';

const money = value => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const words = value =>
  String(value || 'Pending')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());

export default function AdminDashboardScreen({ navigation }) {
  const { user, token, signOut } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async refresh => {
      refresh ? setRefreshing(true) : setLoading(true);
      setError('');
      try {
        setDashboard(await getDashboard(token));
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (token) load(false);
  }, [token, load]);

  const chartHeights = useMemo(() => {
    const values = dashboard?.salesChart?.map(item => Number(item.value)) || [];
    const maximum = Math.max(...values, 1);
    return values.map(value =>
      value === 0 ? 8 : Math.max(16, Math.round((value / maximum) * 84)),
    );
  }, [dashboard]);

  const logout = async () => {
    if (await signOut()) navigation.getParent()?.getParent()?.replace('User');
  };

  const totals = dashboard?.totals || {};
  const today = dashboard?.today || {};
  const stats = [
    {
      label: 'Revenue',
      value: money(totals.revenue),
      change: `${money(today.sales)} today`,
      icon: 'wallet-outline',
      tone: '#EAF7F1',
    },
    {
      label: 'Orders',
      value: Number(totals.orders || 0).toLocaleString('en-IN'),
      change: `${today.orders || 0} today`,
      icon: 'bag-handle-outline',
      tone: '#FFF0E8',
    },
    {
      label: 'Products',
      value: Number(totals.products || 0).toLocaleString('en-IN'),
      change: `${totals.lowStock || 0} low · ${totals.outOfStock || 0} out`,
      icon: 'cube-outline',
      tone: '#EDF2FF',
    },
    {
      label: 'Customers',
      value: Number(totals.customers || 0).toLocaleString('en-IN'),
      change: `+${totals.newCustomersThisWeek || 0} this week`,
      icon: 'people-outline',
      tone: '#F6EDFF',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>ADMIN CONSOLE</Text>
            <Text style={styles.title}>
              Good day, {user?.name?.split(' ')[0] || 'Admin'}
            </Text>
          </View>
          <Pressable
            accessibilityLabel={'Log out'}
            onPress={logout}
            style={styles.logout}
          >
            <Ionicons
              name={'log-out-outline'}
              size={21}
              color={colors.accent}
            />
          </Pressable>
        </View>

        {Boolean(error) && (
          <Pressable onPress={() => load(false)} style={styles.errorBanner}>
            <Ionicons
              name={'cloud-offline-outline'}
              size={19}
              color={'#C83E3E'}
            />
            <Text style={styles.errorText}>{error} Tap to retry.</Text>
          </Pressable>
        )}

        {loading && !dashboard ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size={'large'} color={colors.accent} />
            <Text style={styles.loadingText}>Loading dashboard...</Text>
          </View>
        ) : (
          <>
            <View style={styles.hero}>
              <View style={styles.heroCopy}>
                <Text style={styles.heroLabel}>TODAY'S SALES</Text>
                <Text style={styles.heroValue}>{money(today.sales)}</Text>
                <Text style={styles.heroMeta}>
                  {today.orders || 0} orders · {today.fulfilled || 0} fulfilled
                </Text>
              </View>
              <View style={styles.chart}>
                {chartHeights.map((height, index) => (
                  <View key={index} style={[styles.bar, { height }]} />
                ))}
              </View>
            </View>

            <View style={styles.statGrid}>
              {stats.map(item => (
                <View key={item.label} style={styles.statCard}>
                  <View
                    style={[styles.statIcon, { backgroundColor: item.tone }]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={22}
                      color={colors.primary}
                    />
                  </View>
                  <Text numberOfLines={1} style={styles.statValue}>
                    {item.value}
                  </Text>
                  <Text style={styles.statLabel}>{item.label}</Text>
                  <Text numberOfLines={1} style={styles.statChange}>
                    {item.change}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.catalogueRow}>
              <View style={styles.catalogueItem}>
                <Text style={styles.catalogueValue}>
                  {totals.categories || 0}
                </Text>
                <Text style={styles.catalogueLabel}>Categories</Text>
              </View>
              <View style={styles.catalogueDivider} />
              <View style={styles.catalogueItem}>
                <Text style={styles.catalogueValue}>
                  {totals.lowStock || 0}
                </Text>
                <Text style={styles.catalogueLabel}>Need restocking</Text>
              </View>
              <View style={styles.catalogueDivider} />
              <View style={styles.catalogueItem}>
                <Text style={styles.catalogueValue}>
                  {totals.outOfStock || 0}
                </Text>
                <Text style={styles.catalogueLabel}>Unavailable</Text>
              </View>
            </View>

            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Recent orders</Text>
              <Pressable onPress={() => navigation.navigate('Orders')}>
                <Text style={styles.viewAll}>View all</Text>
              </Pressable>
            </View>

            {dashboard?.recentOrders?.length ? (
              <View style={styles.orderCard}>
                {dashboard.recentOrders.map((order, index) => (
                  <Pressable
                    key={order.id}
                    onPress={() =>
                      navigation.navigate('AdminOrderDetails', { id: order.id })
                    }
                    style={[
                      styles.orderRow,
                      index < dashboard.recentOrders.length - 1 &&
                        styles.divider,
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
                      <Text style={styles.orderId}>{order.orderNumber}</Text>
                      <Text numberOfLines={1} style={styles.customer}>
                        {order.customer}
                      </Text>
                    </View>
                    <View style={styles.orderRight}>
                      <Text style={styles.amount}>{money(order.total)}</Text>
                      <Text style={styles.status}>{words(order.status)}</Text>
                    </View>
                    <Ionicons
                      name={'chevron-forward'}
                      size={17}
                      color={colors.textMuted}
                      style={styles.orderArrow}
                    />
                  </Pressable>
                ))}
              </View>
            ) : (
              <View style={styles.emptyOrders}>
                <Ionicons
                  name={'receipt-outline'}
                  size={31}
                  color={colors.textMuted}
                />
                <Text style={styles.emptyTitle}>No orders yet</Text>
                <Text style={styles.emptyText}>
                  New customer orders will appear here.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 20, paddingBottom: 110 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: {
    marginTop: 4,
    color: colors.primary,
    fontSize: 25,
    fontWeight: '800',
  },
  logout: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.background,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
    padding: 12,
    borderRadius: 13,
    backgroundColor: '#FFF1F1',
  },
  errorText: { flex: 1, marginLeft: 8, color: '#C83E3E', fontSize: 9 },
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
    borderRadius: 22,
    backgroundColor: colors.background,
  },
  loadingText: { marginTop: 11, color: colors.textMuted, fontSize: 10 },
  hero: {
    minHeight: 155,
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 20,
    borderRadius: 24,
    backgroundColor: colors.primary,
  },
  heroCopy: { flex: 1 },
  heroLabel: {
    color: '#9EACC1',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  heroValue: {
    marginTop: 9,
    color: colors.background,
    fontSize: 30,
    fontWeight: '800',
  },
  heroMeta: { marginTop: 8, color: '#C8D3E2', fontSize: 11 },
  chart: {
    height: 85,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
  },
  bar: { width: 7, borderRadius: 4, backgroundColor: colors.accent },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  statCard: {
    width: '48.5%',
    marginTop: 12,
    padding: 15,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  statIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
  },
  statValue: {
    marginTop: 13,
    color: colors.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: { marginTop: 2, color: colors.textMuted, fontSize: 11 },
  statChange: {
    marginTop: 8,
    color: colors.accent,
    fontSize: 10,
    fontWeight: '700',
  },
  catalogueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: colors.background,
  },
  catalogueItem: { flex: 1, alignItems: 'center' },
  catalogueValue: { color: colors.primary, fontSize: 15, fontWeight: '800' },
  catalogueLabel: { marginTop: 3, color: colors.textMuted, fontSize: 8 },
  catalogueDivider: { width: 1, height: 28, backgroundColor: colors.border },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 25,
    marginBottom: 11,
  },
  sectionTitle: { color: colors.primary, fontSize: 17, fontWeight: '800' },
  viewAll: { color: colors.accent, fontSize: 11, fontWeight: '800' },
  orderCard: {
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  orderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  orderIcon: {
    width: 39,
    height: 39,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#FFF0E8',
  },
  orderCopy: { flex: 1, marginLeft: 11 },
  orderId: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  customer: { marginTop: 3, color: colors.textMuted, fontSize: 10 },
  orderRight: { alignItems: 'flex-end' },
  amount: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  status: {
    marginTop: 3,
    color: colors.accent,
    fontSize: 9,
    fontWeight: '700',
  },
  orderArrow: { marginLeft: 8 },
  emptyOrders: {
    alignItems: 'center',
    padding: 28,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  emptyTitle: {
    marginTop: 9,
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  emptyText: { marginTop: 4, color: colors.textMuted, fontSize: 9 },
});
