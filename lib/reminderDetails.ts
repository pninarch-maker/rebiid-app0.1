import type { AppReminder } from '@/src/engine/reminders/types';
import { CATEGORY_LABELS } from '@/src/engine/reminders/types';
import type { UpcomingReminder } from '@/src/engine/types';

import { currentAppSettings } from './appState';
import {
  getNotificationTriggerDate,
  getRelatedZmanLabel,
} from './reminderTiming';
import { getZmanimDisplayTitle } from './zmanimDisplay';
import type { AppSettings } from './settingsTypes';

export interface ReminderDetailsData {
  id: string;
  title: string;
  message: string;
  hebrewDate: string;
  gregorianDate: string;
  dayOfWeek: string;
  categoryLabel: string;
  sourceLabel: string;
  severityLabel: string;
  notificationTime?: string;
  relatedZman?: string;
  zmanimCityLabel?: string;
}

function formatNotificationTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function severityLabel(severity: AppReminder['severity']): string {
  return severity === 'important' ? 'חשוב' : 'מידע';
}

function sourceLabel(source: AppReminder['source']): string {
  return source === 'personal' ? 'אישי' : 'מובנה';
}

export function buildReminderDetails(
  reminder: AppReminder,
  dateObj: Date,
  settings: AppSettings = currentAppSettings,
): ReminderDetailsData {
  const upcoming: UpcomingReminder = { ...reminder, dateObj };
  const triggerDate = getNotificationTriggerDate(upcoming, settings);
  const relatedZman = getRelatedZmanLabel(upcoming);
  const zmanimCityLabel = relatedZman ? getZmanimDisplayTitle(settings.city) : undefined;

  return {
    id: reminder.id,
    title: reminder.title,
    message: reminder.message,
    hebrewDate: reminder.hebrewDate,
    gregorianDate: reminder.gregorianDate,
    dayOfWeek: reminder.dayOfWeek,
    categoryLabel: CATEGORY_LABELS[reminder.category],
    sourceLabel: sourceLabel(reminder.source),
    severityLabel: severityLabel(reminder.severity),
    notificationTime: triggerDate ? formatNotificationTime(triggerDate) : undefined,
    relatedZman,
    zmanimCityLabel,
  };
}

export function buildReminderDetailsFromUpcoming(
  reminder: UpcomingReminder,
  settings: AppSettings = currentAppSettings,
): ReminderDetailsData {
  return buildReminderDetails(reminder, reminder.dateObj, settings);
}
