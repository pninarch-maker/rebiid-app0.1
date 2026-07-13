import Constants from 'expo-constants';

export const APP_META = {
  developer: 'אלי וידר',
  company: 'Deep Media',
  website: 'https://deep-media.co.il/',
  email: 'eli@deep-media.com',
  license: 'חינם לשימוש.',
  copyright: '© 2026 Deep Media – Eli Vider',
  copyrightRights: 'All Rights Reserved.',
} as const;

export function getAppVersion(): string {
  return Constants.expoConfig?.version ?? '1.0.0';
}
