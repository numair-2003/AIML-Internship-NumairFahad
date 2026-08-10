import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { api } from '@/lib/api';
import ChatPanel from '@/components/ChatPanel';
import SummaryPanel from '@/components/SummaryPanel';
import QuizPanel from '@/components/QuizPanel';
import FlashcardPanel from '@/components/FlashcardPanel';

type Tab = 'chat' | 'summary' | 'quiz' | 'flashcards';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'chat', label: 'Chat', icon: 'chatbubble-ellipses-outline' },
  { id: 'summary', label: 'Summary', icon: 'document-text-outline' },
  { id: 'quiz', label: 'Quiz', icon: 'help-circle-outline' },
  { id: 'flashcards', label: 'Flashcards', icon: 'layers-outline' },
];

export default function VideoWorkspaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('chat');

  const { data: video, isLoading, error } = useQuery({
    queryKey: ['video', id],
    queryFn: () => api.getVideo(id!),
    enabled: !!id,
    refetchInterval: (query) =>
      query.state.data?.status === 'processing' ? 4000 : false,
  });

  const s = makeStyles(colors, insets);
  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[s.container, { paddingTop: topPad }]}>
        <View style={s.navBar}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </Pressable>
        </View>
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !video) {
    return (
      <View style={[s.container, { paddingTop: topPad }]}>
        <View style={s.navBar}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </Pressable>
        </View>
        <View style={s.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.destructive} />
          <Text style={s.errorText}>
            {error instanceof Error ? error.message : 'Video not found'}
          </Text>
          <Pressable onPress={() => router.back()} style={s.retryBtn}>
            <Text style={s.retryBtnText}>Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Processing ─────────────────────────────────────────────────────────────
  const isProcessing = video.status === 'processing';

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      {/* Navigation bar */}
      <View style={s.navBar}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={s.navTitle} numberOfLines={1}>
          {video.title || 'Video'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Video meta card */}
      <View style={s.metaCard}>
        {video.thumbnail_url ? (
          <Image source={{ uri: video.thumbnail_url }} style={s.thumbnail} resizeMode="cover" />
        ) : (
          <View style={s.thumbnailPlaceholder}>
            <Ionicons name="play-circle" size={28} color={colors.mutedForeground} />
          </View>
        )}
        <View style={s.metaInfo}>
          <Text style={s.metaTitle} numberOfLines={2}>
            {video.title}
          </Text>
          <Text style={s.metaChannel} numberOfLines={1}>
            {video.channel_name}
          </Text>
          {isProcessing && (
            <View style={s.processingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={s.processingText}>Indexing video…</Text>
            </View>
          )}
        </View>
      </View>

      {/* Tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.tabScroll}
        contentContainerStyle={s.tabContainer}
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              style={[s.tab, active && s.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={active ? colors.primary : colors.mutedForeground}
              />
              <Text style={[s.tabLabel, active && s.tabLabelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Tab indicator line */}
      <View style={s.tabDivider} />

      {/* Panel */}
      <View style={s.panel}>
        {isProcessing ? (
          <View style={s.center}>
            <Ionicons name="time-outline" size={48} color={colors.border} />
            <Text style={s.emptyTitle}>Video is being indexed</Text>
            <Text style={s.emptySubtitle}>
              This usually takes 30–60 seconds. Come back shortly.
            </Text>
          </View>
        ) : (
          <>
            {activeTab === 'chat' && <ChatPanel videoId={id!} />}
            {activeTab === 'summary' && <SummaryPanel videoId={id!} />}
            {activeTab === 'quiz' && <QuizPanel videoId={id!} />}
            {activeTab === 'flashcards' && <FlashcardPanel videoId={id!} />}
          </>
        )}
      </View>
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useColors>, insets: ReturnType<typeof useSafeAreaInsets>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    navBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 8,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    navTitle: {
      flex: 1,
      fontSize: 16,
      fontFamily: 'Inter_600SemiBold',
      color: c.foreground,
      textAlign: 'center',
    },
    metaCard: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginBottom: 12,
      backgroundColor: c.card,
      borderRadius: c.radius + 4,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.border,
    },
    thumbnail: { width: 110, height: 80 },
    thumbnailPlaceholder: {
      width: 110,
      height: 80,
      backgroundColor: c.muted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    metaInfo: { flex: 1, padding: 10, justifyContent: 'center' },
    metaTitle: {
      fontSize: 13,
      fontFamily: 'Inter_600SemiBold',
      color: c.foreground,
      lineHeight: 18,
      marginBottom: 4,
    },
    metaChannel: {
      fontSize: 11,
      fontFamily: 'Inter_400Regular',
      color: c.mutedForeground,
    },
    processingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 6,
    },
    processingText: {
      fontSize: 11,
      fontFamily: 'Inter_500Medium',
      color: c.primary,
    },
    tabScroll: { flexShrink: 0 },
    tabContainer: { paddingHorizontal: 16, gap: 4 },
    tab: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
    },
    tabActive: { backgroundColor: c.accent },
    tabLabel: {
      fontSize: 13,
      fontFamily: 'Inter_500Medium',
      color: c.mutedForeground,
    },
    tabLabelActive: {
      color: c.primary,
      fontFamily: 'Inter_600SemiBold',
    },
    tabDivider: { height: 1, backgroundColor: c.border, marginTop: 6 },
    panel: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    errorText: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: c.mutedForeground,
      textAlign: 'center',
      marginTop: 12,
      marginBottom: 20,
    },
    retryBtn: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: c.radius,
      backgroundColor: c.primary,
    },
    retryBtnText: {
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
      color: c.primaryForeground,
    },
    emptyTitle: {
      fontSize: 17,
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
    },
  });
}
