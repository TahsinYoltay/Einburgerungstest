import React, { createContext, useState, useRef, ReactNode, useEffect } from 'react';
import { Animated, Dimensions } from 'react-native';

interface BottomTabContextType {
  activeTab: number;
  setActiveTab: (index: number) => void;
  indicatorPosition: Animated.Value;
}

const { width } = Dimensions.get('window');
// Assuming 3 tabs, modify if dynamic.
// Ideally, we measure tab widths. For now, we can estimate or leave animation logic to the component.
const TAB_WIDTH = width / 3; 

export const BottomTabContext = createContext<BottomTabContextType>({
  activeTab: 0,
  setActiveTab: () => {},
  indicatorPosition: new Animated.Value(0),
});

export const BottomTabProvider = ({ children }: { children: ReactNode }) => {
  const [activeTab, setActiveTabState] = useState(0);
  const indicatorPosition = useRef(new Animated.Value(0)).current;

  const setActiveTab = (index: number) => {
    setActiveTabState(index);
    Animated.spring(indicatorPosition, {
      toValue: index * TAB_WIDTH,
      useNativeDriver: true,
      tension: 60,
      friction: 8,
    }).start();
  };

  return (
    <BottomTabContext.Provider value={{ activeTab, setActiveTab, indicatorPosition }}>
      {children}
    </BottomTabContext.Provider>
  );
};
