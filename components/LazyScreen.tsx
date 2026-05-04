import React, { Suspense } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

interface LazyScreenProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function LazyScreen({ children, fallback }: LazyScreenProps) {
  const defaultFallback = (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3B82F6" />
    </View>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },
});
