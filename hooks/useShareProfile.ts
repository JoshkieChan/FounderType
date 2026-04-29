import { Share, Platform } from 'react-native';
import { FounderProfile } from '../types';

interface ShareProfileOptions {
  profile: FounderProfile;
  answers?: Record<number, string>;
  includeDetails?: boolean;
}

export function useShareProfile() {
  const shareProfile = async ({ profile, answers, includeDetails = false }: ShareProfileOptions) => {
    try {
      let shareText = `My FounderType: ${profile.founderType}\n\n`;
      
      if (includeDetails) {
        shareText += `${profile.summary}\n\n`;
        
        if (profile.matches.length > 0) {
          shareText += 'Top Matches:\n';
          profile.matches.slice(0, 3).forEach((match, index) => {
            shareText += `${index + 1}. ${match.model} (${match.overallScore}%)\n`;
          });
        }
      } else {
        shareText += 'Discover your FounderType at FounderType.app\n\n';
        shareText += '#FounderType #Startup #Entrepreneur';
      }

      if (Platform.OS === 'web') {
        // Web sharing - copy to clipboard and open share dialog
        if (navigator.share) {
          await navigator.share({
            title: `My FounderType: ${profile.founderType}`,
            text: shareText,
            url: window.location.origin,
          });
        } else {
          // Fallback: copy to clipboard
          await navigator.clipboard.writeText(shareText);
          return { success: true, method: 'clipboard' };
        }
      } else {
        // Native sharing
        await Share.share({
          title: `My FounderType: ${profile.founderType}`,
          message: shareText,
          url: 'https://foundertype.app', // Replace with actual URL
        });

        return { success: true, method: 'native' };
      }
    } catch (error: any) {
      console.error('Share failed:', error);
      return { success: false, error: error?.message || 'Share failed' };
    }
  };

  const shareResults = async (profile: FounderProfile) => {
    return shareProfile({ profile, includeDetails: true });
  };

  const shareSummary = async (profile: FounderProfile) => {
    return shareProfile({ profile, includeDetails: false });
  };

  return {
    shareProfile,
    shareResults,
    shareSummary,
  };
}
