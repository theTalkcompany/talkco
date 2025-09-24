import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.talkco.app',
  appName: 'Talk - Mental Health Support',
  webDir: 'dist',
  bundledWebRuntime: false,
  ios: {
    scheme: 'Talk',
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
