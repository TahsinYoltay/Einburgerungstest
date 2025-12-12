import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import { Avatar, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { createStyles } from './AccountHeader.style';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { useAppSelector } from '../../../store/hooks';
import { RootStackParamList } from '../../../navigations/StackNavigator';
import { ROUTES } from '../../../constants/routes';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Props = {
  titleOverride?: string;
  subtitleOverride?: string;
  containerStyle?: object;
  showText?: boolean;
  showChevron?: boolean;
};

const AccountHeader: React.FC<Props> = ({ titleOverride, subtitleOverride, containerStyle, showText = true, showChevron = true }) => {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const authState = useAppSelector(state => state.auth);

  const title = titleOverride || t('account.title');
  const subtitle =
    subtitleOverride ||
    (authState?.email ? t('account.subtitleSignedIn', { email: authState.email }) : t('account.subtitleGuest'));

  const handlePress = () => navigation.navigate(ROUTES.ACCOUNT);

  return (
    <View style={[styles.container, containerStyle]} pointerEvents="box-none">
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={t('account.title')}
      >
        <Avatar.Icon
          size={48}
          icon="account-circle"
          style={styles.avatar}
          color={theme.colors.primary}
        />
      </TouchableOpacity>
      {showText && (
        <View style={styles.textContainer} pointerEvents="none">
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
        </View>
      )}
      {showChevron && (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.8} style={styles.chevronWrapper}>
          <Icon name="chevron-right" size={22} color={theme.colors.onSurface} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default AccountHeader;
