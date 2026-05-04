import React from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import type { HCaptchaProps } from '@hcaptcha/react-hcaptcha';
import { Platform, Text, View } from 'react-native';
import Logger from '../lib/logger';

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

  // Use your actual hCaptcha site key
  const siteKey = '2c0c3648-eb10-44b0-ab5e-1580a6085e80';
  
  Logger.debug('HCaptcha Site key from env:', siteKey ? 'SET' : 'NOT_SET');

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
