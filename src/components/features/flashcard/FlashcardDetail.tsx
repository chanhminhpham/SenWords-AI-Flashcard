// FlashcardDetail — 4-layer depth exploration tabbed view (Story 2.2)
// This is the SHELL component. Stories 2.3-2.7 populate tab content.
import { useMemo, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from 'react-native-paper';
import { TabView, TabBar, type TabBarProps } from 'react-native-tab-view';
import { useQuery } from '@tanstack/react-query';

import { useTranslation } from 'react-i18next';

import { KnowledgeDot } from '@/components/ui/KnowledgeDot';
import { fetchCardById, fetchScheduleByCardId } from '@/services/vocabulary/vocabulary.service';
import { useAppStore } from '@/stores/app.store';
import { useAuthStore } from '@/stores/auth.store';
import { useAppTheme } from '@/theme/use-app-theme';

// ─── Constants ──────────────────────────────────────────────
const CEFR_LABELS: Record<number, string> = {
  1: 'A1',
  2: 'A2',
  3: 'B1',
  4: 'B2',
  5: 'C1',
  6: 'C2',
};

const TAB_GRADIENT_OPACITY = '15'; // hex suffix ~8% opacity
const TABLET_BREAKPOINT_PX = 768;

// ─── Types ──────────────────────────────────────────────────
interface FlashcardDetailProps {
  cardId: number;
}

type TabRoute = {
  key: string;
  title: string;
};

// ─── Main Component ─────────────────────────────────────────
export function FlashcardDetail({ cardId }: FlashcardDetailProps) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const deviceTier = useAppStore((s) => s.deviceTier);
  const currentUser = useAuthStore((s) => s.user);

  const [tabIndex, setTabIndex] = useState(0);

  // ─── Data fetching (TanStack Query — per-tab pattern) ───
  const { data: card, isLoading: cardLoading } = useQuery({
    queryKey: ['card', cardId],
    queryFn: () => fetchCardById(cardId),
    staleTime: 1000 * 60 * 5,
  });

  const { data: schedule } = useQuery({
    queryKey: ['sr-schedule', cardId, currentUser?.id],
    queryFn: () => fetchScheduleByCardId(cardId, currentUser?.id ?? ''),
    enabled: !!currentUser?.id,
    staleTime: 1000 * 60 * 5,
  });

  const depthLevel = schedule?.depthLevel ?? 1;

  // ─── Tab routes ─────────────────────────────────────────
  const routes = useMemo<TabRoute[]>(
    () => [
      { key: 'recognition', title: t('detail.tab.recognition') },
      { key: 'association', title: t('detail.tab.association') },
      { key: 'production', title: t('detail.tab.production') },
      { key: 'application', title: t('detail.tab.application') },
    ],
    [t]
  );

  const depthColors = useMemo(
    () => [
      theme.colors.depth.layer1,
      theme.colors.depth.layer2,
      theme.colors.depth.layer3,
      theme.colors.depth.layer4,
    ],
    [theme.colors.depth]
  );

  const isWideLayout = width >= TABLET_BREAKPOINT_PX;

  // ─── Tab Bar ────────────────────────────────────────────
  const renderTabBar = (props: TabBarProps<TabRoute>) => (
    <TabBar
      {...props}
      testID="tab-bar"
      indicatorStyle={{ backgroundColor: depthColors[tabIndex] }}
      activeColor={depthColors[tabIndex]}
      inactiveColor={theme.colors.onSurfaceVariant}
      style={{ backgroundColor: theme.colors.surface }}
    />
  );

  // ─── Scene renderer ─────────────────────────────────────
  const renderScene = ({ route }: { route: TabRoute }) => {
    switch (route.key) {
      case 'recognition':
        return (
          <RecognitionTab
            card={card ?? null}
            depthLevel={depthLevel}
            isLoading={cardLoading}
            deviceTier={deviceTier}
          />
        );
      case 'association':
      case 'production':
      case 'application':
        return <PlaceholderTab tabKey={route.key} deviceTier={deviceTier} />;
      default:
        return null;
    }
  };

  const renderLazyPlaceholder = () => (
    <View
      testID="tab-lazy-placeholder"
      style={[styles.lazyPlaceholder, { backgroundColor: theme.colors.surface }]}
    />
  );

  // ─── Card Header ────────────────────────────────────────
  const cardHeader = (
    <View
      testID="card-header"
      accessible={true}
      accessibilityLabel={`${t('detail.header')}: ${card?.word ?? ''}. ${t('detail.depth', { level: depthLevel })}`}
      style={[styles.header, { backgroundColor: theme.colors.background }]}>
      {cardLoading ? (
        <View style={styles.headerSkeleton}>
          <View
            style={[styles.skeletonLine, { width: 120, backgroundColor: theme.colors.surface }]}
          />
          <View
            style={[styles.skeletonLine, { width: 80, backgroundColor: theme.colors.surface }]}
          />
        </View>
      ) : (
        <>
          <Text style={[styles.headerWord, { color: theme.colors.onSurface }]}>
            {card?.word ?? ''}
          </Text>
          {card?.ipa && (
            <Text style={[styles.headerIpa, { color: theme.colors.nature.accent }]}>
              {card.ipa}
            </Text>
          )}
          <View style={styles.headerDot}>
            <KnowledgeDot depthLevel={depthLevel} size={10} />
            <Text style={[styles.headerDepthText, { color: theme.colors.onSurfaceVariant }]}>
              {t('detail.depth', { level: depthLevel })}
            </Text>
          </View>
        </>
      )}
    </View>
  );

  // ─── Tab content ────────────────────────────────────────
  const tabContent = (
    <TabView
      testID="tab-view"
      navigationState={{ index: tabIndex, routes }}
      renderScene={renderScene}
      renderTabBar={renderTabBar}
      onIndexChange={setTabIndex}
      lazy={true}
      renderLazyPlaceholder={renderLazyPlaceholder}
      initialLayout={{ width }}
    />
  );

  // ─── Tablet split layout ────────────────────────────────
  if (isWideLayout) {
    return (
      <View testID="flashcard-detail" style={styles.splitContainer}>
        <View style={styles.splitLeft}>{cardHeader}</View>
        <View style={styles.splitRight}>{tabContent}</View>
      </View>
    );
  }

  // ─── Phone layout ──────────────────────────────────────
  return (
    <View
      testID="flashcard-detail"
      style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {cardHeader}
      {tabContent}
    </View>
  );
}

// ─── RecognitionTab (Tab 1) ─────────────────────────────────
interface RecognitionTabProps {
  card: {
    word: string;
    definition: string;
    partOfSpeech: string;
    ipa: string | null;
    exampleSentence: string | null;
    difficultyLevel: number;
    topicTags: string[] | null;
    imageUrl: string | null;
  } | null;
  depthLevel: number;
  isLoading: boolean;
  deviceTier: string;
}

function RecognitionTab({ card, depthLevel, isLoading, deviceTier }: RecognitionTabProps) {
  const theme = useAppTheme();
  const { t } = useTranslation();

  const gradientColors: [string, string] =
    deviceTier === 'budget'
      ? [theme.colors.surface, theme.colors.surface]
      : [theme.colors.surface, theme.colors.depth.layer1 + TAB_GRADIENT_OPACITY];

  if (isLoading) {
    return (
      <View testID="recognition-tab-loading" style={styles.tabContent}>
        <View style={[styles.skeletonBlock, { backgroundColor: theme.colors.surface }]} />
        <View
          style={[styles.skeletonBlock, { width: '60%', backgroundColor: theme.colors.surface }]}
        />
      </View>
    );
  }

  if (!card) return null;

  const cefrLabel = CEFR_LABELS[card.difficultyLevel] ?? '';
  const topicTags = card.topicTags ?? [];

  return (
    <LinearGradient colors={gradientColors} style={styles.tabContent} testID="recognition-tab">
      {/* Word */}
      <View accessible={true} accessibilityLabel={`${card.word}, ${card.partOfSpeech}`}>
        <Text style={[styles.recWord, { color: theme.colors.onSurface }]}>{card.word}</Text>
        {card.partOfSpeech && (
          <View style={[styles.posBadge, { backgroundColor: theme.colors.nature.tint }]}>
            <Text style={[styles.posBadgeText, { color: theme.colors.nature.accent }]}>
              {card.partOfSpeech}
            </Text>
          </View>
        )}
      </View>

      {/* Definition */}
      <View accessible={true} accessibilityLabel={card.definition}>
        <Text style={[styles.recDefinition, { color: theme.colors.onSurface }]}>
          {card.definition}
        </Text>
      </View>

      {/* Example sentence */}
      {card.exampleSentence && (
        <View accessible={true} accessibilityLabel={card.exampleSentence}>
          <Text style={[styles.recExample, { color: theme.colors.onSurfaceVariant }]}>
            {card.exampleSentence}
          </Text>
        </View>
      )}

      {/* IPA */}
      {card.ipa && (
        <View accessible={true} accessibilityLabel={`IPA: ${card.ipa}`}>
          <Text style={[styles.recIpa, { color: theme.colors.nature.accent }]}>{card.ipa}</Text>
        </View>
      )}

      {/* Difficulty + Topics */}
      <View
        accessible={true}
        accessibilityLabel={`${cefrLabel}${topicTags.length > 0 ? ', ' + topicTags.join(', ') : ''}`}
        style={styles.tagRow}>
        {cefrLabel !== '' && (
          <View style={[styles.cefrBadge, { backgroundColor: theme.colors.sky.blue + '20' }]}>
            <Text style={[styles.cefrText, { color: theme.colors.sky.text }]}>{cefrLabel}</Text>
          </View>
        )}
        {topicTags.map((tag) => (
          <View key={tag} style={[styles.topicChip, { backgroundColor: theme.colors.nature.tint }]}>
            <Text style={[styles.topicChipText, { color: theme.colors.nature.accent }]}>{tag}</Text>
          </View>
        ))}
      </View>

      {/* Depth progress bar */}
      <View
        accessible={true}
        accessibilityLabel={t('detail.depthProgress', { current: depthLevel })}
        style={styles.depthProgressRow}>
        {[1, 2, 3, 4].map((level) => (
          <View
            key={level}
            testID={`depth-segment-${level}`}
            style={[
              styles.depthSegment,
              {
                backgroundColor:
                  level <= depthLevel
                    ? theme.colors.depth[`layer${level}` as keyof typeof theme.colors.depth]
                    : theme.colors.surface,
                borderColor:
                  theme.colors.depth[`layer${level}` as keyof typeof theme.colors.depth] + '40',
              },
            ]}
          />
        ))}
      </View>

      {/* Image placeholder */}
      <View style={[styles.placeholder, { borderColor: theme.colors.surface }]}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>{t('detail.imagePlaceholder')}</Text>
      </View>

      {/* Audio placeholder */}
      <View style={[styles.placeholder, { borderColor: theme.colors.surface }]}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>{t('detail.audioPlaceholder')}</Text>
      </View>
    </LinearGradient>
  );
}

// ─── PlaceholderTab (Tabs 2-4) ──────────────────────────────
interface PlaceholderTabProps {
  tabKey: string;
  deviceTier: string;
}

function PlaceholderTab({ tabKey, deviceTier }: PlaceholderTabProps) {
  const theme = useAppTheme();
  const { t } = useTranslation();

  const colorMap: Record<string, string> = {
    association: theme.colors.depth.layer2,
    production: theme.colors.depth.layer3,
    application: theme.colors.depth.layer4,
  };

  const gradientColors: [string, string] =
    deviceTier === 'budget'
      ? [theme.colors.surface, theme.colors.surface]
      : [theme.colors.surface, (colorMap[tabKey] ?? theme.colors.surface) + TAB_GRADIENT_OPACITY];

  return (
    <LinearGradient
      colors={gradientColors}
      style={styles.placeholderContainer}
      testID={`placeholder-tab-${tabKey}`}>
      <Text style={[styles.placeholderText, { color: theme.colors.onSurfaceVariant }]}>
        {t('detail.empty')}
      </Text>
    </LinearGradient>
  );
}

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  splitContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  splitLeft: {
    flex: 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  splitRight: {
    flex: 0.6,
  },
  // Header
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  headerWord: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerIpa: {
    fontSize: 14,
    marginBottom: 4,
  },
  headerDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  headerDepthText: {
    fontSize: 12,
  },
  headerSkeleton: {
    alignItems: 'center',
    gap: 8,
  },
  skeletonLine: {
    height: 16,
    borderRadius: 4,
  },
  // Tab
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'none',
  },
  tabContent: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  lazyPlaceholder: {
    flex: 1,
  },
  // Recognition tab
  recWord: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  posBadge: {
    alignSelf: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  posBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recDefinition: {
    fontSize: 18,
    lineHeight: 26,
  },
  recExample: {
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  recIpa: {
    fontSize: 16,
    textAlign: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cefrBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  cefrText: {
    fontSize: 12,
    fontWeight: '700',
  },
  topicChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  topicChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  depthProgressRow: {
    flexDirection: 'row',
    gap: 4,
    marginVertical: 8,
  },
  depthSegment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
  },
  placeholder: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  // Placeholder tab
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 16,
  },
  skeletonBlock: {
    height: 20,
    width: '80%',
    borderRadius: 4,
  },
});
