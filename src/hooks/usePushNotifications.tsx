import { useEffect, useState } from 'react';
import { PushNotifications, Token, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export const usePushNotifications = () => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Only initialize push notifications on native platforms
    // Do this non-blocking to not slow down app startup
    if (Capacitor.isNativePlatform()) {
      // Delay initialization slightly to not block app load
      setTimeout(() => {
        initializePushNotifications().catch(err => {
          console.error('Failed to initialize push notifications:', err);
        });
      }, 1000);
    }
  }, []);

  const initializePushNotifications = async () => {
    try {
      // Check permission first without requesting
      let permResult = await PushNotifications.checkPermissions();
      
      // Only request if not already determined
      if (permResult.receive === 'prompt') {
        permResult = await PushNotifications.requestPermissions();
      }
      
      if (permResult.receive === 'granted') {
        // Register with Apple / Google to receive push via APNS/FCM
        await PushNotifications.register();
        setIsRegistered(true);

        // Listen for registration
        await PushNotifications.addListener('registration', (token: Token) => {
          console.log('Push registration success, token: ' + token.value);
          setToken(token.value);
        });

        // Listen for registration errors
        await PushNotifications.addListener('registrationError', (error: any) => {
          console.error('Error on registration: ' + JSON.stringify(error));
        });

        // Listen for push notifications received
        await PushNotifications.addListener(
          'pushNotificationReceived',
          (notification) => {
            console.log('Push notification received: ', notification);
          }
        );

        // Listen for push notification actions
        await PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (notification: ActionPerformed) => {
            console.log('Push notification action performed', notification);
          }
        );
      }
    } catch (error) {
      // Silently fail - push notifications are optional
      console.error('Error initializing push notifications:', error);
    }
  };

  const sendLocalNotification = async (title: string, body: string) => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      // This would trigger a local notification
      console.log('Local notification:', title, body);
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  };

  return {
    isRegistered,
    token,
    sendLocalNotification,
  };
};
