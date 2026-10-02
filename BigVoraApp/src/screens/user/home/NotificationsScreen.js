import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../../../theme/colors';

const notifications = [
  {
    id: 'welcome',
    title: 'Welcome to Big Vora',
    text: 'Explore great products and deals selected for you.',
    time: 'Just now',
    icon: 'sparkles-outline',
    unread: true,
  },
  {
    id: 'deal',
    title: 'Weekend deals are live',
    text: 'Save more on fashion, electronics and home essentials.',
    time: '2 hours ago',
    icon: 'pricetag-outline',
    unread: true,
  },
  {
    id: 'delivery',
    title: 'Free delivery',
    text: 'Get FREE delivery on every order of ₹499 or more.',
    time: 'Yesterday',
    icon: 'cube-outline',
  },
];

export default function NotificationsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={navigation.goBack} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
        <Pressable>
          <Text style={styles.readAll}>Read all</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {notifications.map(item => (
          <View key={item.id} style={styles.card}>
            <View style={styles.icon}>
              <Ionicons name={item.icon} size={23} color={colors.accent} />
            </View>
            <View style={styles.copy}>
              <View style={styles.titleRow}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                {item.unread && <View style={styles.dot} />}
              </View>
              <Text style={styles.text}>{item.text}</Text>
              <Text style={styles.time}>{item.time}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: colors.background,
  },
  back: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  title: { color: colors.primary, fontSize: 19, fontWeight: '800' },
  readAll: { color: colors.accent, fontSize: 11, fontWeight: '800' },
  content: { padding: 20 },
  card: {
    flexDirection: 'row',
    marginBottom: 12,
    padding: 15,
    borderRadius: 18,
    backgroundColor: colors.background,
  },
  icon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: '#FFF0E8',
  },
  copy: { flex: 1, marginLeft: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  itemTitle: {
    flex: 1,
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent },
  text: { marginTop: 5, color: colors.textMuted, fontSize: 11, lineHeight: 17 },
  time: { marginTop: 7, color: colors.accent, fontSize: 9, fontWeight: '700' },
});
