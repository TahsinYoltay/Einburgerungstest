import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import firestore from '@react-native-firebase/firestore';
import { firebaseFirestore } from '../config/firebase';
import { APP_CONFIG } from '../config/appConfig';

export type RatingFeedbackSource = 'manual' | 'auto';

export type SubmitRatingFeedbackInput = {
  rating: number;
  message: string;
  appLanguage: string;
  source: RatingFeedbackSource;
  user: {
    uid: string | null;
    email: string | null;
    isAnonymous: boolean;
    authProvider: string;
  };
};

async function collectDiagnostics(): Promise<Record<string, unknown>> {
  let manufacturer: string | undefined;
  try {
    manufacturer = await DeviceInfo.getManufacturer();
  } catch {
    manufacturer = undefined;
  }

  let timezone: string | undefined;
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    timezone = undefined;
  }

  return {
    platform: Platform.OS,
    platformVersion: Platform.Version,
    app: {
      version: DeviceInfo.getVersion(),
      buildNumber: DeviceInfo.getBuildNumber(),
      bundleId: DeviceInfo.getBundleId(),
      readableVersion: DeviceInfo.getReadableVersion(),
    },
    device: {
      brand: DeviceInfo.getBrand(),
      manufacturer,
      model: DeviceInfo.getModel(),
      deviceId: DeviceInfo.getDeviceId(),
      isTablet: DeviceInfo.isTablet(),
      systemName: DeviceInfo.getSystemName(),
      systemVersion: DeviceInfo.getSystemVersion(),
    },
    timezone,
  };
}

function formatEmailSubject(input: { feedbackId: string; rating: number }) {
  return `[Einburgerungstest] Rating feedback: ${input.rating} star(s) (Ref ${input.feedbackId})`;
}

function formatEmailBody(input: {
  feedbackId: string;
  rating: number;
  message: string;
  appLanguage: string;
  source: RatingFeedbackSource;
  user: SubmitRatingFeedbackInput['user'];
}) {
  const lines: string[] = [
    'A new rating feedback has been submitted.',
    '',
    `Feedback ID: ${input.feedbackId}`,
    `Rating: ${input.rating} star(s)`,
    `Message: ${input.message || 'N/A'}`,
    `Source: ${input.source}`,
    `Language: ${input.appLanguage}`,
    '',
    'User:',
    `UID: ${input.user.uid ?? 'N/A'}`,
    `Email: ${input.user.email ?? 'N/A'}`,
    `Anonymous: ${input.user.isAnonymous ? 'Yes' : 'No'}`,
    `Provider: ${input.user.authProvider}`,
    '',
    `Firestore: ratingFeedback/${input.feedbackId}`,
  ];

  return lines.filter(Boolean).join('\n');
}

async function queueEmailNotification(input: {
  feedbackId: string;
  rating: number;
  message: string;
  appLanguage: string;
  source: RatingFeedbackSource;
  user: SubmitRatingFeedbackInput['user'];
}) {
  const mailDoc: Record<string, unknown> = {
    to: APP_CONFIG.SUPPORT_EMAIL,
    message: {
      subject: formatEmailSubject({ feedbackId: input.feedbackId, rating: input.rating }),
      text: formatEmailBody(input),
    },
    ratingFeedbackId: input.feedbackId,
    createdAt: firestore.FieldValue.serverTimestamp(),
  };

  await firebaseFirestore.collection('mail').add(mailDoc);
}

export async function submitRatingFeedback(input: SubmitRatingFeedbackInput): Promise<{ feedbackId: string; emailQueued: boolean }> {
  const feedbackRef = firebaseFirestore.collection('ratingFeedback').doc();
  const createdAt = firestore.FieldValue.serverTimestamp();
  const diagnostics = await collectDiagnostics();

  await feedbackRef.set({
    rating: input.rating,
    message: input.message,
    appLanguage: input.appLanguage,
    source: input.source,
    user: input.user,
    diagnostics,
    createdAt,
    updatedAt: createdAt,
  });

  let emailQueued = false;
  try {
    await queueEmailNotification({
      feedbackId: feedbackRef.id,
      rating: input.rating,
      message: input.message,
      appLanguage: input.appLanguage,
      source: input.source,
      user: input.user,
    });
    emailQueued = true;
  } catch (error) {
    console.error('[RatingFeedbackService] Failed to queue email notification:', error);
  }

  return { feedbackId: feedbackRef.id, emailQueued };
}
