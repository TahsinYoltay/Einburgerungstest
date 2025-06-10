import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useTranslation } from 'react-i18next';
import HomeScreen from '../screens/home/HomeScreen/HomeScreen';
import BookScreen from '../screens/book/BookScreen/BookScreen';
import { ROUTES } from '../constants/routes';
import CustomDrawerContent from '../components/common/CustomDrawer/CustomDrawer';
import { useAppTheme } from '../providers/ThemeProvider';

export type DrawerParamList = {
  [ROUTES.HOME]: undefined;
  [ROUTES.BOOK]: undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();

function DrawerNavigator() {
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  return (
    <Drawer.Navigator
      screenOptions={{
        headerTintColor: theme.colors.primary,
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.text,
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen
        name={ROUTES.HOME}
        component={HomeScreen}
        options={{ title: t('screens.home') }}
      />
      <Drawer.Screen
        name={ROUTES.BOOK}
        component={BookScreen}
        options={{ title: t('screens.book') }}
      />
    </Drawer.Navigator>
  );
}

export default DrawerNavigator;
