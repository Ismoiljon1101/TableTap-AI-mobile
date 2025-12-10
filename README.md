# TabletTap Mobile App

React Native mobile application for restaurant waiters to manage orders with one-tap simplicity.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start Expo development server
npx expo start

# Run on Android
npx expo start --android

# Run on iOS (requires Mac or Expo Go app)
npx expo start --ios
```

## 📱 Testing Options

### Android (Linux)
- Android Studio emulator
- Physical device via USB debugging

### iOS
- **Expo Go app** - Download on iPhone, scan QR code
- EAS Build for production .ipa

## 🏗️ Project Structure

```
mobile/
├── src/
│   ├── config/          # API configuration
│   ├── navigation/      # React Navigation setup
│   ├── screens/         # App screens
│   │   ├── LoginScreen.tsx
│   │   └── TableGridScreen.tsx
│   ├── services/        # API & WebSocket services
│   │   ├── api.ts       # Axios with token refresh
│   │   └── socket.ts    # Real-time updates
│   ├── store/           # Redux Toolkit
│   │   ├── slices/      # Auth, Tables, Menu, Orders
│   │   ├── hooks.ts     # Typed hooks
│   │   └── index.ts     # Store config
│   └── types/           # TypeScript definitions
├── App.tsx              # Root component
└── package.json
```

## 🔑 Features Implemented

✅ Redux Toolkit state management
✅ JWT authentication with auto-refresh
✅ Axios API service
✅ WebSocket real-time updates
✅ AsyncStorage persistence
✅ TypeScript types
✅ Login screen with validation
✅ Navigation setup

## 🔌 Backend Connection

Update `src/config/api.ts`

 if testing on physical device:
```typescript
export const API_URL = 'http://YOUR_COMPUTER_IP:3000/v1';
export const WS_URL = 'http://YOUR_COMPUTER_IP:3000';
```

Find your IP:
```bash
# Linux
ip addr show | grep inet
```

## 📝 Default Login

- Email: `owner@tabletap.com`
- Password: `password123`

## 🎯 Next Steps

- [ ] Build Table Grid screen
- [ ] Create Order screen
- [ ] Add menu item selection
- [ ] Implement order history
- [ ] Add offline support

## 🔧 Technologies

- **React Native** - Cross-platform framework
- **Expo** - Development tooling
- **TypeScript** - Type safety
- **Redux Toolkit** - State management
- **React Navigation** - Routing
- **Axios** - HTTP client
- **Socket.io** - WebSocket client
- **AsyncStorage** - Local storage

## 📝 License

Copyright (c) 2025 Ismoiljon Masharipov. All Rights Reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.
