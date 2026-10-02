import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Ionicons} from '@react-native-vector-icons/ionicons/static';
import {SafeAreaView} from 'react-native-safe-area-context';
import colors from '../../../theme/colors';

export default function OrderSuccessScreen({navigation, route}) {
  return <SafeAreaView style={styles.container}><View style={styles.content}><View style={styles.icon}><Ionicons name="checkmark" size={56} color={colors.background} /></View><Text style={styles.title}>Order placed!</Text><Text style={styles.text}>Your Cash on Delivery order has been confirmed. You can track it from your account.</Text><View style={styles.orderId}><Text style={styles.orderLabel}>ORDER ID</Text><Text style={styles.orderValue}>{route.params?.orderId}</Text></View><Pressable onPress={() => navigation.popTo('Tabs')} style={styles.button}><Text style={styles.buttonText}>Continue shopping</Text></Pressable></View></SafeAreaView>;
}

const styles = StyleSheet.create({container: {flex: 1, backgroundColor: colors.background}, content: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 35}, icon: {width: 108, height: 108, alignItems: 'center', justifyContent: 'center', borderRadius: 54, backgroundColor: colors.accent}, title: {marginTop: 26, color: colors.primary, fontSize: 28, fontWeight: '800'}, text: {marginTop: 11, color: colors.textMuted, fontSize: 14, lineHeight: 21, textAlign: 'center'}, orderId: {alignItems: 'center', marginTop: 25, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, backgroundColor: colors.surface}, orderLabel: {color: colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1.4}, orderValue: {marginTop: 5, color: colors.primary, fontSize: 17, fontWeight: '800'}, button: {height: 52, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', marginTop: 30, borderRadius: 16, backgroundColor: colors.primary}, buttonText: {color: colors.background, fontSize: 14, fontWeight: '800'}});
