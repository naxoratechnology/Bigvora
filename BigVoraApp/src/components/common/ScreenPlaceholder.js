import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import colors from '../../theme/colors';

function ScreenPlaceholder({title}) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Coming soon</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
  content: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  title: {color: colors.primary, fontSize: 26, fontWeight: '800'},
  subtitle: {marginTop: 8, color: colors.textMuted, fontSize: 14},
});

export default ScreenPlaceholder;
