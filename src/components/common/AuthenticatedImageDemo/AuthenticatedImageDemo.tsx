import React, { useState } from 'react';
import { View, Image, ScrollView, StyleSheet } from 'react-native';
import { Button, Text, Card, ActivityIndicator, Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { useAuthenticatedFirebaseImage, useAuthenticatedFirebaseImages, useFirebaseAuthState } from '../../../hooks/useAuthenticatedFirebaseImage';
import AuthPrompt from '../AuthPrompt/AuthPrompt';

const AuthenticatedImageDemo: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const { authState, isAuthenticated, signOut } = useFirebaseAuthState();

  // Demo single image
  const singleImagePath = 'assets/bookImages/image_rsrc15E.jpg';
  const {
    imageUrl: singleImageUrl,
    isLoading: singleImageLoading,
    error: singleImageError,
    requiresAuth: singleRequiresAuth,
    fromCache: singleFromCache,
    retry: retrySingleImage,
    clearCache: clearSingleImageCache
  } = useAuthenticatedFirebaseImage(singleImagePath);

  // Demo multiple images
  const multipleImagePaths = [
    'assets/bookImages/image_rsrc15E.jpg',
    'assets/bookImages/image_rsrc178.jpg',
    'assets/bookImages/image_rsrc17C.jpg'
  ];

  const {
    imageUrls: multipleImageUrls,
    isLoading: multipleImagesLoading,
    errors: multipleImageErrors,
    authFailures,
    requiresAuth: multipleRequiresAuth,
    retryFailed,
    retryAuthFailures,
    clearCache: clearMultipleImageCache
  } = useAuthenticatedFirebaseImages(multipleImagePaths);

  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      marginBottom: 12,
      fontWeight: '600',
    },
    imageContainer: {
      alignItems: 'center',
      marginVertical: 12,
    },
    image: {
      width: 200,
      height: 150,
      borderRadius: 8,
    },
    errorText: {
      color: theme.colors.error,
      textAlign: 'center',
      marginVertical: 8,
    },
    statusChip: {
      marginVertical: 4,
    },
    buttonRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginVertical: 8,
    },
    authInfo: {
      backgroundColor: theme.colors.primaryContainer,
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    multipleImagesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    smallImage: {
      width: 100,
      height: 75,
      borderRadius: 4,
    }
  });

  const handleShowAuthPrompt = () => {
    setShowAuthPrompt(true);
  };

  const handleDismissAuthPrompt = () => {
    setShowAuthPrompt(false);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Authentication Status */}
      <Card style={styles.section}>
        <Card.Title title={t('auth.authStatus')} />
        <Card.Content>
          <View style={styles.authInfo}>
            <Text variant="bodyMedium">
              {t('auth.status')}: {isAuthenticated ? t('auth.authenticated') : t('auth.notAuthenticated')}
            </Text>
            {authState.user && (
              <Text variant="bodySmall">
                {t('auth.user')}: {authState.user.email}
              </Text>
            )}
          </View>
          
          <View style={styles.buttonRow}>
            {isAuthenticated ? (
              <Button mode="outlined" onPress={signOut}>
                {t('auth.logout')}
              </Button>
            ) : (
              <Button mode="contained" onPress={handleShowAuthPrompt}>
                {t('auth.login')}
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Single Image Demo */}
      <Card style={styles.section}>
        <Card.Title title="Single Authenticated Image" />
        <Card.Content>
          <Text variant="bodyMedium" style={styles.sectionTitle}>
            Loading: {singleImagePath}
          </Text>

          <View style={styles.imageContainer}>
            {singleImageLoading && <ActivityIndicator size="large" />}
            
            {singleImageUrl && (
              <Image 
                source={{ uri: singleImageUrl }} 
                style={styles.image}
                resizeMode="cover"
              />
            )}
            
            {singleImageError && (
              <Text style={styles.errorText}>{singleImageError}</Text>
            )}
          </View>

          <View style={styles.buttonRow}>
            <Chip 
              icon={singleFromCache ? "cached" : "cloud-download"}
              style={styles.statusChip}
            >
              {singleFromCache ? "From Cache" : "From Server"}
            </Chip>
            
            {singleRequiresAuth && (
              <Chip icon="lock" style={styles.statusChip}>
                Auth Required
              </Chip>
            )}
          </View>

          <View style={styles.buttonRow}>
            <Button mode="outlined" onPress={retrySingleImage}>
              Retry
            </Button>
            <Button mode="outlined" onPress={clearSingleImageCache}>
              Clear Cache
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Multiple Images Demo */}
      <Card style={styles.section}>
        <Card.Title title="Multiple Authenticated Images" />
        <Card.Content>
          <Text variant="bodyMedium" style={styles.sectionTitle}>
            Loading {multipleImagePaths.length} images
          </Text>

          {multipleImagesLoading && <ActivityIndicator size="large" />}

          <View style={styles.multipleImagesContainer}>
            {multipleImagePaths.map((path) => {
              const url = multipleImageUrls[path];
              const error = multipleImageErrors[path];
              const isAuthFailure = authFailures.includes(path);

              return (
                <View key={path} style={styles.imageContainer}>
                  {url ? (
                    <Image 
                      source={{ uri: url }} 
                      style={styles.smallImage}
                      resizeMode="cover"
                    />
                  ) : error ? (
                    <View style={[styles.smallImage, { backgroundColor: theme.colors.errorContainer, justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={{ color: theme.colors.error, fontSize: 10, textAlign: 'center' }}>
                        {isAuthFailure ? 'Auth Required' : 'Error'}
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.smallImage, { backgroundColor: theme.colors.surfaceVariant, justifyContent: 'center', alignItems: 'center' }]}>
                      <ActivityIndicator />
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          <View style={styles.buttonRow}>
            <Chip icon="information" style={styles.statusChip}>
              {Object.keys(multipleImageUrls).length}/{multipleImagePaths.length} loaded
            </Chip>
            
            {authFailures.length > 0 && (
              <Chip icon="lock" style={styles.statusChip}>
                {authFailures.length} auth failures
              </Chip>
            )}
          </View>

          <View style={styles.buttonRow}>
            <Button mode="outlined" onPress={retryFailed}>
              Retry Failed
            </Button>
            {authFailures.length > 0 && (
              <Button mode="outlined" onPress={retryAuthFailures}>
                Retry Auth Failures
              </Button>
            )}
            <Button mode="outlined" onPress={clearMultipleImageCache}>
              Clear Cache
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Auth Prompt Modal */}
      {showAuthPrompt && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <AuthPrompt
            title="Authentication Demo"
            message="Sign in to access Firebase Storage images"
            onDismiss={handleDismissAuthPrompt}
            onRetry={() => {
              retrySingleImage();
              retryAuthFailures();
              handleDismissAuthPrompt();
            }}
          />
        </View>
      )}
    </ScrollView>
  );
};

export default AuthenticatedImageDemo; 