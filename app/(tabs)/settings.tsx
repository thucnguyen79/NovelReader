import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Typography, Spacing, BorderRadius } from '../../src/theme/typography';
import { getSetting, setSetting } from '../../src/database/database';

export default function SettingsScreen() {
  const { colors, isDark, themeMode, setThemeMode } = useTheme();
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [model, setModel] = useState('gemini-1.5-flash');
  const [customModel, setCustomModel] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [detectedModels, setDetectedModels] = useState<string[]>([]);

  const AVAILABLE_MODELS = [
    { id: 'gemini-2.0-flash-exp', name: '2.0 Flash (Thử nghiệm)' },
    { id: 'gemini-1.5-flash-8b', name: '1.5 Flash 8B (Nhẹ)' },
    { id: 'gemini-1.5-flash', name: '1.5 Flash (Nhanh)' },
    { id: 'gemini-2.0-flash', name: '2.0 Flash (Mới)' },
  ];

  useEffect(() => {
    getSetting('geminiApiKey').then((key) => {
      if (key) setApiKey(key);
    });
    getSetting('geminiModel').then((m) => {
      if (m) {
        setModel(m);
        if (!AVAILABLE_MODELS.find(x => x.id === m)) {
          setCustomModel(m);
        }
      }
    });
  }, []);

  const handleDetectModels = async () => {
    const key = apiKey.trim();
    if (!key) {
      Alert.alert('Lỗi', 'Vui lòng nhập API Key trước.');
      return;
    }
    setDetecting(true);
    setDetectedModels([]);
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
      );
      if (!resp.ok) {
        const errText = await resp.text();
        Alert.alert('Lỗi API Key', `API Key không hợp lệ hoặc bị lỗi (${resp.status}):\n${errText.slice(0, 200)}`);
        setDetecting(false);
        return;
      }
      const data = await resp.json();
      const models: string[] = (data.models || [])
        .filter((m: any) =>
          m.supportedGenerationMethods?.includes('generateContent')
        )
        .map((m: any) => m.name?.replace('models/', '') || '')
        .filter((name: string) => name.length > 0);

      if (models.length === 0) {
        Alert.alert('Không tìm thấy', 'API Key này không có quyền truy cập bất kỳ mô hình nào hỗ trợ generateContent.');
      } else {
        setDetectedModels(models);
        // Auto-select first flash model or first model
        const flash = models.find(m => m.includes('flash'));
        const pick = flash || models[0];
        setModel(pick);
        setCustomModel('');
        await setSetting('geminiModel', pick);
        Alert.alert('Thành công!', `Tìm thấy ${models.length} mô hình. Đã tự động chọn "${pick}". Bấm "Lưu Cài Đặt" để lưu lại.`);
      }
    } catch (err: any) {
      Alert.alert('Lỗi mạng', err.message || 'Không thể kết nối tới Google API.');
    }
    setDetecting(false);
  };

  const handleSaveApiKey = async () => {
    const finalModel = customModel.trim() !== '' ? customModel.trim() : model;
    await setSetting('geminiApiKey', apiKey.trim());
    await setSetting('geminiModel', finalModel);
    setModel(finalModel);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleThemeChange = () => {
    const modes: Array<'system' | 'light' | 'dark'> = ['system', 'light', 'dark'];
    const currentIndex = modes.indexOf(themeMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setThemeMode(nextMode);
  };

  const themeLabel =
    themeMode === 'system' ? 'Hệ thống' : themeMode === 'dark' ? 'Tối' : 'Sáng';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Gemini API Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="sparkles" size={22} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Google Gemini API</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>API Key</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceElevated,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="Nhập API key..."
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showApiKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => setShowApiKey(!showApiKey)}
              style={styles.eyeBtn}
            >
              <Ionicons
                name={showApiKey ? 'eye-off' : 'eye'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleDetectModels}
            style={[styles.detectBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            disabled={detecting}
          >
            <Ionicons name={detecting ? 'hourglass' : 'search'} size={16} color={colors.primary} />
            <Text style={[styles.detectBtnText, { color: colors.primary }]}>
              {detecting ? 'Đang kiểm tra...' : 'Kiểm tra API Key & Tìm Model'}
            </Text>
          </TouchableOpacity>

          {detectedModels.length > 0 && (
            <View style={{ marginTop: Spacing.md }}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Model khả dụng ({detectedModels.length}):
              </Text>
              <ScrollView horizontal={false} style={{ maxHeight: 160 }}>
                {detectedModels.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.detectedModelBtn,
                      model === m
                        ? { backgroundColor: colors.primary, borderColor: colors.primary }
                        : { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                    ]}
                    onPress={() => {
                      setModel(m);
                      setCustomModel('');
                      setSetting('geminiModel', m);
                    }}
                  >
                    <Text style={{ color: model === m ? '#FFFFFF' : colors.text, fontSize: 13 }}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.lg }]}>Mô Hình Dịch (Model)</Text>
          <View style={styles.modelGrid}>
            {AVAILABLE_MODELS.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[
                  styles.modelBtn,
                  model === m.id && customModel === ''
                    ? { backgroundColor: colors.primary, borderColor: colors.primary }
                    : { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                ]}
                onPress={() => {
                  setModel(m.id);
                  setCustomModel('');
                }}
              >
                <Text
                  style={[
                    styles.modelBtnText,
                    { color: model === m.id && customModel === '' ? '#FFFFFF' : colors.text },
                  ]}
                >
                  {m.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.md }]}>Hoặc nhập tên Model tùy chỉnh:</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceElevated,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={customModel}
            onChangeText={(text) => {
              setCustomModel(text);
              setModel(text);
            }}
            placeholder="vd: gemini-2.0-flash-exp"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            onPress={handleSaveApiKey}
            style={[styles.saveBtn, { backgroundColor: saved ? colors.success : colors.primary, marginTop: Spacing.xl }]}
          >
            <Ionicons
              name={saved ? 'checkmark' : 'save'}
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.saveBtnText}>{saved ? 'Đã lưu!' : 'Lưu Cài Đặt'}</Text>
          </TouchableOpacity>

          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Tạo API key miễn phí tại aistudio.google.com
          </Text>
        </View>
      </View>

      {/* Theme Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="color-palette" size={22} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Giao Diện</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
          <TouchableOpacity onPress={handleThemeChange} style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Chế độ hiển thị</Text>
              <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{themeLabel}</Text>
            </View>
            <Ionicons
              name={isDark ? 'moon' : 'sunny'}
              size={22}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="information-circle" size={22} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Thông Tin</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>Phiên bản</Text>
            <Text style={[styles.aboutValue, { color: colors.text }]}>1.0.0</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>Dịch bởi</Text>
            <Text style={[styles.aboutValue, { color: colors.text }]}>Google Gemini AI</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>Lưu trữ</Text>
            <Text style={[styles.aboutValue, { color: colors.text }]}>Cục bộ (AsyncStorage)</Text>
          </View>
        </View>
      </View>
    </ScrollView>
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
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
  },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  label: {
    ...Typography.label,
    marginBottom: Spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.body,
  },
  eyeBtn: {
    padding: Spacing.sm,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  saveBtnText: {
    color: '#FFFFFF',
    ...Typography.button,
  },
  hint: {
    ...Typography.caption,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    ...Typography.body,
  },
  settingValue: {
    ...Typography.bodySm,
    marginTop: 2,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  aboutLabel: {
    ...Typography.bodySm,
  },
  aboutValue: {
    ...Typography.label,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.xs,
  },
  modelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  modelBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.xs,
  },
  modelBtnText: {
    ...Typography.bodySm,
  },
  detectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.md,
  },
  detectBtnText: {
    ...Typography.bodySm,
    fontWeight: '600' as const,
  },
  detectedModelBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.xs,
  },
});
