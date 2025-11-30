import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconButton, Text, useTheme, Surface, List } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UnifiedEpubReader, UnifiedEpubReaderRef } from '../../components/UnifiedEpubReader';
import { useEpubReader, THEMES } from '../../contexts/EpubReaderContext';
import { RootStackParamList } from '../../navigations/StackNavigator';
import { ROUTES } from '../../constants/routes';
import { getChapterById } from '../../data/book/chapters';

type EpubReaderScreenRouteProp = RouteProp<RootStackParamList, typeof ROUTES.EPUB_READER>;
type EpubReaderScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Clean EPUB Reader Screen
 * 
 * This screen provides a full-featured EPUB reading experience with:
 * - Navigation to specific chapters/sections
 * - Reading settings (font size, theme)
 * - Table of contents
 * - Progress tracking
 * - Paywall support (check chapter availability)
 */
export default function EpubReaderScreen() {
  const navigation = useNavigation<EpubReaderScreenNavigationProp>();
  const route = useRoute<EpubReaderScreenRouteProp>();
  const theme = useTheme();
  const { settings, updateSettings, toc } = useEpubReader();
  
  const { chapterId, targetSectionId, bookTitle } = route.params || {};
  const sectionId = targetSectionId; // Alias for consistency
  
  const [showSettings, setShowSettings] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const readerRef = useRef<UnifiedEpubReaderRef>(null);

  // Get chapter data to check availability and get EPUB path
  const chapter = chapterId ? getChapterById(chapterId) : null;
  
  // For paywall: Check if chapter is available
  if (chapter && !chapter.isAvailable) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
          <Text variant="titleMedium" style={{ flex: 1 }}>
            {bookTitle || chapter.title}
          </Text>
        </View>
        <View style={styles.paywallContainer}>
          <IconButton icon="lock" size={64} iconColor={theme.colors.primary} />
          <Text variant="headlineSmall" style={{ marginTop: 16, textAlign: 'center' }}>
            Chapter Locked
          </Text>
          <Text variant="bodyLarge" style={{ marginTop: 8, textAlign: 'center', opacity: 0.7 }}>
            Unlock this chapter to continue reading
          </Text>
          <TouchableOpacity
            style={[styles.unlockButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => {
              // TODO: Implement paywall/unlock logic
              console.log('Unlock chapter:', chapter.id);
            }}
          >
            <Text style={{ color: theme.colors.onPrimary, fontWeight: 'bold' }}>
              Unlock Chapter
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleProgressUpdate = useCallback((chapId: string, secId: string, progress: number) => {
    console.log(`Progress: Chapter ${chapId}, Section ${secId}, ${progress.toFixed(1)}%`);
  }, []);

  const handleSettingsToggle = () => {
    setShowSettings(!showSettings);
  };

  const handleTocToggle = () => {
    setShowToc(!showToc);
  };

  const changeFontSize = (delta: number) => {
    updateSettings({
      fontSize: Math.max(12, Math.min(32, settings.fontSize + delta)),
    });
  };

  const changeTheme = (themeName: 'light' | 'dark' | 'sepia') => {
    updateSettings({ theme: THEMES[themeName] });
  };

  // Use full book EPUB path or chapter-specific EPUB
  const epubPath = chapter?.epubPath || 'LIUKV3';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: settings.theme.backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <Text variant="titleMedium" style={{ flex: 1 }} numberOfLines={1}>
          {bookTitle || chapter?.title || 'Reader'}
        </Text>
        <IconButton icon="table-of-contents" onPress={handleTocToggle} />
        <IconButton icon="cog" onPress={handleSettingsToggle} />
      </View>

      {/* EPUB Reader */}
      <View style={{ flex: 1 }}>
        <UnifiedEpubReader
          ref={readerRef}
          epubPath={epubPath}
          chapterId={chapterId}
          sectionId={sectionId}
          chapter={chapter || undefined}
          onProgressUpdate={handleProgressUpdate}
          onNavigationReady={() => console.log('Navigation ready')}
        />
      </View>

      {/* Bottom Navigation Toolbar */}
      <Surface style={[styles.bottomToolbar, { backgroundColor: theme.colors.surface }]}>
        <IconButton
          icon="chevron-left"
          size={24}
          onPress={() => readerRef.current?.goToPreviousPage()}
        />
        <View style={styles.toolbarCenter}>
          <IconButton
            icon="format-font-size-increase"
            size={20}
            onPress={() => updateSettings({ fontSize: Math.min(settings.fontSize + 2, 32) })}
          />
          <IconButton
            icon="format-font-size-decrease"
            size={20}
            onPress={() => updateSettings({ fontSize: Math.max(settings.fontSize - 2, 12) })}
          />
        </View>
        <IconButton
          icon="chevron-right"
          size={24}
          onPress={() => readerRef.current?.goToNextPage()}
        />
      </Surface>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <Surface style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text variant="titleLarge">Reading Settings</Text>
              <IconButton icon="close" onPress={() => setShowSettings(false)} />
            </View>

            {/* Font Size */}
            <View style={styles.settingRow}>
              <Text variant="titleMedium">Font Size</Text>
              <View style={styles.buttonGroup}>
                <IconButton icon="minus" onPress={() => changeFontSize(-2)} />
                <Text variant="bodyLarge">{settings.fontSize}px</Text>
                <IconButton icon="plus" onPress={() => changeFontSize(2)} />
              </View>
            </View>

            {/* Theme */}
            <View style={styles.settingRow}>
              <Text variant="titleMedium">Theme</Text>
              <View style={styles.themeButtons}>
                {Object.entries(THEMES).map(([key, themeObj]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.themeButton,
                      { backgroundColor: themeObj.backgroundColor },
                      settings.theme.name === key && styles.themeButtonActive,
                    ]}
                    onPress={() => changeTheme(key as 'light' | 'dark' | 'sepia')}
                  >
                    <Text style={{ color: themeObj.textColor, fontSize: 12 }}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Surface>
        </View>
      </Modal>

      {/* Table of Contents Modal */}
      <Modal
        visible={showToc}
        transparent
        animationType="slide"
        onRequestClose={() => setShowToc(false)}
      >
        <View style={styles.modalOverlay}>
          <Surface style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text variant="titleLarge">Table of Contents</Text>
              <IconButton icon="close" onPress={() => setShowToc(false)} />
            </View>
            
            <ScrollView style={{ maxHeight: '80%' }}>
              {toc.length > 0 ? (
                <List.Section>
                  {toc.map((item, index) => (
                    <React.Fragment key={index}>
                      <List.Item
                        title={item.label.trim()}
                        titleStyle={{ fontWeight: item.subitems ? 'bold' : 'normal' }}
                        onPress={() => {
                          console.log('Navigate to:', item.href);
                          readerRef.current?.navigateToHref(item.href);
                          setShowToc(false);
                        }}
                      />
                      {item.subitems && item.subitems.map((subitem, subIndex) => (
                        <List.Item
                          key={`${index}-${subIndex}`}
                          title={subitem.label.trim()}
                          titleStyle={{ paddingLeft: 16 }}
                          onPress={() => {
                            console.log('Navigate to section:', subitem.href);
                            readerRef.current?.navigateToHref(subitem.href);
                            setShowToc(false);
                          }}
                        />
                      ))}
                    </React.Fragment>
                  ))}
                </List.Section>
              ) : (
                <View style={styles.emptyToc}>
                  <Text variant="bodyLarge" style={{ opacity: 0.7 }}>
                    Loading table of contents...
                  </Text>
                </View>
              )}
            </ScrollView>
          </Surface>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  paywallContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  unlockButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingRow: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  themeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  themeButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 80,
    alignItems: 'center',
  },
  themeButtonActive: {
    borderColor: '#667eea',
  },
  emptyToc: {
    padding: 32,
    alignItems: 'center',
  },
  bottomToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  toolbarCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
