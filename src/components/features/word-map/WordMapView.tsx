import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions, AccessibilityInfo } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { WordMapAccessibleList } from '@/components/features/word-map/WordMapAccessibleList';
import { useWordFamily } from '@/hooks/use-word-family';
import { hapticTapSuccess } from '@/services/haptics';
import { useAppStore } from '@/stores/app.store';
import { useAppTheme } from '@/theme/use-app-theme';
import { computeWordMapLayout, computeStaticCircularLayout } from '@/utils/word-map-layout';
import type { WordMapNode, WordMapLink, WordFamilyWithMembers } from '@/types/vocabulary';

// ─── Constants ──────────────────────────────────────────────
const NODE_RADIUS = 24;
const ROOT_NODE_RADIUS = 30;
const LABEL_FONT_SIZE = 11;
const MAX_NODES_MINI = 7;
const MAX_NODES_FULL_STANDARD = 30;
const MAX_NODES_FULL_BUDGET = 20;
const EDGE_OPACITY = '4D'; // ~30% hex

// ─── Types ──────────────────────────────────────────────────
interface WordMapViewProps {
  cardId: number;
  mode: 'mini' | 'full';
  maxNodes?: number;
}

// ─── Data Transformation ────────────────────────────────────
function transformToGraphData(
  data: WordFamilyWithMembers,
  maxNodes: number
): { nodes: WordMapNode[]; links: WordMapLink[] } {
  const rootNode: WordMapNode = {
    id: `root-${data.family.id}`,
    word: data.family.rootWord,
    type: 'root',
    cardId: null,
  };

  const limitedMembers = data.members.slice(0, maxNodes - 1);

  const memberNodes: WordMapNode[] = limitedMembers.map((m) => ({
    id: `member-${m.id}`,
    word: m.wordText,
    type: 'family' as const,
    cardId: m.cardId,
    partOfSpeech: m.partOfSpeech,
    formLabel: m.formLabel,
  }));

  const links: WordMapLink[] = limitedMembers.map((m) => ({
    source: rootNode.id,
    target: `member-${m.id}`,
    label: m.formLabel ?? m.partOfSpeech,
  }));

  return { nodes: [rootNode, ...memberNodes], links };
}

function getNodeColor(
  type: WordMapNode['type'],
  colors: { root: string; family: string; synonym: string; related: string }
): string {
  switch (type) {
    case 'root':
      return colors.root;
    case 'family':
      return colors.family;
    case 'synonym':
      return colors.synonym;
    case 'related':
      return colors.related;
    default:
      return colors.related;
  }
}

// ─── Main Component ─────────────────────────────────────────
export function WordMapView({ cardId, mode, maxNodes: maxNodesProp }: WordMapViewProps) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const deviceTier = useAppStore((s) => s.deviceTier);
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [tooltipNode, setTooltipNode] = useState<WordMapNode | null>(null);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup tooltip timer on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    };
  }, []);

  // Screen reader detection
  React.useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setScreenReaderEnabled);
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setScreenReaderEnabled
    );
    return () => subscription.remove();
  }, []);

  const { data: wordFamilyData, isLoading, isError } = useWordFamily(cardId);

  // Node limit
  const maxNodes =
    maxNodesProp ??
    (mode === 'mini'
      ? MAX_NODES_MINI
      : deviceTier === 'budget'
        ? MAX_NODES_FULL_BUDGET
        : MAX_NODES_FULL_STANDARD);

  // SVG dimensions
  const svgWidth = mode === 'mini' ? screenWidth - 40 : screenWidth;
  const svgHeight = mode === 'mini' ? 250 : 400;

  // Graph data + layout (budget devices use static circular layout — no d3-force physics)
  const { nodes, links } = useMemo(() => {
    if (!wordFamilyData) return { nodes: [], links: [] };
    const graphData = transformToGraphData(wordFamilyData, maxNodes);
    const layoutFn = deviceTier === 'budget' ? computeStaticCircularLayout : computeWordMapLayout;
    return layoutFn(graphData.nodes, graphData.links, svgWidth, svgHeight);
  }, [wordFamilyData, maxNodes, svgWidth, svgHeight, deviceTier]);

  // Node tap handler
  const handleNodeTap = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      setSelectedNodeId(nodeId);

      if (node.cardId) {
        hapticTapSuccess();
        router.push(`/(tabs)/learn/${node.cardId}`);
      } else {
        setTooltipNode(node);
        // Auto-dismiss tooltip after 3s (cleaned up on unmount via ref)
        if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
        tooltipTimerRef.current = setTimeout(() => setTooltipNode(null), 3000);
      }
    },
    [nodes]
  );

  // Gesture: tap with hit-testing (NOT SVG onPress — Expo SDK 54 bug)
  const tapGesture = useMemo(
    () =>
      Gesture.Tap().onEnd((event) => {
        'worklet';
        const { x, y } = event;
        const tappedNode = nodes.find(
          (node) =>
            Math.hypot((node.x ?? 0) - x, (node.y ?? 0) - y) <=
            (node.type === 'root' ? ROOT_NODE_RADIUS : NODE_RADIUS)
        );
        if (tappedNode) {
          runOnJS(handleNodeTap)(tappedNode.id);
        }
      }),
    [nodes, handleNodeTap]
  );

  // ─── Screen reader mode ─────────────────────────────────
  if (screenReaderEnabled && wordFamilyData) {
    return (
      <WordMapAccessibleList
        wordFamilyData={wordFamilyData}
        nodes={nodes}
        onNodeTap={handleNodeTap}
      />
    );
  }

  // ─── Loading state ───────────────────────────────────────
  if (isLoading) {
    return (
      <View testID="word-map-loading" style={styles.stateContainer}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>{t('wordMap.loading')}</Text>
      </View>
    );
  }

  // ─── Error state ─────────────────────────────────────────
  if (isError) {
    return (
      <View testID="word-map-error" style={styles.stateContainer}>
        <Text style={{ color: theme.colors.error }}>{t('wordMap.error')}</Text>
      </View>
    );
  }

  // ─── Empty state ─────────────────────────────────────────
  if (!wordFamilyData || nodes.length === 0) {
    return (
      <View testID="word-map-empty" style={styles.stateContainer}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>{t('wordMap.empty')}</Text>
      </View>
    );
  }

  // ─── SVG Render ──────────────────────────────────────────
  const rootWord = nodes.find((n) => n.type === 'root')?.word ?? '';

  return (
    <View testID="word-map-view">
      <GestureDetector gesture={tapGesture}>
        <View>
          <Svg
            width={svgWidth}
            height={svgHeight}
            accessibilityRole="image"
            accessibilityLabel={t('wordMap.a11y.summary', {
              word: rootWord,
              count: nodes.length - 1,
            })}>
            {/* Edges */}
            {links.map((link, i) => {
              const sourceNode = nodes.find((n) => n.id === link.source);
              const targetNode = nodes.find((n) => n.id === link.target);
              if (!sourceNode?.x || !targetNode?.x) return null;
              const color = getNodeColor(targetNode.type, theme.colors.wordMap) + EDGE_OPACITY;
              return (
                <Line
                  key={`edge-${i}`}
                  x1={sourceNode.x}
                  y1={sourceNode.y ?? 0}
                  x2={targetNode.x}
                  y2={targetNode.y ?? 0}
                  stroke={color}
                  strokeWidth={2}
                />
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const isRoot = node.type === 'root';
              const radius = isRoot ? ROOT_NODE_RADIUS : NODE_RADIUS;
              const color = getNodeColor(node.type, theme.colors.wordMap);
              const isSelected = selectedNodeId === node.id;

              return (
                <G
                  key={node.id}
                  accessible={true}
                  accessibilityLabel={
                    node.cardId
                      ? `${node.word}${node.partOfSpeech ? ', ' + node.partOfSpeech : ''}`
                      : t('wordMap.a11y.notInDictionary', {
                          word: node.word,
                          pos: node.partOfSpeech ?? '',
                        })
                  }>
                  <Circle
                    cx={node.x ?? 0}
                    cy={node.y ?? 0}
                    r={isSelected ? radius * 1.3 : radius}
                    fill={color}
                    opacity={isSelected ? 1 : 0.85}
                  />
                  <SvgText
                    x={node.x ?? 0}
                    y={(node.y ?? 0) + 1}
                    fontSize={isRoot ? LABEL_FONT_SIZE + 2 : LABEL_FONT_SIZE}
                    fontWeight={isRoot ? '700' : '500'}
                    fill={theme.colors.wordMap.nodeText}
                    textAnchor="middle"
                    alignmentBaseline="central">
                    {node.word.length > 8 ? node.word.slice(0, 7) + '…' : node.word}
                  </SvgText>
                </G>
              );
            })}
          </Svg>
        </View>
      </GestureDetector>

      {/* Tooltip for nodes without cardId */}
      {tooltipNode && (
        <View
          testID="word-map-tooltip"
          style={[styles.tooltip, { backgroundColor: theme.colors.surface }]}>
          <Text style={{ color: theme.colors.onSurface }}>
            {t('wordMap.nodeTooltip', {
              word: tooltipNode.word,
              pos: tooltipNode.partOfSpeech ?? '',
            })}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  stateContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  tooltip: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
});
