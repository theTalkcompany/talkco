import { Capacitor } from '@capacitor/core';

/**
 * Check if the app is running on a native mobile platform
 */
export const isNativePlatform = () => {
  return Capacitor.isNativePlatform();
};

/**
 * Get the current platform (ios, android, or web)
 */
export const getPlatform = () => {
  return Capacitor.getPlatform();
};

/**
 * Check if specific native features are available
 */
export const checkNativeFeatures = () => {
  const isNative = isNativePlatform();
  
  return {
    isNative,
    platform: getPlatform(),
    hasNotifications: isNative,
    hasHaptics: isNative,
    hasShare: isNative || !!navigator.share,
    hasClipboard: !!navigator.clipboard,
  };
};
