import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.talkco.app',
  appName: 'Talk - Mental Health Support',
  webDir: 'dist',
  bundledWebRuntime: false,
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#3b82f6',
    allowsLinkPreview: false,
    scrollEnabled: true,
    // iOS App Store privacy configuration
    privacyManifests: {
      NSUserTrackingUsageDescription: 'This app does not track users for advertising or analytics purposes.',
      NSCameraUsageDescription: 'Allow camera access to take profile pictures and share photos in the community.',
      NSMicrophoneUsageDescription: 'This app does not use the microphone.',
      NSLocationWhenInUseUsageDescription: 'This app does not use location services.',
      NSPhotoLibraryUsageDescription: 'Allow photo library access to select profile pictures and share photos.',
      NSContactsUsageDescription: 'This app does not access your contacts.',
      NSCalendarsUsageDescription: 'This app does not access your calendar.',
      NSRemindersUsageDescription: 'This app does not access your reminders.',
      NSHealthShareUsageDescription: 'This app does not access health data.',
      NSHealthUpdateUsageDescription: 'This app does not update health data.',
      NSFaceIDUsageDescription: 'Use Face ID or Touch ID for secure and quick access to your account.',
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
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#3b82f6',
      sound: 'beep.wav',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
}

export default config
