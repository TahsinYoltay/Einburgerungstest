import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Icon from '@react-native-vector-icons/material-design-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '../../../providers/ThemeProvider';
import { RootStackParamList } from '../../../navigations/StackNavigator';
import { ROUTES } from '../../../constants/routes';

const ProfileInfoScreen = () => {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();

  const handleClose = () => navigation.popToTop();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Icon name="arrow-left" size={22} color={theme.colors.onBackground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('account.menu.profile')}</Text>
        <TouchableOpacity onPress={handleClose} style={styles.iconButton}>
          <Icon name="close" size={22} color={theme.colors.onBackground} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.placeholder}>{t('account.placeholders.profile')}</Text>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.colors.onBackground,
    },
    iconButton: {
      padding: 8,
      borderRadius: 12,
      backgroundColor: theme.dark ? theme.colors.surfaceVariant : '#E8EAED',
    },
    content: {
      padding: 16,
    },
    placeholder: {
      color: theme.colors.onBackground,
      fontSize: 16,
    },
  });

export default ProfileInfoScreen;
