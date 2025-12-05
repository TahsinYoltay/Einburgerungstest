import React, { useState } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { Text, Button, TextInput, Surface, IconButton, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

interface FeedbackModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (feedback: string) => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ visible, onDismiss, onSubmit }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState('');

  const handleSubmit = () => {
    onSubmit(feedback);
    setFeedback('');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <Surface style={[styles.container, { backgroundColor: theme.colors.surface, borderRadius: theme.roundness * 2 }]} elevation={4}>
          <View style={styles.header}>
            <Text variant="titleMedium" style={{ flex: 1, color: theme.colors.onSurface }}>
              {t('rating.feedback_title', 'How can we improve?')}
            </Text>
            <IconButton icon="close" size={20} onPress={onDismiss} />
          </View>
          
          <Text variant="bodyMedium" style={{ marginBottom: 16, color: theme.colors.onSurfaceVariant }}>
            {t('rating.feedback_subtitle', 'We are sorry to hear that. Please let us know what we can do better.')}
          </Text>

          <TextInput
            mode="outlined"
            multiline
            numberOfLines={4}
            placeholder={t('rating.feedback_placeholder', 'Your feedback...')}
            value={feedback}
            onChangeText={setFeedback}
            style={{ marginBottom: 16, backgroundColor: theme.colors.surface }}
          />

          <View style={styles.actions}>
            <Button onPress={onDismiss} style={{ marginRight: 8 }}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button mode="contained" onPress={handleSubmit} disabled={!feedback.trim()}>
              {t('rating.submit_feedback', 'Send Feedback')}
            </Button>
          </View>
        </Surface>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    padding: 20,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
