# Talk - App Store Submission Guide

## App Information

### Basic Details
- **App Name**: Talk - Mental Health Support  
- **Bundle ID**: com.talkco.app
- **Version**: 1.0.0
- **Category**: Medical
- **Age Rating**: 17+ (Mature/Suggestive Themes - Mental Health Content)

### App Description
**Short Description (30 chars):**
Anonymous mental health support

**Full Description:**
Talk is your compassionate mental health support companion. Connect with an AI therapist, join supportive community rooms, and access crisis resources - all while maintaining complete anonymity.

**Key Features:**
• Chat with Willow, your AI mental health companion
• Join anonymous community support rooms  
• Daily inspirational quotes for motivation
• Crisis support resources and hotlines
• Completely anonymous - no personal data required
• Safe, moderated environment
• 24/7 availability for support

**Medical Disclaimer:**
This app is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of qualified mental health professionals for any questions regarding mental health conditions.

### Keywords (100 chars max)
mental health, therapy, support, anonymous, chat, AI, crisis, community, wellness, mindfulness

### App Store Categories
- **Primary**: Medical
- **Secondary**: Health & Fitness

## Screenshots Required

You'll need to provide screenshots for:
- iPhone 6.7" (Pro Max) - 6 screenshots minimum
- iPhone 6.5" (Plus) - 6 screenshots minimum  
- iPhone 5.5" - 6 screenshots minimum
- iPad Pro (6th gen) 12.9" - Optional but recommended

## Privacy Policy Requirements

✅ Your app already includes:
- Privacy Policy accessible at `/privacy-policy`
- Terms of Service at `/terms-of-service`
- App Store Compliance page at `/app-store-compliance`
- Medical disclaimers and age ratings

## App Review Information

### Contact Information
- **First Name**: [Your First Name]
- **Last Name**: [Your Last Name]  
- **Phone**: [Your Phone Number]
- **Email**: [Your Email]

### Review Notes
"Talk is a mental health support app designed to provide anonymous, compassionate support through AI companionship and community features. The app includes appropriate medical disclaimers, crisis resources, and does not replace professional medical care. All content is moderated and the app maintains user anonymity for safety."

### Demo Account (if needed)
Since the app allows anonymous access, no demo account is required.

## Technical Requirements

### iOS Version Support
- Minimum iOS version: 13.0
- Target iOS version: Latest

### Device Support
- iPhone: All models from iPhone 6s onwards
- iPad: All models with iOS 13+

### Permissions
The app requests no special permissions - it's completely web-based within the Capacitor container.

## Compliance Checklist

✅ Medical Disclaimer Present
✅ Age Rating Appropriate (17+)
✅ Privacy Policy Accessible
✅ Terms of Service Available
✅ Crisis Resources Included
✅ Content Moderation System
✅ No Personal Data Collection
✅ App Store Compliance Page

## Submission Steps

1. **Export to GitHub** and clone locally
2. **Install Xcode** and development certificates
3. **Run build commands**:
   ```bash
   npm install
   npm run build
   npx cap sync ios
   npx cap open ios
   ```
4. **Configure signing** in Xcode
5. **Archive and upload** to App Store Connect
6. **Fill out metadata** in App Store Connect
7. **Submit for review**

## Post-Submission

- Response time: 24-48 hours typically
- Be prepared to respond to any reviewer questions
- Have crisis resource documentation ready if requested
- Monitor for approval notifications

---

**Important**: Make sure to test the app thoroughly on physical iOS devices before submission to ensure all features work correctly in the native environment.