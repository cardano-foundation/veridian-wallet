import {
  BarcodeFormat,
  BarcodeScanner,
  LensFacing,
} from "@capacitor-mlkit/barcode-scanning";
import { Capacitor } from "@capacitor/core";
import {
  getPlatforms,
  IonButton,
  IonCol,
  IonGrid,
  IonIcon,
  IonRow,
  IonSpinner,
} from "@ionic/react";
import { scanOutline } from "ionicons/icons";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { i18n } from "../../../i18n";
import { useAppSelector } from "../../../store/hooks";
import { getAuthentication } from "../../../store/reducers/stateCache";
import { showError } from "../../utils/error";
import { combineClassNames } from "../../utils/style";
import { CustomInput } from "../CustomInput";
import { OptionModal } from "../OptionsModal";
import "./Scan.scss";
import { ScanProps, ScanRef } from "./Scan.types";

const Scan = forwardRef<ScanRef, ScanProps>(
  (
    {
      onCheckPermissionFinish,
      cameraDirection = LensFacing.Back,
      onFinishScan,
      customTranslateKey,
    }: ScanProps,
    ref
  ) => {
    const componentId = "scan";
    const platforms = getPlatforms();
    const [pasteModalIsOpen, setPasteModalIsOpen] = useState(false);
    const [pastedValue, setPastedValue] = useState("");
    const [scanning, setScanning] = useState(false);
    const [permission, setPermisson] = useState(false);
    const [scanUnavailable, setScanUnavailable] = useState(false);
    const isHandlingQR = useRef(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isAlreadyLoaded, setIsAlreadyLoaded] = useState(false);
    const loggedIn = useAppSelector(getAuthentication).loggedIn;

    const mobileweb = platforms.includes("mobileweb");

    const stopScan = useCallback(async () => {
      isHandlingQR.current = false;
      setScanning(false);
      document?.querySelector("body")?.classList.remove("scanner-active");

      if (permission) {
        await BarcodeScanner.stopScan();
        await BarcodeScanner.removeAllListeners();
      }
    }, [permission]);

    const handleScanValue = useCallback(
      async (result: string) => {
        if (isHandlingQR.current) return;
        try {
          setScanning(false);
          isHandlingQR.current = true;
          await onFinishScan(result);
        } catch (e) {
          showError("Failed to handle scan", e);
        } finally {
          isHandlingQR.current = false;
        }
      },
      [onFinishScan]
    );

    const registerScanHandler = useCallback(async () => {
      await BarcodeScanner.removeAllListeners();
      setScanning(true);
      const listener = await BarcodeScanner.addListener(
        "barcodesScanned",
        async (result) => {
          if (!result.barcodes?.length) return;
          await listener.remove();
          await handleScanValue(result.barcodes[0].rawValue);
        }
      );
    }, [handleScanValue]);

    const startScan = useCallback(async () => {
      if (Capacitor.isNativePlatform()) {
        const allowed = await checkPermission();
        setPermisson(!!allowed);
        onCheckPermissionFinish?.(!!allowed);
        await registerScanHandler();

        if (allowed) {
          try {
            await BarcodeScanner.startScan({
              formats: [BarcodeFormat.QrCode],
              lensFacing: cameraDirection,
            });
            setIsAlreadyLoaded(true);
          } catch (error) {
            showError("Error starting barcode scan:", error);
            setScanUnavailable(true);
            stopScan();
          }
        }

        document?.querySelector("body")?.classList.add("scanner-active");
        setScanning(true);
        document?.querySelector("body")?.classList.add("scanner-active");
        document
          ?.querySelector("body.scanner-active > div:last-child")
          ?.classList.remove("hide");
      }
    }, [
      onCheckPermissionFinish,
      registerScanHandler,
      cameraDirection,
      stopScan,
    ]);

    const checkPermission = async () => {
      const status = await BarcodeScanner.checkPermissions();
      if (status.camera === "granted") {
        return true;
      }
      if (
        status.camera === "prompt" ||
        status.camera == "prompt-with-rationale"
      ) {
        return (await BarcodeScanner.requestPermissions()).camera === "granted";
      }
    };

    useImperativeHandle(ref, () => ({
      stopScan,
      startScan,
      registerScanHandler,
    }));

    useEffect(() => {
      const handleCameraChange = async () => {
        setIsTransitioning(true);
        await stopScan();
        await startScan();
        setIsTransitioning(false);
      };

      if (!isAlreadyLoaded) return;
      handleCameraChange();
    }, [cameraDirection]);

    useEffect(() => {
      if (!loggedIn) {
        stopScan();
        return;
      }

      startScan();

      return () => {
        stopScan();
      };
    }, [loggedIn]);

    const handleSubmitPastedValue = async () => {
      await handleScanValue(pastedValue);
      setScanning(true);
    };

    const containerClass = combineClassNames("profile-scanner", {
      "no-permission": !permission || mobileweb,
      "scan-unavailable": scanUnavailable,
    });

    const getTranslateText = (key: string) => {
      const newKey = customTranslateKey ? `${customTranslateKey}.${key}` : key;
      return i18n.exists(newKey) ? i18n.t(newKey) : i18n.t(key);
    };

    const closePasteContentModal = () => setPasteModalIsOpen(false);

    return (
      <>
        <IonGrid
          className={containerClass}
          data-testid="profile-scanner"
        >
          {isTransitioning ? (
            <div
              className="scanner-spinner-container"
              data-testid="scanner-spinner-container"
            />
          ) : scanning || mobileweb || scanUnavailable ? (
            <>
              <IonRow>
                <IonCol size="12">
                  <span className="profile-scanner-text">
                    {getTranslateText("scan.title")}
                  </span>
                </IonCol>
              </IonRow>
              <IonRow className="scan-icon">
                <IonIcon
                  icon={scanOutline}
                  color="light"
                  className="profile-scanner-icon"
                />
                <span className="profile-scanner-permission-text">
                  {scanUnavailable
                    ? getTranslateText("scan.cameraunavailable")
                    : getTranslateText("scan.permissionalert")}
                </span>
              </IonRow>
              <IonButton
                shape="round"
                className="paste-content-button primary-button"
                data-testid="paste-content-button"
                onClick={() => setPasteModalIsOpen(true)}
              >
                {getTranslateText("scan.pastecontentbutton")}
              </IonButton>
            </>
          ) : (
            <div
              className="scanner-spinner-container"
              data-testid="scanner-spinner-container"
            >
              <IonSpinner name="circular" />
            </div>
          )}
        </IonGrid>
        <OptionModal
          modalIsOpen={pasteModalIsOpen}
          componentId={componentId + "-input-modal"}
          customClasses={componentId + "-input-modal"}
          onDismiss={closePasteContentModal}
          header={{
            closeButton: true,
            closeButtonAction: closePasteContentModal,
            closeButtonLabel: `${getTranslateText("scan.inputmodal.cancel")}`,
            title: `${getTranslateText("scan.inputmodal.pastecontents")}`,
            actionButton: true,
            actionButtonDisabled: !pastedValue,
            actionButtonAction: handleSubmitPastedValue,
            actionButtonLabel: `${getTranslateText("scan.inputmodal.confirm")}`,
          }}
        >
          <CustomInput
            dataTestId={`${componentId}-input`}
            autofocus={true}
            onChangeInput={setPastedValue}
            value={pastedValue}
          />
        </OptionModal>
      </>
    );
  }
);

export { Scan };
