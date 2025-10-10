import { useEffect } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export const useLocalNotifications = () => {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Request permissions on mount
      LocalNotifications.requestPermissions();
    }
  }, []);

  const scheduleDailyQuoteNotification = async () => {
    if (!Capacitor.isNativePlatform()) {
      console.log('Local notifications only work on native platforms');
      return;
    }

    try {
      // Check permissions
      const permission = await LocalNotifications.checkPermissions();
      
      if (permission.display !== 'granted') {
        const request = await LocalNotifications.requestPermissions();
        if (request.display !== 'granted') {
          throw new Error('Notification permission not granted');
        }
      }

      // Cancel any existing notifications
      await LocalNotifications.cancel({ notifications: [{ id: 1 }] });

      // Schedule daily notification at 9 AM
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Daily Inspiration 💜',
            body: 'Your daily mental health quote is ready!',
            id: 1,
            schedule: {
              on: {
                hour: 9,
                minute: 0,
              },
              repeats: true,
              allowWhileIdle: true,
            },
            sound: 'default',
            smallIcon: 'ic_stat_icon_config_sample',
            largeIcon: 'ic_launcher',
          },
        ],
      });

      return true;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return false;
    }
  };

  const cancelDailyQuoteNotification = async () => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  };

  const checkNotificationStatus = async () => {
    if (!Capacitor.isNativePlatform()) return false;

    try {
      const pending = await LocalNotifications.getPending();
      return pending.notifications.some(n => n.id === 1);
    } catch (error) {
      console.error('Error checking notification status:', error);
      return false;
    }
  };

  return {
    scheduleDailyQuoteNotification,
    cancelDailyQuoteNotification,
    checkNotificationStatus,
  };
};
