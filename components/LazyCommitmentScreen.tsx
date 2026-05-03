import React, { Suspense, lazy } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CommitmentScreen = lazy(() => import('../screens/CommitmentScreen'));

const LoadingFallback = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  </SafeAreaView>
);

export default function LazyCommitmentScreen(props: any) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CommitmentScreen {...props} />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
