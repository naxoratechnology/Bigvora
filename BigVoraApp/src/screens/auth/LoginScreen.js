import React, {useState} from 'react';
import {Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {Ionicons} from '@react-native-vector-icons/ionicons/static';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuth} from '../../features/auth/AuthContext';
import colors from '../../theme/colors';

export default function LoginScreen({navigation}) {
  const {signIn} = useAuth();
  const [method, setMethod] = useState('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (isSubmitting) return;
    const validIdentifier = method === 'email' ? /^\S+@\S+\.\S+$/.test(identifier) : /^\d{10}$/.test(identifier);
    if (!validIdentifier) return setError(method === 'email' ? 'Enter a valid email address.' : 'Enter a valid 10-digit mobile number.');
    if (password.length < 8) return setError('Password must contain at least 8 characters.');
    setError('');
    setIsSubmitting(true);
    try {
      const signedInUser = await signIn({identifier: identifier.trim(), method, password});
      if (signedInUser.role === 'admin') {
        navigation.getParent()?.replace('Admin');
        return;
      }
      navigation.popTo('Tabs');
    } catch (loginError) {
      setError(loginError.message || 'Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMethod = nextMethod => {setMethod(nextMethod); setIdentifier(''); setError('');};

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Pressable accessibilityLabel="Go back" onPress={navigation.goBack} style={styles.backButton}><Ionicons name="arrow-back" size={22} color={colors.primary} /></Pressable>
          <Image source={require('../../assets/logo-transparent.png')} resizeMode="contain" style={styles.logo} />
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue shopping with Big Vora</Text>
          <Text style={styles.adminHint}>Sign in with your customer or admin account</Text>

          <View style={styles.methodTabs}>
            {['mobile', 'email'].map(item => <Pressable key={item} onPress={() => switchMethod(item)} style={[styles.methodTab, method === item && styles.methodTabActive]}><Ionicons name={item === 'mobile' ? 'phone-portrait-outline' : 'mail-outline'} size={17} color={method === item ? colors.background : colors.textMuted} /><Text style={[styles.methodText, method === item && styles.methodTextActive]}>{item === 'mobile' ? 'Mobile' : 'Email'}</Text></Pressable>)}
          </View>

          <Text style={styles.label}>{method === 'mobile' ? 'Mobile number' : 'Email address'}</Text>
          <View style={styles.inputWrap}>
            <Ionicons name={method === 'mobile' ? 'call-outline' : 'mail-outline'} size={20} color={colors.textMuted} />
            {method === 'mobile' && <Text style={styles.prefix}>+91</Text>}
            <TextInput value={identifier} onChangeText={setIdentifier} autoCapitalize="none" keyboardType={method === 'mobile' ? 'phone-pad' : 'email-address'} maxLength={method === 'mobile' ? 10 : undefined} placeholder={method === 'mobile' ? '10-digit mobile number' : 'you@example.com'} placeholderTextColor={colors.textMuted} style={styles.input} />
          </View>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
            <TextInput value={password} onChangeText={setPassword} secureTextEntry={!showPassword} placeholder="Enter your password" placeholderTextColor={colors.textMuted} style={styles.input} />
            <Pressable hitSlop={8} onPress={() => setShowPassword(value => !value)}><Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={21} color={colors.textMuted} /></Pressable>
          </View>
          {Boolean(error) && <View style={styles.errorBox}><Ionicons name="alert-circle-outline" size={17} color="#C83E3E" /><Text style={styles.errorText}>{error}</Text></View>}
          <Pressable onPress={submit} disabled={isSubmitting} accessibilityState={{disabled: isSubmitting, busy: isSubmitting}} style={styles.primaryButton}><Text style={styles.primaryText}>{isSubmitting ? 'Signing in...' : 'Sign in'}</Text><Ionicons name="arrow-forward" size={18} color={colors.background} /></Pressable>
          <View style={styles.registerRow}><Text style={styles.registerPrompt}>New to Big Vora?</Text><Pressable onPress={() => navigation.replace('Register')}><Text style={styles.registerLink}> Create account</Text></Pressable></View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({container: {flex: 1, backgroundColor: colors.background}, flex: {flex: 1}, content: {flexGrow: 1, paddingHorizontal: 24, paddingBottom: 30}, backButton: {width: 42, height: 42, alignItems: 'center', justifyContent: 'center', marginTop: 4, borderRadius: 14, backgroundColor: colors.surface}, logo: {width: 88, height: 88, alignSelf: 'center', marginTop: 6}, title: {marginTop: 10, color: colors.primary, fontSize: 28, fontWeight: '800', textAlign: 'center'}, subtitle: {marginTop: 7, color: colors.textMuted, fontSize: 13, textAlign: 'center'}, adminHint: {marginTop: 8, color: colors.accent, fontSize: 11, fontWeight: '700', textAlign: 'center'}, methodTabs: {flexDirection: 'row', marginTop: 22, marginBottom: 23, padding: 4, borderRadius: 15, backgroundColor: colors.surface}, methodTab: {flex: 1, height: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12}, methodTabActive: {backgroundColor: colors.primary}, methodText: {marginLeft: 7, color: colors.textMuted, fontSize: 12, fontWeight: '700'}, methodTextActive: {color: colors.background}, label: {marginBottom: 7, color: colors.primary, fontSize: 12, fontWeight: '700'}, inputWrap: {height: 54, flexDirection: 'row', alignItems: 'center', marginBottom: 17, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 15, backgroundColor: colors.surface}, input: {flex: 1, marginLeft: 10, color: colors.text, fontSize: 14}, prefix: {marginLeft: 9, color: colors.primary, fontSize: 13, fontWeight: '700'}, forgotButton: {alignSelf: 'flex-end', marginTop: -7}, forgotText: {color: colors.accent, fontSize: 12, fontWeight: '700'}, errorBox: {flexDirection: 'row', alignItems: 'center', marginTop: 15, padding: 10, borderRadius: 11, backgroundColor: '#FFF0F0'}, errorText: {flex: 1, marginLeft: 7, color: '#C83E3E', fontSize: 11}, primaryButton: {height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 22, borderRadius: 16, backgroundColor: colors.accent}, primaryText: {marginRight: 9, color: colors.background, fontSize: 15, fontWeight: '800'}, registerRow: {flexDirection: 'row', justifyContent: 'center', marginTop: 22}, registerPrompt: {color: colors.textMuted, fontSize: 12}, registerLink: {color: colors.accent, fontSize: 12, fontWeight: '800'}});
