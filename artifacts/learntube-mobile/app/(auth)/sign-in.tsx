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
import { useSignIn, useSSO } from '@clerk/expo';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { signIn, errors, fetchStatus } = useSignIn();
  const { startSSOFlow } = useSSO();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void WebBrowser.warmUpAsync();
    return () => { void WebBrowser.coolDownAsync(); };
  }, []);

  const handleSignIn = async () => {
    if (!email || !password || fetchStatus === 'fetching') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGeneralError('');

    const { error } = await signIn.password({ emailAddress: email, password });
    if (error) {
      setGeneralError(error.message ?? 'Sign in failed');
      return;
    }

    if (signIn.status === 'complete') {
      await signIn.finalize({
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
    } else if (signIn.status === 'needs_client_trust') {
      // Auto-send the email MFA code
      const emailFactor = signIn.supportedSecondFactors?.find(
        (f) => f.strategy === 'email_code',
      );
      if (emailFactor) {
        await signIn.mfa.sendEmailCode();
      }
    }
  };

  const handleMfaVerify = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await signIn.mfa.verifyEmailCode({ code: mfaCode });
    if (signIn.status === 'complete') {
      await signIn.finalize({
        navigate: () => { router.replace('/'); },
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

  // ── MFA step ──────────────────────────────────────────────────────────────
  if (signIn.status === 'needs_client_trust') {
    return (
      <View style={[s.container, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0) }]}>
        <View style={s.logoRow}>
          <View style={s.logoIcon}>
            <Ionicons name="play" size={22} color="#fff" />
          </View>
          <Text style={s.logoText}>Learn<Text style={s.logoBlue}>Tube</Text></Text>
        </View>
        <Text style={s.title}>Verify your identity</Text>
        <Text style={s.subtitle}>Enter the code sent to your email</Text>
        <TextInput
          style={s.input}
          value={mfaCode}
          onChangeText={setMfaCode}
          placeholder="000000"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="number-pad"
          autoFocus
        />
        {errors.fields.code && <Text style={s.errorText}>{errors.fields.code.message}</Text>}
        <Pressable
          style={({ pressed }) => [s.primaryBtn, pressed && s.pressed]}
          onPress={handleMfaVerify}
        >
          <Text style={s.primaryBtnText}>Verify</Text>
        </Pressable>
        <Pressable onPress={() => signIn.mfa.sendEmailCode()} style={s.textBtn}>
          <Text style={s.textBtnLabel}>Resend code</Text>
        </Pressable>
        <Pressable onPress={() => signIn.reset()} style={s.textBtn}>
          <Text style={s.textBtnLabel}>Start over</Text>
        </Pressable>
      </View>
    );
  }

  // ── Main sign-in ──────────────────────────────────────────────────────────
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
        {/* Logo */}
        <View style={s.logoRow}>
          <View style={s.logoIcon}>
            <Ionicons name="play" size={22} color="#fff" />
          </View>
          <Text style={s.logoText}>Learn<Text style={s.logoBlue}>Tube</Text></Text>
        </View>

        <Text style={s.title}>Welcome back</Text>
        <Text style={s.subtitle}>Sign in to continue learning</Text>

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

        {/* Email */}
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
        {errors.fields.identifier && (
          <Text style={s.errorText}>{errors.fields.identifier.message}</Text>
        )}

        {/* Password */}
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
            onSubmitEditing={handleSignIn}
          />
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            style={s.eyeBtn}
          >
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

        {/* Sign in button */}
        <Pressable
          style={({ pressed }) => [
            s.primaryBtn,
            (!email || !password || fetchStatus === 'fetching') && s.disabledBtn,
            pressed && s.pressed,
          ]}
          onPress={handleSignIn}
          disabled={!email || !password || fetchStatus === 'fetching'}
        >
          {fetchStatus === 'fetching' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.primaryBtnText}>Sign In</Text>
          )}
        </Pressable>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>Don't have an account? </Text>
          <Link href="/(auth)/sign-up">
            <Text style={s.link}>Sign up</Text>
          </Link>
        </View>
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
