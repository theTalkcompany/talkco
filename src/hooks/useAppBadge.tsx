import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export const useAppBadge = () => {
  const setBadgeCount = async (count: number) => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      // Note: Badge API is iOS only
      // On Android, you'd need a plugin or custom implementation
      if (Capacitor.getPlatform() === 'ios') {
        // This would set the badge count on iOS
        console.log('Setting badge count:', count);
      }
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  };

  const clearBadge = async () => {
    await setBadgeCount(0);
  };

  return {
    setBadgeCount,
    clearBadge,
  };
};
