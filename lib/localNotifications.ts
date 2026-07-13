/**
 * REBIID intentionally does not use remote push notifications.
 * All reminders are scheduled locally on the device.
 *
 * Import expo-notifications only through this module. The package barrel
 * (`expo-notifications`) loads DevicePushTokenAutoRegistration.fx, which
 * registers push tokens with Expo servers and fails in Expo Go.
 */

export {
  getPermissionsAsync,
  requestPermissionsAsync,
} from 'expo-notifications/build/NotificationPermissions';
export { default as setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';
export { default as scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
export { default as cancelScheduledNotificationAsync } from 'expo-notifications/build/cancelScheduledNotificationAsync';
export { default as cancelAllScheduledNotificationsAsync } from 'expo-notifications/build/cancelAllScheduledNotificationsAsync';
export { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
export { addNotificationResponseReceivedListener } from 'expo-notifications/build/NotificationsEmitter';
export { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types';
export { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
export type { NotificationContentInput } from 'expo-notifications/build/Notifications.types';
