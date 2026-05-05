import React from 'react';
import { TouchableOpacity, ViewStyle, TextStyle, Platform } from 'react-native';
import { MobilePolish } from '../lib/mobilePolish';

interface HapticTouchableProps {
  children: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  hapticType?: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning';
  disabled?: boolean;
  activeOpacity?: number;
}

export const HapticTouchable: React.FC<HapticTouchableProps> = ({
  children,
  onPress,
  style,
  textStyle,
  hapticType = 'light',
  disabled = false,
  activeOpacity = 0.7,
}) => {
  const handlePress = () => {
    if (disabled) return;

    // Trigger haptic feedback
    if (Platform.OS !== 'web') {
      MobilePolish.triggerHaptic(hapticType);
    }

    onPress();
  };

  return (
    <TouchableOpacity
      style={style}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={activeOpacity}
    >
      {children}
    </TouchableOpacity>
  );
};
