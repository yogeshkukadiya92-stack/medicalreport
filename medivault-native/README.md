# MediVault Native

Native iOS and Android patient app connected to the existing MediVault backend.

## Included

- password and mobile OTP sign-in
- encrypted bearer token storage using iOS Keychain / Android Keystore
- cloud vault with offline cache
- unified lab and self-upload report timeline
- report details, clinical values, and expiring doctor-share links
- camera and PDF/photo upload
- AI value extraction for report photos
- body-composition and laboratory trend graphs
- family profiles matched by mobile number
- consent preferences and access history
- English, Gujarati, and Hindi navigation

## Local development

```bash
cd medivault-native
npm install
cp .env.example .env
npm start
```

Press `i` for iOS Simulator or `a` for Android Emulator. A physical device can scan the Expo QR code when it can reach the configured API.

## API configuration

Set:

```text
EXPO_PUBLIC_API_URL=https://mr.yogeshaihub.in/api
```

The backend must include `/api/auth/mobile`, which returns a 30-day bearer token. Native tokens are stored only in secure device storage.

## Verification

```bash
npm run typecheck
npx expo export --platform all --output-dir dist-verified
```

## Store builds

Install and authenticate EAS CLI:

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile production
eas build --platform ios --profile production
```

Before store submission, configure the final Apple Team, Google Play account, privacy policy URL, support URL, screenshots, and production push-notification credentials.
