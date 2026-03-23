import * as Sentry from '@sentry/react-native';
import { Stack } from "expo-router";

Sentry.init({
  dsn: 'https://10c3f0f9c66bdb1d4951e0d2fad3cf54@o4511083480219648.ingest.us.sentry.io/4511083485069312',
  sendDefaultPii: true,
  enableLogs: true,

  // Disable auto performance tracing to prevent infinite recursion
  // in fetch instrumentation when the Gemini SDK makes HTTP calls.
  // Fixes REACT-NATIVE-4 and REACT-NATIVE-5
  enableAutoPerformanceTracing: false,

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],
});

export default Sentry.wrap(function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="recipe/[id]" />
    </Stack>
  );
});
