import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { useSignUp, useSSO } from '@clerk/expo';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { signUp, errors, fetchStatus } = useSignUp();
  const { startSSOFlow } = useSSO();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [generalError, setGeneralError] = useState('');

  const isVerifyStep =
    signUp.status === 'missing_requirements' &&
    signUp.unverifiedFields.includes('email_address') &&
    signUp.missingFields.length === 0;

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void WebBrowser.warmUpAsync();
    return () => { void WebBrowser.coolDownAsync(); };
  }, []);

  const handleSignUp = async () => {
    if (!email || !password || fetchStatus === 'fetching') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGeneralError('');

    const { error } = await signUp.password({ emailAddress: email, password });
    if (error) {
      setGeneralError(error.message ?? 'Sign up failed');
      return;
    }
    if (!error) {
      await signUp.verifications.sendEmailCode();
    }
  };

  const handleVerify = async () => {
    if (!code || fetchStatus === 'fetching') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await signUp.verifications.verifyEmailCode({ code });
    if (signUp.status === 'complete') {
      await signUp.finalize({
        navigate: ({ decorateUrl }) => {
          const url = decorateUrl('/');
          if (Platform.OS === 'web' && url.startsWith('http')) {
            // @ts-ignore
            window.location.href = url;
          } else {
            router.replace('/');
          }
        },
      });
    }
  };

  const handleGoogle = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGeneralError('');
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: AuthSession.makeRedirectUri(),
      });
      if (createdSessionId) {
        await setActive!({
          session: createdSessionId,
          navigate: async () => { router.replace('/'); },
        });
      }
    } catch (err: unknown) {
      setGeneralError(err instanceof Error ? err.message : 'Google sign-in failed');
    }
  }, [startSSOFlow, router]);

  const s = makeStyles(colors, insets);

  // ── Verification step ─────────────────────────────────────────────────────
  if (isVerifyStep) {
    return (
      <View style={[s.container, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0) + 20 }]}>
        <View style={s.logoRow}>
          <View style={s.logoIcon}>
            <Ionicons name="play" size={22} color="#fff" />
          </View>
          <Text style={s.logoText}>Learn<Text style={s.logoBlue}>Tube</Text></Text>
        </View>
        <Text style={s.title}>Check your email</Text>
        <Text style={s.subtitle}>We sent a verification code to {email}</Text>

        <TextInput
          style={s.input}
          value={code}
          onChangeText={setCode}
          placeholder="000000"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="number-pad"
          autoFocus
        />
        {errors.fields.code && <Text style={s.errorText}>{errors.fields.code.message}</Text>}

        <Pressable
          style={({ pressed }) => [
            s.primaryBtn,
            (!code || fetchStatus === 'fetching') && s.disabledBtn,
            pressed && s.pressed,
          ]}
          onPress={handleVerify}
          disabled={!code || fetchStatus === 'fetching'}
        >
          {fetchStatus === 'fetching' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.primaryBtnText}>Verify Email</Text>
          )}
        </Pressable>

        <Pressable
          style={s.textBtn}
          onPress={() => signUp.verifications.sendEmailCode()}
        >
          <Text style={s.textBtnLabel}>Resend code</Text>
        </Pressable>

        {/* Captcha required by Clerk */}
        <View nativeID="clerk-captcha" />
      </View>
    );
  }

  // ── Main sign-up ──────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={s.flex}
        contentContainerStyle={[
          s.container,
          { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0) },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.logoRow}>
          <View style={s.logoIcon}>
            <Ionicons name="play" size={22} color="#fff" />
          </View>
          <Text style={s.logoText}>Learn<Text style={s.logoBlue}>Tube</Text></Text>
        </View>

        <Text style={s.title}>Create account</Text>
        <Text style={s.subtitle}>Start learning smarter today</Text>

        {/* Google button */}
        <Pressable
          style={({ pressed }) => [s.googleBtn, pressed && s.pressed]}
          onPress={handleGoogle}
        >
          <Ionicons name="logo-google" size={18} color={colors.foreground} />
          <Text style={s.googleBtnText}>Continue with Google</Text>
        </Pressable>

        {/* Divider */}
        <View style={s.dividerRow}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>or</Text>
          <View style={s.dividerLine} />
        </View>

        <Text style={s.label}>Email</Text>
        <TextInput
          style={s.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          returnKeyType="next"
        />
        {errors.fields.emailAddress && (
          <Text style={s.errorText}>{errors.fields.emailAddress.message}</Text>
        )}

        <Text style={s.label}>Password</Text>
        <View style={s.inputRow}>
          <TextInput
            style={[s.input, s.flex, { marginBottom: 0 }]}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry={!showPassword}
            returnKeyType="done"
            onSubmitEditing={handleSignUp}
          />
          <Pressable onPress={() => setShowPassword((v) => !v)} style={s.eyeBtn}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.mutedForeground}
            />
          </Pressable>
        </View>
        {errors.fields.password && (
          <Text style={s.errorText}>{errors.fields.password.message}</Text>
        )}
        {generalError ? <Text style={s.errorText}>{generalError}</Text> : null}

        <Pressable
          style={({ pressed }) => [
            s.primaryBtn,
            (!email || !password || fetchStatus === 'fetching') && s.disabledBtn,
            pressed && s.pressed,
          ]}
          onPress={handleSignUp}
          disabled={!email || !password || fetchStatus === 'fetching'}
        >
          {fetchStatus === 'fetching' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.primaryBtnText}>Create Account</Text>
          )}
        </Pressable>

        <View style={s.footer}>
          <Text style={s.footerText}>Already have an account? </Text>
          <Link href="/(auth)/sign-in">
            <Text style={s.link}>Sign in</Text>
          </Link>
        </View>

        {/* Captcha required by Clerk */}
        <View nativeID="clerk-captcha" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(c: ReturnType<typeof useColors>, insets: ReturnType<typeof useSafeAreaInsets>) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: c.background },
    container: {
      flexGrow: 1,
      backgroundColor: c.background,
      paddingHorizontal: 24,
      paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 32,
    },
    logoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 40,
      marginTop: 20,
    },
    logoIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoText: {
      fontSize: 22,
      fontFamily: 'Inter_700Bold',
      color: c.foreground,
    },
    logoBlue: { color: c.primary },
    title: {
      fontSize: 28,
      fontFamily: 'Inter_700Bold',
      color: c.foreground,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 15,
      fontFamily: 'Inter_400Regular',
      color: c.mutedForeground,
      marginBottom: 32,
    },
    googleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      height: 50,
      borderRadius: c.radius,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      marginBottom: 20,
    },
    googleBtnText: {
      fontSize: 15,
      fontFamily: 'Inter_600SemiBold',
      color: c.foreground,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 20,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: c.border },
    dividerText: {
      fontSize: 13,
      fontFamily: 'Inter_400Regular',
      color: c.mutedForeground,
    },
    label: {
      fontSize: 13,
      fontFamily: 'Inter_600SemiBold',
      color: c.foreground,
      marginBottom: 6,
    },
    input: {
      height: 50,
      borderRadius: c.radius,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      paddingHorizontal: 14,
      fontSize: 15,
      fontFamily: 'Inter_400Regular',
      color: c.foreground,
      marginBottom: 16,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: c.radius,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      height: 50,
      marginBottom: 16,
      paddingRight: 12,
    },
    eyeBtn: { padding: 4 },
    primaryBtn: {
      height: 50,
      borderRadius: c.radius,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      marginBottom: 24,
    },
    primaryBtnText: {
      fontSize: 16,
      fontFamily: 'Inter_600SemiBold',
      color: c.primaryForeground,
    },
    disabledBtn: { opacity: 0.5 },
    pressed: { opacity: 0.8 },
    textBtn: { alignItems: 'center', paddingVertical: 10 },
    textBtnLabel: {
      fontSize: 14,
      fontFamily: 'Inter_500Medium',
      color: c.primary,
    },
    errorText: {
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
      color: c.destructive,
      marginTop: -10,
      marginBottom: 12,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    footerText: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: c.mutedForeground,
    },
    link: {
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
      color: c.primary,
    },
  });
}
