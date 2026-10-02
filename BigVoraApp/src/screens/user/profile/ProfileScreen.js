import React, {useCallback, useState} from 'react';
import {Image, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {Ionicons} from '@react-native-vector-icons/ionicons/static';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '../../../features/auth/AuthContext';
import {useCart} from '../../../features/cart/CartContext';
import colors from '../../../theme/colors';
import {listOrders} from '../../../services/orders/order.service';

const menuItems = [
  {title: 'My orders', subtitle: 'Track, return or buy again', icon: 'cube-outline', route: 'Orders'},
  {title: 'Favourites', subtitle: 'Products saved for later', icon: 'heart-outline', route: 'Favourites'},
  {title: 'Saved addresses', subtitle: 'Manage delivery locations', icon: 'location-outline', route: 'Addresses'},
  {title: 'Security', subtitle: 'Change your account password', icon: 'shield-checkmark-outline', route: 'ChangePassword'},
  {title: 'Help & support', subtitle: 'Email, call or WhatsApp us', icon: 'help-circle-outline', route: 'HelpSupport'},
];

export default function ProfileScreen({navigation}) {
  const {user, token, isAuthenticated, signOut} = useAuth();
  const {orders, favourites, addresses} = useCart();
  const [orderCount, setOrderCount] = useState(orders.length);
  useFocusEffect(useCallback(() => {
    if (!token) return undefined;
    let active = true;
    listOrders(token, {page: 1, limit: 1}).then(data => {
      if (active) setOrderCount(data.pagination?.total || 0);
    }).catch(() => {});
    return () => { active = false; };
  }, [token]));

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.guestContent}>
          <Image source={require('../../../assets/logo-transparent.png')} resizeMode="contain" style={styles.logo} />
          <View style={styles.guestIcon}><Ionicons name="person-outline" size={45} color={colors.accent} /></View>
          <Text style={styles.guestTitle}>Welcome to Big Vora</Text>
          <Text style={styles.guestText}>Sign in to view orders, save favourites, manage addresses and enjoy a faster checkout.</Text>
          <Pressable onPress={() => navigation.navigate('Login')} style={styles.signInButton}><Text style={styles.signInText}>Sign in or create account</Text></Pressable>
          <View style={styles.benefitsCard}>
            <Text style={styles.benefitsTitle}>Why create an account?</Text>
            {['Track every order in one place', 'Save products to your favourites', 'Reuse delivery addresses at checkout'].map((item, index) => <View key={item} style={styles.benefitRow}><View style={styles.benefitIcon}><Ionicons name={['cube-outline', 'heart-outline', 'location-outline'][index]} size={19} color={colors.accent} /></View><Text style={styles.benefitText}>{item}</Text></View>)}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>My account</Text>
        <View style={styles.profileCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text></View>
          <View style={styles.profileCopy}><Text style={styles.name}>{user.name}</Text><Text style={styles.phone}>{user.phone ? `+91 ${user.phone}` : user.email}</Text></View>
          <Pressable onPress={() => navigation.navigate('EditProfile')} style={styles.editButton}><Ionicons name="pencil-outline" size={18} color={colors.accent} /></Pressable>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.stat}><Text style={styles.statValue}>{orderCount}</Text><Text style={styles.statLabel}>Orders</Text></View><View style={styles.statDivider} /><View style={styles.stat}><Text style={styles.statValue}>{favourites.length}</Text><Text style={styles.statLabel}>Favourites</Text></View><View style={styles.statDivider} /><View style={styles.stat}><Text style={styles.statValue}>{addresses.length}</Text><Text style={styles.statLabel}>Addresses</Text></View>
        </View>
        <Text style={styles.sectionTitle}>Your activity</Text>
        <View style={styles.menuCard}>
          {menuItems.map((item, index) => <Pressable key={item.title} onPress={() => item.route && navigation.navigate(item.route)} style={[styles.menuRow, index < menuItems.length - 1 && styles.menuBorder]}><View style={styles.menuIcon}><Ionicons name={item.icon} size={22} color={colors.primary} /></View><View style={styles.menuCopy}><Text style={styles.menuTitle}>{item.title}</Text><Text style={styles.menuSubtitle}>{item.subtitle}</Text></View><Ionicons name="chevron-forward" size={19} color={colors.textMuted} /></Pressable>)}
        </View>
        <Text style={styles.sectionTitle}>More</Text>
        <View style={styles.menuCard}><Pressable onPress={()=>navigation.navigate('Terms')} style={[styles.menuRow, styles.menuBorder]}><View style={styles.menuIcon}><Ionicons name="document-text-outline" size={22} color={colors.primary} /></View><View style={styles.menuCopy}><Text style={styles.menuTitle}>Terms & conditions</Text><Text style={styles.menuSubtitle}>Rules for using Big Vora</Text></View><Ionicons name="chevron-forward" size={19} color={colors.textMuted} /></Pressable><Pressable onPress={()=>navigation.navigate('PrivacyPolicy')} style={[styles.menuRow, styles.menuBorder]}><View style={styles.menuIcon}><Ionicons name="lock-closed-outline" size={22} color={colors.primary} /></View><View style={styles.menuCopy}><Text style={styles.menuTitle}>Privacy policy</Text><Text style={styles.menuSubtitle}>How your information is handled</Text></View><Ionicons name="chevron-forward" size={19} color={colors.textMuted} /></Pressable><Pressable onPress={signOut} style={styles.menuRow}><View style={[styles.menuIcon, styles.logoutIcon]}><Ionicons name="log-out-outline" size={22} color="#D64040" /></View><View style={styles.menuCopy}><Text style={[styles.menuTitle, styles.logoutText]}>Log out</Text><Text style={styles.menuSubtitle}>Sign out of this account</Text></View></Pressable></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({container: {flex: 1, backgroundColor: colors.surface}, content: {padding: 20, paddingBottom: 120}, pageTitle: {marginBottom: 18, color: colors.primary, fontSize: 28, fontWeight: '800'}, profileCard: {flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, backgroundColor: colors.primary}, avatar: {width: 58, height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 29, backgroundColor: colors.accent}, avatarText: {color: colors.background, fontSize: 25, fontWeight: '800'}, profileCopy: {flex: 1, marginLeft: 13}, name: {color: colors.background, fontSize: 18, fontWeight: '800'}, phone: {marginTop: 4, color: '#C8D3E2', fontSize: 12}, editButton: {width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#FFFFFF18'}, statsRow: {flexDirection: 'row', alignItems: 'center', marginTop: 14, paddingVertical: 16, borderRadius: 18, backgroundColor: colors.background}, stat: {flex: 1, alignItems: 'center'}, statValue: {color: colors.primary, fontSize: 18, fontWeight: '800'}, statLabel: {marginTop: 3, color: colors.textMuted, fontSize: 10}, statDivider: {width: 1, height: 30, backgroundColor: colors.border}, sectionTitle: {marginTop: 24, marginBottom: 11, color: colors.primary, fontSize: 16, fontWeight: '800'}, menuCard: {overflow: 'hidden', borderRadius: 18, backgroundColor: colors.background}, menuRow: {flexDirection: 'row', alignItems: 'center', padding: 14}, menuBorder: {borderBottomWidth: 1, borderBottomColor: colors.border}, menuIcon: {width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: colors.surface}, menuCopy: {flex: 1, marginLeft: 12}, menuTitle: {color: colors.primary, fontSize: 14, fontWeight: '700'}, menuSubtitle: {marginTop: 3, color: colors.textMuted, fontSize: 10}, logoutIcon: {backgroundColor: '#FFF0F0'}, logoutText: {color: '#D64040'}, guestContent: {alignItems: 'center', paddingHorizontal: 25, paddingBottom: 115}, logo: {width: 74, height: 74, alignSelf: 'flex-start'}, guestIcon: {width: 105, height: 105, alignItems: 'center', justifyContent: 'center', marginTop: 38, borderRadius: 53, backgroundColor: '#FFF0E8'}, guestTitle: {marginTop: 22, color: colors.primary, fontSize: 24, fontWeight: '800'}, guestText: {marginTop: 10, color: colors.textMuted, fontSize: 13, lineHeight: 20, textAlign: 'center'}, signInButton: {alignSelf: 'stretch', alignItems: 'center', marginTop: 24, paddingVertical: 15, borderRadius: 16, backgroundColor: colors.accent}, signInText: {color: colors.background, fontSize: 14, fontWeight: '800'}, benefitsCard: {alignSelf: 'stretch', marginTop: 28, padding: 18, borderRadius: 19, backgroundColor: colors.background}, benefitsTitle: {marginBottom: 13, color: colors.primary, fontSize: 15, fontWeight: '800'}, benefitRow: {flexDirection: 'row', alignItems: 'center', marginTop: 10}, benefitIcon: {width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#FFF0E8'}, benefitText: {flex: 1, marginLeft: 11, color: colors.text, fontSize: 12}});
