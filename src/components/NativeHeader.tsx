import React, { type ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, font, weight, icon } from '@/theme';
import { farmInfo } from '@/data';
import { useApp } from '@/store';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showNotifications?: boolean;
  showProfile?: boolean;
  rightAction?: ReactNode;
}

export function NativeHeader({
  title,
  showBack,
  showNotifications = true,
  showProfile = true,
  rightAction,
}: HeaderProps) {
  const { goBack, navigate, setIsNotificationsOpen } = useApp();

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftContainer}>
        {showBack && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={goBack}
            style={styles.backButton}
            hitSlop={8}
            accessibilityLabel="Back"
          >
            <Ionicons name="arrow-back" size={icon.md} color={colors.forest700} />
          </TouchableOpacity>
        )}
        {title && <Text style={styles.headerTitle}>{title}</Text>}
      </View>

      <View style={styles.rightContainer}>
        {rightAction}
        {showNotifications && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsNotificationsOpen(true)}
            style={styles.iconButton}
          >
            <Ionicons name="notifications-outline" size={icon.md} color={colors.charcoal600} />
            <View style={styles.unreadDot} />
          </TouchableOpacity>
        )}
        {showProfile && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigate('settings')}
            style={styles.profileBadge}
          >
            <Text style={styles.profileBadgeText}>
              {farmInfo.owner
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    height: 52,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.charcoal100,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: font.title,
    fontWeight: weight.bold,
    color: colors.charcoal800,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.rust500,
  },
  profileBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.forest700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBadgeText: {
    fontSize: font.caption,
    fontWeight: weight.bold,
    color: colors.white,
  },
});
