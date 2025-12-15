import { ComponentProps } from 'react';
import Icon from '@react-native-vector-icons/material-design-icons';

export type IconName = ComponentProps<typeof Icon>['name'];

export type SupportTopicKey =
  | 'gettingStarted'
  | 'exams'
  | 'accountIssues'
  | 'billingPayments'
  | 'feedback'
  | 'reportBug';

export type SupportTopic = {
  key: SupportTopicKey;
  labelKey: string;
  descriptionKey: string;
  defaultLabel: string;
  defaultDescription: string;
  icon: IconName;
  section: 'faq' | 'resource';
  keywords: string[];
};

export const supportTopics: SupportTopic[] = [
  {
    key: 'gettingStarted',
    labelKey: 'account.help.gettingStarted',
    descriptionKey: 'account.help.gettingStartedDescription',
    defaultLabel: 'Getting Started',
    defaultDescription: 'Set up your account, adjust study settings, and learn how to navigate the app.',
    icon: 'rocket-launch',
    section: 'faq',
    keywords: ['start', 'onboarding', 'setup', 'navigation', 'first steps', 'basics'],
  },
  {
    key: 'exams',
    labelKey: 'account.help.exams',
    descriptionKey: 'account.help.examsDescription',
    defaultLabel: 'Exams',
    defaultDescription: 'See how practice exams work, how scoring is calculated, and how to restart attempts.',
    icon: 'file-document-outline',
    section: 'faq',
    keywords: ['exam', 'test', 'questions', 'booking', 'score', 'pass mark', '75%', '18', 'results'],
  },
  {
    key: 'accountIssues',
    labelKey: 'account.help.accountIssues',
    descriptionKey: 'account.help.accountIssuesDescription',
    defaultLabel: 'Account Issues',
    defaultDescription: 'Reset your password, update your email, and resolve sign-in problems.',
    icon: 'account-circle',
    section: 'faq',
    keywords: ['login', 'password', 'sign in', 'reset', 'email', 'auth'],
  },
  {
    key: 'billingPayments',
    labelKey: 'account.help.billingPayments',
    descriptionKey: 'account.help.billingPaymentsDescription',
    defaultLabel: 'Billing & Subscriptions',
    defaultDescription: 'Manage subscriptions, receipts, and in-app purchase questions.',
    icon: 'credit-card-outline',
    section: 'faq',
    keywords: ['billing', 'payment', 'subscription', 'refund', 'purchase'],
  },
  {
    key: 'feedback',
    labelKey: 'account.help.giveFeedback',
    descriptionKey: 'account.help.giveFeedbackDescription',
    defaultLabel: 'Give Feedback',
    defaultDescription: 'Share feature requests or ideas to improve the app.',
    icon: 'message-alert-outline',
    section: 'resource',
    keywords: ['feedback', 'idea', 'feature', 'request', 'suggestion'],
  },
  {
    key: 'reportBug',
    labelKey: 'account.help.reportBug',
    descriptionKey: 'account.help.reportBugDescription',
    defaultLabel: 'Report a Bug',
    defaultDescription: 'Tell us about issues or crashes so we can fix them quickly.',
    icon: 'bug-outline',
    section: 'resource',
    keywords: ['bug', 'issue', 'crash', 'error', 'problem'],
  },
];
