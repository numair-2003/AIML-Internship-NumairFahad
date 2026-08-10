import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { api } from '@/lib/api';

interface CardProps {
  front: string;
  back: string;
}

function FlipCard({ front, back }: CardProps) {
  const colors = useColors();
  const s = cardStyles(colors);

  const flip = useSharedValue(0);
  const [isBack, setIsBack] = useState(false);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateY: `${interpolate(flip.value, [0, 1], [0, 180])}deg` },
    ],
    opacity: flip.value < 0.5 ? 1 : 0,
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateY: `${interpolate(flip.value, [0, 1], [180, 360])}deg` },
    ],
    opacity: flip.value >= 0.5 ? 1 : 0,
  }));

  const handleFlip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    flip.value = withTiming(isBack ? 0 : 1, { duration: 350 });
    setIsBack((v) => !v);
  };

  return (
    <Pressable onPress={handleFlip} style={s.cardContainer}>
      {/* Front */}
      <Animated.View style={[s.card, s.cardFront, frontStyle]}>
        <Text style={s.cardLabel}>TERM</Text>
        <Text style={s.cardFrontText}>{front}</Text>
        <Text style={s.tapHint}>Tap to reveal</Text>
      </Animated.View>

      {/* Back */}
      <Animated.View style={[s.card, s.cardBack, backStyle]}>
        <Text style={s.cardLabel}>DEFINITION</Text>
        <Text style={s.cardBackText}>{back}</Text>
        <Text style={s.tapHint}>Tap to flip back</Text>
      </Animated.View>
    </Pressable>
  );
}

const cardStyles = (c: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    cardContainer: {
      height: 260,
      position: 'relative',
    },
    card: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: c.radius + 8,
      padding: 28,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    },
    cardFront: {
      backgroundColor: c.card,
    },
    cardBack: {
      backgroundColor: c.primary,
    },
    cardLabel: {
      position: 'absolute',
      top: 14,
      left: 18,
      fontSize: 10,
      fontFamily: 'Inter_600SemiBold',
      letterSpacing: 1.2,
      color: c.mutedForeground,
    },
    cardFrontText: {
      fontSize: 22,
      fontFamily: 'Inter_700Bold',
      color: c.foreground,
      textAlign: 'center',
      lineHeight: 30,
    },
    cardBackText: {
      fontSize: 16,
      fontFamily: 'Inter_400Regular',
      color: c.primaryForeground,
      textAlign: 'center',
      lineHeight: 24,
    },
    tapHint: {
      position: 'absolute',
      bottom: 14,
      fontSize: 11,
      fontFamily: 'Inter_400Regular',
      color: c.mutedForeground,
    },
  });

interface Props {
  videoId: string;
}

export default function FlashcardPanel({ videoId }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const s = makeStyles(colors, insets);

  const [cardIndex, setCardIndex] = useState(0);

  const { data: cards, isLoading, error, refetch } = useQuery({
    queryKey: ['flashcards', videoId],
    queryFn: () => api.getFlashcards(videoId),
  });

  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 16;

  if (isLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={s.loadingText}>Generating flashcards…</Text>
      </View>
    );
  }

  if (error || !cards || cards.length === 0) {
    return (
      <View style={s.center}>
        <Ionicons name="layers-outline" size={48} color={colors.border} />
        <Text style={s.emptyTitle}>No flashcards available</Text>
        <Text style={s.emptySubtitle}>
          {error instanceof Error
            ? error.message
            : 'Could not generate flashcards for this video.'}
        </Text>
        <Pressable style={s.retryBtn} onPress={() => refetch()}>
          <Text style={s.retryBtnText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const current = cards[cardIndex];

  const prev = () => {
    if (cardIndex <= 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCardIndex((i) => i - 1);
  };

  const next = () => {
    if (cardIndex >= cards.length - 1) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCardIndex((i) => i + 1);
  };

  return (
    <View style={[s.container, { paddingBottom: bottomPad }]}>
      {/* Counter */}
      <View style={s.counterRow}>
        <Text style={s.counter}>
          {cardIndex + 1} / {cards.length}
        </Text>
      </View>

      {/* Progress dots */}
      <View style={s.dotsRow}>
        {cards.map((_, i) => (
          <View
            key={i}
            style={[s.dot, i === cardIndex && s.dotActive]}
          />
        ))}
      </View>

      {/* Card */}
      <View style={s.cardWrapper}>
        <FlipCard key={current.id} front={current.front} back={current.back} />
      </View>

      {/* Navigation */}
      <View style={s.navRow}>
        <Pressable
          style={[s.navBtn, cardIndex === 0 && s.navBtnDisabled]}
          onPress={prev}
          disabled={cardIndex === 0}
        >
          <Ionicons name="chevron-back" size={22} color={cardIndex === 0 ? colors.border : colors.foreground} />
        </Pressable>

        <View style={s.navCenter}>
          <Ionicons name="hand-left-outline" size={14} color={colors.mutedForeground} />
          <Text style={s.navHint}>Tap card to flip</Text>
        </View>

        <Pressable
          style={[s.navBtn, cardIndex === cards.length - 1 && s.navBtnDisabled]}
          onPress={next}
          disabled={cardIndex === cards.length - 1}
        >
          <Ionicons name="chevron-forward" size={22} color={cardIndex === cards.length - 1 ? colors.border : colors.foreground} />
        </Pressable>
      </View>

      {/* Completion */}
      {cardIndex === cards.length - 1 && (
        <View style={s.completeBanner}>
          <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
          <Text style={s.completeText}>All cards reviewed!</Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setCardIndex(0);
            }}
          >
            <Text style={s.restartText}>Restart</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useColors>, insets: ReturnType<typeof useSafeAreaInsets>) {
  return StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: c.mutedForeground,
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
    counterRow: { alignItems: 'center', marginBottom: 8 },
    counter: {
      fontSize: 13,
      fontFamily: 'Inter_500Medium',
      color: c.mutedForeground,
    },
    dotsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 4,
      marginBottom: 20,
      flexWrap: 'wrap',
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: c.border,
    },
    dotActive: { backgroundColor: c.primary, width: 20 },
    cardWrapper: { marginBottom: 24 },
    navRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    navBtn: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    navBtnDisabled: { opacity: 0.4 },
    navCenter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    navHint: {
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
      color: c.mutedForeground,
    },
    completeBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: '#f0fdf4',
      borderRadius: c.radius,
      padding: 12,
      marginTop: 20,
    },
    completeText: {
      flex: 1,
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
      color: '#16a34a',
    },
    restartText: {
      fontSize: 13,
      fontFamily: 'Inter_600SemiBold',
      color: c.primary,
    },
  });
}
