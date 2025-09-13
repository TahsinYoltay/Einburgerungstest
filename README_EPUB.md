# Hybrid EPUB Reader for React Native

A comprehensive EPUB reader implementation for React Native using WebView and local file system parsing.

## Features

- ✅ **Hybrid EPUB Support**: Handles both pure EPUB files and extracted EPUB directories
- ✅ **WebView Rendering**: Uses react-native-webview for optimal content display
- ✅ **Caching System**: AsyncStorage-based caching for fast subsequent loads
- ✅ **Navigation**: Chapter-by-chapter navigation with progress tracking
- ✅ **Theming**: Light, dark, and sepia reading modes
- ✅ **Typography Controls**: Font size, line height, and margin adjustments
- ✅ **RTL Support**: Right-to-left language support
- ✅ **Progress Tracking**: Reading progress and session management
- ✅ **Internationalization**: English and Turkish language support

## Libraries Used

- `@react-native-async-storage/async-storage` - Data persistence and caching
- `react-native-webview` - Content rendering
- `@dr.pogodin/react-native-fs` - File system operations
- `react-native-paper` - UI components
- `@react-navigation/native` - Navigation

## Installation

```bash
# Install dependencies
yarn install

# iOS specific
cd ios && pod install

# Android specific (if needed)
cd android && ./gradlew clean
```

## Usage

### Basic Setup

1. Wrap your app with the `BookProvider`:

```tsx
import { BookProvider } from './src/contexts/BookContext';

function App() {
  return (
    <BookProvider>
      {/* Your app content */}
    </BookProvider>
  );
}
```

2. Use the EPUB reader in your components:

```tsx
import { useBook } from './src/contexts/BookContext';
import ChapterListScreen from './src/screens/ChapterListScreen';
import ReaderScreen from './src/screens/ReaderScreen';

function BookReader() {
  const { loadBook } = useBook();
  
  // Load EPUB from extracted directory
  const loadEpub = async () => {
    await loadBook('path/to/extracted/epub/directory');
  };
  
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="ChapterList" component={ChapterListScreen} />
        <Stack.Screen name="Reader" component={ReaderScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### EPUB Structure

The reader supports extracted EPUB directories with this structure:

```
epub-directory/
├── extracted_content/
│   ├── content.opf
│   ├── OEBPS/
│   │   ├── part0007.xhtml
│   │   ├── part0000.xhtml
│   │   └── images/
│   └── META-INF/
│       └── container.xml
└── metadata.opf
```

### Reader Settings

```tsx
const { settings, updateSettings } = useBook();

// Update reader appearance
updateSettings({
  theme: 'dark',
  fontSize: 120,
  lineHeight: 1.8,
  margin: 24,
  textAlign: 'justify',
  isRTL: false
});
```

### Navigation

```tsx
const { goNext, goPrev, goToSection, sections } = useBook();

// Navigate through sections
goNext(); // Next section
goPrev(); // Previous section
goToSection(0); // Go to first section
```

## Components

### BookContext
Central state management for EPUB data, reading position, and settings.

### SectionView
WebView-based component that renders individual EPUB sections with:
- Custom CSS injection for theming
- JavaScript bridges for navigation
- Image processing for local assets
- Link handling

### ChapterListScreen
Displays all available EPUB sections with:
- Section titles and reading estimates
- Progress indicators
- Navigation to individual sections

### ReaderScreen
Full reading interface with:
- Content display via SectionView
- Navigation controls
- Progress tracking
- Settings access

## File Structure

```
src/
├── types/
│   ├── epub.ts          # EPUB data types
│   └── reader.ts        # Reader state types
├── services/
│   └── epubParser.ts    # EPUB parsing and caching
├── contexts/
│   └── BookContext.tsx  # Global book state management
├── components/
│   └── SectionView.tsx  # WebView-based content renderer
├── screens/
│   ├── ChapterListScreen.tsx
│   └── ReaderScreen.tsx
└── localization/
    └── languages/       # Translation files
```

## Commands

```bash
# Development
yarn start          # Start Metro bundler
yarn android        # Run on Android
yarn ios           # Run on iOS

# Testing
yarn test          # Run unit tests
yarn lint          # Run ESLint

# Build
yarn build:android # Build Android APK
yarn build:ios     # Build iOS app
```

## Configuration

### Theme Customization

Themes are defined in the SectionView component and can be extended:

```tsx
const themes = {
  light: { background: '#ffffff', text: '#000000' },
  dark: { background: '#1a1a1a', text: '#e0e0e0' },
  sepia: { background: '#f4f1ea', text: '#5c4b37' },
  // Add custom themes
};
```

### Font Settings

```tsx
const fontOptions = {
  fontFamily: 'system' | 'serif' | 'sans-serif',
  fontSize: 80-200, // Percentage
  lineHeight: 1.0-3.0,
};
```

## Supported EPUB Features

- ✅ XHTML content rendering
- ✅ CSS styling
- ✅ Images (local assets)
- ✅ Navigation links
- ✅ Table of contents
- ✅ Metadata parsing
- ❌ Audio/Video content
- ❌ Interactive elements
- ❌ DRM protection

## Troubleshooting

### Common Issues

1. **Images not displaying**: Ensure image paths in XHTML match the local file structure
2. **Slow loading**: Check if caching is working properly via AsyncStorage
3. **Navigation issues**: Verify the spine order in content.opf
4. **Theme not applying**: Check CSS variable injection in SectionView

### Debug Mode

Enable console logs in the parser service:

```tsx
// In epubParser.ts
console.log('📚 Loading EPUB from:', epubUri);
```

## Performance Optimization

- Content is cached after first load
- Images are processed and cached
- WebView content is optimized for mobile
- Lazy loading for large EPUBs
- Memory management for long reading sessions

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Test on both iOS and Android
5. Ensure accessibility compliance

## License

This implementation is part of the Life in the UK app project. 