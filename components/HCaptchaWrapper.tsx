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

  const nextPublicSiteKey = typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_HCAPTCHA_SITE_KEY : undefined;
  const expoPublicSiteKey = typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_HCAPTCHA_SITE_KEY : undefined;
  
  // Debug logging
  console.log('HCaptcha Debug - NEXT_PUBLIC_HCAPTCHA_SITE_KEY:', nextPublicSiteKey ? 'SET' : 'NOT_SET');
  console.log('HCaptcha Debug - EXPO_PUBLIC_HCAPTCHA_SITE_KEY:', expoPublicSiteKey ? 'SET' : 'NOT_SET');
  
  const siteKey = nextPublicSiteKey || expoPublicSiteKey;

  if (!siteKey) {
    return (
      <View style={{ marginVertical: 16, alignItems: 'center' }}>
        <Text style={{ color: '#EF4444', fontSize: 14 }}>
          Security check is not configured.
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
