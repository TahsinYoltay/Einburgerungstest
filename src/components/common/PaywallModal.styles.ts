import { StyleSheet } from 'react-native';
import { MD3Theme } from 'react-native-paper';

export const createStyles = (theme: MD3Theme) => StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
  },
  container: {
    backgroundColor: theme.colors.surface,
    margin: 14,
    borderRadius: 20,
    maxHeight: '88%',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  scrollContentGrow: {
    flexGrow: 1,
  },
  closeButton: {
    margin: 0,
    alignSelf: 'flex-end',
    marginRight: -4,
    marginBottom: 2,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 21,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
  featuresContainer: {
    paddingHorizontal: 2,
    marginBottom: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // paddingVertical: 6,
  },
  featureIcon: {
    margin: 0,
    marginRight: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  packagesContainer: {
    marginBottom: 14,
  },
  emptyState: {
    marginBottom: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    backgroundColor: theme.colors.surfaceVariant,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyStateMessage: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 12,
  },
  emptyStateButton: {
    borderRadius: 10,
    alignSelf: 'stretch',
  },
  packageCard: {
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1.25,
  },
  packageCardPrimary: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryContainer,
  },
  packageCardSecondary: {
    borderColor: theme.colors.outlineVariant,
    backgroundColor: theme.dark ? theme.colors.surfaceVariant : '#f2f3f7',
  },
  packageContent: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  packageTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  packageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  packageDescription: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 17,
  },
  packagePrice: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  primaryText: {
    color: theme.colors.primary,
  },
  continueButton: {
    marginTop: 2,
    borderRadius: 12,
  },
  continueContent: {
    paddingVertical: 6,
  },
  continueLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  restoreInlineButton: {
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 2,
  },
  restoreInlineLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.outlineVariant,
    marginVertical: 14,
  },
  renewalSection: {
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  renewalText: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 16,
  },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  linkSeparator: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginHorizontal: 8,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
});
