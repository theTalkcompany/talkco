import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

// Note: Biometric authentication requires native implementation
// This is a placeholder that demonstrates the feature
export const useBiometricAuth = () => {
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
    loadBiometricPreference();
  }, []);

  const checkBiometricAvailability = async () => {
    if (!Capacitor.isNativePlatform()) {
      setIsAvailable(false);
      return;
    }

    // On native platforms, biometric auth is available
    // In production, you'd check with the native layer
    setIsAvailable(true);
  };

  const loadBiometricPreference = async () => {
    try {
      const { value } = await Preferences.get({ key: 'biometric_enabled' });
      setIsBiometricEnabled(value === 'true');
    } catch (error) {
      console.error('Error loading biometric preference:', error);
    }
  };

  const enableBiometric = async () => {
    try {
      await Preferences.set({ key: 'biometric_enabled', value: 'true' });
      setIsBiometricEnabled(true);
      return true;
    } catch (error) {
      console.error('Error enabling biometric:', error);
      return false;
    }
  };

  const disableBiometric = async () => {
    try {
      await Preferences.set({ key: 'biometric_enabled', value: 'false' });
      setIsBiometricEnabled(false);
      return true;
    } catch (error) {
      console.error('Error disabling biometric:', error);
      return false;
    }
  };

  const authenticate = async () => {
    if (!Capacitor.isNativePlatform() || !isBiometricEnabled) {
      return false;
    }

    // In production, this would trigger Face ID/Touch ID
    // For now, we simulate success
    return true;
  };

  return {
    isAvailable,
    isBiometricEnabled,
    enableBiometric,
    disableBiometric,
    authenticate,
  };
};
