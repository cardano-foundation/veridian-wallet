import { IonLabel, IonModal, IonSegment, IonSegmentButton } from "@ionic/react";
import { repeatOutline } from "ionicons/icons";
import { useCallback, useRef, useState } from "react";
import { i18n } from "../../../i18n";
import { PageHeader } from "../PageHeader";
import { Scan } from "../Scan";
import { ScanRef } from "../Scan/Scan.types";
import { useCameraDirection } from "../Scan/hook/useCameraDirection";
import { useScanHandle } from "../Scan/hook/useScanHandle";
import { ResponsivePageLayout } from "../layout/ResponsivePageLayout";
import "./ShareProfile.scss";
import { ShareProfileProps, Tab } from "./ShareProfile.types";
import { ShareOobi } from "./components/ShareOobi";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { getCurrentProfile } from "../../../store/reducers/profileCache";
import { Agent } from "../../../core/agent/agent";
import { showError } from "../../utils/error";
import { useOnlineStatusEffect } from "../../hooks";

const ShareProfile = ({ isOpen, setIsOpen }: ShareProfileProps) => {
  const componentId = "share-profile";
  const [tab, setTab] = useState<Tab>(Tab.ShareOobi);
  const isScanTab = Tab.Scan === tab;
  const scanRef = useRef<ScanRef>(null);
  const { resolveIndividualConnection } = useScanHandle();
  const dispatch = useAppDispatch();
  const currentProfile = useAppSelector(getCurrentProfile);
  const [displayOobi, setDisplayOobi] = useState("");

  const { cameraDirection, changeCameraDirection, supportMultiCamera } =
    useCameraDirection();
  const [enableCameraDirection, setEnableCameraDirection] = useState(false);

  const fetchOobi = useCallback(async () => {
    if (!isOpen) return;

    try {
      if (!currentProfile?.identity.id) return;

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
    currentProfile?.identity.id,
    currentProfile?.identity.displayName,
    dispatch,
    isOpen,
  ]);

  useOnlineStatusEffect(fetchOobi);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    scanRef.current?.stopScan();
    setTab(Tab.ShareOobi);
  }, [setIsOpen]);

  const handleScan = useCallback(
    async (content: string) => {
      await resolveIndividualConnection(
        content,
        handleClose,
        scanRef.current?.registerScanHandler,
        handleClose
      );
    },
    [handleClose, resolveIndividualConnection]
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
      </ResponsivePageLayout>
    </IonModal>
  );
};

export { ShareProfile };
