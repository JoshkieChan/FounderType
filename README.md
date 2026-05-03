# FounderType

A React Native/Expo application for tracking and sharing personal commitments with AI-powered insights.

## Features

- **Commitment Tracking**: Create and track daily commitments with AI-generated action plans
- **Public Feed**: View and interact with commitments from other users
- **AI Integration**: Gemini AI for generating personalized commitment suggestions
- **Social Sharing**: Share your commitment profile as a shareable card
- **Daily Check-ins**: Track your progress with daily check-in reminders
- **Cross-platform**: Works on iOS, Android, and Web

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI
- iOS Simulator / Android Emulator (for mobile development)

## Setup

1. Clone the repository:
```bash
git clone https://github.com/JoshkieChan/FounderType.git
cd FounderType
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
EXPO_PUBLIC_REVENUECAT_IOS_KEY=your_revenuecat_key
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn
EXPO_PUBLIC_HCAPTCHA_SITE_KEY=your_hcaptcha_site_key
SENTRY_AUTH_TOKEN=your_sentry_auth_token
```

4. Start the development server:
```bash
npm start
```

5. Run on your preferred platform:
- iOS: Press `i` in the terminal
- Android: Press `a` in the terminal
- Web: Press `w` in the terminal

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Yes |
| `EXPO_PUBLIC_GEMINI_API_KEY` | Google Gemini API key | Yes |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` | RevenueCat iOS key | No |
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry DSN for error tracking | No |
| `EXPO_PUBLIC_HCAPTCHA_SITE_KEY` | hCaptcha site key | No |
| `SENTRY_AUTH_TOKEN` | Sentry auth token | No |

## Project Structure

```
FounderType/
├── components/       # Reusable UI components
├── context/         # React Context providers
├── hooks/           # Custom React hooks
├── lib/             # Utility functions and API clients
├── navigation/      # Navigation configuration
├── screens/         # Screen components
├── types/           # TypeScript type definitions
├── supabase/        # Supabase database migrations
└── constants/       # App constants
```

## Development

### Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run on web
- `npm run build` - Build for web deployment

### Code Style

This project uses:
- TypeScript for type safety
- ESLint/Prettier for code formatting
- Tailwind CSS for styling

### Database

The project uses Supabase as the backend. Database migrations are located in the `supabase/migrations/` directory.

## Deployment

### Vercel (Web)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Mobile

Build and deploy using EAS Build:
```bash
eas build --platform ios
eas build --platform android
```

## Architecture

### Key Components

- **App.tsx**: Main application entry point with Sentry integration
- **UserContext**: Global user state management
- **usePublicFeed**: Custom hook for paginated feed data
- **ErrorBoundary**: Error boundary for graceful error handling

### Data Flow

- Supabase for database and authentication
- AsyncStorage for local data persistence
- Gemini AI for content generation

## Troubleshooting

### Build fails with peer dependency errors
```bash
npm install --legacy-peer-deps
```

### Environment variables not loading
- Ensure variables are prefixed with `EXPO_PUBLIC_` for Expo
- For web deployment, use `NEXT_PUBLIC_` prefix in Vercel

### Blank screen on web
- Check browser console for errors
- Ensure SafeAreaProvider is wrapping your app
- Verify environment variables are set correctly

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT