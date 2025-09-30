import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.talkco.app',
  appName: 'Talk - Mental Health Support',
  webDir: 'dist',
  bundledWebRuntime: false,
  ios: {
    scheme: 'Talk',
    contentInset: 'automatic',
    backgroundColor: '#3b82f6',
    allowsLinkPreview: false,
    scrollEnabled: true,
    buildConfiguration: 'Release',
    // iOS App Store privacy configuration
    privacyManifests: {
      NSUserTrackingUsageDescription: 'This app does not track users for advertising or analytics purposes.',
      NSCameraUsageDescription: 'This app does not use the camera.',
      NSMicrophoneUsageDescription: 'This app does not use the microphone.',
      NSLocationWhenInUseUsageDescription: 'This app does not use location services.',
      NSPhotoLibraryUsageDescription: 'This app does not access your photo library.',
      NSContactsUsageDescription: 'This app does not access your contacts.',
      NSCalendarsUsageDescription: 'This app does not access your calendar.',
      NSRemindersUsageDescription: 'This app does not access your reminders.',
      NSHealthShareUsageDescription: 'This app does not access health data.',
      NSHealthUpdateUsageDescription: 'This app does not update health data.',
      NSFaceIDUsageDescription: 'This app does not use Face ID.',
      NSBluetoothAlwaysUsageDescription: 'This app does not use Bluetooth.',
      NSMotionUsageDescription: 'This app does not access motion data.',
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#3b82f6',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#3b82f6',
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },
}

export default config
