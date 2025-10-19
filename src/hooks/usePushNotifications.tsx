import { useEffect, useState } from 'react';
import { PushNotifications, Token, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export const usePushNotifications = () => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      initializePushNotifications();
    }
  }, []);

  const initializePushNotifications = async () => {
    try {
      // Request permission
      const result = await PushNotifications.requestPermissions();
      
      if (result.receive === 'granted') {
        // Register with Apple / Google to receive push via APNS/FCM
        await PushNotifications.register();
        setIsRegistered(true);

        // Listen for registration
        PushNotifications.addListener('registration', (token: Token) => {
          console.log('Push registration success, token: ' + token.value);
          setToken(token.value);
        });

        // Listen for registration errors
        PushNotifications.addListener('registrationError', (error: any) => {
          console.error('Error on registration: ' + JSON.stringify(error));
        });

        // Listen for push notifications received
        PushNotifications.addListener(
          'pushNotificationReceived',
          (notification) => {
            console.log('Push notification received: ', notification);
          }
        );

        // Listen for push notification actions
        PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (notification: ActionPerformed) => {
            console.log('Push notification action performed', notification);
          }
        );
      }
    } catch (error) {
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
