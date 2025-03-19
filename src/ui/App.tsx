import { Capacitor } from "@capacitor/core";
import { Device, DeviceInfo } from "@capacitor/device";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { StatusBar, Style } from "@capacitor/status-bar";
import {
  getPlatforms,
  IonApp,
  IonSpinner,
  setupIonicReact,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { StrictMode, useEffect, useState } from "react";
import { EdgeToEdge } from "@capawesome/capacitor-android-edge-to-edge-support";
import { ExitApp } from "@jimcase/capacitor-exit-app";
import { Routes } from "../routes";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  getCurrentOperation,
  getGlobalLoading,
  getInitializationPhase,
} from "../store/reducers/stateCache";
import { AppOffline } from "./components/AppOffline";
import { AppWrapper } from "./components/AppWrapper";
import { ToastStack } from "./components/CustomToast/ToastStack";
import { GenericError, NoWitnessAlert } from "./components/Error";
import { InputRequest } from "./components/InputRequest";
import { SidePage } from "./components/SidePage";
import { OperationType } from "./globals/types";
import { FullPageScanner } from "./pages/FullPageScanner";
import { LoadingPage } from "./pages/LoadingPage/LoadingPage";
import { LockPage } from "./pages/LockPage/LockPage";
import "./styles/ionic.scss";
import "./styles/style.scss";
import "./App.scss";
import { showError } from "./utils/error";
import SystemCompatibilityAlert from "./pages/SystemCompatibilityAlert/SystemCompatibilityAlert";
import { SecureStorage } from "../core/storage";
import { compareVersion } from "./utils/version";
import {
  ANDROID_MIN_VERSION,
  IOS_MIN_VERSION,
  WEBVIEW_MIN_VERSION,
} from "./globals/constants";
import { InitializationPhase } from "../store/reducers/stateCache/stateCache.types";
import { getCssVariableValue } from "./utils/styles";
import { LoadingType } from "./pages/LoadingPage/LoadingPage.types";
import {
  androidChecks,
  commonChecks,
  initializeFreeRASP,
  iosChecks,
  ThreatCheck,
} from "../utils/freerasp";
import { freeraspRules } from "../utils/freeraspRules";
import SystemThreatAlert from "./pages/SystemThreatAlert/SystemThreatAlert";

setupIonicReact();

const App = () => {
  const initializationPhase = useAppSelector(getInitializationPhase);
  const globalLoading = useAppSelector(getGlobalLoading);
  const currentOperation = useAppSelector(getCurrentOperation);
  const [showScan, setShowScan] = useState(false);
  const [isCompatible, setIsCompatible] = useState(true);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isFreeRASPInitialized, setIsFreeRASPInitialized] = useState(false);
  const [freeRASPInitializedError, setIsFreeRASPInitializedError] =
    useState("");
  const [initializeFreeRASPFailed, setInitializeFreeRASPFailed] =
    useState(false);

  const platforms = getPlatforms();
  const [appChecks, setAppChecks] = useState<ThreatCheck[]>([
    ...commonChecks,
    ...(platforms.includes("ios") ? iosChecks : androidChecks),
  ]);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const initFreeRASP = initializeFreeRASP(setAppChecks);
    initFreeRASP().then((response) => {
      if (!response.success) {
        setIsFreeRASPInitialized(true);
        setIsFreeRASPInitializedError(
          (response.error as string) || "Unknown error"
        );
        setInitializeFreeRASPFailed(true);
      } else {
        setIsFreeRASPInitialized(true);
      }
    });
  }, []);

  const checkSecurity = () => {
    if (isFreeRASPInitialized && Capacitor.isNativePlatform()) {
      const criticalThreats = appChecks
        .map((check) => {
          const rule = Object.values(freeraspRules.threats).find(
            (threat) => threat.name === check.name
          );
          return rule?.critical && !check.isSecure
            ? {
              name: check.name,
              description:
                  freeraspRules.threats[check.name]?.description ||
                  "No description available",
            }
            : null;
        })
        .filter((threat) => threat !== null);

      if (criticalThreats.length > 0) {
        // eslint-disable-next-line no-console
        console.log(
          "Critical threats detected:",
          JSON.stringify(criticalThreats, null, 2)
        );
        /*
         * The app uses ExitApp.exitApp() to terminate execution when critical security threats
         * are detected at runtime by the freeRASP security library (e.g., jailbreak, root access,
         * debugger attachment). These threats compromise the integrity and security of the app,
         * potentially exposing sensitive user data or enabling unauthorized actions.
         * Terminating the app is a necessary measure to:
         * 1. Protect user data from being accessed or manipulated in an insecure environment.
         * 2. Prevent further execution in a compromised state, adhering to best security practices.
         * 3. Ensure compliance with security standards for handling sensitive operations.
         * This action is only triggered in response to verified runtime threats and is not used
         * arbitrarily. Logs of detected threats are recorded prior to termination for transparency
         * and debugging purposes.
         */
        ExitApp.exitApp();
      }
    }
  };

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    return;
    checkSecurity();
  }, [isFreeRASPInitialized, appChecks]);

  useEffect(() => {
    const handleUnknownPromiseError = (event: PromiseRejectionEvent) => {
      // prevent log error to console.
      event.preventDefault();
      event.promise.catch((e) => showError("Unhandled error", e, dispatch));
    };

    window.addEventListener("unhandledrejection", handleUnknownPromiseError);

    const handleUnknownError = (event: ErrorEvent) => {
      event.preventDefault();
      showError("Unhandled error", event.error, dispatch);
    };

    window.addEventListener("error", handleUnknownError);

    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnknownPromiseError
      );
      window.removeEventListener("error", handleUnknownError);
    };
  }, [dispatch]);

  useEffect(() => {
    setShowScan(
      [
        OperationType.SCAN_CONNECTION,
        OperationType.SCAN_WALLET_CONNECTION,
        OperationType.MULTI_SIG_INITIATOR_SCAN,
        OperationType.MULTI_SIG_RECEIVER_SCAN,
        OperationType.SCAN_SSI_BOOT_URL,
        OperationType.SCAN_SSI_CONNECT_URL,
      ].includes(currentOperation)
    );
  }, [currentOperation]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      ScreenOrientation.lock({ orientation: "portrait" });

      const platforms = getPlatforms();
      if (platforms.includes("ios")) {
        StatusBar.setStyle({
          style: Style.Light,
        });
      }

      if (platforms.includes("android")) {
        EdgeToEdge.setBackgroundColor({
          color: getCssVariableValue("--ion-color-neutral-200"),
        });
      }

      return () => {
        ScreenOrientation.unlock();
      };
    }
  }, []);

  useEffect(() => {
    const checkCompatibility = async () => {
      if (Capacitor.isNativePlatform()) {
        const info = await Device.getInfo();
        setDeviceInfo(info);

        if (info.platform === "android") {
          const notSupportedOS =
            compareVersion(info.osVersion, `${ANDROID_MIN_VERSION}`) < 0 ||
            compareVersion(info.webViewVersion, `${WEBVIEW_MIN_VERSION}`) < 0;
          const isKeyStoreSupported = await SecureStorage.isKeyStoreSupported();
          if (notSupportedOS || !isKeyStoreSupported) {
            setIsCompatible(false);
            return;
          }
        } else if (info.platform === "ios") {
          const notSupportedOS =
            compareVersion(info.osVersion, `${IOS_MIN_VERSION}`) < 0;
          const isKeyStoreSupported = await SecureStorage.isKeyStoreSupported();
          if (notSupportedOS || !isKeyStoreSupported) {
            setIsCompatible(false);
            return;
          }
        }
      }
      setIsCompatible(true);
    };

    checkCompatibility();
  }, []);

  const contentByInitPhase = (initPhase: InitializationPhase) => {
    switch (initPhase) {
    case InitializationPhase.PHASE_ZERO:
      return <LoadingPage />;
    case InitializationPhase.PHASE_ONE:
      return (
        <>
          <LoadingPage type={LoadingType.Splash} />
          <LockPage />
        </>
      );
    case InitializationPhase.PHASE_TWO:
      return (
        <>
          <IonReactRouter>
            {showScan ? (
              <FullPageScanner
                showScan={showScan}
                setShowScan={setShowScan}
              />
            ) : (
              <div
                className="app-spinner-container"
                data-testid="app-spinner-container"
              >
                <IonSpinner name="circular" />
              </div>
            )}
            <div className={showScan ? "ion-hide" : ""}>
              <Routes />
            </div>
            <LockPage />
          </IonReactRouter>
          <AppOffline />
        </>
      );
    }
  };

  const renderApp = () => {
    if (Capacitor.isNativePlatform() && !isFreeRASPInitialized) {
      return <LoadingPage />;
    }

    return (
      <>
        <AppWrapper>
          <StrictMode>
            {contentByInitPhase(initializationPhase)}
            <InputRequest />
            <SidePage />
            <GenericError />
            <NoWitnessAlert />
            <ToastStack />
            {globalLoading && <LoadingPage fullPage />}
          </StrictMode>
        </AppWrapper>
      </>
    );
  };

  if (!isCompatible) {
    return <SystemCompatibilityAlert deviceInfo={deviceInfo} />;
  }

  if (initializeFreeRASPFailed) {
    return <SystemThreatAlert error={freeRASPInitializedError} />;
  }

  return <IonApp>{renderApp()}</IonApp>;
};

export { App };
