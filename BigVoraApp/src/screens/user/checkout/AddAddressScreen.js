import React, {useState} from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {Ionicons} from '@react-native-vector-icons/ionicons/static';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useCart} from '../../../features/cart/CartContext';
import colors from '../../../theme/colors';

export default function AddAddressScreen({navigation}) {
  const {addAddress} = useCart();
  const [form, setForm] = useState({label: 'Home', name: '', phone: '', line: '', city: '', state: '', pincode: ''});
  const [saving, setSaving] = useState(false);
  const setField = (field, value) => setForm(current => ({...current, [field]: value}));
  const valid = form.name && form.phone && form.line && form.city && form.state && form.pincode;
  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try { await addAddress(form); navigation.goBack(); }
    catch (error) { Alert.alert('Address not saved', error.message || 'Please try again.'); }
    finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Pressable onPress={navigation.goBack} style={styles.backButton}><Ionicons name="arrow-back" size={22} color={colors.primary} /></Pressable><Text style={styles.title}>Add address</Text><View style={styles.spacer} /></View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.notice}><Ionicons name="information-circle-outline" size={20} color={colors.accent} /><Text style={styles.noticeText}>Enter your address manually. Map location is not required.</Text></View>
        <Text style={styles.label}>Full name</Text><TextInput value={form.name} onChangeText={value => setField('name', value)} placeholder="Enter full name" placeholderTextColor={colors.textMuted} style={styles.input} />
        <Text style={styles.label}>Mobile number</Text><TextInput value={form.phone} onChangeText={value => setField('phone', value)} keyboardType="phone-pad" placeholder="10-digit mobile number" placeholderTextColor={colors.textMuted} style={styles.input} />
        <Text style={styles.label}>House, building and street</Text><TextInput value={form.line} onChangeText={value => setField('line', value)} placeholder="House no., street, area" placeholderTextColor={colors.textMuted} style={[styles.input, styles.multiline]} multiline />
        <View style={styles.row}><View style={styles.half}><Text style={styles.label}>City</Text><TextInput value={form.city} onChangeText={value => setField('city', value)} placeholder="City" placeholderTextColor={colors.textMuted} style={styles.input} /></View><View style={styles.half}><Text style={styles.label}>State</Text><TextInput value={form.state} onChangeText={value => setField('state', value)} placeholder="State" placeholderTextColor={colors.textMuted} style={styles.input} /></View></View>
        <Text style={styles.label}>PIN code</Text><TextInput value={form.pincode} onChangeText={value => setField('pincode', value)} keyboardType="number-pad" maxLength={6} placeholder="6-digit PIN code" placeholderTextColor={colors.textMuted} style={styles.input} />
        <Text style={styles.label}>Address type</Text><View style={styles.typeRow}>{['Home', 'Work', 'Other'].map(type => <Pressable key={type} onPress={() => setField('label', type)} style={[styles.typeChip, form.label === type && styles.typeChipActive]}><Text style={[styles.typeText, form.label === type && styles.typeTextActive]}>{type}</Text></Pressable>)}</View>
        <Pressable disabled={!valid || saving} onPress={save} style={[styles.saveButton, (!valid || saving) && styles.disabled]}><Text style={styles.saveText}>{saving ? 'Saving...' : 'Save and use address'}</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({container: {flex: 1, backgroundColor: colors.surface}, header: {height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, backgroundColor: colors.background}, backButton: {width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.surface}, title: {color: colors.primary, fontSize: 19, fontWeight: '800'}, spacer: {width: 42}, content: {padding: 20, paddingBottom: 40}, notice: {flexDirection: 'row', alignItems: 'center', marginBottom: 22, padding: 13, borderRadius: 14, backgroundColor: '#FFF0E8'}, noticeText: {flex: 1, marginLeft: 9, color: colors.primary, fontSize: 11, lineHeight: 16}, label: {marginBottom: 7, color: colors.primary, fontSize: 12, fontWeight: '700'}, input: {height: 51, marginBottom: 17, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 14, color: colors.text, backgroundColor: colors.background}, multiline: {height: 76, paddingTop: 14, textAlignVertical: 'top'}, row: {flexDirection: 'row', justifyContent: 'space-between'}, half: {width: '48%'}, typeRow: {flexDirection: 'row', marginBottom: 26}, typeChip: {marginRight: 9, paddingHorizontal: 18, paddingVertical: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 18, backgroundColor: colors.background}, typeChipActive: {borderColor: colors.primary, backgroundColor: colors.primary}, typeText: {color: colors.textMuted, fontSize: 12, fontWeight: '600'}, typeTextActive: {color: colors.background}, saveButton: {height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: colors.accent}, disabled: {opacity: 0.45}, saveText: {color: colors.background, fontSize: 15, fontWeight: '800'}});
