import React from 'react';
import { ScrollView } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './TestScreen.style';
import FileSystemDemo from '../../../components/common/FileSystemDemo/FileSystemDemo';

const TestScreen = () => {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.title} variant="headlineMedium">
          {t('screens.test')}
        </Text>
        
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">
              {t('test.description')}
            </Text>
            <Text variant="bodyMedium">
              This screen will contain practice tests and quizzes.
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <FileSystemDemo />
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TestScreen;
