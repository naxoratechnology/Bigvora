import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../features/auth/AuthContext';
import { useAdminData } from '../../../features/admin/AdminDataContext';
import colors from '../../../theme/colors';

const menu = [
  {
    title: 'Home banners',
    subtitle: 'Create and manage the customer home carousel',
    icon: 'images-outline',
    route: 'Banners',
  },
  {
    title: 'Orders',
    subtitle: 'Track, fulfil and manage customer orders',
    icon: 'receipt-outline',
    route: 'Orders',
  },
  {
    title: 'Customers',
    subtitle: 'View customer accounts and activity',
    icon: 'people-outline',
    route: 'Customers',
  },
  {
    title: 'My product rules',
    subtitle: 'Manage returns, delivery and quality promises',
    icon: 'shield-checkmark-outline',
    route: 'ProductRules',
  },
];
export default function AdminAccountScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const { orders, customers, productRules, banners } = useAdminData();
  const counts = {
    Orders: orders.length,
    Customers: customers.length,
    ProductRules: productRules.length,
    Banners: banners.length,
  };
  const open = route => navigation.getParent()?.navigate(route);
  const logout = async () => {
    if (await signOut()) navigation.getParent()?.getParent()?.replace('User');
  };
  const name = user?.name || user?.fullName || 'Administrator';
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Admin account</Text>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileCopy}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.role}>BIG VORA ADMINISTRATOR</Text>
            <Text style={styles.identity}>
              {user?.email || user?.phone || 'Secure admin account'}
            </Text>
          </View>
          <View style={styles.verified}>
            <Ionicons
              name="shield-checkmark"
              size={19}
              color={colors.background}
            />
          </View>
        </View>
        <Text style={styles.sectionTitle}>Business management</Text>
        <View style={styles.menuCard}>
          {menu.map((item, index) => (
            <Pressable
              key={item.route}
              onPress={() => open(item.route)}
              style={[
                styles.menuRow,
                index < menu.length - 1 && styles.menuBorder,
              ]}
            >
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon} size={22} color={colors.primary} />
              </View>
              <View style={styles.menuCopy}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <View style={styles.trailing}>
                <Text style={styles.count}>{counts[item.route]}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={19}
                  color={colors.textMuted}
                />
              </View>
            </Pressable>
          ))}
        </View>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.menuCard}>
          <Pressable onPress={logout} style={styles.menuRow}>
            <View style={[styles.menuIcon, styles.logoutIcon]}>
              <Ionicons name="log-out-outline" size={22} color="#D64040" />
            </View>
            <View style={styles.menuCopy}>
              <Text style={[styles.menuTitle, styles.logoutText]}>Log out</Text>
              <Text style={styles.menuSubtitle}>
                Sign out of the administrator account
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 20, paddingBottom: 115 },
  pageTitle: {
    marginBottom: 18,
    color: colors.primary,
    fontSize: 28,
    fontWeight: '800',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 17,
    borderRadius: 21,
    backgroundColor: colors.primary,
  },
  avatar: {
    width: 59,
    height: 59,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    backgroundColor: colors.accent,
  },
  avatarText: { color: colors.background, fontSize: 25, fontWeight: '800' },
  profileCopy: { flex: 1, marginLeft: 13 },
  name: { color: colors.background, fontSize: 17, fontWeight: '800' },
  role: {
    marginTop: 4,
    color: colors.accentLight,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  identity: { marginTop: 5, color: '#C8D3E2', fontSize: 10 },
  verified: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#FFFFFF18',
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 11,
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  menuCard: {
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: colors.background,
  },
  menuRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuIcon: {
    width: 43,
    height: 43,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: colors.surface,
  },
  menuCopy: { flex: 1, marginLeft: 12 },
  menuTitle: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  menuSubtitle: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 13,
  },
  trailing: { flexDirection: 'row', alignItems: 'center' },
  count: {
    minWidth: 25,
    marginRight: 7,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 9,
    overflow: 'hidden',
    backgroundColor: '#FFF0E8',
    color: colors.accent,
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
  },
  logoutIcon: { backgroundColor: '#FFF0F0' },
  logoutText: { color: '#D64040' },
});
