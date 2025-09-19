import { IonSpinner, useIonViewWillEnter } from "@ionic/react";
import { useCallback, useMemo, useRef, useState } from "react";
import { repeatOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { Agent } from "../../../core/agent/agent";
import { IdentifierDetails as IdentifierDetailsCore } from "../../../core/agent/services/identifier.types";
import { i18n } from "../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { getBiometricsCache } from "../../../store/reducers/biometricsCache";
import { removeProfile } from "../../../store/reducers/profileCache";
import {
  getAuthentication,
  setCurrentOperation,
  setCurrentRoute,
  setToastMsg,
} from "../../../store/reducers/stateCache";
import "../../components/CardDetails/CardDetails.scss";
import {
  BackEventPriorityType,
  OperationType,
  ToastMsgType,
} from "../../globals/types";
import { useOnlineStatusEffect } from "../../hooks";
import { useProfile } from "../../hooks/useProfile";
import { showError } from "../../utils/error";
import { combineClassNames } from "../../utils/style";
import { Alert } from "../Alert";
import { Avatar } from "../Avatar";
import { CloudError } from "../CloudError";
import { ScrollablePageLayout } from "../layout/ScrollablePageLayout";
import { PageFooter } from "../PageFooter";
import { PageHeader } from "../PageHeader";
import { SideSlider } from "../SideSlider";
import { Verification } from "../Verification";
import { ProfileContent } from "./components/ProfileContent";
import { RotateKeyModal } from "./components/RotateKeyModal";
import "./ProfileDetailsModal.scss";
import {
  IdentifierDetailModalProps,
  ProfileDetailsModalProps,
} from "./ProfileDetailsModal.types";
import { ResponsivePageLayout } from "../layout/ResponsivePageLayout";
import { ScanRef } from "../Scan/Scan.types";
import { useCameraDirection } from "../Scan/hook/useCameraDirection";
import { Scan } from "../Scan";

const ProfileDetailsModule = ({
  profileId,
  onClose: handleDone,
  pageId,
  hardwareBackButtonConfig,
  restrictedOptions,
}: ProfileDetailsModalProps) => {
  const history = useHistory();
  const dispatch = useAppDispatch();
  const biometrics = useAppSelector(getBiometricsCache);
  const passwordAuthentication =
    useAppSelector(getAuthentication).passwordIsSet;
  const [alertIsOpen, setAlertIsOpen] = useState(false);
  const [verifyIsOpen, setVerifyIsOpen] = useState(false);
  const [openRotateKeyModal, setOpenRotateKeyModal] = useState(false);
  const [profile, setProfile] = useState<IdentifierDetailsCore | undefined>();
  const [oobi, setOobi] = useState("");
  const [cloudError, setCloudError] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const scanRef = useRef<ScanRef>(null);
  const { cameraDirection, changeCameraDirection, supportMultiCamera } =
    useCameraDirection();
  const [enableCameraDirection, setEnableCameraDirection] = useState(false);
  const { setRecentProfileAsDefault, defaultProfile, defaultName } =
    useProfile();

  const fetchOobi = useCallback(async () => {
    try {
      if (!profile?.id) return;

      const oobiValue = await Agent.agent.connections.getOobi(`${profile.id}`, {
        alias: profile.displayName,
      });
      if (oobiValue) {
        setOobi(oobiValue);
      }
    } catch (e) {
      showError("Unable to fetch oobi", e, dispatch);
    }
  }, [profile?.id, profile?.displayName, dispatch]);

  const getDetails = useCallback(async () => {
    if (!profileId) return;

    try {
      const cardDetailsResult = await Agent.agent.identifiers.getIdentifier(
        profileId
      );
      setProfile(cardDetailsResult);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes(Agent.MISSING_DATA_ON_KERIA)
      ) {
        setCloudError(true);
      } else {
        handleDone?.(false);
        showError("Unable to get identifier details", error, dispatch);
      }
    }
  }, [profileId, handleDone, dispatch]);

  useOnlineStatusEffect(getDetails);
  useOnlineStatusEffect(fetchOobi);

  useIonViewWillEnter(() => {
    dispatch(setCurrentRoute({ path: history.location.pathname }));
  });

  const handleDelete = async () => {
    handleDone?.(false);
    setHidden(true);

    try {
      setVerifyIsOpen(false);
      const filterId = profile
        ? profile.id
        : cloudError
        ? profileId
        : undefined;

      await deleteIdentifier();
      if (defaultProfile?.identity.id === filterId) {
        await setRecentProfileAsDefault();
      }
      dispatch(setToastMsg(ToastMsgType.IDENTIFIER_DELETED));
      dispatch(removeProfile(filterId || ""));
    } catch (e) {
      showError(
        "Unable to delete identifier",
        e,
        dispatch,
        ToastMsgType.DELETE_IDENTIFIER_FAIL
      );
    }
  };

  const deleteIdentifier = async () => {
    if (profileId && cloudError) {
      await Agent.agent.identifiers.deleteStaleLocalIdentifier(profileId);
    }

    if (profile) {
      await Agent.agent.identifiers.markIdentifierPendingDelete(profile.id);
    }
  };

  const deleteButtonAction = () => {
    setAlertIsOpen(true);
  };

  const handleAuthentication = () => {
    setHidden(!passwordAuthentication && !biometrics.enabled);
    setVerifyIsOpen(true);
  };

  const cancelDelete = () => dispatch(setCurrentOperation(OperationType.IDLE));

  const openRotateModal = useCallback(() => {
    setOpenRotateKeyModal(true);
  }, []);

  const pageClasses = combineClassNames("profile-details-module", {
    "ion-hide": hidden,
  });

  const back = i18n.t("profiledetails.close");

  const handleCloseScan = useCallback(() => {
    setIsScanOpen(false);
  }, []);

  const handleScanFinish = useCallback(
    async (content: string) => {
      // TODO: Implement scan finish logic for ProfileDetailsModal
      // eslint-disable-next-line no-console
      console.log("Scan finished with content:", content);
      handleCloseScan();
    },
    [handleCloseScan]
  );

  return (
    <>
      {(() => {
        if (cloudError) {
          return (
            <CloudError
              pageId={pageId}
              header={
                <PageHeader
                  title={defaultName}
                  additionalButtons={
                    <Avatar id={defaultProfile?.identity.id || ""} />
                  }
                />
              }
              content={`${i18n.t("profiledetails.clouderror")}`}
            >
              <PageFooter
                pageId={pageId}
                deleteButtonText={`${i18n.t("profiledetails.delete.button")}`}
                deleteButtonAction={deleteButtonAction}
              />
            </CloudError>
          );
        }

        if (isScanOpen) {
          return (
            <ResponsivePageLayout
              pageId={pageId}
              customClass={"scan"}
              header={
                <PageHeader
                  closeButton={true}
                  closeButtonLabel={back}
                  closeButtonAction={handleCloseScan}
                  actionButton={supportMultiCamera}
                  actionButtonIcon={repeatOutline}
                  actionButtonAction={changeCameraDirection}
                  actionButtonDisabled={!enableCameraDirection}
                />
              }
            >
              <Scan
                ref={scanRef}
                onFinishScan={handleScanFinish}
                cameraDirection={cameraDirection}
                onCheckPermissionFinish={setEnableCameraDirection}
              />
            </ResponsivePageLayout>
          );
        }

        return (
          <ScrollablePageLayout
            pageId={pageId}
            customClass={pageClasses}
            header={
              <PageHeader
                backButton={true}
                onBack={handleDone}
                title={profile?.displayName}
                hardwareBackButtonConfig={hardwareBackButtonConfig}
              />
            }
          >
            {profile ? (
              <div className="card-details-content">
                <ProfileContent
                  onRotateKey={openRotateModal}
                  cardData={profile as IdentifierDetailsCore}
                  oobi={oobi}
                  setCardData={setProfile}
                />
                {!restrictedOptions && (
                  <PageFooter
                    pageId={pageId}
                    deleteButtonText={`${i18n.t(
                      "profiledetails.delete.button"
                    )}`}
                    deleteButtonAction={deleteButtonAction}
                  />
                )}
              </div>
            ) : (
              <div
                className="identifier-card-detail-spinner-container"
                data-testid="identifier-card-detail-spinner-container"
              >
                <IonSpinner name="circular" />
              </div>
            )}
          </ScrollablePageLayout>
        );
      })()}
      <Alert
        isOpen={alertIsOpen}
        setIsOpen={setAlertIsOpen}
        dataTestId="alert-confirm-identifier-delete-details"
        headerText={i18n.t("profiledetails.delete.alert.title")}
        confirmButtonText={`${i18n.t("profiledetails.delete.alert.confirm")}`}
        cancelButtonText={`${i18n.t("profiledetails.delete.alert.cancel")}`}
        actionConfirm={handleAuthentication}
        actionCancel={cancelDelete}
        actionDismiss={cancelDelete}
      />
      <RotateKeyModal
        identifierId={profileId}
        onReloadData={getDetails}
        signingKey={profile?.k[0] || ""}
        isOpen={openRotateKeyModal}
        onClose={() => setOpenRotateKeyModal(false)}
      />
      <Verification
        verifyIsOpen={verifyIsOpen}
        setVerifyIsOpen={(value, isCancel) => {
          if (isCancel) {
            setHidden(false);
          }

          setVerifyIsOpen(value);
        }}
        onVerify={handleDelete}
      />
    </>
  );
};

const ProfileDetailsModal = ({
  isOpen,
  setIsOpen,
  onClose,
  ...props
}: IdentifierDetailModalProps) => {
  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  const handleBack = useCallback(() => {
    handleClose();
    onClose?.();
  }, [handleClose, onClose]);

  const hardwareBackButtonConfig = useMemo(
    () => ({
      prevent: false,
      priority: BackEventPriorityType.Modal,
    }),
    []
  );

  return (
    <SideSlider
      isOpen={isOpen}
      renderAsModal
    >
      <ProfileDetailsModule
        {...props}
        onClose={handleBack}
        hardwareBackButtonConfig={hardwareBackButtonConfig}
        restrictedOptions={props.restrictedOptions}
      />
    </SideSlider>
  );
};

export { ProfileDetailsModal };
