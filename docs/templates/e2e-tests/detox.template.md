# E2E Test Template: Mobile React Native (Detox)

## Overview

This template provides the structure for End-to-End mobile tests using Detox with Jest for React Native applications.

## Prerequisites

```bash
# Install Detox CLI globally
npm install -g detox-cli

# Install Detox and dependencies
npm install --save-dev detox jest @types/detox

# For iOS: Install applesimutils
brew tap wix/brew
brew install applesimutils
```

## Configuration

### .detoxrc.js

```javascript
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/YourApp.app',
      build: 'xcodebuild -workspace ios/YourApp.xcworkspace -scheme YourApp -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/YourApp.app',
      build: 'xcodebuild -workspace ios/YourApp.xcworkspace -scheme YourApp -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      reversePorts: [8081],
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 14',
      },
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_4_API_30',
      },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.release',
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
    'android.emu.release': {
      device: 'emulator',
      app: 'android.release',
    },
  },
};
```

### e2e/jest.config.js

```javascript
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.e2e.ts'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
};
```

### e2e/setup.ts

```typescript
import { device, element, by, expect } from 'detox';

beforeAll(async () => {
  await device.launchApp();
});

beforeEach(async () => {
  await device.reloadReactNative();
});

afterAll(async () => {
  await device.terminateApp();
});
```

## Template Structure

```typescript
// e2e/[feature-name].e2e.ts

import { device, element, by, expect, waitFor } from 'detox';

describe('Feature: [FEATURE_NAME]', () => {
  // ============================================
  // SETUP & TEARDOWN
  // ============================================

  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES', location: 'always' },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    // Navigate to feature screen if needed
    // await element(by.id('nav-feature')).tap();
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  // ============================================
  // ACCEPTANCE CRITERIA TESTS
  // ============================================

  describe('AC1: [Acceptance Criteria Description]', () => {
    it('should [expected behavior] when [condition]', async () => {
      // Arrange
      await expect(element(by.id('feature-screen'))).toBeVisible();

      // Act
      await element(by.id('input-field')).typeText('test value');
      await element(by.id('submit-button')).tap();

      // Assert
      await expect(element(by.id('success-message'))).toBeVisible();
      await expect(element(by.text('Success!'))).toBeVisible();
    });

    it('should show validation error when [invalid input]', async () => {
      // Arrange
      await expect(element(by.id('feature-screen'))).toBeVisible();

      // Act - Submit without filling required field
      await element(by.id('submit-button')).tap();

      // Assert
      await expect(element(by.id('error-message'))).toBeVisible();
      await expect(element(by.text('This field is required'))).toBeVisible();
    });
  });

  describe('AC2: [Another Acceptance Criteria]', () => {
    it('should navigate to [screen] when [action]', async () => {
      // Arrange
      await expect(element(by.id('home-screen'))).toBeVisible();

      // Act
      await element(by.id('feature-button')).tap();

      // Assert
      await expect(element(by.id('feature-screen'))).toBeVisible();
      await expect(element(by.id('home-screen'))).not.toBeVisible();
    });
  });

  // ============================================
  // USER FLOWS
  // ============================================

  describe('User Flows', () => {
    it('should complete [flow name] successfully', async () => {
      // Step 1: Start on home screen
      await expect(element(by.id('home-screen'))).toBeVisible();

      // Step 2: Navigate to feature
      await element(by.id('start-flow-button')).tap();
      await expect(element(by.id('step-1-screen'))).toBeVisible();

      // Step 3: Fill form
      await element(by.id('name-input')).typeText('John Doe');
      await element(by.id('email-input')).typeText('john@example.com');
      await element(by.id('next-button')).tap();

      // Step 4: Confirm
      await expect(element(by.id('step-2-screen'))).toBeVisible();
      await element(by.id('confirm-button')).tap();

      // Step 5: Success
      await expect(element(by.id('success-screen'))).toBeVisible();
      await expect(element(by.id('confirmation-number'))).toBeVisible();
    });
  });

  // ============================================
  // GESTURES & INTERACTIONS
  // ============================================

  describe('Gestures', () => {
    it('should scroll to bottom of list', async () => {
      await element(by.id('scroll-view')).scrollTo('bottom');
      await expect(element(by.id('list-item-last'))).toBeVisible();
    });

    it('should swipe to delete item', async () => {
      await element(by.id('list-item-1')).swipe('left');
      await element(by.id('delete-button')).tap();
      await expect(element(by.id('list-item-1'))).not.toBeVisible();
    });

    it('should pull to refresh', async () => {
      await element(by.id('scroll-view')).swipe('down', 'slow', 0.5);
      await expect(element(by.id('refresh-indicator'))).toBeVisible();
      await waitFor(element(by.id('refresh-indicator')))
        .not.toBeVisible()
        .withTimeout(5000);
    });

    it('should long press for context menu', async () => {
      await element(by.id('list-item-1')).longPress();
      await expect(element(by.id('context-menu'))).toBeVisible();
    });
  });

  // ============================================
  // ERROR HANDLING
  // ============================================

  describe('Error Handling', () => {
    it('should show network error when offline', async () => {
      // Simulate offline mode
      await device.setURLBlacklist(['.*']);

      await element(by.id('fetch-data-button')).tap();
      await expect(element(by.id('network-error'))).toBeVisible();

      // Reset network
      await device.setURLBlacklist([]);
    });

    it('should handle timeout gracefully', async () => {
      await element(by.id('slow-request-button')).tap();

      await waitFor(element(by.id('timeout-error')))
        .toBeVisible()
        .withTimeout(30000);
    });

    it('should show retry option on failure', async () => {
      await element(by.id('failing-request-button')).tap();
      await expect(element(by.id('error-screen'))).toBeVisible();
      await expect(element(by.id('retry-button'))).toBeVisible();

      await element(by.id('retry-button')).tap();
      // Verify retry behavior
    });
  });

  // ============================================
  // PERMISSIONS
  // ============================================

  describe('Permissions', () => {
    it('should request camera permission', async () => {
      await element(by.id('camera-button')).tap();

      // Handle permission dialog
      await expect(element(by.text('Allow'))).toBeVisible();
      await element(by.text('Allow')).tap();

      await expect(element(by.id('camera-preview'))).toBeVisible();
    });

    it('should handle denied permission', async () => {
      await device.launchApp({
        newInstance: true,
        permissions: { camera: 'NO' },
      });

      await element(by.id('camera-button')).tap();
      await expect(element(by.id('permission-denied-message'))).toBeVisible();
    });
  });

  // ============================================
  // KEYBOARD HANDLING
  // ============================================

  describe('Keyboard', () => {
    it('should dismiss keyboard on tap outside', async () => {
      await element(by.id('text-input')).tap();
      await element(by.id('text-input')).typeText('test');

      // Tap outside to dismiss
      await element(by.id('screen-container')).tap();

      // Keyboard should be dismissed
      await expect(element(by.id('text-input'))).not.toBeFocused();
    });

    it('should handle keyboard avoidance', async () => {
      await element(by.id('bottom-input')).tap();

      // Input should remain visible above keyboard
      await expect(element(by.id('bottom-input'))).toBeVisible();
    });
  });

  // ============================================
  // DEVICE FEATURES
  // ============================================

  describe('Device Features', () => {
    it('should handle orientation change', async () => {
      await device.setOrientation('landscape');
      await expect(element(by.id('landscape-layout'))).toBeVisible();

      await device.setOrientation('portrait');
      await expect(element(by.id('portrait-layout'))).toBeVisible();
    });

    it('should handle background/foreground', async () => {
      await device.sendToHome();
      await device.launchApp({ newInstance: false });

      // App should restore state
      await expect(element(by.id('feature-screen'))).toBeVisible();
    });
  });
});

// ============================================
// HELPER FUNCTIONS
// ============================================

async function login(email: string, password: string) {
  await element(by.id('email-input')).typeText(email);
  await element(by.id('password-input')).typeText(password);
  await element(by.id('login-button')).tap();
  await waitFor(element(by.id('home-screen')))
    .toBeVisible()
    .withTimeout(5000);
}

async function logout() {
  await element(by.id('profile-tab')).tap();
  await element(by.id('logout-button')).tap();
  await expect(element(by.id('login-screen'))).toBeVisible();
}
```

## Running Tests

```bash
# Build app for testing
detox build -c ios.sim.debug
detox build -c android.emu.debug

# Run all E2E tests
detox test -c ios.sim.debug
detox test -c android.emu.debug

# Run specific test file
detox test -c ios.sim.debug e2e/feature-name.e2e.ts

# Run in release mode
detox test -c ios.sim.release

# Run with recording (for debugging)
detox test -c ios.sim.debug --record-videos all --record-logs all

# Run with specific Jest options
detox test -c ios.sim.debug -- --testNamePattern="AC1"
```

## Best Practices

1. **Use testID** - Add testID prop to all interactive elements
2. **Wait for elements** - Use waitFor() for async operations
3. **Isolate tests** - Reset app state between tests
4. **Handle permissions** - Set permissions in launchApp
5. **Test gestures** - Cover swipe, scroll, long press
6. **Test offline** - Use setURLBlacklist for network scenarios
7. **Test orientation** - Verify landscape and portrait modes
