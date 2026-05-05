// Mobile App Polish for FounderType
// Haptic feedback, native animations, and mobile-specific optimizations

import { Animated, Easing, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

type HapticType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'error'
  | 'warning';

export class MobilePolish {
  private static instance: MobilePolish;

  static getInstance(): MobilePolish {
    if (!MobilePolish.instance) {
      MobilePolish.instance = new MobilePolish();
    }
    return MobilePolish.instance;
  }

  static async triggerHaptic(type: HapticType): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          );
          break;
        case 'error':
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error
          );
          break;
        case 'warning':
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Warning
          );
          break;
      }
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  }

  static async triggerTouchFeedback(): Promise<void> {
    await this.triggerHaptic('light');
  }

  static async triggerSuccessFeedback(): Promise<void> {
    await this.triggerHaptic('success');
  }

  static async triggerErrorFeedback(): Promise<void> {
    await this.triggerHaptic('error');
  }

  static async triggerWarningFeedback(): Promise<void> {
    await this.triggerHaptic('warning');
  }

  static createSpringAnimation(
    toValue: number,
    duration: number = 300
  ): Animated.Value {
    const value = new Animated.Value(0);
    Animated.spring(value, {
      toValue,
      speed: Math.max(1, Math.round(1000 / duration)),
      bounciness: 8,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
    return value;
  }

  static createFadeAnimation(duration: number = 300): Animated.Value {
    const value = new Animated.Value(0);
    Animated.timing(value, {
      toValue: 1,
      duration,
      useNativeDriver: Platform.OS !== 'web',
      easing: Easing.linear,
    }).start();
    return value;
  }

  static createSlideInAnimation(
    fromValue: number = -100,
    duration: number = 300
  ): Animated.Value {
    const value = new Animated.Value(fromValue);
    Animated.timing(value, {
      toValue: 0,
      duration,
      useNativeDriver: Platform.OS !== 'web',
      easing: Easing.out(Easing.back(1)),
    }).start();
    return value;
  }

  static createScaleAnimation(
    fromValue: number = 0.8,
    duration: number = 200
  ): Animated.Value {
    const value = new Animated.Value(fromValue);
    Animated.timing(value, {
      toValue: 1,
      duration,
      useNativeDriver: Platform.OS !== 'web',
      easing: Easing.elastic(1),
    }).start();
    return value;
  }

  static createButtonPressAnimation(scaleTo: number = 0.95): Animated.Value {
    return this.createScaleAnimation(scaleTo, 100);
  }

  static createLoadingAnimation(): Animated.Value {
    return this.createFadeAnimation(1000);
  }

  static createShakeAnimation(): Animated.Value {
    const value = new Animated.Value(0);
    Animated.sequence([
      Animated.timing(value, {
        toValue: -10,
        duration: 60,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(value, {
        toValue: 10,
        duration: 60,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(value, {
        toValue: -10,
        duration: 60,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(value, {
        toValue: 10,
        duration: 60,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(value, {
        toValue: 0,
        duration: 60,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
    return value;
  }

  static createPulseAnimation(): Animated.Value {
    const value = new Animated.Value(1);
    Animated.sequence([
      Animated.timing(value, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: Platform.OS !== 'web',
        easing: Easing.ease,
      }),
      Animated.timing(value, {
        toValue: 1,
        duration: 150,
        useNativeDriver: Platform.OS !== 'web',
        easing: Easing.ease,
      }),
    ]).start();
    return value;
  }

  static createBounceAnimation(): Animated.Value {
    const value = new Animated.Value(0);
    Animated.spring(value, {
      toValue: 1,
      friction: 4,
      tension: 60,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
    return value;
  }

  createModalBackdropAnimation(): Animated.Value {
    return MobilePolish.createFadeAnimation(200);
  }

  static createStreakCelebrationAnimation(): Animated.Value {
    return this.createPulseAnimation();
  }

  static createAchievementUnlockAnimation(): Animated.Value {
    return this.createBounceAnimation();
  }

  static createCardHoverAnimation(): Record<string, unknown> {
    if (Platform.OS !== 'web') return {};
    return {
      transform: { scale: 1.02 },
      transition: { duration: 200, easing: 'ease-out' },
    };
  }

  static createPageTransition(): Record<string, unknown> {
    return {
      opacity: 1,
      transform: [{ translateY: 0 }],
      transition: {
        duration: Platform.OS === 'ios' ? 350 : 250,
        easing: 'ease-out',
      },
    };
  }

  static createStatusBarAnimation(): Record<string, unknown> {
    if (Platform.OS !== 'ios') return {};
    return {
      opacity: 1,
      transform: [{ translateY: 0 }],
      transition: { duration: 300, easing: 'ease-out' },
    };
  }

  static createTabBarAnimation(): Record<string, unknown> {
    if (Platform.OS !== 'ios') return {};
    return {
      transform: [{ translateY: 0 }],
      transition: { duration: 250, easing: 'ease-out' },
    };
  }

  static createListItemAnimation(index: number): Record<string, unknown> {
    return {
      opacity: 1,
      transform: [{ translateY: 0 }],
      transition: { delay: index * 50 },
    };
  }

  static getMobileOptimizations(): Record<string, unknown> {
    return {
      hover: 'none',
      touchAction: 'manipulation',
      WebkitOverflowScrolling: 'touch',
      WebkitTapHighlightColor: 'transparent',
      textRendering: 'optimizeSpeed',
      imageRendering: 'optimizeQuality',
      WebkitTransform: 'translateZ(0)',
      WebkitBackfaceVisibility: 'hidden',
      WebkitPerspective: 1000,
    };
  }

  static isHighEndDevice(): boolean {
    const memory = this.getDeviceMemory();
    const cores = this.getDeviceCores();
    return memory >= 6144 || cores >= 6;
  }

  private static getDeviceMemory(): number {
    if (Platform.OS === 'ios') return 4096;
    return 2048;
  }

  private static getDeviceCores(): number {
    return 4;
  }

  static getDeviceType(): 'low-end' | 'mid-range' | 'high-end' {
    const memory = this.getDeviceMemory();
    if (memory >= 6144) return 'high-end';
    if (memory >= 3072) return 'mid-range';
    return 'low-end';
  }

  static getPerformanceLevel(): 'low' | 'medium' | 'high' {
    const deviceType = this.getDeviceType();
    if (deviceType === 'high-end') return 'high';
    if (deviceType === 'mid-range') return 'medium';
    return 'low';
  }

  static getAnimationDuration(baseDuration: number): number {
    const performanceLevel = this.getPerformanceLevel();
    if (performanceLevel === 'high') return baseDuration;
    if (performanceLevel === 'medium') return baseDuration * 1.2;
    return baseDuration * 1.5;
  }

  static shouldReduceComplexity(): boolean {
    return this.getPerformanceLevel() === 'low';
  }

  static getAnimationEasing(): string {
    const performanceLevel = this.getPerformanceLevel();
    if (performanceLevel === 'high') return 'ease-out';
    if (performanceLevel === 'medium') return 'ease-in-out';
    return 'linear';
  }
}
