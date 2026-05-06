import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export function useWebShellWidth(horizontalPadding: number, maxWidth: number) {
  const getWidth = () => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return undefined;
    }

    return Math.max(
      0,
      Math.min(window.innerWidth - horizontalPadding, maxWidth)
    );
  };

  const [width, setWidth] = useState<number | undefined>(getWidth);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleResize = () => setWidth(getWidth());
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [horizontalPadding, maxWidth]);

  return width;
}
