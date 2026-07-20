import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useScreenLayout } from '@/hooks/useScreenLayout';
import { APP_META, getAppVersion } from '@/lib/appInfo';
import { openEmailAddress, openWebsiteUrl } from '@/lib/contactLinks';
import { AboutScreenCopy, REBIID } from '@/lib/rebiidCopy';
import { RtlLabelValueRow, RtlLabelValueRowCustom } from '@/src/components/RtlLabelValueRow';
import { LtrValueText, RtlText } from '@/src/components/rtl';
import { createAboutStyles, type AboutScreenStyles } from '@/src/theme/aboutScreenStyles';
import { useThemeStyles } from '@/src/theme/useTheme';

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
      <RtlText variant="heading" style={styles.legalTitle}>
        {title}
      </RtlText>
      <RtlText style={styles.legalBody}>{body}</RtlText>
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
            <RtlText style={styles.backButtonText}>{AboutScreenCopy.back}</RtlText>
          </Pressable>
          <RtlText variant="heading" style={styles.screenTitle}>
            {AboutScreenCopy.title}
          </RtlText>
        </View>

        <View style={styles.heroCard}>
          <Image
            source={require('@/assets/images/rebiid-logo.webp')}
            style={styles.logo}
            contentFit="contain"
            accessibilityLabel={REBIID.name}
          />
          <RtlText variant="heading" style={styles.appName}>
            {REBIID.name}
          </RtlText>
          <RtlText style={styles.tagline}>{REBIID.tagline}</RtlText>
          <LtrValueText align="end" style={styles.taglineEn}>
            {REBIID.taglineEn}
          </LtrValueText>
          <RtlText style={styles.description}>{AboutScreenCopy.description}</RtlText>
        </View>

        <View style={styles.card}>
          <RtlLabelValueRow
            bordered
            label={AboutScreenCopy.versionLabel}
            value={version}
            valueDirection="ltr"
          />
          <RtlLabelValueRow bordered label={AboutScreenCopy.developerLabel} value={APP_META.developer} />
          <RtlLabelValueRow bordered label={AboutScreenCopy.companyLabel} value={APP_META.company} />
          <RtlLabelValueRowCustom
            label={AboutScreenCopy.websiteLabel}
            value={
              <Pressable
                accessibilityRole="link"
                onPress={() => void openWebsiteUrl(APP_META.website)}
                style={styles.metaLinkPressable}>
                <LtrValueText style={styles.metaLink}>{APP_META.website}</LtrValueText>
              </Pressable>
            }
          />
          <RtlLabelValueRowCustom
            label={AboutScreenCopy.emailLabel}
            value={
              <Pressable
                accessibilityRole="link"
                onPress={() => void openEmailAddress(APP_META.email)}
                style={styles.metaLinkPressable}>
                <LtrValueText style={styles.metaLink}>{APP_META.email}</LtrValueText>
              </Pressable>
            }
          />
          <RtlLabelValueRow bordered label={AboutScreenCopy.licenseLabel} value={APP_META.license} />
          <View style={styles.metaRowStack}>
            <RtlText style={styles.metaLabel}>{AboutScreenCopy.copyrightLabel}</RtlText>
            <RtlText style={styles.metaValueStack}>{APP_META.copyright}</RtlText>
            <RtlText style={styles.metaValueStackMuted}>{APP_META.copyrightRights}</RtlText>
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
