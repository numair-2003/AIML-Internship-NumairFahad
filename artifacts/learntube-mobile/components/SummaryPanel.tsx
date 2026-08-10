import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Pressable,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { api } from '@/lib/api';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface Props {
  videoId: string;
}

export default function SummaryPanel({ videoId }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const s = makeStyles(colors, insets);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['summary', videoId],
    queryFn: () => api.getSummary(videoId),
  });

  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 16;

  if (isLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={s.loadingText}>Generating summary…</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={s.center}>
        <Ionicons name="document-text-outline" size={48} color={colors.border} />
        <Text style={s.emptyTitle}>Summary not yet available</Text>
        <Text style={s.emptySubtitle}>
          {error instanceof Error ? error.message : 'The summary is still being generated.'}
        </Text>
        <Pressable style={s.retryBtn} onPress={() => refetch()}>
          <Text style={s.retryBtnText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={[s.content, { paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Overview */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Ionicons name="document-text-outline" size={18} color={colors.primary} />
          <Text style={s.sectionTitle}>Overview</Text>
        </View>
        <Text style={s.overviewText}>{data.overview}</Text>
      </View>

      {/* Key Points */}
      {data.key_points && data.key_points.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Ionicons name="bulb-outline" size={18} color={colors.primary} />
            <Text style={s.sectionTitle}>Key Points</Text>
          </View>
          {data.key_points.map((point, i) => (
            <View key={i} style={s.keyPointRow}>
              <View style={s.keyPointBullet} />
              <Text style={s.keyPointText}>{point}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Chapters */}
      {data.chapters && data.chapters.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Ionicons name="list-outline" size={18} color={colors.primary} />
            <Text style={s.sectionTitle}>Chapters</Text>
          </View>
          {data.chapters.map((chapter, i) => (
            <View key={i} style={s.chapterRow}>
              <View style={s.chapterTimestamp}>
                <Text style={s.chapterTime}>{formatTime(chapter.start_time)}</Text>
              </View>
              <View style={s.chapterContent}>
                <Text style={s.chapterTitle}>{chapter.title}</Text>
                {chapter.summary ? (
                  <Text style={s.chapterSummary}>{chapter.summary}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function makeStyles(c: ReturnType<typeof useColors>, insets: ReturnType<typeof useSafeAreaInsets>) {
  return StyleSheet.create({
    scroll: { flex: 1 },
    content: { padding: 16 },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      paddingTop: 40,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: c.mutedForeground,
    },
    emptyTitle: {
      fontSize: 16,
      fontFamily: 'Inter_600SemiBold',
      color: c.foreground,
      marginTop: 16,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 13,
      fontFamily: 'Inter_400Regular',
      color: c.mutedForeground,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 20,
    },
    retryBtn: {
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: c.radius,
      backgroundColor: c.primary,
    },
    retryBtnText: {
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
      color: c.primaryForeground,
    },
    section: {
      backgroundColor: c.card,
      borderRadius: c.radius + 4,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 15,
      fontFamily: 'Inter_600SemiBold',
      color: c.foreground,
    },
    overviewText: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: c.foreground,
      lineHeight: 22,
    },
    keyPointRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      marginBottom: 10,
    },
    keyPointBullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: c.primary,
      marginTop: 8,
      flexShrink: 0,
    },
    keyPointText: {
      flex: 1,
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: c.foreground,
      lineHeight: 21,
    },
    chapterRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 14,
    },
    chapterTimestamp: {
      backgroundColor: c.accent,
      borderRadius: c.radius,
      paddingHorizontal: 8,
      paddingVertical: 3,
      alignSelf: 'flex-start',
      flexShrink: 0,
    },
    chapterTime: {
      fontSize: 12,
      fontFamily: 'Inter_600SemiBold',
      color: c.primary,
    },
    chapterContent: { flex: 1 },
    chapterTitle: {
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
      color: c.foreground,
      marginBottom: 3,
    },
    chapterSummary: {
      fontSize: 13,
      fontFamily: 'Inter_400Regular',
      color: c.mutedForeground,
      lineHeight: 19,
    },
  });
}
