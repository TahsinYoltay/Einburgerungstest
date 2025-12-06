import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const TAB_WIDTH = width / 4;

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#fff',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  activeTabLabel: {
    fontWeight: '700',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: TAB_WIDTH,
    height: 3,
    backgroundColor: '#6200ee', // Theme primary color usually, but will be overridden or match theme
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
});
