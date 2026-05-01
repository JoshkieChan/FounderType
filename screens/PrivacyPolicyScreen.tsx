import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

export default function PrivacyPolicyScreen({ navigation }: { navigation: any }) {
  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.navigate('landing')} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.date}>Effective: {today}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What We Collect</Text>
          <Text style={styles.sectionText}>
            We collect only what's necessary to run the diagnostic and public accountability tracker:
          </Text>
          <Text style={styles.bulletPoint}>- Your answers to the 7 assessment questions</Text>
          <Text style={styles.bulletPoint}>- Your founder type result</Text>
          <Text style={styles.bulletPoint}>- Public commitment text, daily action, and check-in progress</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What We DON'T Collect</Text>
          <Text style={styles.sectionText}>
            We intentionally do not collect:
          </Text>
          <Text style={styles.bulletPoint}>- Your name or personal identity</Text>
          <Text style={styles.bulletPoint}>- Email address or contact information</Text>
          <Text style={styles.bulletPoint}>- Location data</Text>
          <Text style={styles.bulletPoint}>- Device identifiers beyond what's necessary</Text>
          <Text style={styles.bulletPoint}>- Social media profiles or accounts</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How We Use Your Data</Text>
          <Text style={styles.sectionText}>
            Your data is used exclusively for:
          </Text>
          <Text style={styles.bulletPoint}>- Calculating your founder type locally from your answers</Text>
          <Text style={styles.bulletPoint}>- Showing your public 30-day commitment in the feed</Text>
          <Text style={styles.bulletPoint}>- Tracking daily check-ins and abandoned/completed status</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Third-Party Services</Text>
          <Text style={styles.sectionText}>
            We use trusted third-party services:
          </Text>
          <Text style={styles.bulletPoint}>- <Text style={styles.bold}>Supabase</Text> - Secure data storage</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Security</Text>
          <Text style={styles.sectionText}>
            We protect your data with:
          </Text>
          <Text style={styles.bulletPoint}>- End-to-end encryption for sensitive data</Text>
          <Text style={styles.bulletPoint}>- Secure cloud storage via Supabase</Text>
          <Text style={styles.bulletPoint}>- Limited data access to essential personnel only</Text>
          <Text style={styles.bulletPoint}>- Regular security audits and updates</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Rights</Text>
          <Text style={styles.sectionText}>
            You have the right to:
          </Text>
          <Text style={styles.bulletPoint}>- Access your data at any time</Text>
          <Text style={styles.bulletPoint}>- Request deletion of your data</Text>
          <Text style={styles.bulletPoint}>- Opt out of data collection</Text>
          <Text style={styles.bulletPoint}>- Export your data in portable format</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Text style={styles.sectionText}>
            If you have questions about this privacy policy or how we handle your data, please contact us at:
          </Text>
          <Text style={styles.contactEmail}>privacy@foundertype.app</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Changes to This Policy</Text>
          <Text style={styles.sectionText}>
            We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Effective" date above.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This privacy policy is designed to be transparent and user-focused. We believe in building trust through honesty about what data we collect and why.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 16,
    minWidth: 80,
    backgroundColor: '#333333',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    color: '#888888',
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 24,
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 16,
    color: '#CCCCCC',
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
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
