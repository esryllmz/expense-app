import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../core/theme/colors';

export const LoadingView = ({ text = 'Yükleniyor...' }: { text?: string }) => {
  return (
    <View style={styles.root}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    paddingVertical: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  text: {
    color: colors.onSurfaceVariant,
    fontWeight: '700',
  },
});
