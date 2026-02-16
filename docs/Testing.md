# Testing Guide

## Unit tests

This project uses [Jest Testing Framework](https://jestjs.io/) for unit testing.

### Run tests:

1. Install all packages locally
```
npm install
```
2. Run the test
```
npm run test
```

## End-to-End (E2E) Testing
### Pre-installed on local:

- [allure commandline](https://docs.qameta.io/allure-report/#_installing_a_commandline)
- Node.js and npm
- Appium installed locally (in case if @wdio/appium-service will not work as expected)
  - install appium e.g. ``` brew install appium ```
  - install driver for ios ``` appium driver install xcuitest ```
  - install driver for android ``` appium driver install uiautomator2 ```
  - install driver for chrome ``` appium driver install chromium ```
  - install driver for safari ``` appium driver install safari ```
- Android Emulator for [Samsung Galaxy S23 Ultra](https://developer.samsung.com/galaxy-emulator-skin/guide.html) is configured or iOS Simulator for [iPhone 15 Pro / 15 Pro Max](https://developer.apple.com/documentation/xcode/installing-additional-simulator-runtimes)
- Create .env file in your local root project folder with APP_PATH, and KERIA_IP when the app must reach Keria on the host (e.g. emulator/simulator or physical device).
```
# Android Emulator (10.0.2.2 is the emulator's alias for the host machine)
APP_PATH=<LOCAL_PATH/app-release-unsigned.apk>
KERIA_IP=10.0.2.2

# iOS Simulator or Physical Devices
APP_PATH=<LOCAL_PATH/App.app>
KERIA_IP=<IP_V4>
```

#### Android Emulator Network Configuration
When running on an Android emulator, set `KERIA_IP=10.0.2.2` in your `.env` (or in the environment when building/running tests). `10.0.2.2` is the emulator's special alias for the host machine, so the app can reach Keria running in Docker on your machine.
- **Keria must be running**: Ensure Keria is running in Docker and accessible on your host machine (e.g., `http://localhost:3901`)
- **Network security**: The app includes a network security config that allows cleartext HTTP traffic to `10.0.2.2` for development

Test configuration (such as `KERIA_IP`) is supplied by the test environment only; production code does not hardcode emulator or test-specific values.

#### Local Android e2e flow (how it works)
1. Create a `.env` in the project root with `APP_PATH=<path-to-your-debug.apk>` and `KERIA_IP=10.0.2.2`.
2. Run `npm run build:e2e`. Webpack loads `.env` and bakes `KERIA_IP` into the app bundle, so the built app will use `10.0.2.2` when it runs on the emulator.
3. Run `npm run wdio:android:s24ultra` (or your Android WDIO command). WDIO loads `.env` via its config, so `APP_PATH` and any other test vars are available. The app installed on the emulator was built with `KERIA_IP=10.0.2.2`, so it can reach Keria on the host.

If you change `KERIA_IP` or add it later, run `npm run build:e2e` again so the new value is included in the app.

#### How to get IP v4 address:
For iOS simulators or physical devices, use your machine's IPv4 so the app can reach the locally running KERIA docker container. Set `KERIA_IP` to that address in your `.env`.
#### MacOS:
````bash
ifconfig | grep -E "([0-9]{1,3}\.){3}[0-9]{1,3}" | grep -v 127.0.0.1 | head -1 | awk '{ print $2 }'
````
#### Windows:
````bash
ipconfig | findstr /R /C:"IPv4 Address"
````
#### Linux:
````bash
ip addr show  | grep -E "([0-9]{1,3}\.){3}[0-9]{1,3}" | grep -v 127.0.0.1 | head -1 | awk '{ print $2 }'
````

### Test run in Local:

1. Install all packages locally
```
npm install
```
2. Run for chosen platform and phone e.g.:
- for all tests
```
npm run wdio:android:s23ultra
```
or
```
npm run wdio:ios:15promax
```
- for specific feature
```
npm run wdio:ios:15promax -- --spec ./tests/features/onboarding/onboarding-pin.feature
```
- for specific scenario in feature you want to run it put a line number at which there is scenario title
```
npm run wdio:ios:15promax -- --spec ./tests/features/onboarding/onboarding-pin.feature:18
```
- If there are issues with appium service run by WDIO, please start appium in terminal separately
- In case WDIO tests will not exit on its own kill the process yourself e.g. ``` pkill -9 -f wdio ```

3. Generate allure report
```
allure generate tests/.reports/allure-results -o tests/.reports/allure-report --clean
```
4. Open allure report
```
allure open tests/.reports/allure-report
```
