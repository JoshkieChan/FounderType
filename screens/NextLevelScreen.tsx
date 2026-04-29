import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Purchases from 'react-native-purchases';
import * as Sentry from '@sentry/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHaptics } from '../hooks/useHaptics';

export default function NextLevelScreen({ navigation }: { navigation: any }) {
  const [loading, setLoading] = useState(false);
  const { medium } = useHaptics();

  const handlePurchase = async () => {
    medium();
    Sentry.addBreadcrumb({
      message: 'next_level_purchase_tapped',
      level: 'info'
    });
    
    try {
      setLoading(true);
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
        const purchaseResult = await Purchases.purchasePackage(
          offerings.current.availablePackages[0]
        );
        
        if (purchaseResult.customerInfo.entitlements.active.nextlevel) {
          // Purchase successful, navigate to next level questions
          navigation.navigate('nextLevelQuestions');
        }
      }
    } catch (e: any) {
      if (e.userCancelled) {
        // User cancelled - not an error, do nothing
        return;
      }
      // Only log real errors to Sentry
      Sentry.captureException(e);
      Alert.alert('Purchase failed', 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      setLoading(true);
      const customerInfo = await Purchases.restorePurchases();
      
      if (customerInfo.entitlements.active.nextlevel) {
        navigation.navigate('nextLevelQuestions');
      } else {
        Alert.alert('No purchases found', 'No Next Level purchases were found to restore.');
      }
    } catch (e: any) {
      Sentry.captureException(e);
      Alert.alert('Restore failed', 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.navigate('landing')} style={styles.backButton}>
          <Text style={styles.backText}>×</Text>
        </TouchableOpacity>

        <View style={styles.headerContainer}>
          <Text style={styles.header}>You've outgrown your first profile.</Text>
          <Text style={styles.subtext}>
            The Next Level assessment goes deeper. 5 harder questions. A more precise match. Built for founders who have already taken action.
          </Text>
        </View>

        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>What you'll get:</Text>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureCheck}>{"\u2713"}</Text>
            <Text style={styles.featureText}>Advanced psychological profiling</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureCheck}>{"\u2713"}</Text>
            <Text style={styles.featureText}>Revenue model deep-dive</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureCheck}>{"\u2713"}</Text>
            <Text style={styles.featureText}>Specific tool and resource recommendations</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureCheck}>{"\u2713"}</Text>
            <Text style={styles.featureText}>90-day advanced action plan</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureCheck}>{"\u2713"}</Text>
            <Text style={styles.featureText}>Founder archetype comparison</Text>
          </View>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>One-time purchase</Text>
          <Text style={styles.price}>$19</Text>
        </View>

        <TouchableOpacity 
          style={[styles.purchaseButton, loading && styles.purchaseButtonDisabled]} 
          onPress={handlePurchase}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.buttonContent}>
              <ActivityIndicator size="small" color="#FFFFFF" style={styles.spinner} />
              <Text style={styles.purchaseButtonText}>Processing...</Text>
            </View>
          ) : (
            <Text style={styles.purchaseButtonText}>Unlock Next Level</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleRestore} disabled={loading}>
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </TouchableOpacity>

        <Text style={styles.availabilityText}>
          Only available after completing your first assessment
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerContainer: {
    marginBottom: 40,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3B82F6',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 38,
  },
  subtext: {
    fontSize: 18,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 26,
  },
  featuresContainer: {
    marginBottom: 40,
    backgroundColor: '#1A1A1A',
    padding: 24,
    borderRadius: 12,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureCheck: {
    fontSize: 20,
    color: '#3B82F6',
    fontWeight: 'bold',
    marginRight: 12,
    width: 24,
  },
  featureText: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
    lineHeight: 22,
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  priceLabel: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 4,
  },
  price: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  purchaseButton: {
    backgroundColor: '#3B82F6',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginRight: 8,
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  restoreText: {
    color: '#888888',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  availabilityText: {
    color: '#666666',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
