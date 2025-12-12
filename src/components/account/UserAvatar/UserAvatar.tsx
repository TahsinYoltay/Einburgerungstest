import React from 'react';
import { Image, StyleProp, TouchableOpacity, View, ViewStyle } from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';

import { useAppTheme } from '../../../providers/ThemeProvider';
import { createStyles } from './UserAvatar.styles';

export type UserAvatarShape = 'circle' | 'rounded';

type Props = {
  uri?: string | null;
  size: number;
  shape?: UserAvatarShape;
  disabled?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  showEditBadge?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

const UserAvatar: React.FC<Props> = ({
  uri,
  size,
  shape = 'circle',
  disabled,
  onPress,
  accessibilityLabel,
  showEditBadge,
  containerStyle,
}) => {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const borderRadius = shape === 'circle' ? size / 2 : Math.round(size * 0.25);
  const baseStyle = React.useMemo<StyleProp<ViewStyle>>(
    () => [{ width: size, height: size, borderRadius }, styles.container, containerStyle],
    [borderRadius, size, styles.container, containerStyle]
  );

  const content = (
    <View style={baseStyle}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[styles.image, { borderRadius }]}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Icon
          name="account-circle"
          size={Math.round(size * 0.7)}
          color={theme.colors.primary}
          style={styles.fallbackIcon}
        />
      )}

      {showEditBadge ? (
        <View style={styles.editBadge} pointerEvents="none">
          <Icon name="camera" size={10} color={theme.colors.onPrimary} />
        </View>
      ) : null}
    </View>
  );

  if (!onPress) return content;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {content}
    </TouchableOpacity>
  );
};

export default UserAvatar;
