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

  const siteKey =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_HCAPTCHA_SITE_KEY) ||
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_HCAPTCHA_SITE_KEY);

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
