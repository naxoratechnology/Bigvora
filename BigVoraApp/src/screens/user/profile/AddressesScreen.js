import React from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {Ionicons} from '@react-native-vector-icons/ionicons/static';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useCart} from '../../../features/cart/CartContext';
import colors from '../../../theme/colors';

export default function AddressesScreen({navigation}) {
  const {addresses, selectedAddressId, setSelectedAddressId, updateAddress, removeAddress} = useCart();
  const select = async address => {
    setSelectedAddressId(address.id);
    try { await updateAddress(address.id, {...address, isDefault: true}); }
    catch (error) { Alert.alert('Address not updated', error.message); }
  };
  const remove = address => Alert.alert('Remove address', 'Remove this saved delivery address?', [
    {text: 'Cancel', style: 'cancel'},
    {text: 'Remove', style: 'destructive', onPress: () => removeAddress(address.id).catch(error => Alert.alert('Address not removed', error.message))},
  ]);
  return <SafeAreaView style={styles.container}>
    <View style={styles.header}><Pressable onPress={navigation.goBack} style={styles.back}><Ionicons name="arrow-back" size={22} color={colors.primary} /></Pressable><Text style={styles.title}>Saved addresses</Text><View style={styles.spacer} /></View>
    <ScrollView contentContainerStyle={styles.content}>
      {addresses.map(address => {
        const selected = address.id === selectedAddressId;
        return <Pressable key={address.id} onPress={() => select(address)} onLongPress={() => remove(address)} style={[styles.card, selected && styles.selected]}>
          <View style={styles.icon}><Ionicons name={address.label === 'Work' ? 'business-outline' : 'home-outline'} size={23} color={colors.accent} /></View>
          <View style={styles.copy}><View style={styles.labelRow}><Text style={styles.label}>{address.label}</Text>{selected && <View style={styles.defaultBadge}><Text style={styles.defaultText}>DEFAULT</Text></View>}</View><Text style={styles.name}>{address.name} ? {address.phone}</Text><Text style={styles.line}>{address.line}, {address.city}, {address.state} - {address.pincode}</Text><Text style={styles.hint}>Long press to remove</Text></View>
        </Pressable>;
      })}
      {!addresses.length && <View style={styles.empty}><Ionicons name="location-outline" size={40} color={colors.accent} /><Text style={styles.emptyTitle}>No saved addresses</Text><Text style={styles.emptyText}>Add an address for faster checkout.</Text></View>}
      <Pressable onPress={() => navigation.navigate('AddAddress')} style={styles.addButton}><Ionicons name="add" size={21} color={colors.accent} /><Text style={styles.addText}>Add a new address</Text></Pressable>
    </ScrollView>
  </SafeAreaView>;
}
const styles=StyleSheet.create({container:{flex:1,backgroundColor:colors.surface},header:{height:64,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,backgroundColor:colors.background},back:{width:42,height:42,alignItems:'center',justifyContent:'center',borderRadius:14,backgroundColor:colors.surface},title:{color:colors.primary,fontSize:19,fontWeight:'800'},spacer:{width:42},content:{padding:20},card:{flexDirection:'row',marginBottom:13,padding:15,borderWidth:1.5,borderColor:colors.border,borderRadius:18,backgroundColor:colors.background},selected:{borderColor:colors.accent},icon:{width:46,height:46,alignItems:'center',justifyContent:'center',borderRadius:14,backgroundColor:'#FFF0E8'},copy:{flex:1,marginLeft:12},labelRow:{flexDirection:'row',alignItems:'center'},label:{color:colors.primary,fontSize:14,fontWeight:'800'},defaultBadge:{marginLeft:8,paddingHorizontal:7,paddingVertical:3,borderRadius:6,backgroundColor:'#EAF8F4'},defaultText:{color:'#179A63',fontSize:8,fontWeight:'800'},name:{marginTop:6,color:colors.text,fontSize:11,fontWeight:'600'},line:{marginTop:5,color:colors.textMuted,fontSize:11,lineHeight:16},hint:{marginTop:7,color:colors.accent,fontSize:9,fontWeight:'700'},addButton:{height:54,flexDirection:'row',alignItems:'center',justifyContent:'center',marginTop:5,borderWidth:1.5,borderStyle:'dashed',borderColor:colors.accent,borderRadius:16},addText:{marginLeft:7,color:colors.accent,fontSize:13,fontWeight:'800'},empty:{alignItems:'center',paddingVertical:35},emptyTitle:{marginTop:12,color:colors.primary,fontSize:16,fontWeight:'800'},emptyText:{marginTop:5,color:colors.textMuted,fontSize:11}});
