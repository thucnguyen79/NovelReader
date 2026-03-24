import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useTheme } from '../theme/ThemeProvider';
import { Typography, Spacing, BorderRadius } from '../theme/typography';
import * as ttsService from '../services/ttsService';
import { VoiceInfo } from '../services/ttsService';

interface TTSPlayerProps {
  text: string;
  onSentenceChange?: (index: number) => void;
  onStop?: () => void;
  bookId?: number;
  initialSpeed?: number;
  initialVoice?: string;
}

const SLEEP_OPTIONS = [
  { label: 'Tắt', value: 0 },
  { label: '15 phút', value: 15 },
  { label: '30 phút', value: 30 },
  { label: '45 phút', value: 45 },
  { label: '60 phút', value: 60 },
  { label: '90 phút', value: 90 },
];

export const TTSPlayer: React.FC<TTSPlayerProps> = ({
  text,
  onSentenceChange,
  onStop,
  initialSpeed = 1.0,
  initialVoice,
}) => {
  const { colors } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(initialSpeed);
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string | undefined>(initialVoice);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [sleepMinutes, setSleepMinutes] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    ttsService.getAvailableVoices().then(setVoices);
  }, []);

  const handlePlay = useCallback(() => {
    if (isPlaying) {
      ttsService.pauseSpeaking();
      setIsPlaying(false);
    } else if (ttsService.getSentences().length > 0 && ttsService.getCurrentSentenceIndex() > 0) {
      ttsService.setSpeed(speed);
      if (selectedVoice) ttsService.setVoice(selectedVoice);
      ttsService.resumeSpeaking(() => {
        setIsPlaying(false);
        onStop?.();
      });
      setIsPlaying(true);
    } else {
      ttsService.speakText(text, {
        speed,
        voice: selectedVoice,
        onStart: () => setIsPlaying(true),
        onDone: () => {
          setIsPlaying(false);
          onStop?.();
        },
        onSentenceChange,
      });
      setIsPlaying(true);
    }
  }, [isPlaying, text, speed, selectedVoice, onSentenceChange, onStop]);

  const handleStop = useCallback(() => {
    ttsService.stopSpeaking();
    setIsPlaying(false);
    onStop?.();
  }, [onStop]);

  const handleSpeedChange = useCallback((value: number) => {
    const rounded = Math.round(value * 10) / 10;
    setSpeed(rounded);
    ttsService.setSpeed(rounded);
  }, []);

  const handleVoiceSelect = useCallback((voice: VoiceInfo) => {
    setSelectedVoice(voice.identifier);
    ttsService.setVoice(voice.identifier);
    setShowVoiceModal(false);
    // Restart if currently playing
    if (isPlaying) {
      ttsService.pauseSpeaking();
      setTimeout(() => {
        ttsService.setVoice(voice.identifier);
        ttsService.resumeSpeaking(() => setIsPlaying(false));
      }, 200);
    }
  }, [isPlaying]);

  const handleSleepSelect = useCallback((minutes: number) => {
    setSleepMinutes(minutes);
    if (minutes > 0) {
      ttsService.setSleepTimer(minutes, () => {
        setIsPlaying(false);
        setSleepMinutes(0);
      });
    } else {
      ttsService.clearSleepTimer();
    }
    setShowSleepModal(false);
  }, []);

  const selectedVoiceName = voices.find((v) => v.identifier === selectedVoice)?.name || 'Mặc định';

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Main controls row */}
      <View style={styles.mainRow}>
        <TouchableOpacity onPress={handleStop} style={styles.iconBtn}>
          <Ionicons name="stop" size={22} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => ttsService.skipBackward()}
          style={styles.iconBtn}
        >
          <Ionicons name="play-skip-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePlay}
          style={[styles.playBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => ttsService.skipForward()}
          style={styles.iconBtn}
        >
          <Ionicons name="play-skip-forward" size={22} color={colors.textSecondary} />
        </TouchableOpacity>

        <Text style={[styles.speedLabel, { color: colors.text }]}>{speed.toFixed(1)}x</Text>

        <TouchableOpacity
          onPress={() => setExpanded(!expanded)}
          style={styles.iconBtn}
        >
          <Ionicons
            name={expanded ? 'chevron-down' : 'chevron-up'}
            size={22}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Expanded controls */}
      {expanded && (
        <View style={styles.expandedArea}>
          {/* Speed slider */}
          <View style={styles.sliderRow}>
            <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>Tốc độ</Text>
            <Slider
              style={styles.slider}
              minimumValue={0.5}
              maximumValue={2.0}
              step={0.1}
              value={speed}
              onValueChange={handleSpeedChange}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
            <Text style={[styles.sliderValue, { color: colors.text }]}>{speed.toFixed(1)}x</Text>
          </View>

          {/* Voice & Sleep buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={() => setShowVoiceModal(true)}
              style={[styles.optionBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            >
              <Ionicons name="mic-outline" size={18} color={colors.primary} />
              <Text style={[styles.optionLabel, { color: colors.text }]} numberOfLines={1}>
                {selectedVoiceName}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowSleepModal(true)}
              style={[styles.optionBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            >
              <Ionicons name="moon-outline" size={18} color={sleepMinutes > 0 ? colors.warning : colors.primary} />
              <Text style={[styles.optionLabel, { color: colors.text }]}>
                {sleepMinutes > 0 ? `${sleepMinutes} phút` : 'Hẹn giờ'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Voice selection modal */}
      <Modal visible={showVoiceModal} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Chọn giọng đọc</Text>
              <TouchableOpacity onPress={() => setShowVoiceModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={voices}
              keyExtractor={(item) => item.identifier}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleVoiceSelect(item)}
                  style={[
                    styles.voiceItem,
                    { borderColor: colors.border },
                    item.identifier === selectedVoice && { backgroundColor: colors.surfaceElevated },
                  ]}
                >
                  <View>
                    <Text style={[styles.voiceName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.voiceLang, { color: colors.textMuted }]}>{item.language}</Text>
                  </View>
                  {item.identifier === selectedVoice && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  Không tìm thấy giọng đọc. Hãy cài đặt giọng Tiếng Việt trong cài đặt điện thoại.
                </Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Sleep timer modal */}
      <Modal visible={showSleepModal} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, maxHeight: 400 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Hẹn giờ tắt</Text>
              <TouchableOpacity onPress={() => setShowSleepModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {SLEEP_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => handleSleepSelect(option.value)}
                style={[
                  styles.sleepItem,
                  { borderColor: colors.border },
                  option.value === sleepMinutes && { backgroundColor: colors.surfaceElevated },
                ]}
              >
                <Text style={[styles.sleepLabel, { color: colors.text }]}>{option.label}</Text>
                {option.value === sleepMinutes && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  iconBtn: {
    padding: Spacing.sm,
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedLabel: {
    ...Typography.label,
    width: 40,
    textAlign: 'center',
  },
  expandedArea: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sliderLabel: {
    ...Typography.bodySm,
    width: 50,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderValue: {
    ...Typography.label,
    width: 40,
    textAlign: 'right',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  optionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  optionLabel: {
    ...Typography.bodySm,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.2)',
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    ...Typography.h3,
  },
  voiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  voiceName: {
    ...Typography.body,
  },
  voiceLang: {
    ...Typography.caption,
    marginTop: 2,
  },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
    paddingVertical: Spacing.xxl,
  },
  sleepItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: BorderRadius.sm,
  },
  sleepLabel: {
    ...Typography.body,
  },
});
