import React, {useCallback, useMemo, useState} from 'react';
import {ActivityIndicator, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, TextInput, View} from 'react-native';
import {Ionicons} from '@react-native-vector-icons/ionicons/static';
import {useFocusEffect} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {request} from '../../../services/api/client';
import colors from '../../../theme/colors';

const filters = [
  {id: 'all', label: 'All'},
  {id: 'available', label: 'In stock'},
  {id: 'withProducts', label: 'With products'},
];

const mapProduct = product => ({
  ...product,
  priceValue: Number(product.price),
  price: '\u20B9' + Number(product.price).toLocaleString('en-IN'),
  oldPrice: '',
  rating: 0,
  newestRank: 0,
  icon: 'cube-outline',
  tint: '#EDF3FF',
});

export default function CategoriesScreen({navigation}) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async ({refresh = false} = {}) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const data = await request('/catalog/home');
      const nextProducts = (data?.products || []).map(mapProduct);
      const counts = nextProducts.reduce((result, product) => {
        const id = String(product.categoryId || '');
        result[id] = (result[id] || 0) + 1;
        if (Number(product.stock) > 0) result[id + ':stock'] = (result[id + ':stock'] || 0) + 1;
        return result;
      }, {});
      setProducts(nextProducts);
      setCategories((data?.categories || []).map(category => ({
        ...category,
        productCount: counts[String(category.id)] || 0,
        availableCount: counts[String(category.id) + ':stock'] || 0,
      })));
      setError('');
    } catch (loadError) {
      setError(loadError.message || 'Unable to load categories.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const visibleCategories = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return categories.filter(category => {
      if (normalized && !category.name.toLowerCase().includes(normalized)) return false;
      if (filter === 'available') return category.availableCount > 0;
      if (filter === 'withProducts') return category.productCount > 0;
      return true;
    });
  }, [categories, filter, query]);

  const openCategory = category => navigation.navigate('CategoryProducts', {
    products,
    categoryId: category.id,
    title: category.name,
  });

  const renderCategory = ({item}) => (
    <Pressable accessibilityRole="button" accessibilityLabel={'Open ' + item.name} onPress={() => openCategory(item)} style={({pressed}) => [styles.categoryCard, pressed && styles.cardPressed]}>
      <View style={styles.imageBox}>
        {item.image
          ? <Image source={{uri: item.image}} resizeMode="cover" style={styles.image} />
          : <Ionicons name="grid-outline" size={31} color={colors.primary} />}
      </View>
      <View style={styles.cardCopy}>
        <Text numberOfLines={1} style={styles.categoryTitle}>{item.name}</Text>
        <Text style={styles.categoryMeta}>{item.productCount} {item.productCount === 1 ? 'product' : 'products'}</Text>
        <View style={styles.stockRow}>
          <View style={[styles.stockDot, !item.availableCount && styles.stockDotEmpty]} />
          <Text style={styles.stockText}>{item.availableCount ? item.availableCount + ' available' : 'Coming soon'}</Text>
        </View>
      </View>
      <View style={styles.arrowButton}><Ionicons name="chevron-forward" size={17} color={colors.accent} /></View>
    </Pressable>
  );

  const header = (
    <>
      <View style={styles.header}>
        <View><Text style={styles.eyebrow}>EXPLORE</Text><Text style={styles.heading}>Categories</Text></View>
        <View style={styles.headerIcon}><Ionicons name="grid" size={23} color={colors.accent} /></View>
      </View>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={21} color={colors.textMuted} />
        <TextInput value={query} onChangeText={setQuery} returnKeyType="search" autoCorrect={false} placeholder="Search categories" placeholderTextColor={colors.textMuted} style={styles.searchInput} />
        {Boolean(query) && <Pressable accessibilityLabel="Clear search" hitSlop={10} onPress={() => setQuery('')}><Ionicons name="close-circle" size={20} color={colors.textMuted} /></Pressable>}
      </View>
      <View style={styles.filterRow}>
        {filters.map(option => <Pressable key={option.id} onPress={() => setFilter(option.id)} style={[styles.filterChip, filter === option.id && styles.filterChipActive]}><Text style={[styles.filterText, filter === option.id && styles.filterTextActive]}>{option.label}</Text></Pressable>)}
      </View>
      <View style={styles.sectionRow}><Text style={styles.sectionTitle}>Shop by category</Text><Text style={styles.countText}>{visibleCategories.length} results</Text></View>
    </>
  );

  if (loading && !categories.length) {
    return <SafeAreaView style={styles.container}><View style={styles.loading}><ActivityIndicator size="large" color={colors.accent} /><Text style={styles.loadingText}>Loading categories?</Text></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={visibleCategories}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        keyExtractor={item => String(item.id)}
        renderItem={renderCategory}
        ListHeaderComponent={header}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load({refresh: true})} colors={[colors.accent]} tintColor={colors.accent} />}
        ListEmptyComponent={<View style={styles.empty}><View style={styles.emptyIcon}><Ionicons name={error ? 'cloud-offline-outline' : 'search-outline'} size={42} color={colors.accent} /></View><Text style={styles.emptyTitle}>{error ? 'Could not load categories' : 'No categories found'}</Text><Text style={styles.emptyText}>{error || 'Try another search or filter.'}</Text><Pressable onPress={() => error ? load() : (setQuery(''), setFilter('all'))} style={styles.retryButton}><Text style={styles.retryText}>{error ? 'Try again' : 'Clear filters'}</Text></Pressable></View>}
        ListFooterComponent={error && categories.length ? <Pressable onPress={() => load({refresh: true})} style={styles.inlineError}><Ionicons name="warning-outline" size={17} color="#B5473C" /><Text style={styles.inlineErrorText}>Refresh failed. Showing saved results. Tap to retry.</Text></Pressable> : <View />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:colors.background},content:{paddingHorizontal:20,paddingBottom:116},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingTop:10,paddingBottom:18},eyebrow:{color:colors.accent,fontSize:11,fontWeight:'800',letterSpacing:1.6},heading:{marginTop:3,color:colors.primary,fontSize:28,fontWeight:'800'},headerIcon:{width:44,height:44,alignItems:'center',justifyContent:'center',borderRadius:14,backgroundColor:'#FFF0E8'},
  searchBar:{height:52,flexDirection:'row',alignItems:'center',paddingHorizontal:15,borderWidth:1,borderColor:colors.border,borderRadius:16,backgroundColor:colors.surface},searchInput:{flex:1,marginHorizontal:10,color:colors.text,fontSize:14},
  filterRow:{flexDirection:'row',paddingTop:14},filterChip:{marginRight:8,paddingHorizontal:16,paddingVertical:9,borderWidth:1,borderColor:colors.border,borderRadius:18,backgroundColor:colors.background},filterChipActive:{borderColor:colors.primary,backgroundColor:colors.primary},filterText:{color:colors.textMuted,fontSize:11,fontWeight:'700'},filterTextActive:{color:colors.background},
  sectionRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:24,marginBottom:14},sectionTitle:{color:colors.primary,fontSize:19,fontWeight:'800'},countText:{color:colors.textMuted,fontSize:11},
  columnWrapper:{justifyContent:'space-between'},categoryCard:{width:'48%',minHeight:210,marginBottom:14,padding:13,borderWidth:1,borderColor:colors.border,borderRadius:20,backgroundColor:colors.background},cardPressed:{opacity:.72},imageBox:{width:'100%',height:112,alignItems:'center',justifyContent:'center',overflow:'hidden',borderRadius:16,backgroundColor:'#FFF0E8'},image:{width:'100%',height:'100%'},cardCopy:{marginTop:12},categoryTitle:{color:colors.primary,fontSize:15,fontWeight:'800'},categoryMeta:{marginTop:5,color:colors.textMuted,fontSize:11},stockRow:{flexDirection:'row',alignItems:'center',marginTop:8},stockDot:{width:7,height:7,marginRight:6,borderRadius:4,backgroundColor:'#179A63'},stockDotEmpty:{backgroundColor:colors.textMuted},stockText:{color:colors.textMuted,fontSize:10,fontWeight:'600'},arrowButton:{position:'absolute',right:10,bottom:10,width:30,height:30,alignItems:'center',justifyContent:'center',borderRadius:10,backgroundColor:'#FFF0E8'},
  loading:{flex:1,alignItems:'center',justifyContent:'center'},loadingText:{marginTop:12,color:colors.textMuted,fontSize:13},empty:{alignItems:'center',paddingHorizontal:24,paddingVertical:54},emptyIcon:{width:86,height:86,alignItems:'center',justifyContent:'center',borderRadius:43,backgroundColor:'#FFF0E8'},emptyTitle:{marginTop:17,color:colors.primary,fontSize:18,fontWeight:'800'},emptyText:{marginTop:7,color:colors.textMuted,fontSize:12,lineHeight:18,textAlign:'center'},retryButton:{marginTop:18,paddingHorizontal:20,paddingVertical:11,borderRadius:13,backgroundColor:colors.accent},retryText:{color:colors.background,fontSize:12,fontWeight:'800'},inlineError:{flexDirection:'row',alignItems:'center',justifyContent:'center',marginTop:6,padding:12,borderRadius:12,backgroundColor:'#FFF0EE'},inlineErrorText:{marginLeft:7,color:'#B5473C',fontSize:10,fontWeight:'600'},
});
