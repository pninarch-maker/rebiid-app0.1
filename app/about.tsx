import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useScreenLayout } from '@/hooks/useScreenLayout';
import { APP_META, getAppVersion } from '@/lib/appInfo';
import { openEmailAddress, openWebsiteUrl } from '@/lib/contactLinks';
import { AboutScreenCopy, REBIID } from '@/lib/rebiidCopy';
import { createAboutStyles, type AboutScreenStyles } from '@/src/theme/aboutScreenStyles';
import { useThemeStyles } from '@/src/theme/useTheme';

function MetaRow({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: AboutScreenStyles;
}) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function MetaLinkRow({
  label,
  value,
  onPress,
  styles,
}: {
  label: string;
  value: string;
  onPress: () => void;
  styles: AboutScreenStyles;
}) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Pressable accessibilityRole="link" onPress={onPress} style={styles.metaLinkPressable}>
        <Text style={styles.metaLink}>{value}</Text>
      </Pressable>
    </View>
  );
}

function LegalSection({
  title,
  body,
  isLast = false,
  styles,
}: {
  title: string;
  body: string;
  isLast?: boolean;
  styles: AboutScreenStyles;
}) {
  return (
    <View style={[styles.legalSection, isLast && styles.legalSectionLast]}>
      <Text style={styles.legalTitle}>{title}</Text>
      <Text style={styles.legalBody}>{body}</Text>
    </View>
  );
}

export default function AboutScreen() {
  const { horizontalPadding } = useScreenLayout();
  const styles = useThemeStyles(createAboutStyles);
  const version = getAppVersion();

  return (
    <SafeAreaView style={styles.screenSafeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={AboutScreenCopy.back}
            onPress={() => router.back()}
            style={styles.backButton}>
            <Text style={styles.backButtonText}>{AboutScreenCopy.back}</Text>
          </Pressable>
          <Text style={styles.screenTitle}>{AboutScreenCopy.title}</Text>
        </View>

        <View style={styles.heroCard}>
          <Image
            source={require('@/assets/images/rebiid-logo.webp')}
            style={styles.logo}
            contentFit="contain"
            accessibilityLabel={REBIID.name}
          />
          <Text style={styles.appName}>{REBIID.name}</Text>
          <Text style={styles.tagline}>{REBIID.tagline}</Text>
          <Text style={styles.taglineEn}>{REBIID.taglineEn}</Text>
          <Text style={styles.description}>{AboutScreenCopy.description}</Text>
        </View>

        <View style={styles.card}>
          <MetaRow label={AboutScreenCopy.versionLabel} value={version} styles={styles} />
          <MetaRow label={AboutScreenCopy.developerLabel} value={APP_META.developer} styles={styles} />
          <MetaRow label={AboutScreenCopy.companyLabel} value={APP_META.company} styles={styles} />
          <MetaLinkRow
            label={AboutScreenCopy.websiteLabel}
            value={APP_META.website}
            onPress={() => void openWebsiteUrl(APP_META.website)}
            styles={styles}
          />
          <MetaLinkRow
            label={AboutScreenCopy.emailLabel}
            value={APP_META.email}
            onPress={() => void openEmailAddress(APP_META.email)}
            styles={styles}
          />
          <MetaRow label={AboutScreenCopy.licenseLabel} value={APP_META.license} styles={styles} />
          <View style={styles.metaRowStack}>
            <Text style={styles.metaLabel}>{AboutScreenCopy.copyrightLabel}</Text>
            <Text style={styles.metaValueStack}>{APP_META.copyright}</Text>
            <Text style={styles.metaValueStackMuted}>{APP_META.copyrightRights}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <LegalSection title={AboutScreenCopy.termsTitle} body={AboutScreenCopy.termsBody} styles={styles} />
          <LegalSection title={AboutScreenCopy.privacyTitle} body={AboutScreenCopy.privacyBody} styles={styles} />
          <LegalSection
            title={AboutScreenCopy.disclaimerTitle}
            body={AboutScreenCopy.disclaimerBody}
            isLast
            styles={styles}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
