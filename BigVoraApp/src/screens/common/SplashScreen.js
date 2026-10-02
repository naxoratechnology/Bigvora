import React, {useEffect, useState} from 'react';
import {Platform, StatusBar, StyleSheet, View} from 'react-native';
import {WebView} from 'react-native-webview';
import {useAuth} from '../../features/auth/AuthContext';

const splashSource = Platform.select({
  android: {uri: 'file:///android_asset/BIG_VORA_WELCOME.html'},
  default: require('../../assets/BIG_VORA_WELCOME.html'),
});

function SplashScreen({navigation}) {
  const {authLoading, user} = useAuth();
  const [minTimeDone, setMinTimeDone] = useState(false);
  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      setMinTimeDone(true);
    }, 6200);

    return () => clearTimeout(redirectTimer);
  }, []);
  useEffect(() => {
    if (minTimeDone && !authLoading) navigation.replace(user?.role === 'admin' ? 'Admin' : 'User');
  }, [minTimeDone, authLoading, user?.role, navigation]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <WebView
        source={splashSource}
        style={styles.webView}
        containerStyle={styles.webViewContainer}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030711',
  },
  webViewContainer: {
    backgroundColor: '#030711',
  },
  webView: {
    flex: 1,
    backgroundColor: '#030711',
  },
});

export default SplashScreen;
