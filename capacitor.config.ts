import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // Bundle identifier — must match what you register in Apple Developer Portal
  appId: "com.lucamilletti.trackr",
  appName: "trackr",

  // Points at Next.js static export output directory
  webDir: "out",

  // iOS-specific settings
  ios: {
    // Allow the WKWebView to scroll (needed for the calendar time grid)
    scrollEnabled: true,
    // Respect the device's content inset so we can handle notch/home-bar in CSS
    contentInset: "always",
  },

  server: {
    // Deep-link URL scheme — registered in ios/App/App/Info.plist by Capacitor.
    // Supabase OAuth redirects here so the callback lands back in the app.
    url: undefined, // leave undefined for production (uses local file bundle)
    cleartext: false,
  },

  plugins: {
    // @capacitor/browser: used for OAuth sign-in (opens Safari, not a WebView)
    Browser: {
      // No extra config needed — defaults are fine
    },

    // @capacitor/push-notifications: enable when you have an APNs key
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
