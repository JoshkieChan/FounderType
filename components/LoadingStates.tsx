import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton from './Skeleton';

export function QuestionSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Skeleton width={60} height={20} borderRadius={10} />
        <View style={styles.dotsContainer}>
          <Skeleton width={8} height={8} borderRadius={4} />
          <Skeleton width={24} height={8} borderRadius={4} />
          <Skeleton width={8} height={8} borderRadius={4} />
        </View>
        <Skeleton width={60} height={20} borderRadius={10} />
      </View>
      
      <View style={styles.content}>
        <Skeleton width={120} height={16} borderRadius={8} style={styles.questionNumber} />
        <Skeleton width="100%" height={32} borderRadius={8} style={styles.questionText} />
        
        <View style={styles.optionsContainer}>
          <Skeleton width="100%" height={60} borderRadius={12} style={styles.option} />
          <Skeleton width="100%" height={60} borderRadius={12} style={styles.option} />
          <Skeleton width="100%" height={60} borderRadius={12} style={styles.option} />
          <Skeleton width="100%" height={60} borderRadius={12} style={styles.option} />
        </View>
      </View>
    </View>
  );
}

export function ResultsSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.resultsHeader}>
        <Skeleton width={150} height={24} borderRadius={12} />
        <Skeleton width="80%" height={16} borderRadius={8} style={styles.subtitle} />
      </View>
      
      <View style={styles.scoresContainer}>
        {Array.from({ length: 4 }).map((_, index) => (
          <View key={index} style={styles.scoreItem}>
            <Skeleton width={100} height={20} borderRadius={10} />
            <Skeleton width={60} height={40} borderRadius={8} />
          </View>
        ))}
      </View>
      
      <View style={styles.matchesContainer}>
        {Array.from({ length: 3 }).map((_, index) => (
          <View key={index} style={styles.matchItem}>
            <Skeleton width={120} height={18} borderRadius={9} />
            <Skeleton width="100%" height={12} borderRadius={6} style={styles.matchDesc} />
            <Skeleton width={80} height={24} borderRadius={12} />
          </View>
        ))}
      </View>
      
      <Skeleton width="100%" height={50} borderRadius={12} style={styles.ctaButton} />
    </View>
  );
}

export function UpgradeSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.upgradeHeader}>
        <Skeleton width={80} height={24} borderRadius={12} />
        <Skeleton width="90%" height={28} borderRadius={8} style={styles.title} />
        <Skeleton width="85%" height={16} borderRadius={8} style={styles.subtitle} />
      </View>
      
      <View style={styles.featuresContainer}>
        {Array.from({ length: 6 }).map((_, index) => (
          <View key={index} style={styles.featureItem}>
            <Skeleton width={24} height={24} borderRadius={12} />
            <Skeleton width="70%" height={16} borderRadius={8} />
          </View>
        ))}
      </View>
      
      <View style={styles.pricingCard}>
        <Skeleton width={120} height={16} borderRadius={8} />
        <Skeleton width={80} height={48} borderRadius={8} style={styles.price} />
        <Skeleton width={100} height={14} borderRadius={7} />
      </View>
      
      <Skeleton width="100%" height={56} borderRadius={12} style={styles.purchaseButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  content: {
    flex: 1,
  },
  questionNumber: {
    marginBottom: 16,
  },
  questionText: {
    marginBottom: 32,
  },
  optionsContainer: {
    gap: 16,
  },
  option: {
    marginBottom: 4,
  },
  resultsHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  subtitle: {
    marginTop: 8,
  },
  scoresContainer: {
    marginBottom: 32,
  },
  scoreItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  matchesContainer: {
    marginBottom: 32,
  },
  matchItem: {
    marginBottom: 20,
  },
  matchDesc: {
    marginVertical: 8,
  },
  ctaButton: {
    marginTop: 16,
  },
  upgradeHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    marginTop: 12,
  },
  featuresContainer: {
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  pricingCard: {
    alignItems: 'center',
    marginBottom: 24,
  },
  price: {
    marginVertical: 8,
  },
  purchaseButton: {
    marginTop: 16,
  },
});
