import React from 'react';
import { StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../core/theme/colors';

interface AppHeaderProps {
  showNotification?: boolean;
  showSearch?: boolean;
  showHelp?: boolean;
}

export const AppHeader = ({
  showNotification = true,
  showSearch = false,
  showHelp = false,
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
        {showSearch && (
          <Pressable style={styles.iconButton}>
            <Ionicons
              name="search-outline"
              size={26}
              color={colors.onSurfaceVariant}
            />
          </Pressable>
        )}

        {showNotification && (
          <Pressable style={styles.iconButton}>
            <Ionicons
              name="notifications-outline"
              size={24}
              color={colors.onSurfaceVariant}
            />
          </Pressable>
        )}

        {showHelp && (
          <Pressable style={styles.iconButton} onPress={handleHelpPress}>
            <Ionicons
              name="help-circle-outline"
              size={26}
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
    height: 72,
    paddingHorizontal: 22,
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
  },
  brandText: {
    color: colors.primary,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
});