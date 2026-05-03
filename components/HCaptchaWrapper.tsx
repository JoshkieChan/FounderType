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

export default function HCaptchaWrapper({
  onVerify,
  onExpire,
  onError,
}: HCaptchaWrapperProps) {
  if (Platform.OS === 'web') {
    return null; // HCaptcha web component incompatible with Metro bundler
  }

  return null; // Captcha handled differently on mobile
}
