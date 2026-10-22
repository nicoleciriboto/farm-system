import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Keyboard, LayoutAnimation } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, weight, icon, spacing } from '@/theme';
import { useApp, type ScreenName } from '@/store';
import { GlassSurface } from '@/components/GlassSurface';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface NavItem {
  screen: ScreenName;
  label: string;
  icon: IoniconName; // filled — shown when active
  iconOutline: IoniconName;
}

const navItems: NavItem[] = [
  { screen: 'home', label: 'Home', icon: 'home', iconOutline: 'home-outline' },
  { screen: 'livestock', label: 'Livestock', icon: 'paw', iconOutline: 'paw-outline' },
  { screen: 'health', label: 'Health', icon: 'medkit', iconOutline: 'medkit-outline' },
  { screen: 'operations', label: 'Operations', icon: 'briefcase', iconOutline: 'briefcase-outline' },
];

const BAR_HEIGHT = 64;
const BAR_RADIUS = BAR_HEIGHT / 2;
const ITEM_HEIGHT = 48;

/** Distance from the screen's bottom edge to the bar's bottom edge. */
function useBarOffset() {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom - 8, spacing.md);
}

/** Bottom padding tab screens need so their last item can scroll clear of the floating bar. */
export function useTabBarSpace() {
  return BAR_HEIGHT + useBarOffset() + spacing.lg;
}

export function NativeTabBar() {
  const { screen, navigate } = useApp();
  const bottom = useBarOffset();
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // Android resizes the window for the keyboard, which would lift the floating bar above it
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (keyboardOpen) return null;

  return (
    <View style={[styles.shadow, { bottom }]}>
      <GlassSurface radius={BAR_RADIUS} interactive style={styles.bar}>
        {navItems.map((item) => {
          const active = screen === item.screen;
          return (
            <TouchableOpacity
              key={item.screen}
              activeOpacity={0.75}
              onPress={() => {
                if (active) return;
                // Only animate size/position changes so the capsule glides; the new screen itself appears instantly
                LayoutAnimation.configureNext({ duration: 220, update: { type: 'easeInEaseOut' } });
                navigate(item.screen);
              }}
              style={[styles.item, active && styles.itemActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={item.label}
            >
              <Ionicons
                name={active ? item.icon : item.iconOutline}
                size={icon.md + 2}
                color={active ? colors.white : colors.charcoal700}
              />
              {active && (
                <Text style={styles.label} numberOfLines={1}>
                  {item.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  // Shadow lives on a wrapper: the glass itself clips its children to the pill shape
  shadow: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    height: BAR_HEIGHT,
    borderRadius: BAR_RADIUS,
    ...Platform.select({
      ios: {
        shadowColor: colors.forest900,
        shadowOpacity: 0.18,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 10 },
      default: { boxShadow: '0 8px 24px rgba(16, 42, 28, 0.18)' },
    }),
  },
  bar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  item: {
    height: ITEM_HEIGHT,
    minWidth: ITEM_HEIGHT,
    borderRadius: ITEM_HEIGHT / 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  itemActive: {
    backgroundColor: colors.forest700,
    paddingHorizontal: 18,
  },
  label: {
    fontSize: font.body,
    fontWeight: weight.semibold,
    color: colors.white,
  },
});
