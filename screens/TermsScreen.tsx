import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface TermsScreenProps {
  navigation: {
    goBack: () => void;
  };
}

export default function TermsScreen({ navigation }: TermsScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.effectiveDate}>Effective: May 2, 2026</Text>

        <Text style={styles.sectionTitle}>Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By using FounderType, you agree to these Terms of Service. If you
          don't agree, don't use the app.
        </Text>

        <Text style={styles.sectionTitle}>What FounderType Does</Text>
        <Text style={styles.paragraph}>
          FounderType is a public accountability system. You post a 30-day
          commitment, check in daily, and your progress is publicly visible.
          Abandoned commitments are marked as such for everyone to see.
        </Text>

        <Text style={styles.sectionTitle}>Your Commitments Are Public</Text>
        <Text style={styles.paragraph}>
          When you post a commitment, it becomes public immediately. Anyone
          using FounderType can see:{'\n\n'}- Your commitment text{'\n'}- Your
          daily action{'\n'}- Your check-in progress{'\n'}- Whether you
          completed, are active, or abandoned it{'\n\n'}
          By posting, you consent to this public visibility.
        </Text>

        <Text style={styles.sectionTitle}>Account Rules</Text>
        <Text style={styles.paragraph}>
          You are responsible for:{'\n\n'}- Posting real commitments (no spam,
          abuse, or harassment){'\n'}- Checking in honestly{'\n'}- Not
          impersonating others{'\n'}- Not posting illegal, harmful, or offensive
          content{'\n\n'}
          We reserve the right to remove content or terminate accounts that
          violate these rules.
        </Text>

        <Text style={styles.sectionTitle}>No Guarantees</Text>
        <Text style={styles.paragraph}>
          FounderType is a tool, not a guarantee. We don't promise you'll
          complete your commitment, get customers, or make money. Your results
          depend entirely on your own actions.
        </Text>

        <Text style={styles.sectionTitle}>Liability</Text>
        <Text style={styles.paragraph}>
          FounderType is provided "as is" without warranties. We're not liable
          for:{'\n\n'}- Lost data or commitments{'\n'}- App downtime or bugs
          {'\n'}- Business outcomes or failures{'\n'}- Any damages from using
          (or not using) the app
        </Text>

        <Text style={styles.sectionTitle}>Termination</Text>
        <Text style={styles.paragraph}>
          You can request account-associated data deletion anytime by emailing
          updates@signaldatasource.com. We can terminate accounts that violate
          these terms without notice.
        </Text>

        <Text style={styles.sectionTitle}>Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We may update these terms. Continued use after changes means you
          accept the new terms.
        </Text>

        <Text style={styles.sectionTitle}>Contact</Text>
        <Text style={styles.paragraph}>
          Questions? Email us at updates@signaldatasource.com
        </Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            These terms are designed to be honest and straightforward.
            FounderType is a public accountability system. Use it to finish what
            you start.
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
  effectiveDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    color: '#D1D5DB',
    lineHeight: 24,
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
