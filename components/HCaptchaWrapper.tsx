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

  // Check all possible locations for environment variables in Expo web
  const windowKeys = typeof window !== 'undefined' ? Object.keys(window).filter(k => k.includes('HCAPTCHA') || k.includes('NEXT_PUBLIC')) : [];
  const globalThisKeys = typeof globalThis !== 'undefined' ? Object.keys(globalThis).filter(k => k.includes('HCAPTCHA') || k.includes('NEXT_PUBLIC')) : [];
  
  // Try different ways Vercel might inject env vars
  const nextPublicSiteKey = 
    (typeof window !== 'undefined' && (window as any).NEXT_PUBLIC_HCAPTCHA_SITE_KEY) ||
    (typeof window !== 'undefined' && (window as any).__NEXT_PUBLIC_HCAPTCHA_SITE_KEY) ||
    (typeof window !== 'undefined' && (window as any).env?.NEXT_PUBLIC_HCAPTCHA_SITE_KEY) ||
    (typeof globalThis !== 'undefined' && (globalThis as any).NEXT_PUBLIC_HCAPTCHA_SITE_KEY) ||
    (typeof globalThis !== 'undefined' && (globalThis as any).__NEXT_PUBLIC_HCAPTCHA_SITE_KEY) ||
    (typeof globalThis !== 'undefined' && (globalThis as any).env?.NEXT_PUBLIC_HCAPTCHA_SITE_KEY);
    
  const expoPublicSiteKey = 
    (typeof window !== 'undefined' && (window as any).EXPO_PUBLIC_HCAPTCHA_SITE_KEY) ||
    (typeof window !== 'undefined' && (window as any).__EXPO_PUBLIC_HCAPTCHA_SITE_KEY) ||
    (typeof window !== 'undefined' && (window as any).env?.EXPO_PUBLIC_HCAPTCHA_SITE_KEY) ||
    (typeof globalThis !== 'undefined' && (globalThis as any).EXPO_PUBLIC_HCAPTCHA_SITE_KEY) ||
    (typeof globalThis !== 'undefined' && (globalThis as any).__EXPO_PUBLIC_HCAPTCHA_SITE_KEY) ||
    (typeof globalThis !== 'undefined' && (globalThis as any).env?.EXPO_PUBLIC_HCAPTCHA_SITE_KEY);
  
  // Debug logging
  console.log('HCaptcha Debug - window HCAPTCHA keys:', windowKeys);
  console.log('HCaptcha Debug - globalThis HCAPTCHA keys:', globalThisKeys);
  console.log('HCaptcha Debug - NEXT_PUBLIC_HCAPTCHA_SITE_KEY:', nextPublicSiteKey ? 'SET' : 'NOT_SET');
  console.log('HCaptcha Debug - EXPO_PUBLIC_HCAPTCHA_SITE_KEY:', expoPublicSiteKey ? 'SET' : 'NOT_SET');
  console.log('HCaptcha Debug - NEXT_PUBLIC value:', nextPublicSiteKey);
  console.log('HCaptcha Debug - window object sample:', typeof window !== 'undefined' ? Object.keys(window).slice(0, 10) : 'no window');
  
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
