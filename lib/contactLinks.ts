import { Linking } from 'react-native';

export interface OpenEmailOptions {
  subject?: string;
}

export async function openEmailAddress(
  email: string,
  options: OpenEmailOptions = {},
): Promise<boolean> {
  const params = new URLSearchParams();
  if (options.subject?.trim()) {
    params.set('subject', options.subject.trim());
  }

  const query = params.toString();
  const url = query.length > 0 ? `mailto:${email}?${query}` : `mailto:${email}`;

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      return false;
    }
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

export async function openWebsiteUrl(url: string): Promise<boolean> {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      return false;
    }
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
