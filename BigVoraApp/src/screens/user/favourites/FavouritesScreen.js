import React from 'react';
import {Image, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {Ionicons} from '@react-native-vector-icons/ionicons/static';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useCart} from '../../../features/cart/CartContext';
import colors from '../../../theme/colors';
import CartQuantityControl from '../../../components/cart/CartQuantityControl';

const money = value => '\u20B9' + Number(value || 0).toLocaleString('en-IN');
export default function FavouritesScreen({navigation}) {
  const {items, favourites, toggleFavourite, addToCart, updateQuantity} = useCart();
  return <SafeAreaView style={styles.container}>
    <View style={styles.header}><Pressable onPress={navigation.goBack} style={styles.back}><Ionicons name="arrow-back" size={22} color={colors.primary}/></Pressable><Text style={styles.title}>Favourites</Text><View style={styles.spacer}/></View>
    {favourites.length ? <ScrollView contentContainerStyle={styles.grid}>{favourites.map(item => {
      const quantity = items.find(cartItem => cartItem.id === item.id)?.quantity || 0;
      return <View key={item.id} style={styles.card}>
        <View style={[styles.visual,{backgroundColor:item.tint??'#EDF3FF'}]}>
          <Pressable accessibilityLabel={'View '+item.name} onPress={()=>navigation.navigate('ProductDetails',{product:item})} style={styles.productTap}>{item.images?.[0]?<Image source={{uri:item.images[0]}} resizeMode="contain" style={styles.image}/>:<Ionicons name={item.icon??'bag'} size={52} color={colors.primaryLight}/>}</Pressable>
          <Pressable accessibilityLabel={'Remove '+item.name+' from favourites'} onPress={()=>toggleFavourite(item)} style={styles.heart}><Ionicons name="heart" size={19} color={colors.accent}/></Pressable>
        </View>
        <Pressable onPress={()=>navigation.navigate('ProductDetails',{product:item})}><Text numberOfLines={2} style={styles.name}>{item.name}</Text></Pressable>
        <View style={styles.priceRow}><Text style={styles.price}>{money(item.priceValue)}</Text><CartQuantityControl compact quantity={quantity} onIncrease={()=>addToCart(item)} onDecrease={()=>updateQuantity(item.id,-1)} style={styles.cartControl}/></View>
      </View>;
    })}</ScrollView>:<View style={styles.empty}><View style={styles.emptyIcon}><Ionicons name="heart-outline" size={48} color={colors.accent}/></View><Text style={styles.emptyTitle}>No favourites yet</Text><Text style={styles.emptyText}>Tap the heart on any product to save it here.</Text></View>}
  </SafeAreaView>;
}
const styles=StyleSheet.create({container:{flex:1,backgroundColor:colors.surface},header:{height:64,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,backgroundColor:colors.background},back:{width:42,height:42,alignItems:'center',justifyContent:'center',borderRadius:14,backgroundColor:colors.surface},title:{color:colors.primary,fontSize:19,fontWeight:'800'},spacer:{width:42},grid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',padding:20},card:{width:'48%',marginBottom:18,paddingBottom:12,borderWidth:1,borderColor:colors.border,borderRadius:18,backgroundColor:colors.background},visual:{height:145,alignItems:'center',justifyContent:'center',overflow:'hidden',borderTopLeftRadius:17,borderTopRightRadius:17,backgroundColor:'#EDF3FF'},productTap:{width:'100%',height:'100%',alignItems:'center',justifyContent:'center'},image:{width:'100%',height:'100%'},heart:{position:'absolute',top:9,right:9,width:32,height:32,alignItems:'center',justifyContent:'center',borderRadius:16,backgroundColor:colors.background,elevation:2},name:{minHeight:38,marginTop:10,paddingHorizontal:11,color:colors.primary,fontSize:13,fontWeight:'700'},priceRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:5,paddingHorizontal:10},price:{flexShrink:1,color:colors.primary,fontSize:14,fontWeight:'800'},cartControl:{marginLeft:5},empty:{flex:1,alignItems:'center',justifyContent:'center',paddingHorizontal:40},emptyIcon:{width:100,height:100,alignItems:'center',justifyContent:'center',borderRadius:50,backgroundColor:'#FFF0E8'},emptyTitle:{marginTop:20,color:colors.primary,fontSize:21,fontWeight:'800'},emptyText:{marginTop:8,color:colors.textMuted,fontSize:13,textAlign:'center'}});
