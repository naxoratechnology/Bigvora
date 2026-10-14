import React, {useState} from 'react';
import {Alert, Linking, PermissionsAndroid, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {Ionicons} from '@react-native-vector-icons/ionicons/static';
import {SafeAreaView} from 'react-native-safe-area-context';
import Geolocation from 'react-native-geolocation-service';
import {useCart} from '../../../features/cart/CartContext';
import colors from '../../../theme/colors';

async function reverseGeocode(latitude, longitude) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${latitude}&lon=${longitude}`,
      {headers: {Accept: 'application/json'}},
    );
    if (response.ok) {
      const result = await response.json();
      const address = result.address || {};
      const line = [address.house_number, address.road, address.neighbourhood || address.suburb || address.village]
        .filter(Boolean)
        .join(', ');
      const city = address.city || address.town || address.village || address.county || '';
      if (line || city || address.state || address.postcode) {
        return {line, city, state: address.state || '', pincode: address.postcode || '', label: [address.suburb || address.neighbourhood, city, address.state].filter(Boolean).join(', ')};
      }
    }
  } catch {
    // Use the secondary provider below when the primary lookup is unavailable.
  }

  const fallbackResponse = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
    {headers: {Accept: 'application/json'}},
  );
  if (!fallbackResponse.ok) throw new Error('Unable to find the address');
  const fallback = await fallbackResponse.json();
  const city = fallback.city || fallback.locality || '';
  const state = fallback.principalSubdivision || '';
  const line = fallback.locality || fallback.city || '';
  if (!line && !city && !state && !fallback.postcode) throw new Error('Address details unavailable');
  return {line, city, state, pincode: fallback.postcode || '', label: [fallback.locality, city, state].filter(Boolean).join(', ')};
}

export default function AddAddressScreen({navigation}) {
  const {addAddress} = useCart();
  const [form, setForm] = useState({label: 'Home', name: '', phone: '', line: '', city: '', state: '', pincode: ''});
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationSelected, setLocationSelected] = useState(false);
  const [locationLabel, setLocationLabel] = useState('');
  const setField = (field, value) => setForm(current => ({...current, [field]: value}));
  const valid = form.name && form.phone && form.line && form.city && form.state && form.pincode;
  const useCurrentLocation = async () => {
    if (locating) return;
    if (Platform.OS === 'android') {
      const permissions = await PermissionsAndroid.requestMultiple(
        [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION],
        {
          title: 'Allow Big Vora to use your location',
          message: 'We use your location to fill your delivery address faster and confirm delivery availability.',
          buttonPositive: 'Allow',
          buttonNegative: 'Not now',
        },
      );
      const locationAllowed = Object.values(permissions).includes(PermissionsAndroid.RESULTS.GRANTED);
      if (!locationAllowed) {
        const blocked = Object.values(permissions).includes(PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN);
        Alert.alert(
          'Location permission needed',
          blocked ? 'Location permission is turned off for Big Vora. Enable it in Settings to use your current location.' : 'Allow location permission to use your current location. You can still enter the address manually.',
          blocked ? [{text: 'Not now', style: 'cancel'}, {text: 'Open settings', onPress: () => Linking.openSettings()}] : [{text: 'OK'}],
        );
        return;
      }
    }
    setLocating(true);
    Geolocation.getCurrentPosition(
      async position => {
        const {latitude, longitude} = position.coords;
        try {
          const address = await reverseGeocode(latitude, longitude);
          setForm(current => ({
            ...current,
            latitude,
            longitude,
            line: address.line || current.line,
            city: address.city || current.city,
            state: address.state || current.state,
            pincode: address.pincode || current.pincode,
          }));
          setLocationLabel(address.label || 'Address filled from your location');
          setLocationSelected(true);
        } catch {
          setForm(current => ({...current, latitude, longitude}));
          setLocationLabel('Address lookup unavailable');
          Alert.alert('Address lookup unavailable', 'Your GPS location was detected, but the address could not be retrieved. Check your internet connection and tap Use current location again.');
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        Alert.alert('Location unavailable', 'We could not detect your location. Check GPS and try again, or enter the address manually.');
      },
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000, showLocationDialog: true},
    );
  };
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
        <Pressable onPress={useCurrentLocation} disabled={locating} style={[styles.locationButton, locating && styles.locationButtonDisabled]}>
          <View style={styles.locationIcon}><Ionicons name={locationSelected ? 'checkmark-circle' : 'navigate-outline'} size={20} color={locationSelected ? '#179A63' : colors.accent} /></View>
          <View style={styles.locationCopy}><Text style={styles.locationTitle}>{locating ? 'Finding and filling your address...' : locationSelected ? 'Location added' : 'Use current location'}</Text><Text numberOfLines={1} style={styles.locationSubtitle}>{locationSelected ? locationLabel || 'Address fields were filled from your current location' : 'Allow location permission to fill your delivery address'}</Text></View>
          {!locating && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
        </Pressable>
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

const styles = StyleSheet.create({container: {flex: 1, backgroundColor: colors.surface}, header: {height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, backgroundColor: colors.background}, backButton: {width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.surface}, title: {color: colors.primary, fontSize: 19, fontWeight: '800'}, spacer: {width: 42}, content: {padding: 20, paddingBottom: 40}, locationButton: {flexDirection: 'row', alignItems: 'center', marginBottom: 22, padding: 13, borderWidth: 1, borderColor: '#FFE0CF', borderRadius: 14, backgroundColor: '#FFF9F5'}, locationButtonDisabled: {opacity: 0.65}, locationIcon: {width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.background}, locationCopy: {flex: 1, marginHorizontal: 10}, locationTitle: {color: colors.primary, fontSize: 12, fontWeight: '800'}, locationSubtitle: {marginTop: 3, color: colors.textMuted, fontSize: 10, lineHeight: 14}, label: {marginBottom: 7, color: colors.primary, fontSize: 12, fontWeight: '700'}, input: {height: 51, marginBottom: 17, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 14, color: colors.text, backgroundColor: colors.background}, multiline: {height: 76, paddingTop: 14, textAlignVertical: 'top'}, row: {flexDirection: 'row', justifyContent: 'space-between'}, half: {width: '48%'}, typeRow: {flexDirection: 'row', marginBottom: 26}, typeChip: {marginRight: 9, paddingHorizontal: 18, paddingVertical: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 18, backgroundColor: colors.background}, typeChipActive: {borderColor: colors.primary, backgroundColor: colors.primary}, typeText: {color: colors.textMuted, fontSize: 12, fontWeight: '600'}, typeTextActive: {color: colors.background}, saveButton: {height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: colors.accent}, disabled: {opacity: 0.45}, saveText: {color: colors.background, fontSize: 15, fontWeight: '800'}});
