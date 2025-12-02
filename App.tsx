/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar, AppState, AppStateStatus } from 'react-native';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

// Store
import { store, persistor } from './src/store';
import { useAppDispatch, useAppSelector } from './src/store/hooks';
import { switchExamLanguage } from './src/store/slices/examSlice';
import { syncContent } from './src/store/slices/contentSlice';

// Providers
import { LocalizationProvider } from './src/providers/LocalizationProvider';
import { ThemeProvider, useAppTheme } from './src/providers/ThemeProvider';
import { AuthProvider } from './src/providers/AuthProvider';

// Navigation
import RootNavigator from './src/navigations/StackNavigator';

if (__DEV__) {
  import('./ReactotronConfig').then(() => console.log('Reactotron Configured'));
}

// Main content component that uses the theme
const AppContent = () => {
  const { theme, isDarkMode, navigationTheme } = useAppTheme();
  const dispatch = useAppDispatch();
  const { currentLanguage } = useAppSelector(state => state.exam);
  const appState = useRef(AppState.currentState);

  // Initial Load
  useEffect(() => {
    dispatch(syncContent());
  }, [dispatch]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('App has come to the foreground! Checking for content updates...');
        // 1. Reload Manifests
        dispatch(syncContent()).then(() => {
          // 2. Check current language
          if (currentLanguage !== 'en') {
             dispatch(switchExamLanguage(currentLanguage));
          }
        });
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [dispatch, currentLanguage]);

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer theme={navigationTheme}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={theme.colors.background}
        />
        <RootNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
};

function App(): React.JSX.Element {
  return (
    <ReduxProvider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <ThemeProvider>
              <AuthProvider>
                <LocalizationProvider>
                  <AppContent />
                </LocalizationProvider>
              </AuthProvider>
            </ThemeProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </PersistGate>
    </ReduxProvider>
  );
}

export default App;
