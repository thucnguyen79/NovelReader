import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Typography, Spacing, BorderRadius } from '../../src/theme/typography';
import { getSetting, setSetting } from '../../src/database/database';
import { t, getLanguage, saveLanguage, TARGET_LANGUAGES, loadLanguage } from '../../src/i18n/i18n';

export default function SettingsScreen() {
  const { colors, isDark, themeMode, setThemeMode } = useTheme();
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [model, setModel] = useState('gemini-1.5-flash');
  const [customModel, setCustomModel] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [detectedModels, setDetectedModels] = useState<string[]>([]);
  const [appLang, setAppLang] = useState<'vi' | 'en'>(getLanguage());
  const [transLang, setTransLang] = useState('vi');
  const [, forceUpdate] = useState(0);

  const AVAILABLE_MODELS = [
    { id: 'gemini-2.0-flash-exp', name: '2.0 Flash (Exp)' },
    { id: 'gemini-1.5-flash-8b', name: '1.5 Flash 8B' },
    { id: 'gemini-1.5-flash', name: '1.5 Flash' },
    { id: 'gemini-2.0-flash', name: '2.0 Flash' },
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
    getSetting('translationLanguage').then((l) => {
      if (l) setTransLang(l);
    });
    loadLanguage().then(() => {
      setAppLang(getLanguage());
    });
  }, []);

  const handleDetectModels = async () => {
    const key = apiKey.trim();
    if (!key) {
      Alert.alert(t('common.error'), t('settings.apiKeyPlaceholder'));
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
        Alert.alert(t('common.error'), `API Key error (${resp.status}):\n${errText.slice(0, 200)}`);
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
        Alert.alert(t('common.notice'), 'No models found for this API Key.');
      } else {
        setDetectedModels(models);
        const flash = models.find(m => m.includes('flash'));
        const pick = flash || models[0];
        setModel(pick);
        setCustomModel('');
        await setSetting('geminiModel', pick);
        Alert.alert(t('common.ok'), `Found ${models.length} models. Auto-selected "${pick}".`);
      }
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || 'Network error.');
    }
    setDetecting(false);
  };

  const handleSaveApiKey = async () => {
    const finalModel = customModel.trim() !== '' ? customModel.trim() : model;
    await setSetting('geminiApiKey', apiKey.trim());
    await setSetting('geminiModel', finalModel);
    await setSetting('translationLanguage', transLang);
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

  const handleLanguageToggle = async () => {
    const newLang = appLang === 'vi' ? 'en' : 'vi';
    await saveLanguage(newLang);
    setAppLang(newLang);
    forceUpdate(n => n + 1);
  };

  const themeLabel =
    themeMode === 'system' ? t('settings.themeSystem') : themeMode === 'dark' ? t('settings.themeDark') : t('settings.themeLight');

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Language Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="language" size={22} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settings.language')}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
          <TouchableOpacity onPress={handleLanguageToggle} style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.language')}</Text>
              <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
                {appLang === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}
              </Text>
            </View>
            <Ionicons name="swap-horizontal" size={22} color={colors.primary} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Translation target language */}
          <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.sm }]}>
            {t('settings.translationLang')}
          </Text>
          <View style={styles.modelGrid}>
            {TARGET_LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.id}
                style={[
                  styles.modelBtn,
                  transLang === lang.id
                    ? { backgroundColor: colors.primary, borderColor: colors.primary }
                    : { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                ]}
                onPress={() => setTransLang(lang.id)}
              >
                <Text style={[styles.modelBtnText, { color: transLang === lang.id ? '#FFFFFF' : colors.text }]}>
                  {lang.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Gemini API Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="sparkles" size={22} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settings.geminiTitle')}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('settings.apiKey')}</Text>
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
              placeholder={t('settings.apiKeyPlaceholder')}
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
              {detecting ? t('settings.detecting') : t('settings.detectModels')}
            </Text>
          </TouchableOpacity>

          {detectedModels.length > 0 && (
            <View style={{ marginTop: Spacing.md }}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {t('settings.availableModels', { count: detectedModels.length })}
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

          <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.lg }]}>{t('settings.model')}</Text>
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

          <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.md }]}>{t('settings.customModel')}</Text>
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
            <Text style={styles.saveBtnText}>{saved ? t('settings.saved') : t('settings.save')}</Text>
          </TouchableOpacity>

          <Text style={[styles.hint, { color: colors.textMuted }]}>
            {appLang === 'vi' ? 'Tạo API key miễn phí tại aistudio.google.com' : 'Get a free API key at aistudio.google.com'}
          </Text>
        </View>
      </View>

      {/* Theme Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="color-palette" size={22} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settings.themeTitle')}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
          <TouchableOpacity onPress={handleThemeChange} style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.themeLabel')}</Text>
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settings.aboutTitle')}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>{t('settings.version')}</Text>
            <Text style={[styles.aboutValue, { color: colors.text }]}>1.0.0</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>{t('settings.translatedBy')}</Text>
            <Text style={[styles.aboutValue, { color: colors.text }]}>Google Gemini AI</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>{t('settings.storage')}</Text>
            <Text style={[styles.aboutValue, { color: colors.text }]}>{t('settings.storageValue')}</Text>
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
