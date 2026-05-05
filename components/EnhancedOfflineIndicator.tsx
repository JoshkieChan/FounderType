import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNetInfo } from '@react-native-community/netinfo';

interface OfflineIndicatorProps {
  showBanner?: boolean;
  position?: 'top' | 'bottom';
}

export default function EnhancedOfflineIndicator({
  showBanner = true,
  position = 'top',
}: OfflineIndicatorProps) {
  const netInfo = useNetInfo();
  const [isOffline, setIsOffline] = useState(!netInfo.isConnected);
  const [slideAnim] = useState(new Animated.Value(isOffline ? 0 : -100));
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(null);

  useEffect(() => {
    const offline = !netInfo.isConnected;
    setIsOffline(offline);

    if (!offline && !lastOnlineTime) {
      setLastOnlineTime(new Date());
    }

    Animated.timing(slideAnim, {
      toValue: offline ? 0 : -100,
      duration: 300,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [netInfo.isConnected, slideAnim, lastOnlineTime]);

  const handleRetry = () => {
    // Trigger a reconnection attempt
    if (netInfo.isConnected) {
      setIsOffline(false);
    }
  };

  const getOfflineDuration = () => {
    if (!lastOnlineTime) return null;
    const now = new Date();
    const diff = now.getTime() - lastOnlineTime.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  if (!showBanner) return null;

  const containerStyle =
    position === 'top'
      ? [
          styles.container,
          styles.topContainer,
          { transform: [{ translateY: slideAnim }] },
        ]
      : [
          styles.container,
          styles.bottomContainer,
          { transform: [{ translateY: slideAnim }] },
        ];

  return (
    <Animated.View style={containerStyle}>
      <SafeAreaView edges={position === 'top' ? ['top'] : ['bottom']}>
        <View style={styles.content}>
          <View style={styles.leftContent}>
            <Ionicons
              name={isOffline ? 'cloud-offline-outline' : 'wifi'}
              size={20}
              color={isOffline ? '#ef4444' : '#10b981'}
            />
            <View style={styles.textContainer}>
              <Text
                style={[
                  styles.statusText,
                  { color: isOffline ? '#ef4444' : '#10b981' },
                ]}
              >
                {isOffline ? 'Offline' : 'Back Online'}
              </Text>
              {isOffline && (
                <Text style={styles.subText}>
                  {lastOnlineTime
                    ? `Last seen ${getOfflineDuration()}`
                    : 'No connection'}
                </Text>
              )}
            </View>
          </View>

          {isOffline && (
            <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
              <Ionicons name="refresh" size={16} color="#6366f1" />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  topContainer: {
    top: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  bottomContainer: {
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textContainer: {
    marginLeft: 8,
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  subText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 1,
  },
  retryButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
});
