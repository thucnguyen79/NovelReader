import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Typography, Spacing, BorderRadius } from '../../src/theme/typography';
import {
  getBook,
  getChapters,
  getReadingProgress,
  getSetting,
  updateChapterTranslation,
  swapChapterOrder,
} from '../../src/database/database';
import { Book, Chapter, ReadingProgress } from '../../src/database/types';
import { translateChapter } from '../../src/services/geminiService';

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [translatingId, setTranslatingId] = useState<number | null>(null);
  const [translationProgress, setTranslationProgress] = useState('');

  const loadData = useCallback(async () => {
    if (!id) return;
    const bookId = parseInt(id);
    const [b, ch, p] = await Promise.all([
      getBook(bookId),
      getChapters(bookId),
      getReadingProgress(bookId),
    ]);
    setBook(b);
    setChapters(ch);
    setProgress(p);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleTranslateChapter = async (chapter: Chapter) => {
    const apiKey = await getSetting('geminiApiKey');
    if (!apiKey) {
      Alert.alert(
        'Chưa có API Key',
        'Vui lòng nhập Google Gemini API key trong Cài Đặt',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Đi tới Cài Đặt', onPress: () => router.push('/(tabs)/settings') },
        ]
      );
      return;
    }

    setTranslatingId(chapter.id);
    setTranslationProgress('Đang dịch...');

    try {
      const translated = await translateChapter(
        chapter.originalContent,
        apiKey,
        (current, total) => {
          setTranslationProgress(`Đang dịch phần ${current}/${total}...`);
        }
      );

      await updateChapterTranslation(chapter.id, translated);
      await loadData();
      Alert.alert('Thành công', `Đã dịch xong "${chapter.title}"`);
    } catch (error: any) {
      Alert.alert('Lỗi dịch', error.message || 'Có lỗi xảy ra khi dịch');
    } finally {
      setTranslatingId(null);
      setTranslationProgress('');
    }
  };

  const handleTranslateAll = () => {
    const untranslated = chapters.filter((ch) => !ch.isTranslated);
    if (untranslated.length === 0) {
      Alert.alert('Thông báo', 'Tất cả chương đã được dịch');
      return;
    }

    Alert.alert(
      'Dịch tất cả',
      `Bạn muốn dịch ${untranslated.length} chương chưa dịch?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Dịch',
          onPress: async () => {
            for (const chapter of untranslated) {
              await handleTranslateChapter(chapter);
            }
          },
        },
      ]
    );
  };

  const handleMoveChapter = async (chapterIdx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? chapterIdx - 1 : chapterIdx + 1;
    if (targetIdx < 0 || targetIdx >= chapters.length || !book) return;
    await swapChapterOrder(book.id, chapters[chapterIdx].id, chapters[targetIdx].id);
    await loadData();
  };

  const handleRetranslate = (chapter: Chapter) => {
    Alert.alert(
      'Dịch lại',
      `Bạn muốn dịch lại "${chapter.title}"? Bản dịch cũ sẽ bị ghi đè.`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Dịch lại', style: 'destructive', onPress: () => handleTranslateChapter(chapter) },
      ]
    );
  };

  if (!book) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const translatedCount = chapters.filter((ch) => ch.isTranslated).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Book header */}
      <View style={[styles.header, { backgroundColor: book.coverColor }]}>
        <Ionicons name="book" size={40} color="rgba(255,255,255,0.9)" />
        <Text style={styles.bookTitle}>{book.title}</Text>
        <Text style={styles.bookMeta}>
          {chapters.length} chương · {translatedCount} đã dịch
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {progress && (
          <TouchableOpacity
            style={[styles.continueBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push(`/reader/${progress.chapterId}`)}
          >
            <Ionicons name="play" size={18} color="#FFFFFF" />
            <Text style={styles.continueBtnText}>Đọc tiếp</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.translateAllBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          onPress={handleTranslateAll}
        >
          <Ionicons name="language" size={18} color={colors.primary} />
          <Text style={[styles.translateAllText, { color: colors.primary }]}>Dịch tất cả</Text>
        </TouchableOpacity>
      </View>

      {/* Chapter list */}
      <FlatList
        data={chapters}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[styles.chapterItem, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
            onPress={() => router.push(`/reader/${item.id}`)}
            disabled={translatingId === item.id}
          >
            {/* Reorder buttons */}
            <View style={styles.reorderCol}>
              <TouchableOpacity
                onPress={() => handleMoveChapter(index, 'up')}
                disabled={index === 0}
                style={styles.reorderBtn}
              >
                <Ionicons name="chevron-up" size={18} color={index === 0 ? colors.textMuted : colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleMoveChapter(index, 'down')}
                disabled={index === chapters.length - 1}
                style={styles.reorderBtn}
              >
                <Ionicons name="chevron-down" size={18} color={index === chapters.length - 1 ? colors.textMuted : colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.chapterInfo}>
              <View style={styles.chapterTitleRow}>
                <Text style={[styles.chapterNumber, { color: colors.primary }]}>
                  {item.chapterNumber}
                </Text>
                <Text style={[styles.chapterTitle, { color: colors.text }]} numberOfLines={1}>
                  {item.title}
                </Text>
              </View>
              <Text style={[styles.chapterPreview, { color: colors.textMuted }]} numberOfLines={2}>
                {item.isTranslated ? item.translatedContent : item.originalContent}
              </Text>

              {translatingId === item.id && (
                <View style={styles.translatingRow}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.translatingText, { color: colors.primary }]}>
                    {translationProgress}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.chapterActions}>
              {item.isTranslated ? (
                <View style={{ alignItems: 'center', gap: 6 }}>
                  <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                  <TouchableOpacity
                    onPress={() => handleRetranslate(item)}
                    disabled={translatingId !== null}
                  >
                    <Ionicons name="refresh" size={20} color={translatingId !== null ? colors.textMuted : colors.accent} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => handleTranslateChapter(item)}
                  disabled={translatingId !== null}
                >
                  <Ionicons
                    name="language"
                    size={22}
                    color={translatingId !== null ? colors.textMuted : colors.accent}
                  />
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  bookTitle: {
    ...Typography.h1,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  bookMeta: {
    ...Typography.bodySm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: Spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  continueBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  continueBtnText: {
    color: '#FFFFFF',
    ...Typography.button,
  },
  translateAllBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  translateAllText: {
    ...Typography.button,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.huge,
  },
  chapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  chapterInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  chapterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  chapterNumber: {
    ...Typography.label,
    fontSize: 12,
    width: 24,
    height: 24,
    textAlign: 'center',
    lineHeight: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    overflow: 'hidden',
  },
  chapterTitle: {
    ...Typography.label,
    flex: 1,
  },
  chapterPreview: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  chapterActions: {
    padding: Spacing.sm,
  },
  reorderCol: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  reorderBtn: {
    padding: 2,
  },
  translatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  translatingText: {
    ...Typography.caption,
  },
});
