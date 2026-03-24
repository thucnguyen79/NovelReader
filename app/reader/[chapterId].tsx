import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Typography, Spacing, BorderRadius } from '../../src/theme/typography';
import { TTSPlayer } from '../../src/components/TTSPlayer';
import {
  getChapter,
  getChapters,
  getBook,
  getSetting,
  saveReadingProgress,
  updateChapterTranslation,
  updateChapterContent,
} from '../../src/database/database';
import { translateChapter } from '../../src/services/geminiService';
import { splitIntoSentences } from '../../src/services/ttsService';
import { Chapter } from '../../src/database/types';
import { t } from '../../src/i18n/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ReaderScreen() {
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);
  const [showTranslated, setShowTranslated] = useState(true);
  const [fontSize, setFontSize] = useState(18);
  const [showControls, setShowControls] = useState(true);
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState(-1);
  const [translating, setTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');

  const loadChapter = useCallback(async () => {
    if (!chapterId) return;
    const ch = await getChapter(parseInt(chapterId));
    if (ch) {
      setChapter(ch);
      const chapters = await getChapters(ch.bookId);
      setAllChapters(chapters);

      // Auto-show translated if available
      setShowTranslated(ch.isTranslated);

      // Save reading progress
      saveReadingProgress(ch.bookId, ch.id).catch(console.error);
    }
  }, [chapterId]);

  useEffect(() => {
    loadChapter();
  }, [loadChapter]);

  useEffect(() => {
    // Load saved font size
    getSetting('readerFontSize').then((size) => {
      if (size) setFontSize(parseInt(size));
    });
  }, []);

  const displayText = showTranslated && chapter?.translatedContent
    ? chapter.translatedContent
    : chapter?.originalContent || '';

  const sentences = splitIntoSentences(displayText);

  const handleSentenceChange = useCallback((index: number) => {
    setCurrentSentenceIdx(index);
  }, []);

  const handleTranslate = async () => {
    if (!chapter) return;
    const apiKey = await getSetting('geminiApiKey');
    if (!apiKey) {
      Alert.alert(t('book.noApiKey'), t('book.noApiKeyMsg'));
      return;
    }

    setTranslating(true);
    try {
      const translated = await translateChapter(
        chapter.originalContent,
        apiKey,
        (current, total) => {
          setTranslationProgress(t('book.translating', { current, total }));
        }
      );
      await updateChapterTranslation(chapter.id, translated);
      await loadChapter();
      setShowTranslated(true);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setTranslating(false);
      setTranslationProgress('');
    }
  };

  const handleStartEdit = () => {
    setEditText(displayText);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!chapter) return;
    if (showTranslated && chapter.isTranslated) {
      await updateChapterContent(chapter.id, undefined, editText);
    } else {
      await updateChapterContent(chapter.id, editText, undefined);
    }
    await loadChapter();
    setIsEditing(false);
    Alert.alert(t('reader.saved'), t('reader.savedMsg'));
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText('');
  };

  const handleRetranslate = () => {
    if (!chapter?.isTranslated) return;
    Alert.alert(
      t('book.retranslate'),
      t('reader.retranslateConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('book.retranslate'), style: 'destructive', onPress: handleTranslate },
      ]
    );
  };

  const navigateChapter = (direction: 'prev' | 'next') => {
    if (!chapter || allChapters.length === 0) return;
    const currentIndex = allChapters.findIndex((c) => c.id === chapter.id);
    const targetIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex >= 0 && targetIndex < allChapters.length) {
      router.replace(`/reader/${allChapters[targetIndex].id}`);
    }
  };

  const currentIndex = chapter
    ? allChapters.findIndex((c) => c.id === chapter.id)
    : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allChapters.length - 1;

  if (!chapter) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      {showControls && (
        <View style={[styles.header, { backgroundColor: colors.surface, paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {chapter.title}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              {currentIndex + 1}/{allChapters.length}
            </Text>
          </View>

          <View style={styles.headerRightActions}>
            {/* Edit button */}
            <TouchableOpacity
              onPress={isEditing ? handleCancelEdit : handleStartEdit}
              style={styles.headerBtn}
            >
              <Ionicons
                name={isEditing ? 'close-circle-outline' : 'create-outline'}
                size={22}
                color={isEditing ? colors.error : colors.textSecondary}
              />
            </TouchableOpacity>
            {/* Font size controls */}
            <TouchableOpacity
              onPress={() => setFontSize((s) => Math.max(14, s - 2))}
              style={styles.headerBtn}
            >
              <Ionicons name="remove-circle-outline" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.fontSizeLabel, { color: colors.textMuted }]}>{fontSize}</Text>
            <TouchableOpacity
              onPress={() => setFontSize((s) => Math.min(28, s + 2))}
              style={styles.headerBtn}
            >
              <Ionicons name="add-circle-outline" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Content */}
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowControls(!showControls)}
        >
          {/* Toggle buttons */}
          <View style={styles.toggleRow}>
            {chapter.isTranslated ? (
              <>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    showTranslated && { backgroundColor: colors.primary },
                    !showTranslated && { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderWidth: 1 },
                  ]}
                  onPress={() => setShowTranslated(true)}
                >
                  <Text style={[styles.toggleText, { color: showTranslated ? '#FFF' : colors.text }]}>
                    {t('reader.translated')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    !showTranslated && { backgroundColor: colors.primary },
                    showTranslated && { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderWidth: 1 },
                  ]}
                  onPress={() => setShowTranslated(false)}
                >
                  <Text style={[styles.toggleText, { color: !showTranslated ? '#FFF' : colors.text }]}>
                    {t('reader.original')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.retranslateBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                  onPress={handleRetranslate}
                  disabled={translating}
                >
                  <Ionicons name="refresh" size={16} color={colors.accent} />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.translateBtn, { backgroundColor: colors.primary }]}
                onPress={handleTranslate}
                disabled={translating}
              >
                {translating ? (
                  <>
                    <ActivityIndicator size="small" color="#FFF" />
                    <Text style={styles.translateBtnText}>{translationProgress || t('book.translating', { current: 0, total: 1 })}</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="language" size={18} color="#FFF" />
                    <Text style={styles.translateBtnText}>{t('reader.translate')}</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Text content */}
          {isEditing ? (
            <View>
              <TextInput
                style={[
                  styles.editInput,
                  {
                    fontSize,
                    lineHeight: fontSize * 1.7,
                    color: colors.text,
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                  },
                ]}
                value={editText}
                onChangeText={setEditText}
                multiline
                textAlignVertical="top"
                autoCorrect={false}
              />
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={[styles.editCancelBtn, { borderColor: colors.border }]}
                  onPress={handleCancelEdit}
                >
                  <Ionicons name="close" size={18} color={colors.textSecondary} />
                  <Text style={[styles.editBtnLabel, { color: colors.textSecondary }]}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editSaveBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSaveEdit}
                >
                  <Ionicons name="checkmark" size={18} color="#FFF" />
                  <Text style={[styles.editBtnLabel, { color: '#FFF' }]}>{t('common.save')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={[styles.textContent, { fontSize, lineHeight: fontSize * 1.7 }]}>
              {sentences.map((sentence, idx) => (
                <Text
                  key={idx}
                  style={[
                    { color: colors.text },
                    idx === currentSentenceIdx && {
                      backgroundColor: `${colors.primary}30`,
                      color: colors.primaryLight,
                    },
                  ]}
                >
                  {sentence}{' '}
                </Text>
              ))}
            </Text>
          )}
        </TouchableOpacity>

        {/* Chapter navigation */}
        <View style={styles.chapterNav}>
          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: hasPrev ? colors.surfaceElevated : 'transparent' }]}
            onPress={() => navigateChapter('prev')}
            disabled={!hasPrev}
          >
            <Ionicons name="chevron-back" size={20} color={hasPrev ? colors.text : colors.textMuted} />
            <Text style={[styles.navText, { color: hasPrev ? colors.text : colors.textMuted }]}>{t('reader.prevChapter')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: hasNext ? colors.surfaceElevated : 'transparent' }]}
            onPress={() => navigateChapter('next')}
            disabled={!hasNext}
          >
            <Text style={[styles.navText, { color: hasNext ? colors.text : colors.textMuted }]}>{t('reader.nextChapter')}</Text>
            <Ionicons name="chevron-forward" size={20} color={hasNext ? colors.text : colors.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* TTS Player */}
      {showControls && (
        <View style={{ paddingBottom: insets.bottom }}>
          <TTSPlayer
            text={displayText}
            onSentenceChange={handleSentenceChange}
            onStop={() => setCurrentSentenceIdx(-1)}
          />
        </View>
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  headerBtn: {
    padding: Spacing.sm,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.label,
    textAlign: 'center',
  },
  headerSubtitle: {
    ...Typography.caption,
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fontSizeLabel: {
    ...Typography.caption,
    width: 22,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.huge,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  toggleText: {
    ...Typography.label,
  },
  translateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  translateBtnText: {
    ...Typography.button,
    color: '#FFFFFF',
  },
  textContent: {
    ...Typography.bodyLarge,
  },
  chapterNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xxxl,
    gap: Spacing.md,
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  navText: {
    ...Typography.label,
  },
  retranslateBtn: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editInput: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    minHeight: 300,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  editCancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  editSaveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  editBtnLabel: {
    ...Typography.button,
  },
});
