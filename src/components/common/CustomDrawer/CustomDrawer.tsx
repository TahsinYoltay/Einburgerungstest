import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { Divider, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../../providers/ThemeProvider';
import ThemeToggle from '../ThemeToggle/ThemeToggle';

const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  return (
    <DrawerContentScrollView
      {...props}
      style={{ backgroundColor: theme.colors.background }}
    >
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <Text style={styles.headerTitle}>Life in the UK</Text>
        <Text style={styles.headerSubtitle}>{t('drawer.subtitle')}</Text>
      </View>
      
      <DrawerItemList {...props} />
      
      <Divider style={[styles.divider, { backgroundColor: theme.colors.border }]} />
      
      <ThemeToggle />
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 20,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.8,
  },
  divider: {
    marginVertical: 10,
  },
});

export default CustomDrawerContent;