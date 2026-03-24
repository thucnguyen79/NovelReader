import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';
import { loadLanguage, t } from '../src/i18n/i18n';

function RootLayoutInner() {
  const { colors, isDark } = useTheme();

  useEffect(() => {
    loadLanguage();
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="add-book"
          options={{
            title: t('addBook.title'),
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="book/[id]"
          options={{ title: t('book.title') }}
        />
        <Stack.Screen
          name="reader/[chapterId]"
          options={{
            title: t('reader.title'),
            headerShown: false,
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutInner />
    </ThemeProvider>
  );
}
