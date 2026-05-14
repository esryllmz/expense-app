import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../core/theme/colors';

interface ErrorStateProps {
  title?: string;
  description: string;
  onRetry?: () => void;
}

export const ErrorState = ({
  title = 'Bir hata oluştu',
  description,
  onRetry,
}: ErrorStateProps) => {
  return (
    <View style={styles.card}>
      <Ionicons name="warning-outline" size={34} color={colors.error} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {onRetry && (
        <Pressable onPress={onRetry} style={styles.button}>
          <Text style={styles.buttonText}>Tekrar Dene</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.errorContainer,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: colors.onErrorContainer,
    fontSize: 18,
    fontWeight: '900',
  },
  description: {
    color: colors.onErrorContainer,
    textAlign: 'center',
    lineHeight: 21,
  },
  button: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: colors.error,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  buttonText: {
    color: colors.onError,
    fontWeight: '900',
  },
});
