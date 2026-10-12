import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PrivacyPolicyScreenProps {
  navigation: {
    goBack: () => void;
  };
}

export default function PrivacyPolicyScreen({
  navigation,
}: PrivacyPolicyScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.title}>Privacy and Data</Text>
        <Text style={styles.date}>Updated: October 12, 2026</Text>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Public content</Text>
          <Text style={styles.sectionText}>
            Commitment text, daily actions, status and check-in dates are
            publicly visible when you post. Records include a pseudonymous
            account identifier. Do not post sensitive or identifying
            information.
          </Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your session and local data</Text>
          <Text style={styles.sectionText}>
            FounderType uses an anonymous account session to associate saved
            records with you. Diagnostic progress, preferences and cached
            receipts may be stored on this device. Clearing browser or app
            storage can lose access to your anonymous account; account recovery
            is not implemented.
          </Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Private records</Text>
          <Text style={styles.sectionText}>
            Saved diagnostic profiles and accountability receipts are restricted
            to their account owner by database policies. Public commitment
            progress is visible with the commitment. A private commitment and
            its progress are restricted to its owner.
          </Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Optional services</Text>
          <Text style={styles.sectionText}>
            If configured, hCaptcha processes challenges, Supabase stores
            account and application data, Resend processes requested receipt
            emails, and Sentry receives technical diagnostics. Email recipient
            addresses and delivery attempts are logged on the server. Local
            usage events are stored on this device; web analytics forwarding
            depends on the hosting configuration.
          </Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deleting data</Text>
          <Text style={styles.sectionText}>
            Owners can delete commitments from the app while signed into the
            originating session. Full account deletion and recovery are not
            available in this version. A deployment operator must provide a
            private support channel and retention policy before accepting real
            user data.
          </Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this notice</Text>
          <Text style={styles.sectionText}>
            This notice describes the repository implementation. The services
            enabled and retention practices of a hosted installation must be
            disclosed by its operator. Use fictional information when evaluating
            a development installation.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  backButton: {
    color: '#3B82F6',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    color: '#D1D5DB',
    lineHeight: 24,
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 15,
    color: '#D1D5DB',
    lineHeight: 24,
    marginBottom: 8,
    paddingLeft: 20,
  },
  bold: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  contactEmail: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
    marginTop: 8,
  },
  footer: {
    marginTop: 32,
    marginBottom: 40,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  footerText: {
    fontSize: 14,
    color: '#888888',
    fontStyle: 'italic',
    lineHeight: 22,
  },
});
