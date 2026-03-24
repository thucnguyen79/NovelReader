import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { Typography, BorderRadius, Spacing } from '../theme/typography';
import { Book } from '../database/types';

interface BookCardProps {
  book: Book;
  chapterCount?: number;
  translatedCount?: number;
  onPress: () => void;
  onLongPress?: () => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.lg * 3) / 2;

export const BookCard: React.FC<BookCardProps> = ({
  book,
  chapterCount = 0,
  translatedCount = 0,
  onPress,
  onLongPress,
}) => {
  const { colors } = useTheme();

  const progressPercent = chapterCount > 0 ? (translatedCount / chapterCount) * 100 : 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      style={[styles.container, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
    >
      {/* Cover */}
      <View style={[styles.cover, { backgroundColor: book.coverColor }]}>
        <Ionicons name="book" size={32} color="rgba(255,255,255,0.9)" />
        <Text style={styles.coverInitial}>
          {book.title.charAt(0).toUpperCase()}
        </Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {chapterCount} chương
        </Text>

        {/* Translation progress */}
        {chapterCount > 0 && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPercent}%`,
                    backgroundColor: progressPercent === 100 ? colors.success : colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.textMuted }]}>
              {translatedCount}/{chapterCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  cover: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  coverInitial: {
    position: 'absolute',
    fontSize: 48,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.15)',
    bottom: -5,
    right: 8,
  },
  info: {
    padding: Spacing.md,
  },
  title: {
    ...Typography.label,
    marginBottom: Spacing.xs,
  },
  meta: {
    ...Typography.caption,
    marginBottom: Spacing.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressBg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    ...Typography.caption,
    fontSize: 10,
  },
});
