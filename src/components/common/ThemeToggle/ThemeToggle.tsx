import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Switch, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../../providers/ThemeProvider';

const ThemeToggle = () => {
  const { t } = useTranslation();
  const { isDarkMode, toggleTheme, theme } = useAppTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: theme.colors.text }]}>
        {isDarkMode ? t('settings.darkMode') : t('settings.lightMode')}
      </Text>
      <Switch
        value={isDarkMode}
        onValueChange={toggleTheme}
        color={theme.colors.primary}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  text: {
    fontSize: 16,
  },
});

export default ThemeToggle;