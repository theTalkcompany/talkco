# App Store Submission Guide

## Issue: Guideline 4.2 - Design: Minimum Functionality

**Apple's Feedback**: "Your app provides a limited user experience as it is not sufficiently different from a mobile browsing experience."

## Solution: Native Mobile Features Implemented

We've added three key native features to satisfy Apple's requirements:

### ✅ 1. Local Push Notifications
- **What**: Daily quote reminders at 9 AM
- **Where**: Toggle in the daily quote modal (first login)
- **Why**: Provides ongoing engagement and native app functionality

### ✅ 2. Native Share Integration
- **What**: Native share sheet for quotes
- **Where**: "Share Quote" button on Quotes page
- **Why**: Deep iOS/Android integration for content sharing

### ✅ 3. Haptic Feedback
- **What**: Vibration feedback on interactions
- **Where**: Throughout app (buttons, toggles, notifications)
- **Why**: Physical feedback that web apps cannot provide

## Testing Before Resubmission

1. **Build Native App**:
   ```bash
   npm install
   npm run build
   npx cap sync
   npx cap run ios
   ```

2. **Test Notifications**:
   - Open app, enable notifications in daily quote modal
   - Verify permission prompt appears
   - Check notification arrives at 9 AM next day
   - Test disabling notifications

3. **Test Native Share**:
   - Navigate to Quotes page
   - Tap "Share Quote" button
   - Verify native share sheet appears
   - Share to Messages/Mail to confirm

4. **Test Haptics**:
   - Tap navigation buttons (feel light vibration)
   - Toggle notification switch (medium vibration)
   - Enable notifications (success vibration)

## Privacy Policy URLs

Update in App Store Connect:
- Privacy Policy: `https://talkco.uk/privacy-policy`
- Terms of Service: `https://talkco.uk/terms-of-service`

## Key Changes Made

### Code Changes:
- ✅ Added `@capacitor/local-notifications` plugin
- ✅ Added `@capacitor/share` plugin
- ✅ Added `@capacitor/haptics` plugin
- ✅ Created `useLocalNotifications` hook
- ✅ Created `useNativeShare` hook
- ✅ Created `useHaptics` hook
- ✅ Updated Daily Quote Modal with notification toggle
- ✅ Updated Quotes page with share button
- ✅ Added haptic feedback to key interactions

### Configuration Changes:
- ✅ Updated `capacitor.config.ts` with notification settings
- ✅ Updated iOS privacy descriptions for Camera and Photos
- ✅ Added notification icon and color configuration

### Camera Permissions Fix (Oct 31, 2025):
**Issue**: Camera feature was failing in TestFlight because privacy keys were missing from `Info.plist` in Xcode.

**Root Cause**: The `npx cap sync` command did not properly copy privacy descriptions from the project's source `Info.plist` to the Xcode project.

**Solution**: Manually added required privacy keys directly in Xcode's `Info.plist`:
- `NSPhotoLibraryUsageDescription`: "Talk needs access to your photo library to select photos for your posts and profile picture."
- `NSPhotoLibraryAddUsageDescription`: "Talk needs permission to save photos to your photo library."
- `NSCameraUsageDescription`: "Talk needs access to your camera to take photos for your posts and profile picture."

**Steps Taken**:
1. Opened `ios/App/App/Info.plist` in Xcode
2. Added the three privacy description keys with user-friendly explanations
3. Cleaned build in Xcode (Product → Clean Build Folder)
4. Rebuilt and uploaded to TestFlight
5. **Result**: ✅ Build 1.4 (1) successfully passed TestFlight processing (Oct 31, 2025 4:20 PM)

**Important Note**: This fix must be done in Xcode after each `npx cap sync` if the keys don't automatically transfer.

## What to Tell Apple in Response

When resubmitting, include this message:

---

**Response to Review Team**:

Thank you for your feedback. We have significantly enhanced the app with native mobile functionality:

**New Native Features**:
1. **Local Notifications**: Users can enable daily mental health quote reminders with native notification banners and sounds
2. **Native Share Sheet**: Integrated iOS/Android share functionality for sharing quotes with contacts
3. **Haptic Feedback**: Tactile vibration feedback throughout the app for button presses and important actions

These features provide a distinctly native mobile experience that goes beyond web browsing capabilities. The app now leverages platform-specific APIs for notifications, sharing, and haptic feedback.

**Testing Instructions**:
- Enable notifications in the daily quote modal (first login)
- Use the "Share Quote" button on the Quotes page
- Feel haptic feedback when navigating and interacting with the app

We believe these additions address the concerns about minimum functionality and provide clear native app value.

---

## Platform Strategy

**Important**: Talk is now an **app-only platform**. The website has been taken down to focus exclusively on delivering the best native mobile experience through the iOS and Android apps.

## Next Steps

1. ✅ Complete native implementation
2. ✅ Fix camera permissions in Xcode
3. ✅ TestFlight build successfully processing
4. ⬜ Test all features on physical iOS device
5. ⬜ Record video showing native features (optional)
6. ⬜ Submit for App Store review
7. ⬜ Add response to review notes explaining native features

## Additional Resources

- See `NATIVE_FEATURES.md` for technical documentation
- All native code is in `src/hooks/useLocalNotifications.tsx`, `useNativeShare.tsx`, `useHaptics.tsx`
- Configuration in `capacitor.config.ts`
