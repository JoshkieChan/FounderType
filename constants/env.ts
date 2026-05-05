type RuntimeEnv = {
  NEXT_PUBLIC_HCAPTCHA_SITE_KEY?: string;
  EXPO_PUBLIC_HCAPTCHA_SITE_KEY?: string;
};

declare const window:
  | {
      __FOUNDER_TYPE_ENV__?: RuntimeEnv;
    }
  | undefined;

const runtimeEnv =
  typeof window !== 'undefined' ? window.__FOUNDER_TYPE_ENV__ || {} : {};

// Environment variables for Expo web
export const ENV = {
  HCAPTCHA_SITE_KEY:
    runtimeEnv.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ||
    runtimeEnv.EXPO_PUBLIC_HCAPTCHA_SITE_KEY ||
    process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ||
    process.env.EXPO_PUBLIC_HCAPTCHA_SITE_KEY ||
    '',
};
