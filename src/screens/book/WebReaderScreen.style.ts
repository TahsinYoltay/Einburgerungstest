import { Platform, StyleSheet } from 'react-native';
import { MD3Theme } from 'react-native-paper';

export const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Platform.OS === 'ios' ? theme.colors.surface : theme.colors.background,
  },
  loading: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  fontControlBar: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: 4,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
  },
  fontControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 200,
  },
  header: {
    backgroundColor: theme.colors.surface,
    elevation: 0,
    height: Platform.OS === 'ios' ? 44 : undefined,
    borderBottomWidth: Platform.OS === 'ios' ? StyleSheet.hairlineWidth : 0,
    borderBottomColor: theme.colors.outline,
  },
  headerContent: {
    alignItems: Platform.OS === 'ios' ? 'center' : 'flex-start',
    paddingHorizontal: 8,
  },
  headerTitle: {
    color: theme.colors.onSurface,
    fontSize: Platform.OS === 'ios' ? 17 : 16,
    fontWeight: '600',
    textAlign: Platform.OS === 'ios' ? 'center' : 'left',
  },
  bottomBar: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    elevation: 4,
    justifyContent: 'space-between',
    gap: 16,
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.outline,
  },
  bottomButton: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
  },
  fontText: {
    width: 50,
    textAlign: 'center',
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  }
});
