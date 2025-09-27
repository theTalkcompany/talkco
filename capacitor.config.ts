import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.talkco.app',
  appName: 'App',
  webDir: 'dist',
  bundledWebRuntime: false,
  // server: {
  //   url: "https://a3b3903e-b0af-4757-9c15-bc69dfbc625d.lovableproject.com?forceHideBadge=true",
  //   cleartext: true
  // },
  ios: {
    scheme: 'App',
    contentInset: 'automatic',
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#3b82f6',
    },
  },
}

export default config
