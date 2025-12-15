import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native';
import { Surface, Text, Button, useTheme, IconButton, TextInput } from 'react-native-paper';
import Rate, { AndroidMarket } from 'react-native-rate-app';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '../../store/hooks';
import { useAppSelector } from '../../store/hooks';
import { recordPromptOutcome, PromptOutcome, RatingStatus } from '../../store/slices/ratingSlice';
import { APP_CONFIG } from '../../config/appConfig';
import { submitRatingFeedback, RatingFeedbackSource } from '../../services/RatingFeedbackService';
import { selectAuthState } from '../../store/slices/authSlice';

interface RatingPromptProps {
  visible: boolean;
  onDismiss: () => void;
  appleAppID?: string;
  googlePackageName?: string;
  source?: RatingFeedbackSource;
}

// Internal Star Component
const StarRating: React.FC<{ rating: number; onRate: (rating: number) => void }> = ({ rating, onRate }) => {
  const theme = useTheme();
  
  return (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <IconButton
          key={star}
          icon={star <= rating ? 'star' : 'star-outline'}
          size={32}
          iconColor={star <= rating ? '#FFD700' : theme.colors.onSurfaceVariant}
          onPress={() => onRate(star)}
          style={styles.starButton}
        />
      ))}
    </View>
  );
};

export const RatingPrompt: React.FC<RatingPromptProps> = ({ 
  visible, 
  onDismiss,
  appleAppID = APP_CONFIG.IOS_APP_ID, 
  googlePackageName = APP_CONFIG.ANDROID_PACKAGE_NAME,
  source = 'auto'
}) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const auth = useAppSelector(selectAuthState);
  
  const [step, setStep] = useState<'rate' | 'feedback'>('rate');
  const [userRating, setUserRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Reset state when visible changes
  useEffect(() => {
    if (visible) {
      setStep('rate');
      setUserRating(0);
      setFeedbackText('');
    }
  }, [visible]);

  const handleClose = (outcome: PromptOutcome = 'ignored') => {
    let nextStatus: RatingStatus = 'eligible_not_asked'; 
    
    switch (outcome) {
        case 'positive_flow': nextStatus = 'completed_flow'; break;
        case 'remind_later': nextStatus = 'asked_remind_later'; break;
        case 'negative_feedback': nextStatus = 'negative_feedback_given'; break;
        default: nextStatus = 'asked_ignored'; break;
    }

    dispatch(recordPromptOutcome({ outcome, nextStatus }));
    onDismiss();
  };

  const handleStarPress = async (rating: number) => {
    setUserRating(rating);

    // Slight delay to let user see the star selection animation
    setTimeout(async () => {
      if (rating >= 4) {
        // POSITIVE FLOW: 4 or 5 Stars -> Trigger Native Store Review
        try {
          const success = await Rate.requestReview({
            androidMarket: AndroidMarket.GOOGLE,
          });
          handleClose('positive_flow');
        } catch (error) {
          console.warn('Rating request failed', error);
          handleClose('ignored');
        }
      } else {
        // NEGATIVE FLOW: 1-3 Stars -> Show Feedback Form
        setStep('feedback');
      }
    }, 300);
  };

  const submitFeedback = async () => {
    if (!feedbackText.trim()) {
      return;
    }

    try {
      setIsSubmittingFeedback(true);
      await submitRatingFeedback({
        rating: userRating,
        message: feedbackText.trim(),
        appLanguage: i18n.language,
        source,
        user: {
          uid: auth.firebaseUid,
          email: auth.email,
          isAnonymous: auth.status !== 'authenticated',
          authProvider: auth.authProvider,
        },
      });
    } catch (error) {
      Alert.alert(t('common.error'), t('rating.feedbackSubmitError', 'Unable to send feedback right now.'));
    } finally {
      setIsSubmittingFeedback(false);
      handleClose('negative_feedback');
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => handleClose('ignored')}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.overlay}
        >
          <Surface style={[styles.container, { backgroundColor: theme.colors.surface, borderRadius: 28 }]} elevation={5}>
            
            {/* Close Button */}
            <IconButton 
              icon="close" 
              size={20} 
              style={styles.closeButton} 
              onPress={() => handleClose('ignored')} 
            />

            {step === 'rate' ? (
              <View style={styles.content}>
                <View style={[styles.iconPlaceholder, { backgroundColor: theme.colors.secondaryContainer }]}>
                   <IconButton icon="thumb-up" size={32} iconColor={theme.colors.onSecondaryContainer} />
                </View>

                <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
                  {t('rating.enjoy_title', 'Enjoying Life in the UK?')}
                </Text>
                
                <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                  {t('rating.enjoy_message', 'Tap a star to rate it on the App Store.')}
                </Text>

                <StarRating rating={userRating} onRate={handleStarPress} />

                <Button 
                  mode="text" 
                  onPress={() => handleClose('remind_later')}
                  style={styles.notNowButton}
                  textColor={theme.colors.onSurfaceVariant}
                >
                  {t('rating.not_now', 'Not Now')}
                </Button>
              </View>
            ) : (
              <View style={styles.content}>
                <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
                  {t('rating.feedback_title', 'How can we improve?')}
                </Text>
                
                <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                  {t('rating.feedback_subtitle', 'We are sorry to hear that. Please let us know what we can do better.')}
                </Text>

                <TextInput
                  mode="outlined"
                  multiline
                  numberOfLines={4}
                  placeholder={t('rating.feedback_placeholder', 'Your feedback...')}
                  value={feedbackText}
                  onChangeText={setFeedbackText}
                  style={[styles.input, { backgroundColor: theme.colors.surface }]}
                  outlineStyle={{ borderRadius: 12 }}
                  returnKeyType="done"
                  blurOnSubmit={true}
                  onSubmitEditing={Keyboard.dismiss}
                />

                <Button 
                  mode="contained" 
                  onPress={submitFeedback} 
                  style={styles.submitButton}
                  contentStyle={{ height: 48 }}
                  loading={isSubmittingFeedback}
                  disabled={!feedbackText.trim() || isSubmittingFeedback}
                >
                  {t('rating.submit_feedback', 'Send Feedback')}
                </Button>
              </View>
            )}

          </Surface>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
    opacity: 0.6,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  iconPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 4,
    lineHeight: 20,
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 24,
  },
  starButton: {
    margin: 0,
  },
  notNowButton: {
    marginTop: 8,
  },
  input: {
    width: '100%',
    marginBottom: 24,
    minHeight: 100,
  },
  submitButton: {
    width: '100%',
    borderRadius: 24,
  }
});
