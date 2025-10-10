import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

export const useNativeShare = () => {
  const shareQuote = async (quote: string, author: string) => {
    try {
      if (!Capacitor.isNativePlatform()) {
        // Fallback to Web Share API
        if (navigator.share) {
          await navigator.share({
            title: 'Inspiring Quote from Talk',
            text: `"${quote}"\n\n— ${author}`,
          });
          return true;
        } else {
          // Fallback to clipboard
          await navigator.clipboard.writeText(`"${quote}"\n\n— ${author}`);
          return 'clipboard';
        }
      }

      // Native share
      await Share.share({
        title: 'Inspiring Quote from Talk',
        text: `"${quote}"\n\n— ${author}`,
        dialogTitle: 'Share this quote',
      });
      return true;
    } catch (error) {
      console.error('Error sharing:', error);
      return false;
    }
  };

  const shareApp = async () => {
    try {
      const appUrl = 'https://talkco.uk';
      
      if (!Capacitor.isNativePlatform()) {
        if (navigator.share) {
          await navigator.share({
            title: 'Talk - Mental Health Support',
            text: 'Join me on Talk, a supportive mental health community!',
            url: appUrl,
          });
          return true;
        } else {
          await navigator.clipboard.writeText(appUrl);
          return 'clipboard';
        }
      }

      await Share.share({
        title: 'Talk - Mental Health Support',
        text: 'Join me on Talk, a supportive mental health community!',
        url: appUrl,
        dialogTitle: 'Share Talk',
      });
      return true;
    } catch (error) {
      console.error('Error sharing app:', error);
      return false;
    }
  };

  return {
    shareQuote,
    shareApp,
  };
};
