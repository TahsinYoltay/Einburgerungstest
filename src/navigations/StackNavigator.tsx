import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen/ForgotPasswordScreen';
import ExamResults from '../screens/exam/ExamResults/ExamResults';
import ChapterScreen from '../screens/book/ChapterScreen/ChapterScreen';
import EpubReaderScreen from '../screens/book/EpubReaderScreen/EpubReaderScreen';
import { ROUTES } from '../constants/routes';
import TabNavigator from './TabNavigator';

export type RootStackParamList = {
  [ROUTES.AUTH]: undefined;
  [ROUTES.LOGIN]: undefined;
  [ROUTES.REGISTER]: undefined;
  [ROUTES.FORGOT_PASSWORD]: undefined;
  [ROUTES.HOME]: undefined;
  HomeTab: undefined;
  BookTab: undefined;
  ExamTab: { id?: string };
  TestTab: undefined;
  SettingsTab: undefined;
  [ROUTES.EXAM]: { id: string };
  [ROUTES.EXAM_RESULTS]: { examId: string };
  [ROUTES.BOOK]: undefined;
  [ROUTES.CHAPTER]: { id: string };
  [ROUTES.EPUB_READER]: { bookTitle?: string; targetSectionId?: string };
  [ROUTES.TEST]: undefined;
  [ROUTES.SETTINGS]: undefined;
  [ROUTES.PROFILE]: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  const isAuthenticated = true; // Replace with actual auth state

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={isAuthenticated ? ROUTES.HOME : ROUTES.LOGIN}
    >
      {!isAuthenticated ? (
        <>
          <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
          <Stack.Screen name={ROUTES.REGISTER} component={RegisterScreen} />
          <Stack.Screen name={ROUTES.FORGOT_PASSWORD} component={ForgotPasswordScreen} />
        </>
      ) : (
        <>
          {/* TabNavigator contains HomeTab, BookTab, ExamTab, TestTab, and SettingsTab screens */}
          <Stack.Screen name={ROUTES.HOME} component={TabNavigator} />
          {/* Screens that should open as standalone pages with back navigation */}
          <Stack.Screen name={ROUTES.EXAM_RESULTS} component={ExamResults} />
          <Stack.Screen name={ROUTES.CHAPTER} component={ChapterScreen} />
          <Stack.Screen
            name={ROUTES.EPUB_READER}
            component={EpubReaderScreen}
            options={{ headerShown: true, title: 'E-Book Reader' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default RootNavigator;
