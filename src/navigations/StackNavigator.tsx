import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen/ForgotPasswordScreen';
import ExamResults from '../screens/exam/ExamResults/ExamResults';
import ExamScreen from '../screens/exam/ExamScreen/ExamScreen';
import WebReaderScreen from '../screens/book/WebReaderScreen';
import { ROUTES } from '../constants/routes';
import TabNavigator from './TabNavigator';
import SettingsScreen from '../screens/settings/SettingsScreen/SettingsScreen';
import AccountScreen from '../screens/account/AccountScreen/AccountScreen';
import ProfileInfoScreen from '../screens/account/ProfileInfoScreen/ProfileInfoScreen';
import HelpSupportScreen from '../screens/account/HelpSupportScreen/HelpSupportScreen';
import SupportTopicScreen from '../screens/account/SupportTopicScreen/SupportTopicScreen';
import PrivacyPolicyScreen from '../screens/account/PrivacyPolicyScreen/PrivacyPolicyScreen';
import { SupportTopicKey } from '../constants/supportTopics';
import ReviewQuestionsScreen from '../screens/review/ReviewQuestionsScreen';

export type RootStackParamList = {
  [ROUTES.AUTH]: undefined;
  [ROUTES.LOGIN]: undefined;
  [ROUTES.REGISTER]: undefined;
  [ROUTES.FORGOT_PASSWORD]: undefined;
  [ROUTES.HOME]: undefined;
  [ROUTES.ACCOUNT]: undefined;
  [ROUTES.PROFILE_INFO]: undefined;
  [ROUTES.HELP]: undefined;
  [ROUTES.PRIVACY]: undefined;
  [ROUTES.HELP_TOPIC]: { topicKey: SupportTopicKey };
  HomeTab: undefined;
  BookTab: undefined;
  ExamTab: { id?: string };
  ProgressTab: undefined;
  [ROUTES.EXAM]: { id: string; restart?: boolean };
  [ROUTES.EXAM_RESULTS]: { examId: string };
  [ROUTES.BOOK]: undefined;
  [ROUTES.CHAPTER]: { id: string };
  [ROUTES.READER]: { chapterId: string; subSectionId: string };
  [ROUTES.TEST]: undefined;
  [ROUTES.SETTINGS]: undefined;
  [ROUTES.REVIEW_QUESTIONS]: { mode: 'favorites' | 'incorrect' };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={ROUTES.HOME}
    >
      <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
      <Stack.Screen name={ROUTES.REGISTER} component={RegisterScreen} />
      <Stack.Screen name={ROUTES.FORGOT_PASSWORD} component={ForgotPasswordScreen} />
      <Stack.Screen
        name={ROUTES.ACCOUNT}
        component={AccountScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.PROFILE_INFO}
        component={ProfileInfoScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.HELP}
        component={HelpSupportScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.HELP_TOPIC}
        component={SupportTopicScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.PRIVACY}
        component={PrivacyPolicyScreen}
        options={{ headerShown: false }}
      />
      {/* TabNavigator contains HomeTab, BookTab, ExamTab, TestTab, and ProgressTab screens */}
      <Stack.Screen name={ROUTES.HOME} component={TabNavigator} />
      {/* Screens that should open as standalone pages with back navigation */}
      <Stack.Screen
        name={ROUTES.EXAM}
        component={ExamScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name={ROUTES.EXAM_RESULTS} component={ExamResults} />
      <Stack.Screen
        name={ROUTES.READER}
        component={WebReaderScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.SETTINGS}
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.REVIEW_QUESTIONS}
        component={ReviewQuestionsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default RootNavigator;