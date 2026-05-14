import React, { useMemo, useState } from 'react';
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
import { tokenStorage } from '../../../core/storage/tokenStorage';
import { profileService } from '../services/profileService';

export const ProfileScreen = () => {
  const { user, signIn, signOut } = useAuthContext();

  const initialFullName = useMemo(() => {
    return `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
  }, [user?.firstName, user?.lastName]);

  const [fullName, setFullName] = useState(initialFullName);
  const [email] = useState(user?.email || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

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
      const response = await profileService.updateProfile({
        firstName: parsedName.firstName,
        lastName: parsedName.lastName,
      });

      if (response.success && user) {
        const updatedUser = {
          ...user,
          firstName: parsedName.firstName,
          lastName: parsedName.lastName,
        };

        await tokenStorage.setUser(updatedUser);
        await signIn(updatedUser);

        Alert.alert('Başarılı', response.message || 'Profil bilgileri güncellendi.');
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        'Profil güncellenirken bir hata oluştu.';

      Alert.alert('Hata', message);
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
      const response = await profileService.changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });

      if (response.success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');

        Alert.alert('Başarılı', response.message || 'Şifre başarıyla değiştirildi.');
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        'Şifre değiştirilirken bir hata oluştu.';

      Alert.alert('Hata', message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleContactPress = () => {
    Alert.alert(
      'Bize Ulaşın',
      'Destek için sistem yöneticiniz veya insan kaynakları birimiyle iletişime geçebilirsiniz.'
    );
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      await tokenStorage.clear();
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <AppHeader showNotification showHelp />

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
              Hesap tercihlerinizi ve güvenlik ayarlarınızı buradan yönetin.
            </Text>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="person-outline"
                size={24}
                color={colors.primary}
              />

              <Text style={styles.sectionTitle}>KULLANICI PROFİLİ</Text>
            </View>

            <View style={styles.sectionBody}>
              <InputField
                label="Ad Soyad"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Ad Soyad"
                autoCapitalize="words"
              />

              <InputField
                label="E-posta Adresi"
                value={email}
                onChangeText={() => undefined}
                placeholder="E-posta"
                editable={false}
                keyboardType="email-address"
                autoCapitalize="none"
              />

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
                  <Text style={styles.primaryButtonText}>Profili Güncelle</Text>
                )}
              </Pressable>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="shield-checkmark-outline"
                size={24}
                color={colors.primary}
              />

              <Text style={styles.sectionTitle}>GÜVENLİK</Text>
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
                label="Yeni Şifre (Tekrar)"
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                placeholder="••••••••"
                secureTextEntry
              />

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

          <View style={styles.helpCard}>
            <View style={styles.helpIconArea}>
              <Ionicons
                name="information-circle-outline"
                size={28}
                color={colors.primary}
              />
            </View>

            <View style={styles.helpContent}>
              <Text style={styles.helpTitle}>Yardıma mı ihtiyacınız var?</Text>
              <Text style={styles.helpText}>
                Kurumsal güvenlik politikalarımız gereği şifrenizi her 90 günde
                bir değiştirmeniz önerilir.
              </Text>

              <Pressable onPress={handleContactPress}>
                <Text style={styles.helpLink}>Bize Ulaşın</Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
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
  editable?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  editable = true,
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
        editable={editable}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={[
          styles.input,
          !editable && styles.disabledInput,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background ?? colors.surface,
  },
  keyboardRoot: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 34,
    paddingBottom: 130,
  },
  pageTitleArea: {
    marginBottom: 32,
  },
  pageTitle: {
    color: colors.onSurface,
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '900',
  },
  pageSubtitle: {
    marginTop: 10,
    color: colors.onSurfaceVariant,
    fontSize: 18,
    lineHeight: 28,
  },
  sectionCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(195,198,215,0.22)',
    overflow: 'hidden',
    marginBottom: 28,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
  },
  sectionHeader: {
    minHeight: 72,
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(195,198,215,0.16)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  sectionTitle: {
    color: colors.onSurface,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  sectionBody: {
    padding: 22,
    gap: 18,
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
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surface,
    paddingHorizontal: 18,
    color: colors.onSurface,
    fontSize: 18,
    lineHeight: 24,
  },
  disabledInput: {
    opacity: 0.75,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 10,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3,
  },
  passwordButton: {
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: colors.onPrimary,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  disabledButton: {
    opacity: 0.7,
  },
  helpCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 18,
    padding: 24,
    flexDirection: 'row',
    gap: 18,
    marginBottom: 26,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 1,
  },
  helpIconArea: {
    paddingTop: 4,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    color: colors.onSurface,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
  },
  helpText: {
    marginTop: 8,
    color: colors.onSurfaceVariant,
    fontSize: 17,
    lineHeight: 25,
  },
  helpLink: {
    marginTop: 18,
    color: colors.primary,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '900',
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