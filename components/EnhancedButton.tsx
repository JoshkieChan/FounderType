import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { MobilePolish } from '../lib/mobilePolish';

interface EnhancedButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  haptic?: boolean;
  animationType?: 'scale' | 'bounce' | 'shake';
}

export const EnhancedButton: React.FC<EnhancedButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  haptic = true,
  _animationType = 'scale',
}) => {
  const { colors } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    // Trigger haptic feedback
    if (haptic && Platform.OS !== 'web') {
      MobilePolish.triggerTouchFeedback();
    }

    // Animate button press
    Animated.spring(scaleAnim, {
      toValue: MobilePolish.shouldReduceComplexity() ? 0.98 : 0.95,
      useNativeDriver: Platform.OS !== 'web',
      friction: 8,
      tension: 100,
    }).start();
  };

  const handlePressOut = () => {
    // Animate button release
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: Platform.OS !== 'web',
      friction: 5,
      tension: 100,
    }).start();
  };

  const handlePress = () => {
    if (disabled || loading) return;

    // Trigger success haptic for primary actions
    if (variant === 'primary' && haptic && Platform.OS !== 'web') {
      MobilePolish.triggerSuccessFeedback();
    }

    onPress();
  };

  const getButtonStyles = () => {
    const baseStyles = {
      ...styles.button,
      opacity: disabled ? 0.5 : 1,
      transform: [{ scale: scaleAnim }],
    };

    const sizeStyles = {
      small: { paddingVertical: 8, paddingHorizontal: 16 },
      medium: { paddingVertical: 12, paddingHorizontal: 24 },
      large: { paddingVertical: 16, paddingHorizontal: 32 },
    };

    const variantStyles = {
      primary: {
        backgroundColor: colors.primary,
        borderWidth: 0,
      },
      secondary: {
        backgroundColor: colors.secondary,
        borderWidth: 0,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: colors.primary,
      },
    };

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const getTextStyles = () => {
    const baseStyles = {
      ...styles.text,
      color: variant === 'outline' ? colors.primary : '#ffffff',
    };

    const sizeStyles = {
      small: { fontSize: 14 },
      medium: { fontSize: 16 },
      large: { fontSize: 18 },
    };

    return {
      ...baseStyles,
      ...sizeStyles[size],
    };
  };

  return (
    <Animated.View style={styles.container}>
      <TouchableOpacity
        style={getButtonStyles()}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        <Text style={getTextStyles()}>{loading ? 'Loading...' : title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      },
    }),
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
