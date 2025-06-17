import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useReader } from '../../reader/ReaderContext';

export const ReadingStats = () => {
  const { t } = useTranslation();
  const { readingTime } = useReader();

  const formatReadingTime = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <Card style={styles.container}>
      <Card.Content>
        <Text variant="titleMedium">Reading Statistics</Text>
        <View style={styles.statRow}>
          <Text variant="bodyMedium">Total reading time:</Text>
          <Text variant="bodyLarge" style={styles.statValue}>
            {formatReadingTime(readingTime)}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  statValue: {
    fontWeight: 'bold',
  },
});
