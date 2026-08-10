import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Video } from '@/lib/api';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface Props {
  video: Video;
  onPress: () => void;
  onDelete: () => void;
}

export default function VideoCard({ video, onPress, onDelete }: Props) {
  const colors = useColors();
  const s = makeStyles(colors);

  const isProcessing = video.status === 'processing';
  const isError = video.status === 'failed';

  return (
    <Pressable
      style={({ pressed }) => [s.card, pressed && s.pressed]}
      onPress={onPress}
      disabled={isProcessing}
    >
      {/* Thumbnail */}
      <View style={s.thumbnailContainer}>
        {video.thumbnail_url ? (
          <Image source={{ uri: video.thumbnail_url }} style={s.thumbnail} resizeMode="cover" />
        ) : (
          <View style={s.thumbnailPlaceholder}>
            <Ionicons name="play-circle" size={36} color={colors.mutedForeground} />
          </View>
        )}
        {video.duration_seconds > 0 && !isProcessing && (
          <View style={s.durationBadge}>
            <Text style={s.durationText}>{formatDuration(video.duration_seconds)}</Text>
          </View>
        )}
        {isProcessing && (
          <View style={s.processingOverlay}>
            <Text style={s.processingText}>Processing...</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={s.info}>
        <Text style={s.title} numberOfLines={2}>
          {video.title || 'Loading...'}
        </Text>
        {video.channel_name ? (
          <Text style={s.channel} numberOfLines={1}>
            {video.channel_name}
          </Text>
        ) : null}

        <View style={s.footer}>
          {isError ? (
            <View style={s.statusBadge}>
              <Ionicons name="warning-outline" size={12} color={colors.destructive} />
              <Text style={[s.statusText, { color: colors.destructive }]}>Error</Text>
            </View>
          ) : isProcessing ? (
            <View style={s.statusBadge}>
              <Ionicons name="time-outline" size={12} color={colors.primary} />
              <Text style={[s.statusText, { color: colors.primary }]}>Indexing</Text>
            </View>
          ) : (
            <View style={s.statusBadge}>
              <Ionicons name="checkmark-circle-outline" size={12} color="#22c55e" />
              <Text style={[s.statusText, { color: '#22c55e' }]}>Ready</Text>
            </View>
          )}

          <Pressable onPress={onDelete} style={s.deleteBtn} hitSlop={8}>
            <Ionicons name="trash-outline" size={16} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

function makeStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: c.card,
      borderRadius: c.radius + 4,
      marginBottom: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.border,
    },
    pressed: { opacity: 0.85 },
    thumbnailContainer: {
      width: 120,
      height: 90,
      position: 'relative',
    },
    thumbnail: { width: 120, height: 90 },
    thumbnailPlaceholder: {
      width: 120,
      height: 90,
      backgroundColor: c.muted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    durationBadge: {
      position: 'absolute',
      bottom: 4,
      right: 4,
      backgroundColor: 'rgba(0,0,0,0.75)',
      borderRadius: 3,
      paddingHorizontal: 4,
      paddingVertical: 1,
    },
    durationText: {
      fontSize: 11,
      fontFamily: 'Inter_600SemiBold',
      color: '#fff',
    },
    processingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.55)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    processingText: {
      fontSize: 11,
      fontFamily: 'Inter_600SemiBold',
      color: '#fff',
    },
    info: { flex: 1, padding: 10, justifyContent: 'space-between' },
    title: {
      fontSize: 13,
      fontFamily: 'Inter_600SemiBold',
      color: c.foreground,
      lineHeight: 18,
      marginBottom: 4,
    },
    channel: {
      fontSize: 11,
      fontFamily: 'Inter_400Regular',
      color: c.mutedForeground,
      marginBottom: 6,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statusText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
    deleteBtn: { padding: 2 },
  });
}
