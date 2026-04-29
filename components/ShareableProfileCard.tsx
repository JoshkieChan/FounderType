import React, { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';

interface ShareableProfileCardProps {
  founderType: string;
  topMatch: {
    model: string;
    score: number;
  };
  summary: string;
}

export default function ShareableProfileCard({ 
  founderType, 
  topMatch, 
  summary 
}: ShareableProfileCardProps) {
  const cardRef = useRef<View>(null);

  const generateShareCard = async () => {
    try {
      // Capture the card as an image
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 0.9,
      });

      // Share the image
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share Your FounderType',
      });
    } catch (error) {
      console.error('Failed to share profile card:', error);
    }
  };

  return (
    <View ref={cardRef} style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>YOUR FOUNDERTYPE</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.founderType}>{founderType}</Text>
        
        <View style={styles.matchContainer}>
          <Text style={styles.matchLabel}>Top Match</Text>
          <Text style={styles.matchModel}>{topMatch.model}</Text>
          <Text style={styles.matchScore}>{topMatch.score}% Match</Text>
        </View>
        
        <Text style={styles.summary} numberOfLines={2}>
          {summary}
        </Text>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.branding}>FounderType App</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0A0A0A',
    borderRadius: 16,
    padding: 24,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    marginBottom: 16,
  },
  label: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 1,
  },
  content: {
    alignItems: 'center',
  },
  founderType: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  matchContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  matchLabel: {
    color: '#888888',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  matchModel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  matchScore: {
    color: '#3B82F6',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  summary: {
    color: '#CCCCCC',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    marginTop: 20,
  },
  branding: {
    color: '#666666',
    fontSize: 12,
    textAlign: 'center',
  },
});
