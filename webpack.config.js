const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Inject environment variables for webpack
config.resolve.alias = {
  ...config.resolve.alias,
  'react-native$': 'react-native-web',
};

// Define plugin for environment variables
if (config.plugins) {
  config.plugins.push(
    new (require('webpack')).DefinePlugin({
      'process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY': JSON.stringify(
        process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY
      ),
      'process.env.EXPO_PUBLIC_HCAPTCHA_SITE_KEY': JSON.stringify(
        process.env.EXPO_PUBLIC_HCAPTCHA_SITE_KEY
      ),
    })
  );
}

module.exports = config;
