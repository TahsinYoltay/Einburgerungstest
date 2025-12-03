import { StyleSheet } from 'react-native';
import { MD3Theme } from 'react-native-paper';

export const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 4,
      paddingVertical: 0,
      marginTop: 0,
      marginBottom: 30,
    },
    avatar: {
      backgroundColor: theme.dark ? theme.colors.surfaceVariant : '#DCE8FF',
      borderWidth: theme.dark ? 0 : 1,
      borderColor: '#C5D7FF',
    },
    textContainer: {
      marginLeft: 10,
      flex: 1,
    },
    title: {
      color: theme.colors.onBackground,
      fontWeight: '700',
      fontSize: 16,
    },
    subtitle: {
      color: theme.colors.onBackground,
      opacity: 0.7,
      marginTop: 2,
      fontSize: 13,
    },
    chevronWrapper: {
      padding: 6,
    },
  });
