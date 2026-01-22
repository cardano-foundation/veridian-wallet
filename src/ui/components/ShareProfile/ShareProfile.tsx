import { IonLabel, IonModal, IonSegment, IonSegmentButton } from "@ionic/react";
import { repeatOutline } from "ionicons/icons";
import { useCallback, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import { Agent } from "../../../core/agent/agent";
import { i18n } from "../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { getCurrentProfile } from "../../../store/reducers/profileCache";
import { useOnlineStatusEffect } from "../../hooks";
import { showError } from "../../utils/error";
import { PageHeader } from "../PageHeader";
import { Scan } from "../Scan";
import { ScanRef } from "../Scan/Scan.types";
import { useCameraDirection } from "../Scan/hook/useCameraDirection";
import { useScanHandle } from "../Scan/hook/useScanHandle";
import { ResponsivePageLayout } from "../layout/ResponsivePageLayout";
import { TabsRoutePath } from "../navigation/TabsMenu";
import "./ShareProfile.scss";
import { ShareProfileProps, Tab } from "./ShareProfile.types";
import { ShareOobi } from "./components/ShareOobi";

const ShareProfile = ({
  isOpen,
  oobi,
  hiddenScan,
  setIsOpen,
  onScan,
  defaultTab = Tab.ShareOobi,
}: ShareProfileProps) => {
  const componentId = "share-profile";
  const [tab, setTab] = useState<Tab>(defaultTab);
  const isScanTab = Tab.Scan === tab;
  const scanRef = useRef<ScanRef>(null);
  const { resolveIndividualConnection } = useScanHandle();
  const dispatch = useAppDispatch();
  const currentProfile = useAppSelector(getCurrentProfile);
  const [displayOobi, setDisplayOobi] = useState("");
  const history = useHistory();

  const { cameraDirection, changeCameraDirection, supportMultiCamera } =
    useCameraDirection();
  const [enableCameraDirection, setEnableCameraDirection] = useState(false);

  const fetchOobi = useCallback(async () => {
    if (!isOpen) return;

    if (defaultTab) {
      setTab(defaultTab);
    }

    if (oobi) {
      setDisplayOobi(oobi);
    }

    try {
      if (!currentProfile?.identity.id || oobi) return;

      const oobiValue = await Agent.agent.connections.getOobi(
        `${currentProfile.identity.id}`,
        { alias: currentProfile?.identity.displayName || "" }
      );
      if (oobiValue) {
        setDisplayOobi(oobiValue);
      }
    } catch (e) {
      showError("Unable to fetch connection oobi", e, dispatch);
    }
  }, [
    isOpen,
    defaultTab,
    oobi,
    currentProfile?.identity.id,
    currentProfile?.identity.displayName,
    dispatch,
  ]);

  useOnlineStatusEffect(fetchOobi);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    scanRef.current?.stopScan();
    setTab(Tab.ShareOobi);
  }, [setIsOpen]);

  const handleScan = useCallback(
    async (content: string) => {
      if (onScan) {
        await onScan(content, scanRef.current?.registerScanHandler);
        return;
      }

      const close = () => {
        handleClose();

        if (history.location.pathname != TabsRoutePath.CONNECTIONS) {
          history.push(TabsRoutePath.CONNECTIONS);
        }
      };

      await resolveIndividualConnection(
        content,
        close,
        scanRef.current?.registerScanHandler,
        close
      );
    },
    [handleClose, history, onScan, resolveIndividualConnection]
  );

  return (
    <IonModal
      className={`${componentId}-modal ${tab}`}
      data-testid={componentId}
      isOpen={isOpen}
      onDidDismiss={handleClose}
    >
      <ResponsivePageLayout
        pageId={componentId}
        customClass={tab}
        header={
          <PageHeader
            closeButton={true}
            closeButtonAction={handleClose}
            closeButtonLabel={`${i18n.t("shareprofile.buttons.close")}`}
            title={
              tab === Tab.ShareOobi
                ? `${i18n.t("shareprofile.shareoobi.title")}`
                : undefined
            }
            actionButton={isScanTab && supportMultiCamera}
            actionButtonIcon={isScanTab ? repeatOutline : undefined}
            actionButtonAction={isScanTab ? changeCameraDirection : undefined}
            actionButtonDisabled={isScanTab && !enableCameraDirection}
          />
        }
      >
        {tab === Tab.ShareOobi ? (
          <>
            <p className="share-profile-subtitle">
              {i18n.t("shareprofile.shareoobi.description")}
            </p>
            <ShareOobi oobi={displayOobi} />
          </>
        ) : (
          <>
            <div className="placeholder"></div>
            <Scan
              ref={scanRef}
              onFinishScan={handleScan}
              cameraDirection={cameraDirection}
              onCheckPermissionFinish={setEnableCameraDirection}
              displayOnModal
            />
          </>
        )}
        {hiddenScan ? (
          <div />
        ) : (
          <IonSegment
            data-testid="share-profile-segment"
            className="share-profile-segment"
            value={tab}
            onIonChange={(event) => setTab(event.detail.value as Tab)}
          >
            <IonSegmentButton
              value={Tab.ShareOobi}
              data-testid="share-oobi-segment-button"
            >
              <IonLabel>{`${i18n.t("shareprofile.buttons.provide")}`}</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton
              value={Tab.Scan}
              data-testid="scan-profile-segment-button"
            >
              <IonLabel>{`${i18n.t("shareprofile.buttons.scan")}`}</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        )}
      </ResponsivePageLayout>
    </IonModal>
  );
};

export { ShareProfile };
