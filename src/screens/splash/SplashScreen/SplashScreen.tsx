import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, StatusBar, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text } from 'react-native-paper';
import DeviceInfo from 'react-native-device-info';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ROUTES } from '../../../constants/routes';
import type { RootStackParamList } from '../../../navigations/StackNavigator';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { syncContent } from '../../../store/slices/contentSlice';
import { switchExamLanguage } from '../../../store/slices/examSlice';
import { switchBookLanguage } from '../../../store/slices/bookSlice';
import { createStyles } from './SplashScreen.styles';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.SPLASH>;

const MIN_SPLASH_MS = 3000;

const normalizeProgress = (value: number) => {
  if (Number.isNaN(value)) return 0;
  if (value > 1) return value / 100;
  return value;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const APP_ICON = require('../../../assets/images/app_icon.png');

const SplashScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const currentLanguage = useAppSelector(state => state.exam.currentLanguage);
  const contentLoading = useAppSelector(state => state.content.loading);
  const examLoading = useAppSelector(state => state.exam.isDownloadingLanguage);
  const examProgressRaw = useAppSelector(state => state.exam.downloadProgress);
  const bookLoading = useAppSelector(state => state.book.loading);
  const bookProgressRaw = useAppSelector(state => state.book.downloadProgress);

  const startedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0.05);

  const derivedProgress = useMemo(() => {
    const contentPart = contentLoading ? 0 : 1;
    const examPart = examLoading ? clamp01(normalizeProgress(examProgressRaw)) : 1;
    const bookPart = bookLoading ? clamp01(normalizeProgress(bookProgressRaw)) : 1;

    // Weights: content manifest/modules is the key blocker.
    const weighted = 0.5 * contentPart + 0.25 * examPart + 0.25 * bookPart;
    return clamp01(Math.max(0.05, weighted));
  }, [bookLoading, bookProgressRaw, contentLoading, examLoading, examProgressRaw]);

  useEffect(() => {
    setProgress(derivedProgress);
  }, [derivedProgress]);

  const bootstrap = useCallback(async () => {
    setError(null);
    const startedAt = Date.now();

    try {
      await dispatch(syncContent()).unwrap();

      const examPromise = dispatch(switchExamLanguage(currentLanguage)).unwrap();
      const bookPromise = dispatch(switchBookLanguage(currentLanguage)).unwrap();
      const results = await Promise.allSettled([examPromise, bookPromise]);
      const hasFailure = results.some(result => result.status === 'rejected');
      if (hasFailure && currentLanguage !== 'en') {
        setError(t('splash.genericError'));
        return;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('splash.genericError'));
      return;
    }

    const elapsed = Date.now() - startedAt;
    if (elapsed < MIN_SPLASH_MS) {
      await new Promise<void>(resolve =>
        setTimeout(() => resolve(), MIN_SPLASH_MS - elapsed)
      );
    }

    navigation.reset({
      index: 0,
      routes: [{ name: ROUTES.HOME as unknown as never }],
    });
  }, [currentLanguage, dispatch, navigation, t]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void bootstrap();
  }, [bootstrap]);

  const handleRetry = () => {
    void bootstrap();
  };

  const version = DeviceInfo.getVersion();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={styles.background}>
        <View style={styles.gradientStart} />
        <View style={styles.gradientEnd} />
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
      </View>

      <View style={styles.content}>
        <View style={styles.logoCard}>
          <Image source={APP_ICON} style={styles.logo} />
        </View>

        <Text style={styles.title}>{t('splash.title')}</Text>
        <Text style={styles.tagline}>{t('splash.tagline')}</Text>
      </View>

      <View style={styles.bottom}>
        <View style={styles.progressWrapper}>
          <Text style={styles.loadingText}>{t('splash.loading')}</Text>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>

          <Text style={styles.versionText}>{t('splash.version', { version })}</Text>

          {error ? (
            <>
              <Text style={styles.errorText}>{error}</Text>
              <Button
                mode="contained"
                onPress={handleRetry}
                style={styles.retryButton}
                buttonColor={theme.colors.splashProgressFill}
                textColor={theme.colors.splashGradientStart}
              >
                {t('splash.retry')}
              </Button>
            </>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SplashScreen;
