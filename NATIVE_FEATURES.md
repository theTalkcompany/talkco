# Native Mobile Features

This document describes the native mobile features implemented in Talk to satisfy Apple App Store requirements (Guideline 4.2 - Minimum Functionality).

## Implemented Features

### 1. Local Notifications
**Location**: Daily Quote Modal (`src/components/DailyQuoteModal.tsx`)

**Functionality**:
- Users can enable daily quote notifications at 9 AM
- Toggle switch in the daily quote modal
- Notifications appear even when app is closed
- Native notification sound and icon

**Testing**:
- Open the app on first login
- Toggle "Daily reminder at 9 AM" switch
- Test notification appears at scheduled time

### 2. Native Share
**Location**: Quotes Page (`src/pages/Quotes.tsx`)

**Functionality**:
- Share button on quotes page
- Opens native share sheet on iOS/Android
- Shares formatted quote with author attribution
- Fallback to Web Share API or clipboard on web

**Testing**:
- Navigate to Quotes page
- Tap "Share Quote" button
- Native share sheet should appear
- Share to Messages, Mail, etc.

### 3. Haptic Feedback
**Location**: Throughout the app (via `useHaptics` hook)

**Functionality**:
- Light haptic feedback on button taps
- Success/warning/error haptics for important actions
- Vibration feedback for notifications
- Only runs on native platforms (iOS/Android)

**Testing**:
- Tap share button (light haptic)
- Toggle notification switch (medium haptic)
- Enable/disable notifications (success/error haptic)

## Technical Implementation

### Capacitor Plugins Used
- `@capacitor/local-notifications` - Daily quote reminders
- `@capacitor/share` - Native sharing functionality
- `@capacitor/haptics` - Tactile feedback

### Custom Hooks
1. `useLocalNotifications` - Manages notification scheduling
2. `useNativeShare` - Handles native and web sharing
3. `useHaptics` - Provides haptic feedback utilities

### Configuration
All native features are configured in `capacitor.config.ts` with proper iOS privacy descriptions.

## Building for iOS/Android

After making changes to native features:

1. **Export to GitHub** (if not already done)
2. **Git pull** the latest changes
3. **Install dependencies**: `npm install`
4. **Build the project**: `npm run build`
5. **Sync native platforms**: `npx cap sync`
6. **Run on device**:
   - iOS: `npx cap run ios` (requires Mac with Xcode)
   - Android: `npx cap run android` (requires Android Studio)

## iOS App Store Privacy

The following permissions are declared in `Info.plist`:
- **Notifications**: For daily quote reminders
- **Camera**: For profile pictures
- **Photo Library**: For profile pictures and sharing

## Testing Checklist for App Review

- [ ] Daily notifications work and appear at correct time
- [ ] Share button opens native share sheet
- [ ] Haptic feedback works throughout app
- [ ] App feels native, not like a web browser
- [ ] All permissions have clear descriptions
- [ ] App works offline for core features

## Future Enhancement Ideas

- Camera integration for profile pictures
- Biometric authentication (Face ID/Touch ID)
- Contact sharing for inviting friends
- Background sync for messages
- App badges for unread messages
- Native calendar integration
- Deep linking support
