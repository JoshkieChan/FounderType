import React, { useState, useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  refreshing?: boolean;
  colors?: string[];
  tintColor?: string;
}

export default function PullToRefresh({
  children,
  onRefresh,
  refreshing = false,
  colors = ['#3B82F6'],
  tintColor = '#3B82F6',
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(refreshing);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={colors}
          tintColor={tintColor}
        />
      }
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
