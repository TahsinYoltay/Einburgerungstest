import React, { useMemo } from 'react';
import { StyleSheet, View, ActivityIndicator, useColorScheme } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigations/StackNavigator';
import { useAppTheme } from '../../providers/ThemeProvider';
import { Appbar, Text } from 'react-native-paper';
import { ROUTES } from '../../constants/routes';

import { useAppSelector } from '../../store/hooks';

type ReaderRouteProp = RouteProp<RootStackParamList, typeof ROUTES.READER>;

const WebReaderScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const route = useRoute<ReaderRouteProp>();
  const navigation = useNavigation();
  const { chapterId, subSectionId } = route.params;
  const { data: bookData } = useAppSelector(state => state.book);

  const targetSection = useMemo(() => {
    if (!bookData) return null;
    const chapter = bookData.chapters.find(c => c.id === chapterId);
    if (!chapter) return null;
    return chapter.subSections.find(s => s.id === subSectionId);
  }, [bookData, chapterId, subSectionId]);

  const content = targetSection?.content || '<p>Content not found</p>';
  const title = targetSection?.title || 'Reader';

  // Inject theme CSS to handle dark mode dynamically
  const css = `
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      font-size: 1.1rem;
      padding: 1.5rem;
      line-height: 1.8;
      background-color: ${theme.colors.background};
      color: ${theme.colors.onBackground};
    }
    h1, h2, h3, h4, h5, h6 {
      color: ${theme.colors.primary};
      margin-top: 1.5em;
    }
    a {
      color: ${theme.colors.secondary};
    }
    img {
        border-radius: 8px;
        margin: 1rem 0;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
  `;

  const injectedJS = useMemo(() => `
    (function() {
      var style = document.createElement('style');
      style.textContent = ${JSON.stringify(css)};
      document.head.appendChild(style);
    })();
    true;
  `, [theme, css]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface, elevation: 0 }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={title} titleStyle={{ fontSize: 18, fontWeight: 'bold' }} />
      </Appbar.Header>
      <WebView
        originWhitelist={['*']}
        source={{ html: content, baseUrl: '' }}
        style={{ backgroundColor: theme.colors.background, flex: 1 }}
        injectedJavaScript={injectedJS}
        showsVerticalScrollIndicator={true}
        startInLoadingState={true}
        renderLoading={() => (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
});

export default WebReaderScreen;
