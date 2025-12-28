import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/material-design-icons';
import { useTranslation } from 'react-i18next';
import { Dimensions, Platform } from 'react-native';

// Screens
import HomeScreen from '../screens/home/HomeScreen/HomeScreen';
import ExamListScreen from '../screens/exam/ExamList/ExamListScreen';
import ProgressScreen from '../screens/progress/ProgressScreen/ProgressScreen';
import { useAppTheme } from '../providers/ThemeProvider';

// No need for ROUTES import as we're using direct string names

const Tab = createBottomTabNavigator();

// Define icon components outside of the render function
const renderHomeIcon = ({ color, size }: { color: string; size: number }) => (
  <Icon name="home" color={color} size={size} />
);

const renderExamIcon = ({ color, size }: { color: string; size: number }) => (
  <Icon name="book-open-variant" color={color} size={size} />
);

const renderProgressIcon = ({ color, size }: { color: string; size: number }) => (
  <Icon name="chart-bar" color={color} size={size} />
);

const TabNavigator = () => {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isAndroid = Platform.OS === 'android';

  // On some Android builds (edge-to-edge), the system nav can overlay the tab bar.
  // If RN reports a full-height window, apply a conservative bottom inset.
  const screenWindowHeightDiff =
    Dimensions.get('screen').height - Dimensions.get('window').height;
  const isEdgeToEdgeAndroid = isAndroid && Math.abs(screenWindowHeightDiff) < 2;
  const baseAndroidInset = isEdgeToEdgeAndroid ? Math.max(insets.bottom, 16) : 0;
  const androidExtraBottomGap = 12;
  const androidTabBarInset = baseAndroidInset + androidExtraBottomGap;

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      safeAreaInsets={isAndroid ? { bottom: androidTabBarInset } : undefined}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          borderTopWidth: 0.5,
          // Add shadow for iOS
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          // Add elevation for Android
          elevation: 12,
        },
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: isAndroid ? 2 : 4,
        },
        // Disable animation between tabs
        animation: 'none',
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: t('screens.home'),
          tabBarIcon: renderHomeIcon,
        }}
      />
      <Tab.Screen
        name="ExamTab"
        component={ExamListScreen}
        options={{
          tabBarLabel: t('screens.test'),
          tabBarIcon: renderExamIcon,
        }}
      />
      <Tab.Screen
        name="ProgressTab"
        component={ProgressScreen}
        options={{
          tabBarLabel: t('screens.progress'),
          tabBarIcon: renderProgressIcon,
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
