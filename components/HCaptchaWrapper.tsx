import React from 'react';
import { Platform, View } from 'react-native';

let HCaptcha: any;
if (Platform.OS === 'web') {
  HCaptcha = require('@hcaptcha/react-hcaptcha');
}

interface HCaptchaWrapperProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (err: any) => void;
}

export default function HCaptchaWrapper({ onVerify, onExpire, onError }: HCaptchaWrapperProps) {
  if (Platform.OS !== 'web') {
    return null; // Captcha handled differently on mobile (usually via Supabase directly or WebView)
  }

  return (
    <View style={{ marginVertical: 16, alignItems: 'center' }}>
      <HCaptcha
        sitekey={process.env.EXPO_PUBLIC_HCAPTCHA_SITE_KEY}
        onVerify={onVerify}
        onExpire={onExpire}
        onError={onError}
      />
    </View>
  );
}
