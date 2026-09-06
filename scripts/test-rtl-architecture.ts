/**
 * RTL architecture regression checks (source + calendar mapping; no RN runtime).
 * Run: npm run test:rtl
 */
import fs from 'node:fs';
import path from 'node:path';

import {
  CALENDAR_ENGINE_WEEKDAY_HEADERS,
  getVisualWeekdayHeadersLeftToRight,
  mapEngineWeekToVisualOrder,
} from '../lib/calendarWeekLayout';

function assert(label: string, condition: boolean): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function read(rel: string): string {
  return fs.readFileSync(path.resolve(rel), 'utf8');
}

const rtlArch = read('lib/rtlArchitecture.ts');
const layout = read('constants/layout.ts');
const rootLayout = read('app/_layout.tsx');
const bottomNav = read('src/components/navigation/BottomNavigation.tsx');
const zmanimList = read('src/components/ZmanimRowList.tsx');
const hero = read('src/components/home/HebrewDateHero.tsx');
const physicalRow = read('src/components/rtl/PhysicalRow.tsx');
const rtlText = read('src/components/rtl/RtlText.tsx');

assert(
  'RTL_HEADING_TEXT uses textAlign right + writingDirection rtl + width 100%',
  /export const RTL_HEADING_TEXT[\s\S]*?textAlign:\s*'right'/.test(rtlArch) &&
    /export const RTL_BLOCK_TEXT[\s\S]*?writingDirection:\s*'rtl'/.test(rtlArch) &&
    /export const RTL_BLOCK_TEXT[\s\S]*?width:\s*'100%'/.test(rtlArch),
);

assert(
  'RTL_BLOCK_CONTAINER includes physicalStyleDirection (direction ltr on native)',
  rtlArch.includes('...physicalStyleDirection') &&
    rtlArch.includes("default: { direction: 'ltr' }"),
);

assert(
  'LTR_VALUE_TEXT is physical-left LTR',
  /export const LTR_VALUE_TEXT[\s\S]*?textAlign:\s*'left'/.test(rtlArch) &&
    /export const LTR_VALUE_TEXT[\s\S]*?writingDirection:\s*'ltr'/.test(rtlArch),
);

assert(
  'LTR_VALUE_TEXT_END is physical-right LTR',
  /export const LTR_VALUE_TEXT_END[\s\S]*?textAlign:\s*'right'/.test(rtlArch) &&
    /export const LTR_VALUE_TEXT_END[\s\S]*?writingDirection:\s*'ltr'/.test(rtlArch),
);

assert(
  'mergeRtlHeadingTextStyle applies RTL_HEADING_TEXT last',
  rtlArch.includes('...RTL_HEADING_TEXT'),
);

assert(
  'TAB_ROUTE_PHYSICAL_LTR_ORDER is settings|reminders|calendar|index',
  /TAB_ROUTE_PHYSICAL_LTR_ORDER\s*=\s*\[[\s\S]*?'settings'[\s\S]*?'reminders'[\s\S]*?'calendar'[\s\S]*?'index'/.test(
    rtlArch,
  ),
);

assert(
  'BottomNavigation uses TAB_ROUTE_PHYSICAL_LTR_ORDER',
  bottomNav.includes('TAB_ROUTE_PHYSICAL_LTR_ORDER'),
);

assert(
  'Calendar visual headers: ש … א left-to-right',
  getVisualWeekdayHeadersLeftToRight().join('|') === 'ש|ו|ה|ד|ג|ב|א',
);

assert(
  'Calendar mapEngineWeekToVisualOrder matches headers',
  mapEngineWeekToVisualOrder([...CALENDAR_ENGINE_WEEKDAY_HEADERS]).join('|') === 'ש|ו|ה|ד|ג|ב|א',
);

assert(
  'No runtime I18nManager.forceRTL() in app/_layout.tsx',
  !rootLayout.includes('forceRTL') && !rootLayout.includes('I18nManager'),
);

assert(
  'physicalHebrewRow no longer uses row-reverse',
  !layout.includes("flexDirection: 'row-reverse'"),
);

assert(
  'physicalLtrRow documents first-child = physical left',
  layout.includes("first child = physical left") ||
    physicalRow.includes('first child = physical left'),
);

assert(
  'ZmanimRowList renders time before label (physical left → right)',
  zmanimList.indexOf('<LtrValueText') < zmanimList.indexOf('<RtlText inRow'),
);

assert(
  'HebrewDateHero uses RtlText headings + LtrValueText align=end for Gregorian',
  hero.includes('RtlText variant="heading"') && hero.includes('align="end"'),
);

assert(
  'RtlText documents physical LTR ancestor requirement',
  rtlText.includes('physical LTR') || rtlText.includes('physicalStyleDirection'),
);

assert(
  'No forceRTL calls anywhere under app/ or src/',
  !read('app/_layout.tsx').includes('forceRTL') &&
    !fs
      .readdirSync(path.resolve('src'), { recursive: true })
      .map(String)
      .filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'))
      .some((f) => read(path.join('src', f)).includes('I18nManager.forceRTL')),
);

// --- Settings About card (focused layout regression) ---
const settingsScreen = read('app/(tabs)/settings.tsx');
const settingsStyles = read('src/theme/settingsScreenStyles.ts');
const aboutCardBlock = settingsStyles.match(/aboutCard:\s*\{[^}]*\}/)?.[0] ?? '';
const aboutLogoBlock = settingsStyles.match(/aboutLogo:\s*\{[^}]*\}/)?.[0] ?? '';
const aboutLogoWrapBlock = settingsStyles.match(/aboutLogoWrap:\s*\{[^}]*\}/)?.[0] ?? '';

assert(
  'Settings About card uses content-driven aboutCard style (not flex:1 Pressable card)',
  settingsScreen.includes('styles.aboutCard') &&
    aboutCardBlock.includes('flexGrow: 0') &&
    !aboutCardBlock.includes('flex: 1') &&
    !aboutCardBlock.includes("height: '100%'") &&
    !/minHeight:\s*\d{3,}/.test(aboutCardBlock),
);

assert(
  'Settings About logo is centered with fixed size, not absolute',
  aboutLogoBlock.includes('width: 96') &&
    aboutLogoWrapBlock.includes("alignItems: 'center'") &&
    !aboutLogoBlock.includes("position: 'absolute'") &&
    !aboutLogoWrapBlock.includes("position: 'absolute'"),
);

assert(
  'Settings About renders version, developer, and legal link rows',
  settingsScreen.includes('getAppVersion()') &&
    settingsScreen.includes('AboutScreenCopy.versionLabel') &&
    settingsScreen.includes('AboutScreenCopy.developerLabel') &&
    settingsScreen.includes('AboutScreenCopy.termsTitle') &&
    settingsScreen.includes('AboutScreenCopy.privacyTitle') &&
    settingsScreen.includes('AboutScreenCopy.disclaimerTitle') &&
    settingsScreen.includes("router.push('/about')"),
);

assert(
  'Settings About legal rows use RtlText inRow + physicalLtrRow chevron-first order',
  settingsScreen.includes('<RtlText inRow style={styles.aboutNavLabel}>') &&
    settingsStyles.includes('aboutNavRow:') &&
    settingsStyles.includes('...physicalLtrRow') &&
    settingsScreen.indexOf('styles.aboutNavChevron') <
      settingsScreen.indexOf('styles.aboutNavLabelWrap'),
);

assert(
  'Broken aboutLink* styles removed (no full-width RtlText chevron regression)',
  !settingsStyles.includes('aboutLinkLogo') &&
    !settingsStyles.includes('aboutLinkChevron') &&
    !settingsScreen.includes('styles.aboutLinkRow'),
);

console.log('All RTL architecture checks passed.');
