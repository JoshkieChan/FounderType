import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import * as Sentry from '@sentry/react-native';

export default function OnboardingScreen({ navigation }: { navigation: any }) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Image 
            source={require('../assets/foundertype-icon.png')}
            style={{
              width: 80,
              height: 80,
              borderRadius: 18,
              marginBottom: 24
            }}
          />
        </View>
        
        <Text style={styles.headline}>
          The honest truth about building
        </Text>
        
        <View style={styles.bodyContainer}>
          <Text style={styles.bodyText}>
            Most people spend years trying the wrong things. Not because they lack drive 
            {/* eslint-disable-next-line react-native/no-inline-styles */}
            <Text style={{ fontWeight: '600' }}> because nobody told them what actually fits them.</Text>
          </Text>
          
          <Text style={styles.bodyText}>
            FounderType asks you 7 honest questions. Then it tells you exactly what business 
            model fits your skills, psychology, and lifestyle {/* eslint-disable-next-line react-native/no-inline-styles */}
            <Text style={{ fontWeight: '600' }}> and what will make you quit.</Text>
          </Text>
          
          <Text style={styles.bodyText}>
            No motivation. No generic advice. {/* eslint-disable-next-line react-native/no-inline-styles */}
            <Text style={{ fontWeight: '600' }}> Just the truth about where you should focus.</Text>
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.ctaButton}
          onPress={() => {
            Sentry.addBreadcrumb({
              message: 'assessment_started',
              level: 'info'
            });
            navigation.navigate('questions');
          }}
        >
          <Text style={styles.ctaText}>I'm ready to be honest</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 400,
    alignSelf: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  icon: {
    width: 32,
    height: 32,
    backgroundColor: '#3B82F6',
    borderRadius: 16,
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 32,
  },
  bodyContainer: {
    marginBottom: 48,
  },
  bodyText: {
    fontSize: 17,
    color: '#888888',
    lineHeight: 26,
    marginBottom: 20,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
