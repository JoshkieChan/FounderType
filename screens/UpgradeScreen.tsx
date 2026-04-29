import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import Purchases from 'react-native-purchases';
import * as Sentry from '@sentry/react-native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getStoredProfile } from '../lib/profileStorage';

type UpgradeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'upgrade'>;

export default function UpgradeScreen({ navigation }: { navigation: UpgradeScreenNavigationProp }) {
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    Sentry.addBreadcrumb({
      message: 'upgrade_tapped',
      level: 'info'
    });
    try {
      setLoading(true);
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
        const purchaseResult = await Purchases.purchasePackage(
          offerings.current.availablePackages[0]
        );
        if (purchaseResult.customerInfo.entitlements.active['premium']) {
          // Get stored profile data for action plan
          const storedProfile = await getStoredProfile();
          if (storedProfile) {
            navigation.navigate('actionPlan', {
              answers: storedProfile.answers,
              founderType: storedProfile.founderType,
              topMatch: storedProfile.topMatch
            });
          } else {
            Alert.alert('Profile not found', 'Please complete the assessment first to generate your action plan.');
          }
        }
      } else {
        Alert.alert('Not available', 'The premium offering is not configured yet.');
      }
    } catch (e: any) {
      Sentry.captureException(e);
      if (!e.userCancelled) {
        Alert.alert('Purchase failed', 'Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      setLoading(true);
      const customerInfo = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active['premium']) {
        navigation.navigate('results');
      } else {
        Alert.alert('No purchases found', 'There are no previous purchases to restore.');
      }
    } catch (e: any) {
      Sentry.captureException(e);
      Alert.alert('Restore failed', 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.navigate('results');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>PREMIUM</Text>
          </View>
          <Text style={styles.title}>Unlock Your 30-Day Action Plan</Text>
          <Text style={styles.subtitle}>
            Get a personalized roadmap to launch your business based on your FounderType
          </Text>
        </View>

        <View style={styles.features}>
          <FeatureItem icon="📋" text="Custom 30-day launch timeline" />
          <FeatureItem icon="🎯" text="Weekly milestones & goals" />
          <FeatureItem icon="💡" text="Actionable tasks for your type" />
          <FeatureItem icon="📊" text="Progress tracking dashboard" />
          <FeatureItem icon="🔄" text="Pivot strategies when needed" />
          <FeatureItem icon="🎓" text="FounderType-specific resources" />
        </View>

        <View style={styles.pricingCard}>
          <Text style={styles.priceLabel}>One-time payment</Text>
          <Text style={styles.price}>$29</Text>
          <Text style={styles.priceSubtext}>Lifetime access</Text>
        </View>

        <TouchableOpacity
          style={[styles.subscribeButton, loading && styles.subscribeButtonDisabled]}
          onPress={handlePurchase}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.buttonContent}>
              <ActivityIndicator size="small" color="#FFFFFF" style={styles.spinner} />
              <Text style={styles.subscribeText}>Processing...</Text>
            </View>
          ) : (
            <Text style={styles.subscribeText}>Get Your Action Plan</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleRestore} disabled={loading}>
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </TouchableOpacity>

        <Text style={styles.guarantee}>
          30-day money-back guarantee • Secure payment
        </Text>
      </ScrollView>
    </View>
  );
}


function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  backButton: {
    padding: 8,
    marginBottom: 24,
  },
  backText: {
    color: '#888888',
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  badge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 36,
  },
  subtitle: {
    color: '#CCCCCC',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  features: {
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  featureText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  pricingCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  priceLabel: {
    color: '#888888',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  price: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 4,
  },
  priceSubtext: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  subscribeButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  subscribeButtonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  spinner: {
    marginRight: 8,
  },
  subscribeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  restoreText: {
    color: '#888888',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
    textDecorationLine: 'underline',
  },
  guarantee: {
    color: '#666666',
    fontSize: 12,
    textAlign: 'center',
  },
});
