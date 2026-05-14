import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { colors } from '../../../core/theme/colors';
import { tokenStorage } from '../../../core/auth/tokenStorage';
import { getApiErrorMessage } from '../../../core/api/apiError';
import { authService } from '../services/authService';
import { useAuthContext } from '../context/AuthContext';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from '../types/authTypes';
import type { ApiResponse } from '../../../core/types/ApiResponse';

type Mode = 'login' | 'register';

export const AuthScreen = () => {
  const { signIn } = useAuthContext();
  const [mode, setMode] = useState<Mode>('login');
  const [secureText, setSecureText] = useState(true);

  const [loginForm, setLoginForm] = useState<LoginRequest>({
    email: '',
    password: '',
  });

  const [registerForm, setRegisterForm] = useState<RegisterRequest>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  const loginMutation = useMutation<ApiResponse<AuthResponse>, unknown, LoginRequest>({
    mutationFn: authService.login,
    onSuccess: async (response) => {
      if (!response.success || !response.data) {
        Alert.alert('Giriş başarısız', response.message || 'Bilgileri kontrol edin.');
        return;
      }

      await tokenStorage.setSession(response.data);
      await signIn(response.data.user);
    },
    onError: (error) => {
      Alert.alert(
        'Giriş başarısız',
        getApiErrorMessage(
          error,
          'Sunucu ile iletişim kurulamadı. Backend çalışıyor mu kontrol edin.'
        )
      );
    },
  });

  const registerMutation = useMutation<ApiResponse<null>, unknown, RegisterRequest>({
    mutationFn: authService.register,
    onSuccess: (response) => {
      if (!response.success) {
        Alert.alert('Kayıt başarısız', response.message || 'Bilgileri kontrol edin.');
        return;
      }

      Alert.alert('Kayıt başarılı', 'Hesabınız oluşturuldu. Giriş yapabilirsiniz.');
      setMode('login');
      setLoginForm({
        email: registerForm.email,
        password: registerForm.password,
      });
    },
    onError: (error) => {
      Alert.alert(
        'Kayıt başarısız',
        getApiErrorMessage(error, 'Kayıt sırasında bir hata oluştu.')
      );
    },
  });

  const isLogin = mode === 'login';
  const isLoading = loginMutation.isPending || registerMutation.isPending;

  const handleSubmit = () => {
    if (isLogin) {
      if (!loginForm.email.trim() || !loginForm.password) {
        Alert.alert('Eksik bilgi', 'E-posta ve şifre alanları zorunludur.');
        return;
      }

      loginMutation.mutate({
        email: loginForm.email.trim(),
        password: loginForm.password,
      });

      return;
    }

    if (
      !registerForm.firstName.trim() ||
      !registerForm.lastName.trim() ||
      !registerForm.email.trim() ||
      !registerForm.password
    ) {
      Alert.alert('Eksik bilgi', 'Tüm alanları doldurun.');
      return;
    }

    registerMutation.mutate({
      firstName: registerForm.firstName.trim(),
      lastName: registerForm.lastName.trim(),
      email: registerForm.email.trim(),
      password: registerForm.password,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <MaterialCommunityIcons
              name="wallet-outline"
              size={34}
              color={colors.primary}
            />
            <Text style={styles.brandText}>CapitalFlow</Text>
          </View>

          <View style={styles.heroBackground}>
            <View style={styles.card}>
              <View style={styles.cardBody}>
                <View style={styles.titleArea}>
                  <Text style={styles.title}>
                    {isLogin ? 'Welcome Back' : 'Register your team'}
                  </Text>
                  <Text style={styles.subtitle}>
                    {isLogin
                      ? 'Access your corporate financial dashboard'
                      : 'Create an employee account for CapitalFlow'}
                  </Text>
                </View>

                {!isLogin && (
                  <View style={styles.nameRow}>
                    <Input
                      label="First Name"
                      value={registerForm.firstName}
                      onChangeText={(value) =>
                        setRegisterForm((prev) => ({ ...prev, firstName: value }))
                      }
                      icon="person-outline"
                      placeholder="John"
                      containerStyle={styles.nameInput}
                    />

                    <Input
                      label="Last Name"
                      value={registerForm.lastName}
                      onChangeText={(value) =>
                        setRegisterForm((prev) => ({ ...prev, lastName: value }))
                      }
                      icon="person-outline"
                      placeholder="Doe"
                      containerStyle={styles.nameInput}
                    />
                  </View>
                )}

                <Input
                  label="Email Address"
                  value={isLogin ? loginForm.email : registerForm.email}
                  onChangeText={(value) =>
                    isLogin
                      ? setLoginForm((prev) => ({ ...prev, email: value }))
                      : setRegisterForm((prev) => ({ ...prev, email: value }))
                  }
                  icon="mail-outline"
                  placeholder="name@company.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <View>
                  <Text style={styles.label}>Password</Text>

                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={24}
                      color={colors.outline}
                      style={styles.inputIcon}
                    />

                    <TextInput
                      value={isLogin ? loginForm.password : registerForm.password}
                      onChangeText={(value) =>
                        isLogin
                          ? setLoginForm((prev) => ({ ...prev, password: value }))
                          : setRegisterForm((prev) => ({ ...prev, password: value }))
                      }
                      placeholder="••••••••"
                      placeholderTextColor={colors.outline}
                      secureTextEntry={secureText}
                      style={styles.input}
                    />

                    <Pressable
                      onPress={() => setSecureText((prev) => !prev)}
                      style={styles.eyeButton}
                    >
                      <Ionicons
                        name={secureText ? 'eye-outline' : 'eye-off-outline'}
                        size={24}
                        color={colors.outline}
                      />
                    </Pressable>
                  </View>
                </View>

                <Pressable
                  disabled={isLoading}
                  onPress={handleSubmit}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.buttonPressed,
                    isLoading && styles.buttonDisabled,
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.onPrimary} />
                  ) : (
                    <>
                      <Text style={styles.primaryButtonText}>
                        {isLogin ? 'Sign In' : 'Submit Request'}
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={22}
                        color={colors.onPrimary}
                      />
                    </>
                  )}
                </Pressable>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.footerText}>
                  {isLogin ? "Don't have an account?" : 'Already have an account?'}
                </Text>

                <Pressable onPress={() => setMode(isLogin ? 'register' : 'login')}>
                  <Text style={styles.footerLink}>
                    {isLogin ? ' Register your team' : ' Sign In'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

interface InputProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  containerStyle?: object;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address';
}

const Input = ({
  label,
  value,
  onChangeText,
  icon,
  placeholder,
  containerStyle,
  autoCapitalize,
  keyboardType,
}: InputProps) => {
  return (
    <View style={[styles.inputContainer, containerStyle]}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputWrapper}>
        <Ionicons
          name={icon}
          size={24}
          color={colors.outline}
          style={styles.inputIcon}
        />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.outline}
          style={styles.input}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
  },
  keyboardRoot: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    height: 88,
    backgroundColor: 'rgba(250, 248, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  brandText: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    color: colors.primary,
  },
  heroBackground: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 80,
    paddingBottom: 40,
    backgroundColor: colors.surfaceContainerLow,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 215, 0.3)',
    overflow: 'hidden',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  cardBody: {
    padding: 24,
    gap: 24,
  },
  titleArea: {
    gap: 8,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    color: colors.onSurface,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.onSurfaceVariant,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameInput: {
    flex: 1,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.8,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    marginBottom: 8,
  },
  inputWrapper: {
    minHeight: 64,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 20,
    color: colors.onSurface,
    paddingVertical: 12,
  },
  eyeButton: {
    paddingLeft: 12,
  },
  primaryButton: {
    minHeight: 64,
    borderRadius: 14,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: 18,
    lineHeight: 24,
    color: colors.onPrimary,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cardFooter: {
    minHeight: 72,
    backgroundColor: 'rgba(231, 231, 243, 0.5)',
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  footerText: {
    fontSize: 16,
    color: colors.onSurfaceVariant,
  },
  footerLink: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '800',
  },
});
