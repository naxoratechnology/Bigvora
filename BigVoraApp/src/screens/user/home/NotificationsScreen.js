import React, {useCallback, useState} from 'react';
import {ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {Ionicons} from '@react-native-vector-icons/ionicons/static';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuth} from '../../../features/auth/AuthContext';
import {listNotifications, markAllNotificationsRead} from '../../../services/notifications/notification.service';
import colors from '../../../theme/colors';

const relativeTime = value => {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 172800) return 'Yesterday';
  return new Date(value).toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'});
};

export default function NotificationsScreen({navigation}) {
  const {token, isAuthenticated} = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [readingAll, setReadingAll] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async refresh => {
    if (!token) { setNotifications([]); setLoading(false); return; }
    refresh ? setRefreshing(true) : setLoading(true); setError('');
    try { setNotifications(await listNotifications(token)); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);
  useFocusEffect(useCallback(() => { load(false); }, [load]));
  const readAll = async () => {
    if (readingAll || !token || !notifications.some(item => !item.isRead)) return;
    setReadingAll(true); setError('');
    try { await markAllNotificationsRead(token); setNotifications(current => current.map(item => ({...item, isRead: true}))); }
    catch (requestError) { setError(requestError.message); }
    finally { setReadingAll(false); }
  };
  const hasUnread = notifications.some(item => !item.isRead);
  return <SafeAreaView style={styles.container}>
    <View style={styles.header}><Pressable onPress={navigation.goBack} style={styles.back}><Ionicons name="arrow-back" size={22} color={colors.primary}/></Pressable><Text style={styles.title}>Notifications</Text><Pressable disabled={readingAll || !hasUnread} onPress={readAll} style={styles.readAllButton}><Text style={[styles.readAll, (!hasUnread || readingAll) && styles.readAllMuted]}>{readingAll ? 'Updating...' : 'Read all'}</Text></Pressable></View>
    {loading ? <View style={styles.center}><ActivityIndicator size="large" color={colors.accent}/></View> : !isAuthenticated ? <View style={styles.center}><Ionicons name="notifications-outline" size={45} color={colors.accent}/><Text style={styles.emptyTitle}>Sign in to see notifications</Text><Text style={styles.emptyText}>Store updates and offers will appear here.</Text></View> : <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.accent]} tintColor={colors.accent}/>}>
      {Boolean(error) && <Pressable onPress={() => load(true)} style={styles.error}><Text style={styles.errorText}>{error} Tap to retry.</Text></Pressable>}
      {notifications.map(item => <View key={item.id} style={styles.card}><View style={styles.icon}><Ionicons name={item.icon || 'notifications-outline'} size={23} color={colors.accent}/></View><View style={styles.copy}><View style={styles.titleRow}><Text style={styles.itemTitle}>{item.title}</Text>{!item.isRead && <View style={styles.dot}/>}</View><Text style={styles.text}>{item.message}</Text><Text style={styles.time}>{relativeTime(item.createdAt)}</Text></View></View>)}
      {!error && !notifications.length && <View style={styles.empty}><View style={styles.emptyIcon}><Ionicons name="notifications-outline" size={40} color={colors.accent}/></View><Text style={styles.emptyTitle}>No notifications yet</Text><Text style={styles.emptyText}>New store updates and offers will appear here.</Text></View>}
    </ScrollView>}
  </SafeAreaView>;
}

const styles = StyleSheet.create({container:{flex:1,backgroundColor:colors.surface},header:{height:64,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,backgroundColor:colors.background},back:{width:42,height:42,alignItems:'center',justifyContent:'center',borderRadius:14,backgroundColor:colors.surface},title:{color:colors.primary,fontSize:19,fontWeight:'800'},readAllButton:{width:76,alignItems:'flex-end'},readAll:{color:colors.accent,fontSize:11,fontWeight:'800'},readAllMuted:{color:colors.textMuted},content:{padding:20,paddingBottom:35},card:{flexDirection:'row',marginBottom:12,padding:15,borderRadius:18,backgroundColor:colors.background},icon:{width:48,height:48,alignItems:'center',justifyContent:'center',borderRadius:15,backgroundColor:'#FFF0E8'},copy:{flex:1,marginLeft:12},titleRow:{flexDirection:'row',alignItems:'center'},itemTitle:{flex:1,color:colors.primary,fontSize:14,fontWeight:'800'},dot:{width:7,height:7,borderRadius:4,backgroundColor:colors.accent},text:{marginTop:5,color:colors.textMuted,fontSize:11,lineHeight:17},time:{marginTop:7,color:colors.accent,fontSize:9,fontWeight:'700'},center:{flex:1,alignItems:'center',justifyContent:'center',padding:35},empty:{alignItems:'center',paddingTop:100},emptyIcon:{width:88,height:88,alignItems:'center',justifyContent:'center',borderRadius:44,backgroundColor:'#FFF0E8'},emptyTitle:{marginTop:16,color:colors.primary,fontSize:18,fontWeight:'800'},emptyText:{marginTop:7,color:colors.textMuted,fontSize:11,lineHeight:17,textAlign:'center'},error:{marginBottom:12,padding:12,borderRadius:13,backgroundColor:'#FFF1F1'},errorText:{color:'#C83E3E',fontSize:10,textAlign:'center'}});
