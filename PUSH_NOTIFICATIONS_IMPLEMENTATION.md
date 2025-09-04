# Push Notifications Implementation Plan

## 🎯 **Phase 1: Local Notifications (App Open)** ✅ IMPLEMENTED

### **What's Done:**
- ✅ Installed `@capacitor/local-notifications` plugin
- ✅ Created `NotificationService` class with Capacitor integration
- ✅ Implemented local notification scheduling and display
- ✅ Added permission management
- ✅ Created React hooks for easy integration
- ✅ Added deep-linking support for notification taps

### **Integration Points:**
```typescript
// In App.tsx or main component
import { useNotificationManager } from './hooks/useNotificationManager';

const App = () => {
  useNotificationManager(); // Handles permissions and setup
  // ... rest of app
};
```

```typescript
// When receiving KERIA notifications
import { useNotificationService } from './hooks/useLocalNotifications';

const SomeComponent = () => {
  const { showNotification } = useNotificationService();

  // When a new notification arrives
  useEffect(() => {
    if (newNotification) {
      showNotification(newNotification);
    }
  }, [newNotification]);
};
```

## 🚀 **Phase 2: Background Notifications (App Closed)**

### **Current Constraints:**
- **KERIA WebSocket Limitation**: KERIA notifications require an active WebSocket connection
- **No Persistent Connection**: When app is closed, WebSocket disconnects
- **No Built-in Push Service**: KERIA doesn't integrate with Firebase/APNS

### **Proposed Solutions:**

#### **Option A: Hybrid Approach (Recommended)**
1. **Local Notifications**: Use Capacitor Local Notifications when app is open
2. **Background Service**: Use Capacitor Background Task plugin for periodic checks
3. **KERIA Polling**: Poll KERIA endpoint periodically when app is backgrounded
4. **Push Token Registration**: Register device tokens with KERIA for future push integration

#### **Option B: Full Push Integration**
1. **Firebase/APNS Setup**: Configure Firebase for Android, APNS for iOS
2. **KERIA Enhancement**: Modify KERIA to support push token registration
3. **Webhook Integration**: KERIA sends webhooks to Firebase Functions
4. **Token Management**: Secure device token storage and rotation

### **Implementation Steps for Phase 2:**

#### **Step 1: Background Service Setup**
```bash
npm install @capacitor/background-task
npx cap sync
```

#### **Step 2: Periodic KERIA Polling**
```typescript
// Background task that runs every 5-10 minutes
import { BackgroundTask } from '@capacitor/background-task';

const runBackgroundTask = async () => {
  const taskId = await BackgroundTask.beforeExit(async () => {
    // Poll KERIA for new notifications
    const newNotifications = await pollKeriaNotifications();

    if (newNotifications.length > 0) {
      // Schedule local notifications
      await scheduleLocalNotifications(newNotifications);
    }

    BackgroundTask.finish({ taskId });
  });
};
```

#### **Step 3: Push Token Registration (Future)**
```typescript
// When KERIA supports push tokens
const registerPushToken = async (token: string) => {
  await keriaService.registerDeviceToken({
    token,
    platform: Capacitor.getPlatform(),
    profileId: currentProfile.id
  });
};
```

## 🔧 **Technical Architecture**

### **Current Architecture:**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React App     │────│  KERIA Service   │────│   Local Storage │
│                 │    │                  │    │                 │
│ - UI Components │    │ - WebSocket      │    │ - Notifications │
│ - Notifications │    │ - REST API       │    │ - Credentials   │
│ - State Mgmt    │    │ - Event Handling │    │ - Connections   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌────────────────────┐
                    │ Capacitor Plugins  │
                    │ - Local Notifications │
                    │ - Background Tasks   │
                    │ - App State          │
                    └─────────────────────┘
```

### **Target Architecture (Phase 2):**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React App     │────│  KERIA Service   │────│   Local Storage │
│   (Open)        │    │                  │    │                 │
│ - UI Components │    │ - WebSocket      │    │ - Notifications │
│ - Notifications │    │ - REST API       │    │ - Credentials   │
│ - State Mgmt    │    │ - Event Handling │    │ - Connections   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Background Task │────│  KERIA Polling   │────│ Push Services   │
│   (Closed)      │    │                  │    │                 │
│ - Periodic Poll │    │ - REST API       │    │ - Firebase      │
│ - Local Notify  │    │ - Token Mgmt     │    │ - APNS          │
│ - Deep Linking  │    │ - Webhook        │    │ - Token Store   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📋 **Implementation Checklist**

### **Phase 1 (Current):**
- ✅ Install Capacitor Local Notifications plugin
- ✅ Create NotificationService class
- ✅ Implement permission management
- ✅ Add notification scheduling
- ✅ Create React hooks
- ✅ Integrate with existing KERIA notifications
- ✅ Add deep-linking support
- ✅ Test on iOS and Android

### **Phase 2 (Next Steps):**
- 🔄 Install Background Task plugin
- 🔄 Implement periodic KERIA polling
- 🔄 Add background notification scheduling
- 🔄 Test background notification delivery
- 🔄 Optimize polling frequency
- 🔄 Add battery/performance considerations
- 🔄 Consider push token registration for future

### **Phase 3 (Future Enhancement):**
- 🔄 Implement Firebase/APNS setup
- 🔄 Modify KERIA for push token support
- 🔄 Add webhook integration
- 🔄 Implement secure token management
- 🔄 Add notification preferences
- 🔄 Test end-to-end push delivery

## 🎯 **Success Metrics**

### **Phase 1 Success Criteria:**
- ✅ Local notifications work when app is open
- ✅ Notifications deep-link to correct sections
- ✅ No third-party services required
- ✅ Works on both iOS and Android
- ✅ Integrates with existing KERIA notifications

### **Phase 2 Success Criteria:**
- 🔄 Background notifications work when app is closed
- 🔄 Reasonable battery impact (<5% additional drain)
- 🔄 Notifications appear within 5-10 minutes
- 🔄 Deep-linking works from background notifications
- 🔄 No crashes or performance issues

## 🚨 **Risks & Mitigations**

### **KERIA Limitations:**
- **Risk**: WebSocket disconnection when app closes
- **Mitigation**: Implement polling fallback with background tasks

### **Battery Impact:**
- **Risk**: Frequent polling drains battery
- **Mitigation**: Optimize polling intervals, use background task scheduling

### **Platform Differences:**
- **Risk**: iOS/Android notification behavior differences
- **Mitigation**: Test on both platforms, use Capacitor abstractions

### **Privacy/Security:**
- **Risk**: Device tokens stored insecurely
- **Mitigation**: Use secure storage, encrypt tokens, implement token rotation

## 📚 **Resources & Documentation**

- [Capacitor Local Notifications](https://capacitorjs.com/docs/apis/local-notifications)
- [Capacitor Background Tasks](https://capacitorjs.com/docs/apis/background-task)
- [KERIA Notification Service](../core/agent/services/keriaNotificationService.ts)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Apple Push Notifications](https://developer.apple.com/notifications/)

---

## 🎉 **Current Status**

**Phase 1: ✅ COMPLETE**
- Local notifications fully implemented and tested
- Deep-linking working
- No third-party dependencies
- Ready for production

**Phase 2: 🔄 READY FOR DEVELOPMENT**
- Architecture designed
- Implementation plan documented
- Background task integration planned
- KERIA polling strategy defined

**Next Steps:**
1. Install background task plugin
2. Implement periodic polling service
3. Test background notification delivery
4. Optimize performance and battery usage
