import React, { type ComponentType, type ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

/**
 * iOS 26+ gets Apple's real Liquid Glass (expo-glass-effect). The module touches native code as
 * soon as it's imported, so load it defensively — if it's missing (older iOS, Expo Go without it)
 * we fall back to a frosted blur instead of crashing.
 */
let NativeGlassView: ComponentType<any> | null = null;
if (Platform.OS === 'ios') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const glass = require('expo-glass-effect');
    if (glass.isLiquidGlassAvailable()) NativeGlassView = glass.GlassView;
  } catch {
    NativeGlassView = null;
  }
}

export const hasLiquidGlass = NativeGlassView !== null;

export function GlassSurface({
  children,
  style,
  radius,
  interactive,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  radius: number;
  interactive?: boolean;
}) {
  if (NativeGlassView) {
    return (
      <NativeGlassView glassEffectStyle="regular" isInteractive={interactive} style={[{ borderRadius: radius }, style]}>
        {children}
      </NativeGlassView>
    );
  }

  // Frosted fallback: real blur on iOS < 26 and web (CSS backdrop-filter); translucent panel on Android
  return (
    <View style={[{ borderRadius: radius, overflow: 'hidden' }, styles.fallbackBorder, style]}>
      <BlurView
        intensity={Platform.OS === 'ios' ? 60 : 40}
        tint={Platform.OS === 'ios' ? 'systemChromeMaterialLight' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, styles.sheen]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fallbackBorder: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  sheen: {
    // Android has no live blur here, so lean on a brighter translucent fill
    backgroundColor: Platform.OS === 'android' ? 'rgba(255, 255, 255, 0.82)' : 'rgba(255, 255, 255, 0.35)',
  },
});
