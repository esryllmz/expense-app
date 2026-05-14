import React, { useEffect, useMemo, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../core/theme/colors';
import { AppHeader } from '../../../shared/components/AppHeader';
import { useAuthContext } from '../../auth/context/AuthContext';
import { tokenStorage } from '../../../core/auth/tokenStorage';
import { getApiErrorMessage } from '../../../core/api/apiError';
import { getRoleLabel } from '../../../core/utils/formatters';
import { userService } from '../../setting/services/userService';

export const ProfileScreen = () => {
  const { user, signIn, signOut } = useAuthContext();

  const initialFullName = useMemo(() => {
    return `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
  }, [user?.firstName, user?.lastName]);

  const [fullName, setFullName] = useState(initialFullName);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    setFullName(initialFullName);
  }, [initialFullName]);

  const splitFullName = (value: string) => {
    const normalized = value.trim().replace(/\s+/g, ' ');
    const parts = normalized.split(' ');

    if (parts.length < 2) {
      return {
        firstName: normalized,
        lastName: '',
      };
    }

    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' '),
    };
  };

  const validatePassword = () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Alert.alert('Eksik bilgi', 'Şifre alanlarının tamamı doldurulmalıdır.');
      return false;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert('Şifre uyuşmuyor', 'Yeni şifreler birbiriyle eşleşmiyor.');
      return false;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (!passwordRegex.test(newPassword)) {
      Alert.alert(
        'Geçersiz şifre',
        'Yeni şifre en az 8 karakter olmalı, bir büyük harf, bir küçük harf ve bir rakam içermelidir.'
      );
      return false;
    }

    return true;
  };

  const handleUpdateProfile = async () => {
    const parsedName = splitFullName(fullName);

    if (!parsedName.firstName || !parsedName.lastName) {
      Alert.alert('Eksik bilgi', 'Ad ve soyad bilgisi birlikte girilmelidir.');
      return;
    }

    setProfileLoading(true);

    try {
      const response = await userService.updateProfile({
        firstName: parsedName.firstName,
        lastName: parsedName.lastName,
      });

      if (!response.success) {
        Alert.alert('Hata', response.message || 'Profil güncellenemedi.');
        return;
      }

      if (user) {
        const updatedUser = {
          ...user,
          firstName: parsedName.firstName,
          lastName: parsedName.lastName,
        };

        await tokenStorage.setUser(updatedUser);
        await signIn(updatedUser);
      }

      Alert.alert('Başarılı', response.message || 'Profil bilgileri güncellendi.');
    } catch (error) {
      Alert.alert(
        'Hata',
        getApiErrorMessage(error, 'Profil güncellenirken bir hata oluştu.')
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) {
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await userService.changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });

      if (!response.success) {
        Alert.alert('Hata', response.message || 'Şifre değiştirilemedi.');
        return;
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');

      Alert.alert('Başarılı', response.message || 'Şifre başarıyla değiştirildi.');
    } catch (error) {
      Alert.alert(
        'Hata',
        getApiErrorMessage(error, 'Şifre değiştirilirken bir hata oluştu.')
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>

    <AppHeader showHelp />

      <KeyboardAvoidingView
        style={styles.keyboardRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.pageTitleArea}>
            <Text style={styles.pageTitle}>Ayarlar</Text>
            <Text style={styles.pageSubtitle}>
              Profil bilgilerinizi ve güvenlik ayarlarınızı buradan yönetebilirsiniz.
            </Text>
          </View>

          <View style={styles.identityCard}>
            <View style={styles.avatar}>
              <Ionicons name="person-outline" size={30} color={colors.primary} />
            </View>

            <View style={styles.identityContent}>
              <Text style={styles.identityName}>{initialFullName || '-'}</Text>
              <Text style={styles.identityRole}>{getRoleLabel(user?.role)}</Text>

              {!!user?.managerName && (
                <Text style={styles.identityMeta}>
                  Yönetici: {user.managerName}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={23} color={colors.primary} />
              <Text style={styles.sectionTitle}>PROFİL BİLGİLERİ</Text>
            </View>

            <View style={styles.sectionBody}>
              <InputField
                label="Ad Soyad"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Ad Soyad"
                autoCapitalize="words"
              />

              <InfoRow label="E-posta Adresi" value={user?.email || '-'} />
              <InfoRow label="Rol" value={getRoleLabel(user?.role)} />

              <Pressable
                disabled={profileLoading}
                onPress={handleUpdateProfile}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.pressed,
                  profileLoading && styles.disabledButton,
                ]}
              >
                {profileLoading ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={styles.primaryButtonText}>Ad Soyad Güncelle</Text>
                )}
              </Pressable>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="shield-checkmark-outline"
                size={23}
                color={colors.primary}
              />
              <Text style={styles.sectionTitle}>ŞİFRE İŞLEMLERİ</Text>
            </View>

            <View style={styles.sectionBody}>
              <InputField
                label="Mevcut Şifre"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="••••••••"
                secureTextEntry
              />

              <InputField
                label="Yeni Şifre"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="••••••••"
                secureTextEntry
              />

              <InputField
                label="Yeni Şifre Tekrar"
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                placeholder="••••••••"
                secureTextEntry
              />

              <Text style={styles.passwordHint}>
                Yeni şifre en az 8 karakter olmalı, bir büyük harf, bir küçük harf
                ve bir rakam içermelidir.
              </Text>

              <Pressable
                disabled={passwordLoading}
                onPress={handleChangePassword}
                style={({ pressed }) => [
                  styles.primaryButton,
                  styles.passwordButton,
                  pressed && styles.pressed,
                  passwordLoading && styles.disabledButton,
                ]}
              >
                {passwordLoading ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={styles.primaryButtonText}>Şifreyi Değiştir</Text>
                )}
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={() => {
              Alert.alert(
                'Çıkış Yap',
                'Oturumunuzu kapatmak istiyor musunuz?',
                [
                  {
                    text: 'Vazgeç',
                    style: 'cancel',
                  },
                  {
                    text: 'Çıkış Yap',
                    style: 'destructive',
                    onPress: signOut,
                  },
                ]
              );
            }}
            style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.onErrorContainer} />
            <Text style={styles.logoutText}>Çıkış Yap</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: InputFieldProps) => {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.outline}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={styles.input}
      />
    </View>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardRoot: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 130,
  },
  pageTitleArea: {
    marginBottom: 22,
  },
  pageTitle: {
    color: colors.onSurface,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '900',
  },
  pageSubtitle: {
    marginTop: 8,
    color: colors.onSurfaceVariant,
    fontSize: 16,
    lineHeight: 24,
  },
  identityCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(195,198,215,0.25)',
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityContent: {
    flex: 1,
  },
  identityName: {
    color: colors.onSurface,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
  },
  identityRole: {
    marginTop: 2,
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  identityMeta: {
    marginTop: 3,
    color: colors.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(195,198,215,0.22)',
    overflow: 'hidden',
    marginBottom: 24,
  },
  sectionHeader: {
    minHeight: 66,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(195,198,215,0.16)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    color: colors.onSurface,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  sectionBody: {
    padding: 20,
    gap: 17,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  input: {
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    color: colors.onSurface,
    fontSize: 17,
    lineHeight: 24,
  },
  infoRow: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  infoLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  infoValue: {
    marginTop: 4,
    color: colors.onSurface,
    fontSize: 16,
    fontWeight: '800',
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 12,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passwordButton: {
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: colors.onPrimary,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '900',
  },
  passwordHint: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  disabledButton: {
    opacity: 0.7,
  },
  logoutButton: {
    height: 54,
    borderRadius: 12,
    backgroundColor: colors.errorContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: {
    color: colors.onErrorContainer,
    fontSize: 16,
    fontWeight: '900',
  },
});