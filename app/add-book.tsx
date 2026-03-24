import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/theme/ThemeProvider';
import { Typography, Spacing, BorderRadius } from '../src/theme/typography';
import { createBook, createChapter } from '../src/database/database';
import { t } from '../src/i18n/i18n';

export default function AddBookScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setContent(text);
      } else {
        Alert.alert(t('common.notice'), t('addBook.clipboardEmpty'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), 'Cannot read clipboard');
    }
  };

  const splitIntoChapters = (text: string): { title: string; content: string }[] => {
    // Try to split by common chapter patterns
    const chapterPatterns = [
      /^(Chương\s+\d+[^\n]*)/gim,
      /^(Chapter\s+\d+[^\n]*)/gim,
      /^(第[一二三四五六七八九十百千\d]+[章回节][^\n]*)/gim,
      /^(CHAPTER\s+\d+[^\n]*)/gim,
    ];

    for (const pattern of chapterPatterns) {
      const parts = text.split(pattern).filter((s) => s.trim());
      if (parts.length > 1) {
        const chapters: { title: string; content: string }[] = [];
        for (let i = 0; i < parts.length; i += 2) {
          const chTitle = parts[i]?.trim() || `Chương ${chapters.length + 1}`;
          const chContent = parts[i + 1]?.trim() || parts[i]?.trim() || '';
          if (chContent) {
            chapters.push({ title: chTitle, content: chContent });
          }
        }
        if (chapters.length > 0) return chapters;
      }
    }

    // No chapter markers found — split by paragraphs into ~3000 char chunks
    if (text.length > 5000) {
      const paragraphs = text.split(/\n\s*\n/);
      const chapters: { title: string; content: string }[] = [];
      let currentContent = '';
      let chapterNum = 1;

      for (const para of paragraphs) {
        if (currentContent.length + para.length > 3000 && currentContent.length > 0) {
          chapters.push({ title: `Phần ${chapterNum}`, content: currentContent.trim() });
          currentContent = '';
          chapterNum++;
        }
        currentContent += (currentContent ? '\n\n' : '') + para;
      }
      if (currentContent.trim()) {
        chapters.push({ title: `Phần ${chapterNum}`, content: currentContent.trim() });
      }
      return chapters;
    }

    // Short text — single chapter
    return [{ title: 'Chương 1', content: text }];
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(t('addBook.missingInfo'), t('addBook.needTitle'));
      return;
    }
    if (!content.trim()) {
      Alert.alert(t('addBook.missingInfo'), t('addBook.needContent'));
      return;
    }

    setSaving(true);
    try {
      const bookId = await createBook(title.trim());
      const chapters = splitIntoChapters(content.trim());

      for (let i = 0; i < chapters.length; i++) {
        await createChapter(bookId, i + 1, chapters[i].title, chapters[i].content);
      }

      Alert.alert(
        t('addBook.success'),
        t('addBook.savedMsg', { title, count: chapters.length }),
        [{ text: t('common.ok'), onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error saving book:', error);
      Alert.alert(t('common.error'), t('addBook.error'));
    } finally {
      setSaving(false);
    }
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        {/* Title input */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('addBook.bookName')}</Text>
        <TextInput
          style={[
            styles.titleInput,
            {
              backgroundColor: colors.surfaceCard,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          value={title}
          onChangeText={setTitle}
          placeholder={t('addBook.bookNamePlaceholder')}
          placeholderTextColor={colors.textMuted}
        />

        {/* Content area */}
        <View style={styles.contentHeader}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('addBook.content')}</Text>
          <TouchableOpacity onPress={handlePaste} style={[styles.pasteBtn, { backgroundColor: colors.surfaceElevated }]}>
            <Ionicons name="clipboard-outline" size={16} color={colors.primary} />
            <Text style={[styles.pasteBtnText, { color: colors.primary }]}>{t('addBook.paste')}</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={[
            styles.contentInput,
            {
              backgroundColor: colors.surfaceCard,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          value={content}
          onChangeText={setContent}
          placeholder={t('addBook.contentPlaceholder')}
          placeholderTextColor={colors.textMuted}
          multiline
          textAlignVertical="top"
        />

        {/* Word count */}
        {content.length > 0 && (
          <Text style={[styles.wordCount, { color: colors.textMuted }]}>
            {t('addBook.chars', { count: content.length.toLocaleString() })} · {t('addBook.words', { count: wordCount.toLocaleString() })}
          </Text>
        )}

        {/* Info */}
        <View style={[styles.infoBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Ionicons name="information-circle" size={18} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {t('addBook.autoSplitHint')}
          </Text>
        </View>

        {/* Save button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveBtn, { backgroundColor: saving ? colors.textMuted : colors.primary }]}
        >
          <Ionicons name="save" size={20} color="#FFFFFF" />
          <Text style={styles.saveBtnText}>{saving ? t('addBook.saving') : t('addBook.save')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.huge,
  },
  label: {
    ...Typography.label,
    marginBottom: Spacing.sm,
  },
  titleInput: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.body,
    marginBottom: Spacing.xl,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  pasteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.round,
  },
  pasteBtnText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  contentInput: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.body,
    minHeight: 250,
    maxHeight: 400,
  },
  wordCount: {
    ...Typography.caption,
    textAlign: 'right',
    marginTop: Spacing.sm,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.lg,
  },
  infoText: {
    ...Typography.bodySm,
    flex: 1,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
  },
  saveBtnText: {
    color: '#FFFFFF',
    ...Typography.button,
  },
});
