import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigations/StackNavigator';
import { ROUTES } from '../../../constants/routes';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ReaderProvider } from '../../../reader/ReaderContext';
import { FontControls } from '../../../components/fontController/FontControls';
import { StructuredContentReader } from '../../../reader/StructuredContentReader';

type EpubReaderScreenRouteProp = RouteProp<RootStackParamList, typeof ROUTES.EPUB_READER>;
type EpubReaderScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const EpubReaderScreen = () => {
  const route = useRoute<EpubReaderScreenRouteProp>();
  const navigation = useNavigation<EpubReaderScreenNavigationProp>();
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const { bookPath: chapterId, bookTitle, targetSectionId } = route.params;

  // Set up header
  useEffect(() => {
    navigation.setOptions({
      title: bookTitle || t('book.ebook'),
    });
  }, [navigation, bookTitle, t]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ReaderProvider>
        <FontControls />
        <StructuredContentReader 
          chapterId={chapterId} 
          targetSectionId={targetSectionId} 
        />
      </ReaderProvider>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default EpubReaderScreen;
