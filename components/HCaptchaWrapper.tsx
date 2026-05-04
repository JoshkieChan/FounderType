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

  // Read from environment variables (works in local dev, need to fix for Vercel Expo web)
  // TODO: Fix environment variable injection in Expo web build
  const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || process.env.EXPO_PUBLIC_HCAPTCHA_SITE_KEY;
  
  console.log('HCaptcha Debug - Site key from env:', siteKey ? 'SET' : 'NOT_SET');

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
