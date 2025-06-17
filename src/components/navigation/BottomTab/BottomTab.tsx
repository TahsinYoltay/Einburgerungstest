import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
// Tab route names are used directly
import { styles } from './BottomTab.style';
import { BottomTabContext } from '../../../providers/BottomTabProvider';

interface TabItemProps {
  route: string;
  label: string;
  icon: string;
  isActive: boolean;
  onPress: () => void;
}

const TabItem = ({ label, icon, isActive, onPress }: TabItemProps) => {
  const theme = useTheme();
  const activeColor = theme.colors.primary;
  const inactiveColor = 'gray';
  
  return (
    <TouchableOpacity style={styles.tabItem} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <MaterialCommunityIcons
        name={icon}
        size={24}
        color={isActive ? activeColor : inactiveColor}
      />
      <Text style={[
        styles.tabLabel,
        isActive && styles.activeTabLabel,
        { color: isActive ? activeColor : inactiveColor },
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const BottomTab = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { activeTab, setActiveTab, indicatorPosition } = useContext(BottomTabContext);

  const tabs = [
    { route: 'HomeTab', label: t('screens.home'), icon: 'home' },
    { route: 'BookTab', label: t('screens.book'), icon: 'book-open-variant' },
    { route: 'ExamTab', label: t('screens.exam'), icon: 'clipboard-text' },
    { route: 'TestTab', label: t('screens.test'), icon: 'format-list-checks' },
    { route: 'SettingsTab', label: t('screens.settings'), icon: 'cog' },
  ];

  const handleTabPress = (index: number, route: string) => {
    setActiveTab(index);
    // Use type assertion to fix the navigation type error
    navigation.navigate(route as never);
  };

  return (
    <View style={styles.container}>
      {tabs.map((tab, index) => (
        <TabItem
          key={tab.route}
          route={tab.route}
          label={tab.label}
          icon={tab.icon}
          isActive={activeTab === index}
          onPress={() => handleTabPress(index, tab.route)}
        />
      ))}
      <Animated.View
        style={[
          styles.indicator,
          { transform: [{ translateX: indicatorPosition }] },
        ]}
      />
    </View>
  );
};

export default BottomTab;
