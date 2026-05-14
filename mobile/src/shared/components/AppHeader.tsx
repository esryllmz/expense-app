import React from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../core/theme/colors';

interface AppHeaderProps {
  showNotification?: boolean;
  showHelp?: boolean;
  onNotificationPress?: () => void;
}

export const AppHeader = ({
  showNotification = true,
  showHelp = false,
  onNotificationPress,
}: AppHeaderProps) => {
  const handleHelpPress = () => {
    Alert.alert(
      'Yardım',
      'Şifre veya hesap işlemleriyle ilgili destek için sistem yöneticinizle iletişime geçebilirsiniz.'
    );
  };

  return (
    <View style={styles.header}>
      <View style={styles.brandArea}>
        <MaterialCommunityIcons
          name="wallet-outline"
          size={28}
          color={colors.primary}
        />

        <Text style={styles.brandText}>CapitalFlow</Text>
      </View>

      <View style={styles.actions}>
        {showNotification && (
          <Pressable
            style={styles.iconButton}
            onPress={onNotificationPress}
            hitSlop={8}
          >
            <Ionicons
              name="notifications-outline"
              size={23}
              color={colors.onSurfaceVariant}
            />

            <View style={styles.notificationDot} />
          </Pressable>
        )}

        {showHelp && (
          <Pressable
            style={styles.iconButton}
            onPress={handleHelpPress}
            hitSlop={8}
          >
            <Ionicons
              name="help-circle-outline"
              size={24}
              color={colors.onSurfaceVariant}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    minHeight: 84,
    paddingTop:
      Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 18,
    paddingBottom: 14,
    paddingHorizontal: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  brandText: {
    color: colors.primary,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
});