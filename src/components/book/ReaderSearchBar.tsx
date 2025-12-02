import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { IconButton, useTheme, Text } from 'react-native-paper';

interface ReaderSearchBarProps {
  visible: boolean;
  onClose: () => void;
  onSearch: (text: string) => void;
  onNext: () => void;
  onPrev: () => void;
  matchCount: number;
  currentMatch: number;
}

export const ReaderSearchBar = ({
  visible,
  onClose,
  onSearch,
  onNext,
  onPrev,
  matchCount,
  currentMatch,
}: ReaderSearchBarProps) => {
  const theme = useTheme();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      onSearch(query);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  if (!visible) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]}>
      <View style={styles.searchRow}>
        <IconButton
          icon="close"
          size={20}
          onPress={() => {
            setQuery('');
            onClose();
          }}
        />
        <TextInput
          style={[styles.input, { color: theme.colors.onSurfaceVariant }]}
          placeholder="Search in content..."
          placeholderTextColor={theme.colors.onSurfaceDisabled}
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
        <View style={styles.controls}>
          <Text style={{ color: theme.colors.onSurfaceVariant, marginRight: 8 }}>
            {matchCount > 0 ? `${currentMatch + 1}/${matchCount}` : '0/0'}
          </Text>
          <IconButton 
            icon="chevron-up" 
            size={24} 
            onPress={onPrev} 
            disabled={matchCount === 0} 
          />
          <IconButton 
            icon="chevron-down" 
            size={24} 
            onPress={onNext} 
            disabled={matchCount === 0} 
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: 4,
    elevation: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  }
});
