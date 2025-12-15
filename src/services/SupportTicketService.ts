import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import firestore from '@react-native-firebase/firestore';

import { firebaseFirestore } from '../config/firebase';
import { APP_CONFIG } from '../config/appConfig';

export type SupportTicketKind = 'feedback' | 'bug';
export type SupportTicketSeverity = 'low' | 'medium' | 'high' | 'crash';

export type SubmitSupportTicketInput = {
  kind: SupportTicketKind;
  category: string;
  subject: string;
  message: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  severity?: SupportTicketSeverity;
  contactEmail?: string;
  includeDiagnostics: boolean;
  appLanguage: string;
  user: {
    uid: string | null;
    email: string | null;
    isAnonymous: boolean;
    authProvider: string;
  };
};

export type SubmitSupportTicketResult = {
  ticketId: string;
  supportEmailQueued: boolean;
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

function formatEmailSubject(input: { ticketId: string; kind: SupportTicketKind; subject: string }) {
  const safeSubject = input.subject.replace(/[\r\n]+/g, ' ').trim().slice(0, 120);
  return `[LifeInTheUK] New ${input.kind} ticket: ${safeSubject} (Ticket ${input.ticketId})`;
}

function formatEmailBody(input: {
  ticketId: string;
  kind: SupportTicketKind;
  category: string;
  subject: string;
  appLanguage: string;
  includeDiagnostics: boolean;
  user: SubmitSupportTicketInput['user'];
  contactEmail?: string;
}) {
  const lines: string[] = [
    'A new support ticket has been created.',
    '',
    `Ticket ID: ${input.ticketId}`,
    `Type: ${input.kind}`,
    `Category: ${input.category}`,
    `Subject: ${input.subject}`,
    `Language: ${input.appLanguage}`,
    `Diagnostics included: ${input.includeDiagnostics ? 'Yes' : 'No'}`,
    '',
    'User:',
    `UID: ${input.user.uid ?? 'N/A'}`,
    `Email: ${input.user.email ?? 'N/A'}`,
    `Anonymous: ${input.user.isAnonymous ? 'Yes' : 'No'}`,
    `Provider: ${input.user.authProvider}`,
    input.contactEmail ? `Contact email: ${input.contactEmail}` : '',
    '',
    `Firestore: supportTickets/${input.ticketId}`,
  ];

  return lines.filter(Boolean).join('\n');
}

async function queueSupportEmailNotification(input: {
  ticketId: string;
  kind: SupportTicketKind;
  category: string;
  subject: string;
  appLanguage: string;
  includeDiagnostics: boolean;
  user: SubmitSupportTicketInput['user'];
  contactEmail?: string;
}) {
  const mailDoc: Record<string, unknown> = {
    to: APP_CONFIG.SUPPORT_EMAIL,
    message: {
      subject: formatEmailSubject({ ticketId: input.ticketId, kind: input.kind, subject: input.subject }),
      text: formatEmailBody(input),
    },
    supportTicketId: input.ticketId,
    kind: input.kind,
    category: input.category,
    createdAt: firestore.FieldValue.serverTimestamp(),
  };

  if (input.contactEmail) {
    mailDoc.replyTo = input.contactEmail;
  }

  await firebaseFirestore.collection('mail').add(mailDoc);
}

export async function submitSupportTicket(
  input: SubmitSupportTicketInput
): Promise<SubmitSupportTicketResult> {
  const ticketRef = firebaseFirestore.collection('supportTickets').doc();
  const createdAt = firestore.FieldValue.serverTimestamp();

  const diagnostics = input.includeDiagnostics ? await collectDiagnostics() : null;

  await ticketRef.set({
    kind: input.kind,
    category: input.category,
    subject: input.subject,
    message: input.message,
    stepsToReproduce: input.stepsToReproduce || null,
    expectedBehavior: input.expectedBehavior || null,
    actualBehavior: input.actualBehavior || null,
    severity: input.severity || null,
    contactEmail: input.contactEmail || null,
    includeDiagnostics: input.includeDiagnostics,
    diagnostics,
    appLanguage: input.appLanguage,
    user: input.user,
    status: 'new',
    createdAt,
    updatedAt: createdAt,
  });

  let supportEmailQueued = false;
  try {
    await queueSupportEmailNotification({
      ticketId: ticketRef.id,
      kind: input.kind,
      category: input.category,
      subject: input.subject,
      appLanguage: input.appLanguage,
      includeDiagnostics: input.includeDiagnostics,
      user: input.user,
      contactEmail: input.contactEmail,
    });
    supportEmailQueued = true;
  } catch (error) {
    console.error('[SupportTicketService] Failed to queue support email notification:', error);
  }

  return { ticketId: ticketRef.id, supportEmailQueued };
}
