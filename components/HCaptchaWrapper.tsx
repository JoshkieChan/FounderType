import React from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import type { HCaptchaProps } from '@hcaptcha/react-hcaptcha';
import { Platform, Text, View } from 'react-native';

type HCaptchaWrapperProps = Pick<
  HCaptchaProps,
  'onVerify' | 'onExpire' | 'onError'
>;

export default function HCaptchaWrapper({
  onVerify,
  onExpire,
  onError,
}: HCaptchaWrapperProps) {
  if (Platform.OS !== 'web') {
    return null; // Captcha handled differently on mobile
  }

  // Try multiple ways to access environment variables in Expo web
  const nextPublicSiteKey = 
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_HCAPTCHA_SITE_KEY) ||
    (typeof window !== 'undefined' && (window as any).__ENV?.NEXT_PUBLIC_HCAPTCHA_SITE_KEY) ||
    (typeof globalThis !== 'undefined' && (globalThis as any).process?.env?.NEXT_PUBLIC_HCAPTCHA_SITE_KEY);
    
  const expoPublicSiteKey = 
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_HCAPTCHA_SITE_KEY) ||
    (typeof window !== 'undefined' && (window as any).__ENV?.EXPO_PUBLIC_HCAPTCHA_SITE_KEY) ||
    (typeof globalThis !== 'undefined' && (globalThis as any).process?.env?.EXPO_PUBLIC_HCAPTCHA_SITE_KEY);
  
  // Debug logging
  console.log('HCaptcha Debug - process.env exists:', typeof process !== 'undefined');
  console.log('HCaptcha Debug - window exists:', typeof window !== 'undefined');
  console.log('HCaptcha Debug - globalThis exists:', typeof globalThis !== 'undefined');
  console.log('HCaptcha Debug - NEXT_PUBLIC_HCAPTCHA_SITE_KEY:', nextPublicSiteKey ? 'SET' : 'NOT_SET');
  console.log('HCaptcha Debug - EXPO_PUBLIC_HCAPTCHA_SITE_KEY:', expoPublicSiteKey ? 'SET' : 'NOT_SET');
  console.log('HCaptcha Debug - NEXT_PUBLIC value:', nextPublicSiteKey);
  console.log('HCaptcha Debug - All process.env keys:', typeof process !== 'undefined' ? Object.keys(process.env || {}).filter(k => k.includes('HCAPTCHA')) : 'process undefined');
  
  const siteKey = nextPublicSiteKey || expoPublicSiteKey;

  if (!siteKey) {
    return (
      <View style={{ marginVertical: 16, alignItems: 'center' }}>
        <Text style={{ color: '#EF4444', fontSize: 14 }}>
          Security check is not configured.
        </Text>
        <Text style={{ color: '#888888', fontSize: 12, textAlign: 'center', marginTop: 8 }}>
          Please add NEXT_PUBLIC_HCAPTCHA_SITE_KEY to your environment variables.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ marginVertical: 16, alignItems: 'center' }}>
      <HCaptcha
        sitekey={siteKey}
        theme="dark"
        onVerify={onVerify}
        onExpire={onExpire}
        onError={onError}
      />
    </View>
  );
}
