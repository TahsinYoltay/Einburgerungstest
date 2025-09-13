import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { Reader, ReaderProvider, useReader } from '@epubjs-react-native/core';
import { useFileSystem } from '@epubjs-react-native/file-system';

interface EpubReaderDemoProps {}

// Component that uses the reader context
function ReaderControls() {
  const { theme, changeFontSize, goNext, goPrevious, getCurrentLocation, atStart, atEnd } = useReader();
  
  const [currentLocation, setCurrentLocation] = useState<string>('');

  const handleGetLocation = async () => {
    try {
      const location = await getCurrentLocation();
      setCurrentLocation(JSON.stringify(location, null, 2));
      Alert.alert('Current Location', JSON.stringify(location, null, 2));
    } catch (error) {
      Alert.alert('Error', `Failed to get location: ${error}`);
    }
  };

  return (
    <View style={styles.controls}>
      <View style={styles.buttonRow}>
        <Button
          mode="contained"
          onPress={() => goPrevious()}
          disabled={atStart}
          style={styles.controlButton}
        >
          ← Previous
        </Button>
        
        <Button
          mode="contained"
          onPress={() => goNext()}
          disabled={atEnd}
          style={styles.controlButton}
        >
          Next →
        </Button>
      </View>

      <View style={styles.buttonRow}>
        <Button
          mode="outlined"
          onPress={() => changeFontSize('18px')}
          style={styles.controlButton}
        >
          Small Font
        </Button>
        
        <Button
          mode="outlined"
          onPress={() => changeFontSize('24px')}
          style={styles.controlButton}
        >
          Large Font
        </Button>
      </View>

      <Button
        mode="contained"
        onPress={handleGetLocation}
        style={styles.controlButton}
      >
        Get Current Location
      </Button>

      {currentLocation && (
        <View style={styles.locationContainer}>
          <Text variant="bodySmall" style={styles.locationText}>
            Current Location: {currentLocation}
          </Text>
        </View>
      )}
    </View>
  );
}

function EpubReaderDemo(props: EpubReaderDemoProps) {
  const theme = useTheme();
  const [bookLoaded, setBookLoaded] = useState(false);
  
  // Sample EPUB file URL - you can replace this with your book
  const bookSrc = 'https://www.gutenberg.org/ebooks/2701.epub.images'; // Moby Dick

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={styles.title}>
        EPUB Reader Demo
      </Text>
      
      <Text variant="bodyMedium" style={styles.subtitle}>
        Testing epubjs-react-native integration
      </Text>

      <ReaderProvider>
        <View style={styles.readerContainer}>
          <Reader
            src={bookSrc}
            width={300}
            height={400}
            fileSystem={useFileSystem}
            onReady={() => {
              setBookLoaded(true);
              console.log('Book loaded successfully!');
            }}
            defaultTheme={{
              'body': {
                'background': theme.colors.background,
                'color': theme.colors.onBackground,
              }
            }}
          />
        </View>

        {bookLoaded && <ReaderControls />}
      </ReaderProvider>

      {!bookLoaded && (
        <View style={styles.loadingContainer}>
          <Text variant="bodyMedium">Loading book...</Text>
          <Text variant="bodySmall" style={styles.loadingNote}>
            This may take a few moments to download and parse the EPUB file.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  readerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: 'white',
  },
  controls: {
    width: '100%',
    gap: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  controlButton: {
    flex: 1,
  },
  locationContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  locationText: {
    fontFamily: 'monospace',
    fontSize: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  loadingNote: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.6,
  },
});

export default EpubReaderDemo; 