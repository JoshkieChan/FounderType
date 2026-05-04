import { StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export function useThemeStyles<T extends StyleSheet.NamedStyles<T>>(
  styleFactory: (colors: any) => T
): T {
  const { colors } = useTheme();
  return StyleSheet.create(styleFactory(colors));
}