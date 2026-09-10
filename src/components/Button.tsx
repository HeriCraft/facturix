/**
 * Facturix Atomic Button Component
 * Tactile, high-contrast, accessible button with variant hierarchy and loading states.
 */

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  accessibilityLabel?: string;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
  accessibilityLabel,
  testID,
}) => {
  const isInteractive = !disabled && !loading;

  return (
    <Pressable
      testID={testID}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      disabled={!isInteractive}
      onPress={isInteractive ? onPress : undefined}
      style={({ pressed }) => [
        styles.base,
        VARIANT_VIEW_STYLES[variant],
        SIZE_VIEW_STYLES[size],
        fullWidth && styles.fullWidth,
        pressed && isInteractive && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? '#2563eb' : '#ffffff'}
        />
      ) : (
        <>
          {icon ? <React.Fragment>{icon}</React.Fragment> : null}
          <Text
            style={[
              styles.text,
              VARIANT_TEXT_STYLES[variant],
              SIZE_TEXT_STYLES[size],
              icon ? styles.textWithIcon : null,
              disabled ? styles.textDisabled : null,
              textStyle,
            ]}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.5,
    backgroundColor: '#cbd5e1',
    borderColor: 'transparent',
  },

  // Variants
  primary: {
    backgroundColor: '#2563eb', // Action Blue
    borderColor: '#2563eb',
  },
  secondary: {
    backgroundColor: '#0f172a', // Slate Navy
    borderColor: '#0f172a',
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: '#cbd5e1',
  },
  danger: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },

  // Sizes
  size_sm: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  size_md: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  size_lg: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
  },

  // Text Styles
  text: {
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: -0.01,
  },
  textWithIcon: {
    marginLeft: 8,
  },
  text_primary: {
    color: '#ffffff',
  },
  text_secondary: {
    color: '#ffffff',
  },
  text_outline: {
    color: '#0f172a',
  },
  text_danger: {
    color: '#ffffff',
  },
  text_ghost: {
    color: '#2563eb',
  },
  textSize_sm: {
    fontSize: 13,
    lineHeight: 16,
  },
  textSize_md: {
    fontSize: 15,
    lineHeight: 20,
  },
  textSize_lg: {
    fontSize: 16,
    lineHeight: 22,
  },
  textDisabled: {
    color: '#64748b',
  },
});

const VARIANT_VIEW_STYLES: Record<ButtonVariant, ViewStyle> = {
  primary: styles.primary,
  secondary: styles.secondary,
  outline: styles.outline,
  danger: styles.danger,
  ghost: styles.ghost,
};

const SIZE_VIEW_STYLES: Record<ButtonSize, ViewStyle> = {
  sm: styles.size_sm,
  md: styles.size_md,
  lg: styles.size_lg,
};

const VARIANT_TEXT_STYLES: Record<ButtonVariant, TextStyle> = {
  primary: styles.text_primary,
  secondary: styles.text_secondary,
  outline: styles.text_outline,
  danger: styles.text_danger,
  ghost: styles.text_ghost,
};

const SIZE_TEXT_STYLES: Record<ButtonSize, TextStyle> = {
  sm: styles.textSize_sm,
  md: styles.textSize_md,
  lg: styles.textSize_lg,
};

