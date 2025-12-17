import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  cardContainer: {
    width: '100%',
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextCard: {
    zIndex: 0,
    ...(Platform.OS === 'android' ? { elevation: 0 } : {}),
  },
  topCard: {
    zIndex: 1,
    ...(Platform.OS === 'android' ? { elevation: 1 } : {}),
  },
});

