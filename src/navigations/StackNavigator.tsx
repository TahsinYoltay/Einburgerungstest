import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen/ForgotPasswordScreen';
import ExamScreen from '../screens/exam/ExamScreen/ExamScreen';
import BookScreen from '../screens/book/BookScreen/BookScreen';
import ChapterScreen from '../screens/book/ChapterScreen/ChapterScreen';
import { ROUTES } from '../constants/routes';
import DrawerNavigator from './DrawerNavigator';

export type RootStackParamList = {
  [ROUTES.AUTH]: undefined;
  [ROUTES.LOGIN]: undefined;
  [ROUTES.REGISTER]: undefined;
  [ROUTES.FORGOT_PASSWORD]: undefined;
  [ROUTES.DRAWER]: undefined;
  [ROUTES.EXAM]: { id: string };
  [ROUTES.BOOK]: undefined;
  [ROUTES.CHAPTER]: { id: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  const isAuthenticated = true; // Replace with actual auth state

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={isAuthenticated ? ROUTES.DRAWER : ROUTES.LOGIN}
    >
      {!isAuthenticated ? (
        <>
          <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
          <Stack.Screen name={ROUTES.REGISTER} component={RegisterScreen} />
          <Stack.Screen name={ROUTES.FORGOT_PASSWORD} component={ForgotPasswordScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name={ROUTES.DRAWER} component={DrawerNavigator} />
          <Stack.Screen name={ROUTES.EXAM} component={ExamScreen} />
          <Stack.Screen name={ROUTES.BOOK} component={BookScreen} />
          <Stack.Screen name={ROUTES.CHAPTER} component={ChapterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default RootNavigator;