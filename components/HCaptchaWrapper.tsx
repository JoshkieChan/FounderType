import React from 'react';
import { Text } from 'react-native';
export default function HCaptchaWrapper(_props: {
  onVerify?: (token: string) => void;
  onExpire?: () => void;
  onError?: (error?: string) => void;
}) {
  return (
    <Text style={{ color: '#888888' }}>
      Use the web app to complete the security check.
    </Text>
  );
}
