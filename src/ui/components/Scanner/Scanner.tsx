import {
  BarcodeFormat,
  BarcodeScanner,
  LensFacing,
} from "@capacitor-mlkit/barcode-scanning";
import { Capacitor } from "@capacitor/core";
import {
  getPlatforms,
  IonCol,
  IonGrid,
  IonIcon,
  IonRow,
  IonSpinner,
} from "@ionic/react";
import { scanOutline } from "ionicons/icons";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { i18n } from "../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  getConnectionsCache,
  getProfileGroupCache,
  getProfiles,
  setPendingDAppConnection,
  showDAppConnect,
} from "../../../store/reducers/profileCache";
import { setBootUrl, setConnectUrl } from "../../../store/reducers/ssiAgent";
import {
  getAuthentication,
  getCurrentOperation,
  getToastMsgs,
  setCurrentOperation,
  setToastMsg,
} from "../../../store/reducers/stateCache";
import { OperationType, ToastMsgType } from "../../globals/types";
import { showError } from "../../utils/error";
import { combineClassNames } from "../../utils/style";
import { Alert } from "../Alert";
import { CustomInput } from "../CustomInput";
import { TabsRoutePath } from "../navigation/TabsMenu";
import { OptionModal } from "../OptionsModal";
import { PageFooter } from "../PageFooter";
import "./Scanner.scss";
import { ScannerProps } from "./Scanner.types";

const Scanner = forwardRef(
  (
    {
      routePath,
      handleReset,
      onCheckPermissionFinish,
      cameraDirection = LensFacing.Back,
    }: ScannerProps,
    ref
  ) => {
    const componentId = "scanner";
    const platforms = getPlatforms();
    const dispatch = useAppDispatch();
    const multiSigGroupCache = useAppSelector(getProfileGroupCache);
    const currentOperation = useAppSelector(getCurrentOperation);
    const currentToastMsgs = useAppSelector(getToastMsgs);
    const loggedIn = useAppSelector(getAuthentication).loggedIn;
    const [createIdentifierModalIsOpen, setCreateIdentifierModalIsOpen] =
      useState(false);
    const [pasteModalIsOpen, setPasteModalIsOpen] = useState(false);
    const [groupId, setGroupId] = useState("");
    const [pastedValue, setPastedValue] = useState("");
    const [scanning, setScanning] = useState(false);
    const [permission, setPermisson] = useState(false);
    const [mobileweb, setMobileweb] = useState(false);
    const [scanUnavailable, setScanUnavailable] = useState(false);
    const isHandlingQR = useRef(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isAlreadyLoaded, setIsAlreadyLoaded] = useState(false);
    const [openIdentifierMissingAlert, setOpenIdentifierMissingAlert] =
      useState<boolean>(false);

    useEffect(() => {
      if (platforms.includes("mobileweb")) {
        setMobileweb(true);
      }
    }, [platforms]);

    useImperativeHandle(ref, () => ({
      stopScan,
    }));

    const initScan = async () => {
      if (Capacitor.isNativePlatform()) {
        const allowed = await checkPermission();
        setPermisson(!!allowed);
        onCheckPermissionFinish?.(!!allowed);

        if (allowed) {
          await BarcodeScanner.removeAllListeners();
          const listener = await BarcodeScanner.addListener(
            "barcodesScanned",
            async (result) => {
              await listener.remove();
              if (isHandlingQR.current) return;
              isHandlingQR.current = true;
              if (!result.barcodes?.length) return;
              await processValue(result.barcodes[0].rawValue);
            }
          );

          try {
            await BarcodeScanner.startScan({
              formats: [BarcodeFormat.QrCode],
              lensFacing: cameraDirection,
            });
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
    };

    useEffect(() => {
      const onLoad = async () => {
        if (
          (routePath === TabsRoutePath.SCAN && createIdentifierModalIsOpen) ||
          !loggedIn
        ) {
          await stopScan();
          return;
        }

        const isDuplicateConnectionToast = currentToastMsgs.some(
          (item) => ToastMsgType.DUPLICATE_CONNECTION === item.message
        );
        const isRequestPending = currentToastMsgs.some((item) =>
          [
            ToastMsgType.CONNECTION_REQUEST_PENDING,
            ToastMsgType.CREDENTIAL_REQUEST_PENDING,
          ].includes(item.message)
        );
        const isFullPageScan = !routePath;
        const isScanning =
          routePath === TabsRoutePath.SCAN ||
          (isFullPageScan &&
            [
              OperationType.SCAN_CONNECTION,
              OperationType.SCAN_WALLET_CONNECTION,
              OperationType.SCAN_SSI_BOOT_URL,
              OperationType.SCAN_SSI_CONNECT_URL,
            ].includes(currentOperation));

        const isMultisignScan =
          isFullPageScan &&
          [
            OperationType.MULTI_SIG_INITIATOR_SCAN,
            OperationType.MULTI_SIG_RECEIVER_SCAN,
          ].includes(currentOperation) &&
          !isDuplicateConnectionToast;

        if ((isScanning && !isRequestPending) || isMultisignScan) {
          await initScan();
        } else {
          await stopScan();
        }
        setIsAlreadyLoaded(true);
      };
      onLoad();
    }, [
      currentOperation,
      routePath,
      createIdentifierModalIsOpen,
      currentToastMsgs,
      loggedIn,
    ]);

    useEffect(() => {
      const handleCameraChange = async () => {
        setIsTransitioning(true);
        await stopScan();
        await initScan();
        setIsTransitioning(false);
      };

      if (!isAlreadyLoaded) return;
      handleCameraChange();
    }, [cameraDirection]);

    useEffect(() => {
      return () => {
        stopScan();
      };
    }, []);

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

    const stopScan = async () => {
      if (permission) {
        await BarcodeScanner.stopScan();
        await BarcodeScanner.removeAllListeners();
      }

      setScanning(false);
      document?.querySelector("body")?.classList.remove("scanner-active");
      setGroupId("");
    };

    const handleConnectWallet = (id: string) => {
      if (/^b[1-9A-HJ-NP-Za-km-z]{33}/.test(id)) {
        dispatch(setToastMsg(ToastMsgType.PEER_ID_SUCCESS));
        dispatch(
          setPendingDAppConnection({
            meerkatId: id,
          })
        );
        dispatch(showDAppConnect(true));
        handleReset?.();
      } else {
        dispatch(setToastMsg(ToastMsgType.PEER_ID_ERROR));
      }
    };

    const handleSSIScan = (content: string) => {
      if (OperationType.SCAN_SSI_BOOT_URL === currentOperation) {
        dispatch(setBootUrl(content));
      }

      if (OperationType.SCAN_SSI_CONNECT_URL === currentOperation) {
        dispatch(setConnectUrl(content));
      }

      dispatch(setCurrentOperation(OperationType.IDLE));
      handleReset && handleReset();
    };

    const processValue = async (content: string) => {
      await stopScan();

      if (currentOperation === OperationType.SCAN_WALLET_CONNECTION) {
        handleConnectWallet(content);
        isHandlingQR.current = false;
        return;
      }

      if (
        [
          OperationType.SCAN_SSI_BOOT_URL,
          OperationType.SCAN_SSI_CONNECT_URL,
        ].includes(currentOperation)
      ) {
        handleSSIScan(content);
        isHandlingQR.current = false;
        return;
      }
    };

    const handlePrimaryButtonAction = () => {
      stopScan();
      dispatch(setCurrentOperation(OperationType.MULTI_SIG_INITIATOR_INIT));
      handleReset && handleReset();
    };

    const handleSubmitPastedValue = () => {
      setPasteModalIsOpen(false);
      processValue(pastedValue);
      setPastedValue("");
    };

    const openPasteModal = () => setPasteModalIsOpen(true);

    const RenderPageFooter = () => {
      switch (currentOperation) {
        case OperationType.SCAN_WALLET_CONNECTION:
          return (
            <PageFooter
              customClass="actions-button"
              secondaryButtonAction={openPasteModal}
              secondaryButtonText={`${i18n.t("tabs.scan.pastemeerkatid")}`}
            />
          );
        case OperationType.MULTI_SIG_INITIATOR_SCAN:
          return (
            <PageFooter
              pageId={componentId}
              primaryButtonText={`${i18n.t("setupgroupprofile.scan.initiate")}`}
              primaryButtonAction={handlePrimaryButtonAction}
              primaryButtonDisabled={!multiSigGroupCache?.connections.length}
              secondaryButtonText={`${i18n.t(
                "setupgroupprofile.scan.pasteoobi"
              )}`}
              secondaryButtonAction={openPasteModal}
            />
          );
        case OperationType.MULTI_SIG_RECEIVER_SCAN:
          return (
            <PageFooter
              pageId={componentId}
              secondaryButtonText={`${i18n.t(
                "setupgroupprofile.scan.pasteoobi"
              )}`}
              secondaryButtonAction={openPasteModal}
            />
          );
        case OperationType.SCAN_SSI_BOOT_URL:
        case OperationType.SCAN_SSI_CONNECT_URL:
          return <div></div>;
        default:
          return (
            <PageFooter
              pageId={componentId}
              secondaryButtonText={`${i18n.t(
                "setupgroupprofile.scan.pastecontents"
              )}`}
              secondaryButtonAction={openPasteModal}
            />
          );
      }
    };

    const containerClass = combineClassNames("qr-code-scanner", {
      "no-permission": !permission || mobileweb,
      "scan-unavailable": scanUnavailable,
    });

    const handleCloseAlert = () => {
      setOpenIdentifierMissingAlert(false);
    };

    const handleCreateIdentifier = () => {
      setCreateIdentifierModalIsOpen(true);
    };

    return (
      <>
        <IonGrid
          className={containerClass}
          data-testid="qr-code-scanner"
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
                  <span className="qr-code-scanner-text">
                    {i18n.t("tabs.scan.tab.title")}
                  </span>
                </IonCol>
              </IonRow>
              <IonRow className="scan-icon">
                <IonIcon
                  icon={scanOutline}
                  color="light"
                  className="qr-code-scanner-icon"
                />
                <span className="qr-code-scanner-permission-text">
                  {scanUnavailable
                    ? i18n.t("tabs.scan.tab.cameraunavailable")
                    : i18n.t("tabs.scan.tab.permissionalert")}
                </span>
              </IonRow>
              <RenderPageFooter />
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
          onDismiss={() => setPasteModalIsOpen(false)}
          header={{
            closeButton: true,
            closeButtonAction: () => setPasteModalIsOpen(false),
            closeButtonLabel: `${i18n.t("setupgroupprofile.scan.cancel")}`,
            title: `${
              currentOperation === OperationType.MULTI_SIG_INITIATOR_SCAN ||
              currentOperation === OperationType.MULTI_SIG_RECEIVER_SCAN
                ? `${i18n.t("setupgroupprofile.scan.pasteoobi")}`
                : currentOperation === OperationType.SCAN_WALLET_CONNECTION
                ? i18n.t("connectdapp.inputpidmodal.header")
                : `${i18n.t("setupgroupprofile.scan.pastecontents")}`
            }`,
            actionButton: true,
            actionButtonDisabled: !pastedValue,
            actionButtonAction: handleSubmitPastedValue,
            actionButtonLabel: `${i18n.t("setupgroupprofile.scan.confirm")}`,
          }}
        >
          <CustomInput
            dataTestId={`${componentId}-input`}
            autofocus={true}
            onChangeInput={setPastedValue}
            value={pastedValue}
          />
        </OptionModal>
        <Alert
          isOpen={openIdentifierMissingAlert}
          setIsOpen={setOpenIdentifierMissingAlert}
          dataTestId="alert-create-identifier"
          className="alert-create-identifier"
          headerText={i18n.t("tabs.scan.tab.missingidentifier.title")}
          confirmButtonText={`${i18n.t(
            "tabs.scan.tab.missingidentifier.create"
          )}`}
          cancelButtonText={`${i18n.t(
            "tabs.scan.tab.missingidentifier.cancel"
          )}`}
          actionConfirm={handleCreateIdentifier}
          actionCancel={handleCloseAlert}
          actionDismiss={handleCloseAlert}
        />
      </>
    );
  }
);

export { Scanner };
