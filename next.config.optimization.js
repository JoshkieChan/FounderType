// Next.js optimization for free tier scaling
// Reduces bundle size and improves performance

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputMode: 'export',
  trailingSlash: true,
  images: {
    domains: ['foundertype.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@supabase/supabase-js', 'react', 'react-native-web'],
    scrollRestoration: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    swcMinify: true,
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize bundle size
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\\\/]node_modules[\\\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: -30,
            enforce: true,
          },
        },
      },
      usedExports: true,
      sideEffects: false,
    };

    // Reduce bundle analysis time
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': __dirname,
    };

    // Optimize images
    config.module.rules.push({
      test: /\\.(png|jpe?g|gif|svg|webp|avif)$/i,
      type: 'asset/resource',
      generator: {
        filename: 'images/[name].[hash][ext]',
      },
      use: [
        {
          loader: 'sharp-loader',
          options: {
            // Optimize images for web
            quality: 80,
            progressive: true,
            withMetadata: false,
          },
        },
      ],
    });

    // Remove unused code
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        'process.env.API_URL': JSON.stringify(process.env.API_URL),
      })
    );

    return config;
  },
  // Enable compression
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // Optimize for static export
  generateBuildId: false,
  
  // Reduce JavaScript size
  reactStrictMode: true,
  
  // Optimize CSS
  optimizeFonts: true,
  
  // Enable static optimization
  staticPageGenerationTimeout: 60,
  
  // Reduce re-renders
  swcMinify: true,
  
  // Bundle analyzer for development
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
        })
      );
      return config;
    },
  }),
};

module.exports = nextConfig;
