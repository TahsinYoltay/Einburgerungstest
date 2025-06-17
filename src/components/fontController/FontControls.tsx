import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useReader } from '../../reader/ReaderContext';
 
export const FontControls = () => {
  const { fontSize, setFontSize } = useReader();
  
  const decreaseFont = () => {
    const newSize = Math.max(fontSize - 10, 50); // Minimum 50%
    setFontSize(newSize);
  };
  
  const resetFont = () => {
    setFontSize(100);
  };
  
  const increaseFont = () => {
    const newSize = Math.min(fontSize + 10, 200); // Maximum 200%
    setFontSize(newSize);
  };
  
  return (
    <View style={styles.container}>
      <Button mode="outlined" onPress={decreaseFont} style={styles.button}>
        A⁻
      </Button>
      <View style={styles.sizeDisplay}>
        <Text variant="bodySmall">{fontSize}%</Text>
      </View>
      <Button mode="outlined" onPress={resetFont} style={styles.resetButton}>
        A
      </Button>
      <Button mode="outlined" onPress={increaseFont} style={styles.button}>
        A⁺
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  button: {
    marginHorizontal: 4,
    minWidth: 40,
  },
  resetButton: {
    marginHorizontal: 8,
    minWidth: 40,
  },
  sizeDisplay: {
    marginHorizontal: 8,
    minWidth: 40,
    alignItems: 'center',
  },
});