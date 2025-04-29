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
import { SafeArea } from "capacitor-plugin-safe-area";
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
import { LoadingType } from "./pages/LoadingPage/LoadingPage.types";
import { initializeFreeRASP, ThreatCheck } from "../security/freerasp";
import { SystemThreatAlert } from "./pages/SystemThreatAlert/SystemThreatAlert";
import { ConfigurationService } from "../core/configuration";
import { i18n } from "../i18n";

setupIonicReact();

const App = () => {
  const initializationPhase = useAppSelector(getInitializationPhase);
  const globalLoading = useAppSelector(getGlobalLoading);
  const currentOperation = useAppSelector(getCurrentOperation);
  const [showScan, setShowScan] = useState(false);
  const [isCompatible, setIsCompatible] = useState(true);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isFreeRASPInitialized, setIsFreeRASPInitialized] = useState(false);
  const [freeRASPInitResult, setFreeRASPInitResult] = useState<{
    success: boolean;
    error: string;
  }>({ success: false, error: "" });

  const [threatsDetected, setThreatsDetected] = useState<ThreatCheck[]>([]);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const initConfiguration = async () => {
      if (ConfigurationService.env.security.rasp.enabled) {
        const result = await initializeFreeRASP(setThreatsDetected);
        setIsFreeRASPInitialized(true);
        setFreeRASPInitResult({
          success: result.success,
          error: result.success
            ? ""
            : (result.error as string) || "Unknown error",
        });
      } else {
        setIsFreeRASPInitialized(true);
        setFreeRASPInitResult({ success: true, error: "" });
      }
    };

    initConfiguration();
  }, []);

  useEffect(() => {
    const handleUnknownPromiseError = (event: PromiseRejectionEvent) => {
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
        SafeArea.getSafeAreaInsets().then((insets) => {
          Object.entries(insets.insets).forEach(([key, value]) => {
            document.body.style.setProperty(
              `--ion-safe-area-${key}`,
              `${value}px`
            );
          });
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

  const renderContentByInitPhase = (initPhase: InitializationPhase) => {
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
            {renderContentByInitPhase(initializationPhase)}
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

  if (isFreeRASPInitialized && !freeRASPInitResult.success) {
    return <SystemThreatAlert errors={[i18n.t("systemthreats.initerror")]} />;
  }

  if (threatsDetected.length > 0) {
    return (
      <SystemThreatAlert
        errors={threatsDetected.map((threat) => threat.description)}
      />
    );
  }

  return <IonApp>{renderApp()}</IonApp>;
};

export { App };
