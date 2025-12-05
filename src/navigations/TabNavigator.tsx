import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/material-design-icons';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

// Screens
import HomeScreen from '../screens/home/HomeScreen/HomeScreen';
import BookScreen from '../screens/book/BookScreen/BookScreen';
import ExamListScreen from '../screens/exam/ExamList/ExamListScreen';
import ProgressScreen from '../screens/progress/ProgressScreen/ProgressScreen';

// No need for ROUTES import as we're using direct string names

const Tab = createBottomTabNavigator();

// Define icon components outside of the render function
const renderHomeIcon = ({ color, size }: { color: string; size: number }) => (
  <Icon name="home" color={color} size={size} />
);

const renderBookIcon = ({ color, size }: { color: string; size: number }) => (
  <Icon name="book" color={color} size={size} />
);

const renderExamIcon = ({ color, size }: { color: string; size: number }) => (
  <Icon name="book-open-variant" color={color} size={size} />
);

const renderProgressIcon = ({ color, size }: { color: string; size: number }) => (
  <Icon name="chart-bar" color={color} size={size} />
);

const TabNavigator = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  
  // Calculate dynamic tab bar height based on device
  const isIphoneWithNotch = insets.bottom > 0;
  
  // Determine bottom tab bar height and padding
  const tabBarHeight = isIphoneWithNotch ? 85 : 60;
  const bottomPadding = isIphoneWithNotch ? Math.max(insets.bottom - 5, 15) : 8;

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          height: tabBarHeight,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          // Add shadow for iOS
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          // Add elevation for Android
          elevation: 10,
        },
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 12,
          paddingBottom: 4,
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
        name="BookTab"
        component={BookScreen}
        options={{
          tabBarLabel: t('screens.book'),
          tabBarIcon: renderBookIcon,
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
