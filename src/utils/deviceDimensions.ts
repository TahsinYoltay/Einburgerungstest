import { Dimensions, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

export const hasNotch = (): boolean => {
  // Check for iPhones with notch
  if (isIOS) {
    // iPhone X dimensions and newer models
    if (
      (width === 375 && height === 812) || // iPhone X, XS, 11 Pro, 12 mini, 13 mini
      (width === 414 && height === 896) || // iPhone XR, XS Max, 11, 11 Pro Max
      (width === 390 && height === 844) || // iPhone 12, 12 Pro, 13, 13 Pro
      (width === 428 && height === 926) || // iPhone 12 Pro Max, 13 Pro Max
      (width === 393 && height === 852) || // iPhone 14, iPhone 14 Pro
      (width === 430 && height === 932) || // iPhone 14 Pro Max
      height >= 844 // Future-proofing for newer models
    ) {
      return true;
    }
  }

  // Most Android devices with a notch will report a StatusBar height > 24
  if (isAndroid && StatusBar.currentHeight && StatusBar.currentHeight > 24) {
    return true;
  }

  return false;
};

export const useDeviceDimensions = () => {
  const insets = useSafeAreaInsets();
  
  const deviceData = {
    screenWidth: width,
    screenHeight: height,
    isSmallDevice: width < 375,
    isMediumDevice: width >= 375 && width < 414,
    isLargeDevice: width >= 414,
    isIOS,
    isAndroid,
    hasNotch: hasNotch(),
    bottomInset: insets.bottom,
    topInset: insets.top,
  };

  return deviceData;
};

// For use outside of React components where hooks can't be used
export const getTabBarHeight = (): number => {
  if (isIOS) {
    return hasNotch() ? 85 : 65; // Higher for notched devices
  }
  return 60; // Standard height for Android
};

export const getTabBarPadding = (): { bottom: number; top: number } => {
  if (isIOS) {
    const bottom = hasNotch() ? 28 : 8;
    return { bottom, top: 8 };
  }
  return { bottom: 8, top: 8 }; // Standard padding for Android
};
