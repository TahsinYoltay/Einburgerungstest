import React, { useMemo } from 'react';
import { View } from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { Divider, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../../providers/ThemeProvider';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import { createStyles } from './CustomDrawer.styles';

const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <DrawerContentScrollView
      {...props}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Einbürgerungstest</Text>
        <Text style={styles.headerSubtitle}>{t('drawer.subtitle')}</Text>
      </View>
      
      <DrawerItemList {...props} />
      
      <Divider style={styles.divider} />
      
      <ThemeToggle />
    </DrawerContentScrollView>
  );
};

export default CustomDrawerContent;
