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

## Local browser testing with OTP 1111

The testing OTP is accepted by default only in development. Production test login
requires explicit server configuration: `AUTH_TEST_LOGIN_ENABLED=true` and an
`AUTH_TEST_PHONE_NUMBERS` allowlist of approved test accounts. This never enables
production OTP signup or password reset. Keep real patient accounts out of that
allowlist. For browser QA,
run a development backend with a separate local MongoDB database, then point
Expo's development proxy at it:

```bash
# Terminal 1: from medivault-web (local MongoDB must already be running)
MONGODB_URI=mongodb://127.0.0.1:27029 MONGODB_DB=medivault_local_qa npm run dev -- --hostname 127.0.0.1 --port 3011

# Terminal 2: from medivault-native
MEDIVAULT_DEV_API_URL=http://127.0.0.1:3011/api npm run start -- --web --port 8089
```

Create a local test account before signing in. `MEDIVAULT_DEV_API_URL` configures
only the browser development proxy; it does not change the production/native API
URL. Test records in this database do not represent production records.
