import React, { useMemo, useState, useEffect } from 'react';
import { View, Modal, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native';
import { Surface, Text, Button, IconButton, TextInput } from 'react-native-paper';
import Rate, { AndroidMarket } from 'react-native-rate-app';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { recordPromptOutcome, PromptOutcome, RatingStatus } from '../../store/slices/ratingSlice';
import { APP_CONFIG } from '../../config/appConfig';
import { submitRatingFeedback, RatingFeedbackSource } from '../../services/RatingFeedbackService';
import { selectAuthState } from '../../store/slices/authSlice';
import { useAppTheme } from '../../providers/ThemeProvider';
import { createStyles } from './RatingPrompt.styles';

interface RatingPromptProps {
  visible: boolean;
  onDismiss: () => void;
  appleAppID?: string;
  googlePackageName?: string;
  source?: RatingFeedbackSource;
}

// Internal Star Component
export const RatingPrompt: React.FC<RatingPromptProps> = ({ 
  visible, 
  onDismiss,
  appleAppID = APP_CONFIG.IOS_APP_ID, 
  googlePackageName = APP_CONFIG.ANDROID_PACKAGE_NAME,
  source = 'auto'
}) => {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          style={styles.overlay}
        >
          <Surface style={styles.container} elevation={5}>
            
            {/* Close Button */}
            <IconButton 
              icon="close" 
              size={20} 
              style={styles.closeButton} 
              iconColor={theme.colors.onSurface}
              onPress={() => handleClose('ignored')} 
            />

            {step === 'rate' ? (
              <View style={styles.content}>
                <View style={styles.iconPlaceholder}>
                   <IconButton
                     icon="thumb-up"
                     size={28}
                     iconColor={theme.colors.primary}
                     style={styles.placeholderIconButton}
                   />
                </View>

                <Text variant="headlineSmall" style={styles.title}>
                  {t('rating.enjoy_title', 'Enjoying Einbürgerungstest?')}
                </Text>
                
                <Text variant="bodyMedium" style={styles.subtitle}>
                  {t('rating.enjoy_message', 'Tap a star to rate it on the App Store.')}
                </Text>

                <View style={styles.starContainer}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <IconButton
                      key={star}
                      icon={star <= userRating ? 'star' : 'star-outline'}
                      size={30}
                      iconColor={star <= userRating ? '#FFD700' : theme.colors.onSurfaceVariant}
                      onPress={() => handleStarPress(star)}
                      style={styles.starButton}
                    />
                  ))}
                </View>

                <Button 
                  mode="outlined"
                  onPress={() => handleClose('remind_later')}
                  style={styles.secondaryButton}
                  contentStyle={styles.secondaryButtonContent}
                  labelStyle={styles.secondaryButtonLabel}
                >
                  {t('rating.not_now', 'Not Now')}
                </Button>
              </View>
            ) : (
              <View style={styles.content}>
                <Text variant="headlineSmall" style={styles.title}>
                  {t('rating.feedback_title', 'How can we improve?')}
                </Text>
                
                <Text variant="bodyMedium" style={styles.subtitle}>
                  {t('rating.feedback_subtitle', 'We are sorry to hear that. Please let us know what we can do better.')}
                </Text>

                <TextInput
                  mode="outlined"
                  multiline
                  numberOfLines={4}
                  placeholder={t('rating.feedback_placeholder', 'Your feedback...')}
                  value={feedbackText}
                  onChangeText={setFeedbackText}
                  style={styles.input}
                  outlineStyle={styles.inputOutline}
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.primary}
                  textColor={theme.colors.onSurface}
                  selectionColor={theme.colors.primary}
                  returnKeyType="done"
                  blurOnSubmit={true}
                  onSubmitEditing={Keyboard.dismiss}
                />

                <Button 
                  mode="contained" 
                  onPress={submitFeedback} 
                  style={styles.submitButton}
                  contentStyle={styles.submitButtonContent}
                  labelStyle={styles.submitButtonLabel}
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
