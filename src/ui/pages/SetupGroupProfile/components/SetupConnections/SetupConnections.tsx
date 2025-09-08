import { IonLabel, IonSegment, IonSegmentButton } from "@ionic/react";
import { repeatOutline, warningOutline } from "ionicons/icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Agent } from "../../../../../core/agent/agent";
import {
  isMultisigConnectionDetails,
  OobiType,
} from "../../../../../core/agent/agent.types";
import { i18n } from "../../../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks";
import {
  getMultisigConnectionsCache,
  getProfiles,
  MultiSigGroup,
  updateOrAddMultisigConnectionCache,
} from "../../../../../store/reducers/profileCache";
import { setToastMsg } from "../../../../../store/reducers/stateCache";
import { Avatar } from "../../../../components/Avatar";
import { InfoCard } from "../../../../components/InfoCard";
import { ScrollablePageLayout } from "../../../../components/layout/ScrollablePageLayout";
import { PageFooter } from "../../../../components/PageFooter";
import { PageHeader } from "../../../../components/PageHeader";
import { Scan } from "../../../../components/Scan";
import { useScanHandle } from "../../../../components/Scan/hook/useScanHandle";
import { ScanRef } from "../../../../components/Scan/Scan.types";
import { useCameraDirection } from "../../../../components/Scanner/hook/useCameraDirection";
import { ToastMsgType } from "../../../../globals/types";
import { useOnlineStatusEffect } from "../../../../hooks";
import { Profiles } from "../../../Profiles";
import { StageProps } from "../../SetupGroupProfile.types";
import "./SetupConnections.scss";
import { Tab } from "./SetupConnections.types";
import { ShareConnections } from "./ShareConnections";

const SetupConnections = ({ setState }: StageProps) => {
  const componentId = "setup-group-profile";
  const dispatch = useAppDispatch();
  const profiles = useAppSelector(getProfiles);
  const [oobi, setOobi] = useState("");
  const [tab, setTab] = useState<Tab>(Tab.SetupMembers);
  const isScanTab = Tab.Scan === tab;
  const { cameraDirection, changeCameraDirection, supportMultiCamera } =
    useCameraDirection();
  const [enableCameraDirection, setEnableCameraDirection] = useState(false);
  const [openProfiles, setOpenProfiles] = useState(false);
  const scanRef = useRef<ScanRef>(null);
  const { id: profileId } = useParams<{ id: string }>();
  const profile = profiles[profileId]?.identity;
  const groupId = profile?.groupMetadata?.groupId;
  const userName = profile?.groupMetadata?.userName;

  // ensure groupConnections is always an object to avoid runtime errors in tests
  const groupConnections = useAppSelector(getMultisigConnectionsCache);

  const [multiSigGroup, setMultiSigGroup] = useState<
    MultiSigGroup | undefined
  >();

  const { resolveGroupConnection } = useScanHandle();

  const handleAvatarClick = () => {
    setOpenProfiles(true);
  };

  const updateMultiSigGroup = useCallback(async () => {
    if (!groupId) {
      return;
    }

    try {
      const multiSigGroup: MultiSigGroup = {
        groupId,
        connections: Object.values(groupConnections).filter(
          (item) =>
            isMultisigConnectionDetails(item) && item.groupId === groupId
        ),
      };

      setMultiSigGroup(multiSigGroup);
    } catch (e) {
      dispatch(setToastMsg(ToastMsgType.UNKNOWN_ERROR));
    }
  }, [dispatch, groupConnections, groupId]);

  useEffect(() => {
    updateMultiSigGroup();
  }, [groupConnections, groupId, updateMultiSigGroup]);

  const fetchOobi = useCallback(async () => {
    if (!groupId || !userName) return;

    try {
      const oobiValue = await Agent.agent.connections.getOobi(profileId, {
        alias: profile?.displayName,
        groupId: groupId,
        groupName: userName,
      });
      if (oobiValue) {
        setOobi(oobiValue);
      }
    } catch (e) {
      dispatch(setToastMsg(ToastMsgType.UNKNOWN_ERROR));
    }
  }, [groupId, userName, profileId, profile?.displayName, dispatch]);

  useOnlineStatusEffect(fetchOobi);

  const handleClose = useCallback(() => {
    scanRef.current?.stopScan();
    setTab(Tab.SetupMembers);
  }, []);

  const handleScan = useCallback(
    async (content: string) => {
      if (!groupId) return;
      const invitation = await resolveGroupConnection(
        content,
        groupId,
        handleClose,
        scanRef.current?.registerScanHandler,
        handleClose
      );

      if (!invitation) return;

      if (isMultisigConnectionDetails(invitation.connection)) {
        dispatch(updateOrAddMultisigConnectionCache(invitation.connection));
      }

      if (invitation.type === OobiType.NORMAL) {
        dispatch(setToastMsg(ToastMsgType.NEW_MULTI_SIGN_MEMBER));
      }
    },
    [dispatch, groupId, handleClose, resolveGroupConnection]
  );

  const handleInit = () => {
    if (!multiSigGroup || multiSigGroup.connections.length == 0) return;

    setState((value) => ({
      ...value,
      scannedConections: multiSigGroup.connections,
      ourIdentifier: profileId,
      newIdentifier: profile,
    }));
  };

  return (
    <>
      <ScrollablePageLayout
        pageId={componentId}
        customClass={tab}
        header={
          <PageHeader
            title={tab === Tab.SetupMembers ? profile?.displayName : undefined}
            actionButton={isScanTab && supportMultiCamera}
            actionButtonIcon={isScanTab ? repeatOutline : undefined}
            actionButtonAction={isScanTab ? changeCameraDirection : undefined}
            actionButtonDisabled={isScanTab && !enableCameraDirection}
            additionalButtons={
              !isScanTab && profile ? (
                <Avatar
                  id={profile.id}
                  handleAvatarClick={handleAvatarClick}
                />
              ) : undefined
            }
          />
        }
        footer={
          tab === Tab.SetupMembers &&
          profile?.groupMetadata?.groupInitiator && (
            <PageFooter
              pageId={componentId}
              primaryButtonAction={handleInit}
              primaryButtonText={`${i18n.t(
                "setupgroupprofile.setupmembers.actions.initiator.initiatebutton"
              )}`}
              primaryButtonDisabled={!multiSigGroup?.connections.length}
            />
          )
        }
      >
        <div className={`container ${tab}-container`}>
          {tab !== Tab.Scan && (
            <InfoCard
              className="alert"
              icon={warningOutline}
              content={
                profile?.groupMetadata?.groupInitiator
                  ? i18n.t("setupgroupprofile.setupmembers.alert.initiator")
                  : i18n.t("setupgroupprofile.setupmembers.alert.joiner")
              }
            />
          )}
          <IonSegment
            data-testid="setup-members-segment"
            className="setup-members-segment"
            value={tab}
            onIonChange={(event) => setTab(event.detail.value as Tab)}
          >
            <IonSegmentButton
              value={Tab.SetupMembers}
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
          {tab === Tab.SetupMembers ? (
            <ShareConnections
              oobi={oobi}
              group={multiSigGroup}
              profile={profile}
            />
          ) : (
            <Scan
              ref={scanRef}
              onFinishScan={handleScan}
              cameraDirection={cameraDirection}
              onCheckPermissionFinish={setEnableCameraDirection}
            />
          )}
        </div>
      </ScrollablePageLayout>
      <Profiles
        isOpen={openProfiles}
        setIsOpen={setOpenProfiles}
      />
    </>
  );
};

export { SetupConnections };
