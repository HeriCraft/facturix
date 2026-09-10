/**
 * Facturix Atomic Card Component
 * Premium Fintech elevated container with subtle borders and crisp shadows.
 */

import React from 'react';
import { StyleSheet, View, ViewProps, ViewStyle } from 'react-native';

export interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'flat';
  style?: ViewStyle | ViewStyle[];
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  style,
  ...rest
}) => {
  return (
    <View
      style={[
        styles.base,
        variant === 'elevated' && styles.elevated,
        variant === 'outlined' && styles.outlined,
        variant === 'flat' && styles.flat,
        style,
      ]}
      {...rest}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  elevated: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  outlined: {
    borderColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  flat: {
    backgroundColor: '#f8fafc',
    borderColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
});
