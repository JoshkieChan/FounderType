# Sentry Setup Guide for FounderType

## 🚨 Current Issue

You're seeing this warning:

```
[@sentry/react-native/expo] Missing config for organization, project. Environment variables will be used as a fallback.
```

## 🎯 **Quick Fix - 5 Steps:**

### 1. **Get Your Sentry DSN**

- Go to https://sentry.io
- Sign in or create an account
- Create a new project called "FounderType"
- Select "React Native" as the platform
- Copy your **DSN** (Data Source Name) - it looks like:

```text
https://your-public-key@your-project-id.ingest.sentry.io/your-project-id
```

### 2. **Update Your .env.local File**

Replace the placeholder with your actual DSN:

```bash
#DO NOT COMMIT THIS
SENTRY_AUTH_TOKEN=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
EXPO_PUBLIC_RESEND_API_KEY=re_crTskVXL_CRrPeaun73qK8zj2aBemXZYT
EXPO_PUBLIC_SENTRY_DSN=https://YOUR-ACTUAL-DSN-HERE
```

### 3. **Update app.json Configuration**

Your app.json already has the Sentry config, but let's ensure it's complete:

```json
{
  "expo": {
    "plugins": [
      "@sentry/react-native",
      [
        "@sentry/react-native/expo",
        {
          "url": "https://sentry.io/",
          "project": "foundertype",
          "organization": "foundertype"
        }
      ]
    ]
  }
}
```

### 4. **Deploy the Changes**

```bash
git add .env.local
git commit -m "Add Sentry DSN configuration"
git push origin main
vercel --prod
```

### 5. **Verify Sentry is Working**

- Go to your Sentry dashboard
- Check for incoming events
- Test the app to trigger some errors or performance data

## 📋 **What Sentry Will Track:**

### ✅ **Error Tracking**

- JavaScript errors
- React Native crashes
- Network failures
- Supabase connection issues

### ✅ **Performance Monitoring**

- Page load times
- API response times
- User interactions
- Memory usage

### ✅ **Release Tracking**

- Version deployment tracking
- Error regression detection
- Performance impact analysis

## 🎯 **Sentry Configuration Options:**

### **Development vs Production**

```javascript
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enableInExpoDevelopment: __DEV__, // Only track in production
  debug: false,
  tracesSampleRate: 0.2, // 20% of transactions
  environment: __DEV__ ? 'development' : 'production',
});
```

### **Custom Error Context**

```javascript
Sentry.setTag('feature', 'commitments');
Sentry.setUser({ id: userId, email: userEmail });
Sentry.setContext('commitment', { id, status });
```

## 🔧 **Troubleshooting:**

### **If you still see the warning:**

1. **Check DSN format** - Must start with `https://`
2. **Verify project exists** in Sentry dashboard
3. **Check environment variables** are properly loaded
4. **Clear build cache**: `vercel build --force`

### **If no events appear in Sentry:**

1. **Check environment** - Sentry disabled in development by default
2. **Test with real errors** - Try triggering an actual error
3. **Check network** - Ensure app can reach Sentry servers

### **Common DSN Issues:**

- ❌ `https://123456@123456.ingest.sentry.io/123456` ✅
- ❌ `http://sentry.io/...` ❌ (must be https)
- ❌ Missing project ID ❌

## 🚀 **Free Tier Benefits:**

Sentry's free tier includes:

- ✅ **5,000 events/month**
- ✅ **30-day data retention**
- ✅ **Error tracking**
- ✅ **Performance monitoring**
- ✅ **Release tracking**
- ✅ **Unlimited team members**

## 📊 **Recommended Settings for FounderType:**

```javascript
// Optimal for free tier
tracesSampleRate: 0.1, // 10% of transactions
environment: 'production',
debug: false,
enableInExpoDevelopment: false,
```

## 🎯 **Next Steps:**

1. **Get your Sentry DSN** from https://sentry.io
2. **Update .env.local** with your actual DSN
3. **Deploy to Vercel**
4. **Test error tracking**
5. **Monitor your Sentry dashboard**

**This will eliminate the warning and give you comprehensive error tracking for FounderType!** 🚀

## 📱 **Testing Sentry Integration:**

After configuration, you can test Sentry by:
1. **Triggering an error** (try accessing undefined data)
2. **Checking Sentry dashboard** for events
3. **Verifying performance data** appears
4. **Testing release tracking** after deployments

Your FounderType app will have enterprise-level error monitoring, all on Sentry's free tier! 🎯