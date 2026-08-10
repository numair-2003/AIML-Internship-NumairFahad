import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { api, ChatMessage } from '@/lib/api';

interface Props {
  videoId: string;
}

function CitationChip({ citation }: { citation: { start_time?: number; text?: string } }) {
  const colors = useColors();
  const s = chipStyles(colors);
  if (citation.start_time == null) return null;
  const mins = Math.floor(citation.start_time / 60);
  const secs = Math.floor(citation.start_time % 60);
  return (
    <View style={s.chip}>
      <Ionicons name="time-outline" size={10} color={colors.primary} />
      <Text style={s.chipText}>
        {mins}:{secs.toString().padStart(2, '0')}
      </Text>
    </View>
  );
}

const chipStyles = (c: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: c.accent,
      borderRadius: 10,
      paddingHorizontal: 7,
      paddingVertical: 2,
    },
    chipText: {
      fontSize: 10,
      fontFamily: 'Inter_500Medium',
      color: c.primary,
    },
  });

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const colors = useColors();
  const isUser = msg.role === 'user';
  const s = makeStyles(colors, { bottom: 0 } as any);

  return (
    <View style={[s.bubbleRow, isUser && s.bubbleRowUser]}>
      {!isUser && (
        <View style={s.avatar}>
          <Ionicons name="play" size={12} color="#fff" />
        </View>
      )}
      <View style={[s.bubble, isUser ? s.bubbleUser : s.bubbleAI]}>
        <Text style={[s.bubbleText, isUser && s.bubbleTextUser]}>
          {msg.content}
        </Text>
        {!isUser && msg.citations && msg.citations.length > 0 && (
          <View style={s.citationsRow}>
            {msg.citations.slice(0, 5).map((c, i) => (
              <CitationChip key={i} citation={c} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function TypingIndicator() {
  const colors = useColors();
  const s = makeStyles(colors, { bottom: 0 } as any);
  return (
    <View style={s.bubbleRow}>
      <View style={s.avatar}>
        <Ionicons name="play" size={12} color="#fff" />
      </View>
      <View style={s.bubbleAI}>
        <ActivityIndicator size="small" color={colors.mutedForeground} />
      </View>
    </View>
  );
}

export default function ChatPanel({ videoId }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const s = makeStyles(colors, insets);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState('');

  // Load chat history on mount
  useEffect(() => {
    api
      .getChatHistory(videoId)
      .then((history) => setMessages(history))
      .catch(() => {/* silently ignore */})
      .finally(() => setLoadingHistory(false));
  }, [videoId]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput('');
    setSending(true);
    setError('');

    // Optimistic user message
    const tempId = Date.now().toString() + Math.random().toString(36).slice(2);
    const userMsg: ChatMessage = {
      id: tempId,
      role: 'user',
      content: text,
      citations: [],
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await api.chat(videoId, text);
      const aiMsg: ChatMessage = {
        id: tempId + '_ai',
        role: 'assistant',
        content: res.answer,
        citations: res.citations ?? [],
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      // Remove the optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  }, [input, sending, videoId]);

  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  if (loadingHistory) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      {/* Messages — inverted so newest is at bottom */}
      <FlatList
        data={[...messages].reverse()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble msg={item} />}
        inverted
        contentContainerStyle={{ paddingTop: 12, paddingHorizontal: 14 }}
        ListHeaderComponent={sending ? <TypingIndicator /> : null}
        ListFooterComponent={
          messages.length === 0 ? (
            <View style={s.emptyState}>
              <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.border} />
              <Text style={s.emptyTitle}>Ask anything about this video</Text>
              <Text style={s.emptySub}>
                I can answer questions, explain concepts, and cite specific moments.
              </Text>
            </View>
          ) : null
        }
        scrollEnabled={!!messages.length}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      />

      {/* Error */}
      {error ? (
        <View style={s.errorBanner}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Input bar */}
      <View style={[s.inputBar, { paddingBottom: bottomPad + 8 }]}>
        <TextInput
          style={s.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about this video…"
          placeholderTextColor={colors.mutedForeground}
          multiline
          maxLength={500}
          returnKeyType="send"
          blurOnSubmit
          onSubmitEditing={sendMessage}
        />
        <Pressable
          style={[s.sendBtn, (!input.trim() || sending) && s.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!input.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={18} color="#fff" />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(c: ReturnType<typeof useColors>, insets: { bottom: number }) {
  return StyleSheet.create({
    flex: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    bubbleRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
      marginBottom: 12,
    },
    bubbleRowUser: { flexDirection: 'row-reverse' },
    avatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    bubble: {
      maxWidth: '78%',
      borderRadius: 18,
      padding: 12,
    },
    bubbleUser: {
      backgroundColor: c.primary,
      borderBottomRightRadius: 4,
    },
    bubbleAI: {
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      borderBottomLeftRadius: 4,
    },
    bubbleText: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: c.foreground,
      lineHeight: 20,
    },
    bubbleTextUser: { color: c.primaryForeground },
    citationsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginTop: 8,
    },
    emptyState: {
      alignItems: 'center',
      paddingHorizontal: 32,
      paddingTop: 60,
    },
    emptyTitle: {
      fontSize: 16,
      fontFamily: 'Inter_600SemiBold',
      color: c.foreground,
      marginTop: 16,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySub: {
      fontSize: 13,
      fontFamily: 'Inter_400Regular',
      color: c.mutedForeground,
      textAlign: 'center',
      lineHeight: 20,
    },
    errorBanner: {
      marginHorizontal: 14,
      marginBottom: 4,
      backgroundColor: c.destructive + '22',
      borderRadius: c.radius,
      padding: 10,
    },
    errorText: {
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
      color: c.destructive,
    },
    inputBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 10,
      paddingHorizontal: 14,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: c.border,
      backgroundColor: c.background,
    },
    input: {
      flex: 1,
      minHeight: 42,
      maxHeight: 120,
      borderRadius: 21,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: c.foreground,
    },
    sendBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    sendBtnDisabled: { opacity: 0.4 },
  });
}
