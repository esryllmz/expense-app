import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../core/theme/colors';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

export const EmptyState = ({
  icon = 'information-circle-outline',
  title,
  description,
}: EmptyStateProps) => {
  return (
    <View style={styles.card}>
      <Ionicons name={icon} size={36} color={colors.primary} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(195,198,215,0.3)',
  },
  title: {
    color: colors.onSurface,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  description: {
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 21,
  },
});
