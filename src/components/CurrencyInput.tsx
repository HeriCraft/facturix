/**
 * Facturix Atomic CurrencyInput Component
 * Controlled numeric input with prefix adornment, decimal sanitization,
 * and reliable numeric callbacks.
 */

import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

export interface CurrencyInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  value: number;
  onChangeValue: (value: number) => void;
  currencySymbol?: string;
  label?: string;
  allowDecimals?: boolean;
  containerStyle?: ViewStyle;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChangeValue,
  currencySymbol,
  label,
  allowDecimals = true,
  containerStyle,
  placeholder = '0.00',
  editable = true,
  ...rest
}) => {
  // Local string state to handle typing "12." without premature numeric truncation
  const [text, setText] = useState<string>(value ? String(value) : '');

  useEffect(() => {
    // Synchronize when outer numerical value changes significantly (e.g. form reset)
    const currentNum = parseFloat(text) || 0;
    if (value !== currentNum && !text.endsWith('.')) {
      setText(value === 0 ? '' : String(value));
    }
  }, [value]);

  const handleChangeText = (rawText: string) => {
    // Replace comma with period for international keyboards
    let sanitized = rawText.replace(/,/g, '.');

    if (allowDecimals) {
      // Allow only numbers and a single decimal point
      sanitized = sanitized.replace(/[^0-9.]/g, '');
      const parts = sanitized.split('.');
      if (parts.length > 2) {
        sanitized = `${parts[0]}.${parts.slice(1).join('')}`;
      }
      // Limit to 2 decimal places
      if (parts.length === 2 && parts[1].length > 2) {
        sanitized = `${parts[0]}.${parts[1].slice(0, 2)}`;
      }
    } else {
      sanitized = sanitized.replace(/[^0-9]/g, '');
    }

    setText(sanitized);

    const numericValue = parseFloat(sanitized);
    onChangeValue(Number.isFinite(numericValue) ? numericValue : 0);
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputContainer, !editable && styles.disabledInputContainer]}>
        {currencySymbol ? <Text style={styles.symbol}>{currencySymbol}</Text> : null}
        <TextInput
          {...rest}
          value={text}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          keyboardType={allowDecimals ? 'decimal-pad' : 'number-pad'}
          editable={editable}
          style={[styles.input, !currencySymbol && styles.inputWithoutSymbol]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.04,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  disabledInputContainer: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  symbol: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    paddingVertical: 8,
  },
  inputWithoutSymbol: {
    paddingLeft: 0,
  },
});
