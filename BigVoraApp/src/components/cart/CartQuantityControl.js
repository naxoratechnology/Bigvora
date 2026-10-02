import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Ionicons} from '@react-native-vector-icons/ionicons/static';
import colors from '../../theme/colors';

export default function CartQuantityControl({quantity=0,onIncrease,onDecrease,compact=false,style}) {
  if (quantity <= 0) return <Pressable accessibilityLabel="Add to cart" onPress={onIncrease} style={[styles.addToCart,compact?styles.compactAdd:styles.regularAdd,style]}><Ionicons name="cart-outline" size={compact?14:18} color={colors.accent}/><Text style={[styles.addText,compact&&styles.compactAddText]}>Add to cart</Text></Pressable>;
  return <View style={[styles.control,compact?styles.compact:styles.regular,style]}>
    <Pressable accessibilityLabel="Remove one from cart" disabled={!quantity} onPress={onDecrease} hitSlop={6} style={[styles.action,!quantity&&styles.disabled]}><Ionicons name="remove" size={compact?15:18} color={colors.background}/></Pressable>
    <Text accessibilityLabel={quantity+' in cart'} style={[styles.quantity,compact&&styles.compactText]}>{quantity}</Text>
    <Pressable accessibilityLabel="Add one to cart" onPress={onIncrease} hitSlop={6} style={styles.action}><Ionicons name="add" size={compact?15:18} color={colors.background}/></Pressable>
  </View>;
}
const styles=StyleSheet.create({control:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:colors.accent},compact:{width:88,height:31,borderRadius:10},regular:{height:50,minWidth:128,borderRadius:15},addToCart:{flexDirection:'row',alignItems:'center',justifyContent:'center',borderWidth:1.5,borderColor:colors.accent,backgroundColor:colors.background},compactAdd:{width:104,height:31,borderRadius:10},regularAdd:{height:50,minWidth:128,paddingHorizontal:15,borderRadius:15},addText:{marginLeft:6,color:colors.accent,fontSize:12,fontWeight:'800'},compactAddText:{marginLeft:4,fontSize:9},action:{flex:1,height:'100%',alignItems:'center',justifyContent:'center'},disabled:{opacity:.35},quantity:{minWidth:32,color:colors.background,fontSize:15,fontWeight:'800',textAlign:'center'},compactText:{minWidth:24,fontSize:12}});
