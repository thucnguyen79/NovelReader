import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Typography, Spacing, BorderRadius } from '../../src/theme/typography';
import { BookCard } from '../../src/components/BookCard';
import {
  getAllBooks,
  deleteBook,
  getChapterCount,
  getTranslatedChapterCount,
} from '../../src/database/database';
import { Book } from '../../src/database/types';
import { t } from '../../src/i18n/i18n';

interface BookWithMeta extends Book {
  chapterCount: number;
  translatedCount: number;
}

export default function LibraryScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [books, setBooks] = useState<BookWithMeta[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadBooks = useCallback(async () => {
    try {
      const allBooks = await getAllBooks();
      const booksWithMeta: BookWithMeta[] = await Promise.all(
        allBooks.map(async (book) => ({
          ...book,
          chapterCount: await getChapterCount(book.id),
          translatedCount: await getTranslatedChapterCount(book.id),
        }))
      );
      setBooks(booksWithMeta);
    } catch (error) {
      console.error('Error loading books:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBooks();
    }, [loadBooks])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBooks();
    setRefreshing(false);
  };

  const handleDeleteBook = (book: Book) => {
    Alert.alert(
      t('library.deleteTitle'),
      `${t('library.deleteMsg', { title: book.title })}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteBook(book.id);
            loadBooks();
          },
        },
      ]
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="book-outline" size={80} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {t('library.empty')}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {t('library.emptyHint')}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('library.title')}</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          {t('library.bookCount', { count: books.length })}
        </Text>
      </View>

      {/* Book list */}
      <FlatList
        data={books}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <BookCard
            book={item}
            chapterCount={item.chapterCount}
            translatedCount={item.translatedCount}
            onPress={() => router.push(`/book/${item.id}`)}
            onLongPress={() => handleDeleteBook(item)}
          />
        )}
        ListEmptyComponent={renderEmpty}
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/add-book')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    ...Typography.h1,
  },
  headerSubtitle: {
    ...Typography.bodySm,
    marginTop: Spacing.xs,
  },
  listContent: {
    padding: Spacing.lg,
    flexGrow: 1,
  },
  row: {
    justifyContent: 'space-between',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    ...Typography.h2,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    ...Typography.body,
    marginTop: Spacing.sm,
  },
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    bottom: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
