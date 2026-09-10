/**
 * Facturix Atomic SegmentedControl Component
 * Tactile pill switcher for document filters and document type toggling.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

export interface SegmentOption<T extends string = string> {
  key: T;
  label: string;
  count?: number;
}

export interface SegmentedControlProps<T extends string = string> {
  options: readonly SegmentOption<T>[];
  selectedKey: T;
  onSelect: (key: T) => void;
  style?: ViewStyle;
}

export function SegmentedControl<T extends string = string>({
  options,
  selectedKey,
  onSelect,
  style,
}: SegmentedControlProps<T>) {
  return (
    <View style={[styles.container, style]}>
      {options.map((option) => {
        const isSelected = option.key === selectedKey;
        return (
          <Pressable
            key={option.key}
            onPress={() => onSelect(option.key)}
            style={({ pressed }) => [
              styles.segment,
              isSelected && styles.selectedSegment,
              pressed && !isSelected && styles.pressedSegment,
            ]}>
            <Text
              style={[
                styles.label,
                isSelected ? styles.selectedLabel : styles.unselectedLabel,
              ]}>
              {option.label}
            </Text>
            {typeof option.count === 'number' ? (
              <View
                style={[
                  styles.countBadge,
                  isSelected ? styles.selectedCountBadge : styles.unselectedCountBadge,
                ]}>
                <Text
                  style={[
                    styles.countText,
                    isSelected ? styles.selectedCountText : styles.unselectedCountText,
                  ]}>
                  {option.count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  selectedSegment: {
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  pressedSegment: {
    opacity: 0.7,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.01,
  },
  selectedLabel: {
    color: '#0f172a',
  },
  unselectedLabel: {
    color: '#64748b',
  },
  countBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 9999,
  },
  selectedCountBadge: {
    backgroundColor: '#eff6ff',
  },
  unselectedCountBadge: {
    backgroundColor: '#e2e8f0',
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
  },
  selectedCountText: {
    color: '#2563eb',
  },
  unselectedCountText: {
    color: '#64748b',
  },
});
