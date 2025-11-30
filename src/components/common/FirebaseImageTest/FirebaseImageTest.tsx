import React, { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { useTheme, Text, Button, ActivityIndicator } from 'react-native-paper';
import { useFirebaseImages, useFirebaseImage } from '../../../hooks/useFirebaseImage';
import { FIREBASE_IMAGE_PATHS } from '../../../reader/ContentLoader';
import { useTranslation } from 'react-i18next';

interface FirebaseImageTestProps {}

function FirebaseImageTest({}: FirebaseImageTestProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Test loading multiple images
  const testImagePaths = Object.values(FIREBASE_IMAGE_PATHS).slice(0, 5); // Test first 5 images
  const {
    urls,
    loading,
    error,
    loadingPaths,
    failedPaths,
    retry,
    retryPath
  } = useFirebaseImages(testImagePaths);

  // Test loading a single image
  const singleImageTest = useFirebaseImage(selectedImage);

  const handleTestSingleImage = () => {
    const firstImagePath = Object.values(FIREBASE_IMAGE_PATHS)[0];
    setSelectedImage(firstImagePath);
  };

  const handleClearCache = async () => {
    try {
      // Clear cache and retry
      retry();
      Alert.alert('Success', 'Cache cleared and images reloaded');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear cache');
    }
  };

  const renderImageResult = (path: string) => {
    const imageName = Object.keys(FIREBASE_IMAGE_PATHS).find(
      key => FIREBASE_IMAGE_PATHS[key] === path
    ) || path;

    const url = urls[path];
    const isLoading = loadingPaths.includes(path);
    const hasFailed = failedPaths.includes(path);

    return (
      <View key={path} style={{ borderWidth: 1, borderColor: theme.colors.outline, borderRadius: 8, padding: 12, marginBottom: 8 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.onSurface, marginBottom: 8 }}>{imageName}</Text>
        
        {isLoading && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
            <ActivityIndicator size="small" animating={true} />
            <Text style={{ marginLeft: 8, color: theme.colors.onSurfaceVariant }}>Loading image...</Text>
          </View>
        )}
        
        {url && (
          <View style={{ backgroundColor: theme.colors.primaryContainer, borderRadius: 6, padding: 8 }}>
            <Text style={{ color: theme.colors.onPrimaryContainer, fontWeight: '600', marginBottom: 4 }}>✅ Loaded successfully</Text>
            <Text style={{ fontSize: 12, color: theme.colors.onPrimaryContainer, fontFamily: 'monospace' }} numberOfLines={2}>{url}</Text>
          </View>
        )}
        
        {hasFailed && (
          <View style={{ backgroundColor: theme.colors.errorContainer, borderRadius: 6, padding: 8 }}>
            <Text style={{ color: theme.colors.onErrorContainer, fontWeight: '600' }}>❌ Failed to load</Text>
            <Button mode="contained" onPress={() => retryPath(path)} style={{ marginTop: 8 }}>
              Retry
            </Button>
          </View>
        )}
      </View>
    );
  };

  const totalImages = testImagePaths.length;
  const loadedImages = Object.keys(urls).length;
  const errorCount = failedPaths.length;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background, padding: 16 }} showsVerticalScrollIndicator={false}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.colors.onBackground, textAlign: 'center', marginBottom: 24 }}>
        🔥 Firebase Image Test
      </Text>
      
      {/* Batch Image Loading Test */}
      <View style={{ backgroundColor: theme.colors.surface, borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.onSurface, marginBottom: 8 }}>
          Batch Image Loading
        </Text>
        <Text style={{ fontSize: 14, color: theme.colors.onSurfaceVariant, marginBottom: 12 }}>
          Testing {totalImages} images: {loadedImages} loaded, {errorCount} errors
        </Text>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>Total</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.primary }}>{totalImages}</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>Loaded</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.primary }}>{loadedImages}</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>Errors</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.primary }}>{errorCount}</Text>
          </View>
        </View>

        {loading && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
            <ActivityIndicator size="large" animating={true} />
            <Text style={{ marginLeft: 8, color: theme.colors.onSurfaceVariant }}>Loading images...</Text>
          </View>
        )}

        {error && (
          <View style={{ backgroundColor: theme.colors.errorContainer, borderRadius: 6, padding: 8, marginBottom: 12 }}>
            <Text style={{ color: theme.colors.onErrorContainer, fontWeight: '600' }}>❌ {error}</Text>
          </View>
        )}

        {/* Display results for each image */}
        {testImagePaths.map(path => renderImageResult(path))}

        {failedPaths.length > 0 && (
          <Button mode="contained" onPress={retry} style={{ marginTop: 12 }}>
            Retry Failed Images
          </Button>
        )}
      </View>

      {/* Single Image Loading Test */}
      <View style={{ backgroundColor: theme.colors.surface, borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.onSurface, marginBottom: 8 }}>
          Single Image Loading
        </Text>
        
        <Button mode="contained" onPress={handleTestSingleImage} style={{ marginTop: 12 }}>
          Test Single Image
        </Button>

        {selectedImage && (
          <View style={{ marginTop: 12, borderWidth: 1, borderColor: theme.colors.outline, borderRadius: 8, padding: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.onSurface, marginBottom: 8 }}>
              Testing: {selectedImage}
            </Text>
            
            {singleImageTest.loading && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
                <ActivityIndicator size="small" animating={true} />
                <Text style={{ marginLeft: 8, color: theme.colors.onSurfaceVariant }}>Loading image...</Text>
              </View>
            )}
            
            {singleImageTest.url && (
              <View style={{ backgroundColor: theme.colors.primaryContainer, borderRadius: 6, padding: 8 }}>
                <Text style={{ color: theme.colors.onPrimaryContainer, fontWeight: '600', marginBottom: 4 }}>
                  ✅ Loaded {singleImageTest.fromCache ? '(from cache)' : '(from Firebase)'}
                </Text>
                <Text style={{ fontSize: 12, color: theme.colors.onPrimaryContainer, fontFamily: 'monospace' }} numberOfLines={2}>
                  {singleImageTest.url}
                </Text>
              </View>
            )}
            
            {singleImageTest.error && (
              <View style={{ backgroundColor: theme.colors.errorContainer, borderRadius: 6, padding: 8 }}>
                <Text style={{ color: theme.colors.onErrorContainer, fontWeight: '600' }}>
                  ❌ {singleImageTest.error}
                </Text>
                <Button mode="contained" onPress={singleImageTest.retry} style={{ marginTop: 8 }}>
                  Retry
                </Button>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Cache Management */}
      <View style={{ backgroundColor: theme.colors.surface, borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.onSurface, marginBottom: 8 }}>
          Cache Management
        </Text>
        
        <Button mode="contained" onPress={handleClearCache} style={{ marginTop: 12 }}>
          Clear Cache & Reload
        </Button>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

export default FirebaseImageTest; 