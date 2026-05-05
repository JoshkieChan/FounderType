import React from 'react';
import { StyleSheet, Animated, Platform, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { MobilePolish } from '../lib/mobilePolish';

interface AnimatedCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  animationType?: 'slideIn' | 'fadeIn' | 'scaleIn' | 'bounceIn';
  delay?: number;
  duration?: number;
  haptic?: boolean;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  style,
  animationType = 'fadeIn',
  delay = 0,
  duration,
  haptic = false,
}) => {
  const { colors } = useTheme();

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(
    new Animated.Value(animationType === 'slideIn' ? 50 : 0)
  ).current;
  const scaleAnim = React.useRef(
    new Animated.Value(animationType === 'scaleIn' ? 0.8 : 1)
  ).current;

  React.useEffect(() => {
    const animationDuration =
      duration || MobilePolish.getAnimationDuration(300);

    // Trigger haptic feedback on mount if requested
    if (haptic && Platform.OS !== 'web') {
      setTimeout(() => {
        MobilePolish.triggerTouchFeedback();
      }, delay);
    }

    // Start animations
    const animations = [];

    // Fade animation
    animations.push(
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: animationDuration,
        delay,
        useNativeDriver: Platform.OS !== 'web',
      })
    );

    // Slide animation
    if (animationType === 'slideIn') {
      animations.push(
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: animationDuration,
          delay,
          useNativeDriver: Platform.OS !== 'web',
        })
      );
    }

    // Scale animation
    if (animationType === 'scaleIn' || animationType === 'bounceIn') {
      const springConfig =
        animationType === 'bounceIn'
          ? { friction: 3, tension: 40 }
          : { friction: 7, tension: 40 };

      animations.push(
        Animated.spring(scaleAnim, {
          toValue: 1,
          ...springConfig,
          useNativeDriver: Platform.OS !== 'web',
        })
      );
    }

    // Run animations in parallel
    Animated.parallel(animations).start();
  }, [animationType, delay, duration, haptic]);

  const getCardStyles = () => {
    const baseStyles = {
      ...styles.card,
      backgroundColor: colors.card,
      borderColor: colors.border,
    };

    const transform = [];

    // Add slide
    if (animationType === 'slideIn') {
      transform.push({ translateY: slideAnim });
    }

    // Add scale
    if (animationType === 'scaleIn' || animationType === 'bounceIn') {
      transform.push({ scale: scaleAnim });
    }

    return {
      ...baseStyles,
      opacity: fadeAnim,
      transform,
      ...style,
    };
  };

  return <Animated.View style={getCardStyles()}>{children}</Animated.View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
      },
    }),
  },
});
