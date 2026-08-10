import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useClerk, useUser } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { api, libraryApi, ApiError, Video, LibraryVideo } from '@/lib/api';
import { getVideoIds, addVideoId, removeVideoId, clearVideoIds } from '@/lib/videoStorage';
import VideoCard from '@/components/VideoCard';

/**
 * Unified entry shown in the library list.
 * Ready videos come from the server (/api/library);
 * processing/failed videos are fetched individually via their IDs kept in
 * AsyncStorage until they either become ready (and appear server-side) or fail.
 */
type LibraryEntry =
  | { kind: 'ready'; video: LibraryVideo }
  | { kind: 'inprogress'; video: Video };

export default function LibraryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const userId = user?.id ?? '';

  // IDs in AsyncStorage represent recently-added videos still in processing/failed state.
  // Keys are scoped by userId so IDs never bleed across accounts on shared devices.
  // We remove an ID once the library endpoint confirms it is ready server-side,
  // or if the server returns 404/403 for it.
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [url, setUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  // Load stored IDs on mount (scoped to this user)
  useEffect(() => {
    if (!userId) return;
    getVideoIds(userId).then(setPendingIds);
  }, [userId]);

  // ── Server library (ready videos, authenticated) ──────────────────────────
  const {
    data: libraryVideos,
    isLoading: libraryLoading,
    refetch: refetchLibrary,
  } = useQuery({
    queryKey: ['library'],
    queryFn: () => libraryApi.getLibrary(),
    staleTime: 10_000,
  });

  // Once server-side videos appear in the library, remove their IDs from AsyncStorage.
  useEffect(() => {
    if (!libraryVideos || !userId) return;
    const readyIds = new Set(libraryVideos.map((v) => v.id));
    const stillPending = pendingIds.filter((id) => !readyIds.has(id));
    if (stillPending.length !== pendingIds.length) {
      const removed = pendingIds.filter((id) => readyIds.has(id));
      removed.forEach((id) => removeVideoId(userId, id));
      setPendingIds(stillPending);
    }
  }, [libraryVideos, pendingIds, userId]);

  // ── In-progress / failed videos (polled individually) ────────────────────
  const {
    data: pendingVideos,
    isLoading: pendingLoading,
  } = useQuery({
    queryKey: ['pending-videos', pendingIds, userId],
    queryFn: async () => {
      if (pendingIds.length === 0 || !userId) return [] as Video[];
      const results = await Promise.allSettled(pendingIds.map((id) => api.getVideo(id)));
      const toRemove: string[] = [];
      const videos: Video[] = [];
      results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          videos.push(result.value);
        } else {
          // Only remove the ID if the server confirmed it doesn't exist for this user
          // (404 Not Found or 403 Forbidden). Preserve IDs on network/transient errors
          // so in-progress work isn't discarded by a temporary connectivity hiccup.
          const err = result.reason;
          const isOwnershipError =
            err instanceof ApiError && (err.status === 404 || err.status === 403);
          if (isOwnershipError) {
            toRemove.push(pendingIds[i]);
          }
        }
      });
      if (toRemove.length > 0) {
        await Promise.all(toRemove.map((id) => removeVideoId(userId, id)));
        setPendingIds((prev) => prev.filter((id) => !toRemove.includes(id)));
      }
      return videos;
    },
    enabled: pendingIds.length > 0 && !!userId,
    refetchInterval: (query) => {
      const anyProcessing = query.state.data?.some((v) => v.status === 'processing');
      return anyProcessing ? 5000 : false;
    },
  });

  // ── Merged list ───────────────────────────────────────────────────────────
  const entries: LibraryEntry[] = [
    ...(pendingVideos ?? [])
      .filter((v) => v.status !== 'ready')
      .map<LibraryEntry>((v) => ({ kind: 'inprogress', video: v })),
    ...(libraryVideos ?? []).map<LibraryEntry>((v) => ({ kind: 'ready', video: v })),
  ];

  const isLoading = libraryLoading || (pendingIds.length > 0 && pendingLoading);

  // ── Actions ───────────────────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['library'] }),
      queryClient.invalidateQueries({ queryKey: ['pending-videos'] }),
    ]);
  }, [queryClient]);

  const handleAddVideo = async () => {
    if (!url.trim() || adding) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAdding(true);
    setAddError('');
    try {
      const result = await api.processVideo(url.trim());
      await addVideoId(userId, result.video_id);
      setPendingIds((prev) => [result.video_id, ...prev.filter((id) => id !== result.video_id)]);
      setModalVisible(false);
      setUrl('');
      router.push(`/video/${result.video_id}`);
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Failed to add video');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = useCallback(
    (id: string, isReady: boolean) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const doDelete = async () => {
        // Always call the backend first (it handles both ready and processing/failed
        // entries via the UserVideo ownership record). Only update local state on success.
        try {
          await libraryApi.deleteVideo(id);
        } catch (err) {
          // If the server says 404 the video isn't in this user's library — treat as
          // already gone and proceed with local cleanup.  Any other error surfaces to
          // the user so the item isn't silently lost from the list.
          if (!(err instanceof ApiError && err.status === 404)) {
            Alert.alert('Remove failed', err instanceof Error ? err.message : 'Could not remove video');
            return;
          }
        }
        // Reach here only on success or 404 (already removed server-side)
        removeVideoId(userId, id);
        setPendingIds((prev) => prev.filter((v) => v !== id));
        if (isReady) {
          queryClient.setQueryData<LibraryVideo[]>(['library'], (old) =>
            old ? old.filter((v) => v.id !== id) : old,
          );
        }
      };
      if (Platform.OS === 'web') {
        void doDelete();
      } else {
        Alert.alert('Remove Video', 'Remove this video from your library?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: () => void doDelete() },
        ]);
      }
    },
    [queryClient],
  );

  const handleSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Clear React Query cache so the next user starts fresh
    queryClient.clear();
    signOut();
  };

  const s = makeStyles(colors, insets);
  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);

  // Build a stub Video object from a LibraryVideo for VideoCard compatibility
  const toStubVideo = (lv: LibraryVideo): Video => ({
    id: lv.id,
    url: '',
    title: lv.title ?? '',
    channel_name: lv.channel_name ?? '',
    thumbnail_url: lv.thumbnail_url ?? '',
    duration_seconds: 0,
    status: 'ready',
    error_message: null,
    created_at: lv.created_at,
  });

  return (
    <View style={[s.container, { paddingTop: topPadding }]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.logoIcon}>
            <Ionicons name="play" size={18} color="#fff" />
          </View>
          <Text style={s.logoText}>
            Learn<Text style={s.logoBlue}>Tube</Text>
          </Text>
        </View>
        <Pressable onPress={handleSignOut} style={s.avatarBtn}>
          <Ionicons name="person-circle-outline" size={30} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <Text style={s.pageTitle}>My Videos</Text>
      {user?.primaryEmailAddress?.emailAddress && (
        <Text style={s.pageSubtitle}>{user.primaryEmailAddress.emailAddress}</Text>
      )}

      {isLoading && entries.length === 0 ? (
        <View style={s.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.video.id}
          contentContainerStyle={[
            s.listContent,
            { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 100 },
          ]}
          renderItem={({ item }) => {
            const video =
              item.kind === 'ready' ? toStubVideo(item.video as LibraryVideo) : (item.video as Video);
            return (
              <VideoCard
                video={video}
                onPress={() => {
                  if (video.status === 'failed') return;
                  router.push(`/video/${video.id}`);
                }}
                onDelete={() => handleDelete(video.id, item.kind === 'ready')}
              />
            );
          }}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={s.emptyState}>
                <Ionicons name="play-circle-outline" size={64} color={colors.border} />
                <Text style={s.emptyTitle}>No videos yet</Text>
                <Text style={s.emptySubtitle}>
                  Tap the + button to add your first YouTube video
                </Text>
              </View>
            ) : null
          }
        />
      )}

      {/* FAB */}
      <Pressable
        style={({ pressed }) => [
          s.fab,
          { bottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 20 },
          pressed && s.fabPressed,
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setModalVisible(true);
        }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      {/* Add Video Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={s.modalBackdrop} onPress={() => setModalVisible(false)}>
          <Pressable
            style={[s.modalContent, { paddingBottom: insets.bottom + 16 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Add YouTube Video</Text>
            <Text style={s.modalSubtitle}>Paste a YouTube URL to start learning from it</Text>
            <TextInput
              style={[s.modalInput, adding && s.disabledInput]}
              value={url}
              onChangeText={(t) => { setUrl(t); setAddError(''); }}
              placeholder="https://youtube.com/watch?v=..."
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              autoFocus
              editable={!adding}
            />
            {addError ? <Text style={s.errorText}>{addError}</Text> : null}
            <Pressable
              style={({ pressed }) => [
                s.modalBtn,
                (!url.trim() || adding) && s.modalBtnDisabled,
                pressed && s.pressed,
              ]}
              onPress={handleAddVideo}
              disabled={!url.trim() || adding}
            >
              {adding ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.modalBtnText}>Add Video</Text>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useColors>, insets: ReturnType<typeof useSafeAreaInsets>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    logoIcon: {
      width: 32,
      height: 32,
      borderRadius: 9,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoText: { fontSize: 18, fontFamily: 'Inter_700Bold', color: c.foreground },
    logoBlue: { color: c.primary },
    avatarBtn: { padding: 4 },
    pageTitle: {
      fontSize: 26,
      fontFamily: 'Inter_700Bold',
      color: c.foreground,
      paddingHorizontal: 20,
      marginTop: 8,
      marginBottom: 4,
    },
    pageSubtitle: {
      fontSize: 13,
      fontFamily: 'Inter_400Regular',
      color: c.mutedForeground,
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    listContent: { paddingHorizontal: 16, paddingTop: 4 },
    centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 },
    emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
    emptyTitle: {
      fontSize: 18,
      fontFamily: 'Inter_600SemiBold',
      color: c.foreground,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: c.mutedForeground,
      textAlign: 'center',
      lineHeight: 20,
    },
    fab: {
      position: 'absolute',
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
    fabPressed: { transform: [{ scale: 0.94 }] },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: c.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
    },
    modalHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border,
      alignSelf: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontFamily: 'Inter_700Bold',
      color: c.foreground,
      marginBottom: 6,
    },
    modalSubtitle: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: c.mutedForeground,
      marginBottom: 20,
    },
    modalInput: {
      height: 50,
      borderRadius: c.radius,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      paddingHorizontal: 14,
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: c.foreground,
      marginBottom: 8,
    },
    disabledInput: { opacity: 0.6 },
    errorText: {
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
      color: c.destructive,
      marginBottom: 8,
    },
    modalBtn: {
      height: 50,
      borderRadius: c.radius,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    modalBtnDisabled: { opacity: 0.5 },
    modalBtnText: {
      fontSize: 16,
      fontFamily: 'Inter_600SemiBold',
      color: c.primaryForeground,
    },
    pressed: { opacity: 0.8 },
  });
}
