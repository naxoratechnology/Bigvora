import React, {useState} from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View} from 'react-native';
import {Ionicons} from '@react-native-vector-icons/ionicons/static';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAdminData} from '../../../features/admin/AdminDataContext';
import colors from '../../../theme/colors';

const icons = ['notifications-outline', 'sparkles-outline', 'pricetag-outline', 'cube-outline', 'gift-outline', 'megaphone-outline'];
const date = value => new Date(value).toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'});

export default function AdminNotificationsScreen({navigation}) {
  const {notifications, notificationsLoading, notificationsError, refreshNotifications, addNotification, updateNotification, deleteNotification} = useAdminData();
  const [editing, setEditing] = useState(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [icon, setIcon] = useState(icons[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const reset = () => { setEditing(null); setTitle(''); setMessage(''); setIcon(icons[0]); setError(''); };
  const edit = notification => { setEditing(notification); setTitle(notification.title); setMessage(notification.message); setIcon(notification.icon); setError(''); };
  const save = async () => {
    if (!title.trim() || !message.trim()) { setError('Enter a notification title and message.'); return; }
    setSaving(true); setError('');
    try {
      const fields = {title: title.trim(), message: message.trim(), icon};
      if (editing) await updateNotification(editing.id, fields, editing.version);
      else await addNotification(fields);
      reset();
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  };
  const remove = notification => Alert.alert('Delete notification?', 'This removes it from customer inboxes.', [{text: 'Cancel', style: 'cancel'}, {text: 'Delete', style: 'destructive', onPress: () => deleteNotification(notification.id).catch(requestError => setError(requestError.message))}]);
  return <SafeAreaView style={styles.container} edges={['top']}>
    <View style={styles.header}><Pressable onPress={navigation.goBack} style={styles.back}><Ionicons name="arrow-back" size={22} color={colors.primary}/></Pressable><View><Text style={styles.title}>Notifications</Text><Text style={styles.subtitle}>Publish updates to customer inboxes</Text></View><View style={styles.spacer}/></View>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.form}><Text style={styles.formTitle}>{editing ? 'Edit notification' : 'Create notification'}</Text><TextInput value={title} onChangeText={setTitle} maxLength={100} placeholder="e.g. Weekend deals are live" placeholderTextColor={colors.textMuted} style={styles.input}/><TextInput value={message} onChangeText={setMessage} maxLength={400} multiline placeholder="Write a clear customer message" placeholderTextColor={colors.textMuted} style={[styles.input, styles.message]}/><Text style={styles.label}>Icon</Text><View style={styles.iconRow}>{icons.map(item => <Pressable key={item} onPress={() => setIcon(item)} style={[styles.iconChoice, icon === item && styles.iconActive]}><Ionicons name={item} size={20} color={icon === item ? colors.background : colors.primary}/></Pressable>)}</View>{Boolean(error) && <Text style={styles.error}>{error}</Text>}<View style={styles.actions}>{editing && <Pressable onPress={reset} style={styles.cancel}><Text style={styles.cancelText}>Cancel</Text></Pressable>}<Pressable disabled={saving} onPress={save} style={styles.save}><Text style={styles.saveText}>{saving ? 'Saving...' : editing ? 'Save changes' : 'Publish notification'}</Text></Pressable></View></View>
      <View style={styles.listHead}><Text style={styles.listTitle}>Published notifications</Text><Text style={styles.count}>{notifications.length}</Text></View>
      {notificationsLoading && <Text style={styles.info}>Loading notifications...</Text>}{Boolean(notificationsError) && <Pressable onPress={refreshNotifications}><Text style={styles.error}>{notificationsError} Tap to retry.</Text></Pressable>}
      {notifications.map(notification => <View key={notification.id} style={styles.card}><View style={styles.cardIcon}><Ionicons name={notification.icon} size={22} color={colors.accent}/></View><View style={styles.copy}><Text style={styles.cardTitle}>{notification.title}</Text><Text numberOfLines={2} style={styles.cardMessage}>{notification.message}</Text><Text style={styles.meta}>{notification.isActive ? 'Visible to customers' : 'Hidden'} · {date(notification.createdAt)}</Text></View><View style={styles.tools}><Switch value={notification.isActive} onValueChange={value => updateNotification(notification.id, {isActive: value}, notification.version).catch(requestError => setError(requestError.message))} trackColor={{false: colors.border, true: '#FFC7A8'}} thumbColor={notification.isActive ? colors.accent : '#999'}/><Pressable onPress={() => edit(notification)}><Ionicons name="create-outline" size={20} color={colors.primary}/></Pressable><Pressable onPress={() => remove(notification)}><Ionicons name="trash-outline" size={20} color="#C83E3E"/></Pressable></View></View>)}
      {!notificationsLoading && !notifications.length && !notificationsError && <Text style={styles.info}>No notifications yet. Publish your first customer update above.</Text>}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({container:{flex:1,backgroundColor:colors.surface},header:{height:68,flexDirection:'row',alignItems:'center',paddingHorizontal:20,backgroundColor:colors.background},back:{width:40,height:40,alignItems:'center',justifyContent:'center',marginRight:12,borderRadius:13,backgroundColor:colors.surface},title:{color:colors.primary,fontSize:18,fontWeight:'800'},subtitle:{marginTop:2,color:colors.textMuted,fontSize:9},spacer:{flex:1},content:{padding:20,paddingBottom:40},form:{padding:17,borderRadius:20,backgroundColor:colors.background},formTitle:{marginBottom:13,color:colors.primary,fontSize:16,fontWeight:'800'},input:{height:50,marginBottom:11,paddingHorizontal:13,borderWidth:1,borderColor:colors.border,borderRadius:13,color:colors.text,fontSize:12},message:{height:88,paddingTop:13,textAlignVertical:'top'},label:{color:colors.primary,fontSize:11,fontWeight:'700'},iconRow:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:9,marginBottom:14},iconChoice:{width:42,height:42,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:colors.border,borderRadius:12},iconActive:{borderColor:colors.accent,backgroundColor:colors.accent},actions:{flexDirection:'row',justifyContent:'flex-end'},cancel:{height:44,justifyContent:'center',paddingHorizontal:17},cancelText:{color:colors.textMuted,fontSize:12,fontWeight:'700'},save:{height:44,justifyContent:'center',paddingHorizontal:18,borderRadius:13,backgroundColor:colors.accent},saveText:{color:colors.background,fontSize:11,fontWeight:'800'},error:{marginVertical:8,color:'#C83E3E',fontSize:11},listHead:{flexDirection:'row',alignItems:'center',marginTop:23,marginBottom:10},listTitle:{color:colors.primary,fontSize:16,fontWeight:'800'},count:{marginLeft:8,paddingHorizontal:8,paddingVertical:3,borderRadius:9,backgroundColor:'#FFF0E8',color:colors.accent,fontSize:10,fontWeight:'800'},info:{paddingVertical:18,color:colors.textMuted,fontSize:12,textAlign:'center'},card:{flexDirection:'row',alignItems:'center',marginBottom:10,padding:14,borderRadius:17,backgroundColor:colors.background},cardIcon:{width:43,height:43,alignItems:'center',justifyContent:'center',borderRadius:13,backgroundColor:'#FFF0E8'},copy:{flex:1,marginHorizontal:11},cardTitle:{color:colors.primary,fontSize:13,fontWeight:'800'},cardMessage:{marginTop:3,color:colors.textMuted,fontSize:10,lineHeight:14},meta:{marginTop:5,color:colors.accent,fontSize:8,fontWeight:'700'},tools:{alignItems:'center',gap:9}});
