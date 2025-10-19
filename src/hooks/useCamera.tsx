import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export const useCamera = () => {
  const takePicture = async () => {
    try {
      if (!Capacitor.isNativePlatform()) {
        // Fallback to web file input
        return null;
      }

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      return image.dataUrl || null;
    } catch (error) {
      console.error('Error taking picture:', error);
      return null;
    }
  };

  const pickFromGallery = async () => {
    try {
      if (!Capacitor.isNativePlatform()) {
        // Fallback to web file input
        return null;
      }

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });

      return image.dataUrl || null;
    } catch (error) {
      console.error('Error picking from gallery:', error);
      return null;
    }
  };

  const checkPermissions = async () => {
    if (!Capacitor.isNativePlatform()) return true;
    
    try {
      const permissions = await Camera.checkPermissions();
      return permissions.camera === 'granted' && permissions.photos === 'granted';
    } catch (error) {
      console.error('Error checking camera permissions:', error);
      return false;
    }
  };

  const requestPermissions = async () => {
    if (!Capacitor.isNativePlatform()) return true;
    
    try {
      const permissions = await Camera.requestPermissions();
      return permissions.camera === 'granted' && permissions.photos === 'granted';
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return false;
    }
  };

  return {
    takePicture,
    pickFromGallery,
    checkPermissions,
    requestPermissions,
  };
};
