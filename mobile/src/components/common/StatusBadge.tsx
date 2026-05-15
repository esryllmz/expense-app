import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../core/theme/colors';
import { getStatusLabel } from '../../core/utils/formatters';
import type { RequestStatus } from '../../features/expense/types/expenseTypes';

export const StatusBadge = ({ status }: { status: RequestStatus }) => {
  const config = getStatusConfig(status);

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.color }]}>
        {getStatusLabel(status)}
      </Text>
    </View>
  );
};

const getStatusConfig = (status: RequestStatus) => {
  switch (status) {
    case 'APPROVED':
      return {
        bg: '#D1FAE5',
        color: '#047857',
      };
    case 'REJECTED':
      return {
        bg: colors.errorContainer,
        color: colors.onErrorContainer,
      };
    case 'PENDING':
    default:
      return {
        bg: '#FEF3C7',
        color: '#B45309',
      };
  }
};

const styles = StyleSheet.create({
  badge: {
    minHeight: 28,
    borderRadius: 999,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '900',
  },
});
