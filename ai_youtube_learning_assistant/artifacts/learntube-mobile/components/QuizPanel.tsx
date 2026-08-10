import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { api } from '@/lib/api';

interface Props {
  videoId: string;
}

export default function QuizPanel({ videoId }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const s = makeStyles(colors, insets);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const { data: questions, isLoading, error, refetch } = useQuery({
    queryKey: ['quiz', videoId],
    queryFn: () => api.getQuiz(videoId),
  });

  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 16;

  if (isLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={s.loadingText}>Generating quiz…</Text>
      </View>
    );
  }

  if (error || !questions) {
    return (
      <View style={s.center}>
        <Ionicons name="help-circle-outline" size={48} color={colors.border} />
        <Text style={s.emptyTitle}>Quiz not available</Text>
        <Text style={s.emptySubtitle}>
          {error instanceof Error ? error.message : 'The quiz could not be loaded.'}
        </Text>
        <Pressable style={s.btn} onPress={() => refetch()}>
          <Text style={s.btnText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={s.center}>
        <Ionicons name="help-circle-outline" size={48} color={colors.border} />
        <Text style={s.emptyTitle}>No quiz questions</Text>
        <Text style={s.emptySubtitle}>Couldn't generate quiz questions for this video.</Text>
      </View>
    );
  }

  // ── Finished screen ──────────────────────────────────────────────────────
  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    const passed = pct >= 70;
    return (
      <View style={[s.center, { paddingBottom: bottomPad }]}>
        <Ionicons
          name={passed ? 'trophy-outline' : 'refresh-circle-outline'}
          size={64}
          color={passed ? '#f59e0b' : colors.mutedForeground}
        />
        <Text style={s.scoreTitle}>{pct}%</Text>
        <Text style={s.scoreLabel}>
          {score} / {questions.length} correct
        </Text>
        <Text style={s.scoreMsg}>
          {passed ? 'Great job! You know this material well.' : 'Keep studying — you\'ll get it!'}
        </Text>
        <Pressable
          style={[s.btn, { marginTop: 24 }]}
          onPress={() => {
            setCurrentIndex(0);
            setSelectedAnswer(null);
            setScore(0);
            setFinished(false);
          }}
        >
          <Ionicons name="refresh" size={16} color={colors.primaryForeground} />
          <Text style={s.btnText}>Retake Quiz</Text>
        </Pressable>
      </View>
    );
  }

  // ── Question screen ───────────────────────────────────────────────────────
  const q = questions[currentIndex];
  const isAnswered = selectedAnswer !== null;
  const isCorrect = selectedAnswer === q.answer;

  const handleSelect = (i: number) => {
    if (isAnswered) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAnswer(i);
    if (i === q.answer) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (currentIndex + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
    }
  };

  const getOptionStyle = (i: number) => {
    if (!isAnswered) return s.option;
    if (i === q.answer) return [s.option, s.optionCorrect];
    if (i === selectedAnswer) return [s.option, s.optionWrong];
    return [s.option, s.optionDim];
  };

  const getOptionTextStyle = (i: number) => {
    if (!isAnswered) return s.optionText;
    if (i === q.answer) return [s.optionText, { color: '#16a34a' }];
    if (i === selectedAnswer) return [s.optionText, { color: colors.destructive }];
    return [s.optionText, { color: colors.mutedForeground }];
  };

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={[s.content, { paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Progress */}
      <View style={s.progressRow}>
        <Text style={s.progressText}>
          Question {currentIndex + 1} of {questions.length}
        </Text>
        <View style={s.progressBar}>
          <View
            style={[
              s.progressFill,
              { width: `${((currentIndex + 1) / questions.length) * 100}%` as any },
            ]}
          />
        </View>
      </View>

      {/* Score badge */}
      <View style={s.scoreBadge}>
        <Ionicons name="star" size={12} color="#f59e0b" />
        <Text style={s.scoreBadgeText}>{score} pts</Text>
      </View>

      {/* Question */}
      <View style={s.questionCard}>
        <Text style={s.questionText}>{q.question}</Text>
      </View>

      {/* Options */}
      <View style={s.optionsContainer}>
        {q.options.map((opt, i) => (
          <Pressable
            key={i}
            style={({ pressed }) => [...(getOptionStyle(i) as any[]), pressed && !isAnswered && s.optionPressed]}
            onPress={() => handleSelect(i)}
          >
            <View style={s.optionLetter}>
              <Text style={s.optionLetterText}>
                {String.fromCharCode(65 + i)}
              </Text>
            </View>
            <Text style={getOptionTextStyle(i) as any}>{opt}</Text>
            {isAnswered && i === q.answer && (
              <Ionicons name="checkmark-circle" size={18} color="#16a34a" style={s.optionIcon} />
            )}
            {isAnswered && i === selectedAnswer && i !== q.answer && (
              <Ionicons name="close-circle" size={18} color={colors.destructive} style={s.optionIcon} />
            )}
          </Pressable>
        ))}
      </View>

      {/* Explanation */}
      {isAnswered && q.explanation && (
        <View style={s.explanation}>
          <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
          <Text style={s.explanationText}>{q.explanation}</Text>
        </View>
      )}

      {/* Result banner */}
      {isAnswered && (
        <View style={[s.resultBanner, isCorrect ? s.resultCorrect : s.resultWrong]}>
          <Ionicons
            name={isCorrect ? 'checkmark-circle' : 'close-circle'}
            size={20}
            color={isCorrect ? '#16a34a' : colors.destructive}
          />
          <Text style={[s.resultText, { color: isCorrect ? '#16a34a' : colors.destructive }]}>
            {isCorrect ? 'Correct!' : 'Incorrect'}
          </Text>
        </View>
      )}

      {/* Next button */}
      {isAnswered && (
        <Pressable
          style={({ pressed }) => [s.btn, pressed && s.pressed]}
          onPress={handleNext}
        >
          <Text style={s.btnText}>
            {currentIndex + 1 >= questions.length ? 'See Results' : 'Next Question'}
          </Text>
          <Ionicons name="arrow-forward" size={16} color={colors.primaryForeground} />
        </Pressable>
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
    progressRow: { marginBottom: 8 },
    progressText: {
      fontSize: 12,
      fontFamily: 'Inter_500Medium',
      color: c.mutedForeground,
      marginBottom: 6,
    },
    progressBar: {
      height: 4,
      backgroundColor: c.muted,
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressFill: {
      height: 4,
      backgroundColor: c.primary,
      borderRadius: 2,
    },
    scoreBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      alignSelf: 'flex-end',
      backgroundColor: c.accent,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
      marginBottom: 12,
    },
    scoreBadgeText: {
      fontSize: 12,
      fontFamily: 'Inter_600SemiBold',
      color: c.primary,
    },
    questionCard: {
      backgroundColor: c.card,
      borderRadius: c.radius + 4,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: c.border,
    },
    questionText: {
      fontSize: 16,
      fontFamily: 'Inter_600SemiBold',
      color: c.foreground,
      lineHeight: 24,
    },
    optionsContainer: { gap: 10, marginBottom: 16 },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: c.card,
      borderRadius: c.radius + 2,
      borderWidth: 1,
      borderColor: c.border,
      padding: 14,
    },
    optionCorrect: {
      backgroundColor: '#f0fdf4',
      borderColor: '#86efac',
    },
    optionWrong: {
      backgroundColor: '#fef2f2',
      borderColor: '#fca5a5',
    },
    optionDim: { opacity: 0.5 },
    optionPressed: { opacity: 0.85 },
    optionLetter: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: c.muted,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    optionLetterText: {
      fontSize: 13,
      fontFamily: 'Inter_600SemiBold',
      color: c.foreground,
    },
    optionText: {
      flex: 1,
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: c.foreground,
      lineHeight: 20,
    },
    optionIcon: { flexShrink: 0 },
    explanation: {
      flexDirection: 'row',
      gap: 8,
      backgroundColor: c.accent,
      borderRadius: c.radius,
      padding: 12,
      marginBottom: 12,
      alignItems: 'flex-start',
    },
    explanationText: {
      flex: 1,
      fontSize: 13,
      fontFamily: 'Inter_400Regular',
      color: c.accentForeground,
      lineHeight: 19,
    },
    resultBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderRadius: c.radius,
      padding: 12,
      marginBottom: 16,
    },
    resultCorrect: { backgroundColor: '#f0fdf4' },
    resultWrong: { backgroundColor: '#fef2f2' },
    resultText: {
      fontSize: 15,
      fontFamily: 'Inter_600SemiBold',
    },
    btn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 50,
      borderRadius: c.radius,
      backgroundColor: c.primary,
    },
    btnText: {
      fontSize: 15,
      fontFamily: 'Inter_600SemiBold',
      color: c.primaryForeground,
    },
    pressed: { opacity: 0.85 },
    scoreTitle: {
      fontSize: 64,
      fontFamily: 'Inter_700Bold',
      color: c.foreground,
      marginTop: 16,
    },
    scoreLabel: {
      fontSize: 16,
      fontFamily: 'Inter_500Medium',
      color: c.mutedForeground,
      marginBottom: 8,
    },
    scoreMsg: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: c.mutedForeground,
      textAlign: 'center',
    },
  });
}
