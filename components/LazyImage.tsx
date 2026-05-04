import React, { useState, useRef, useEffect } from 'react';
import { Image, View, ActivityIndicator } from 'react-native';

interface LazyImageProps {
  source: { uri: string };
  style?: any;
  placeholder?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
}

export default function LazyImage({
  source,
  style,
  placeholder,
  onLoad,
  onError,
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inView, setInView] = useState(false);
  const imageRef = useRef<any>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold: 0.1 }
    );

    if (imageRef.current) {
      observer.observe(imageRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setLoaded(true);
    setLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setLoading(false);
    onError?.();
  };

  const startLoading = () => {
    setLoading(true);
  };

  return (
    <View style={style}>
      {!loaded && placeholder && (
        <View style={{ position: 'absolute' }}>
          {placeholder}
        </View>
      )}
      
      {inView && (
        <Image
          ref={imageRef}
          source={source}
          style={[
            style,
            { opacity: loaded ? 1 : 0 }
          ]}
          onLoadStart={startLoading}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
      
      {loading && (
        <View style={{
          position: 'absolute',
          justifyContent: 'center',
          alignItems: 'center',
          ...style
        }}>
          <ActivityIndicator size="small" color="#3B82F6" />
        </View>
      )}
    </View>
  );
}
