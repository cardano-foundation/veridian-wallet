import { IonSpinner, useIonViewWillEnter } from "@ionic/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { syncOutline } from "ionicons/icons";
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
  ProfileDetailsModuleProps,
  QR_CODE_TYPES,
  ERROR_MESSAGES,
  MODAL_STATES,
  ModalState,
} from "./ProfileDetailsModal.types";
import { ResponsivePageLayout } from "../layout/ResponsivePageLayout";
import { ScanRef } from "../Scan/Scan.types";
import { useCameraDirection } from "../Scan/hook/useCameraDirection";
import { Scan } from "../Scan";
import { handleConnect } from "./handleConnect";
import { IncomingRequest } from "./components/IncomingRequest";

const DELAY_TO_CLOSE_MODAL = 300;

const useProfileData = (
  profileId: string | undefined,
  handleDone: ((success: boolean) => void) | undefined,
  dispatch: any
) => {
  const [profile, setProfile] = useState<IdentifierDetailsCore | undefined>();
  const [oobi, setOobi] = useState("");
  const [cloudError, setCloudError] = useState(false);

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
      showError(ERROR_MESSAGES.UNABLE_TO_FETCH_OOBI, e, dispatch);
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
        showError(
          ERROR_MESSAGES.UNABLE_TO_GET_IDENTIFIER_DETAILS,
          error,
          dispatch
        );
      }
    }
  }, [profileId, handleDone, dispatch]);

  useOnlineStatusEffect(getDetails);
  useOnlineStatusEffect(fetchOobi);

  return {
    profile,
    setProfile,
    oobi,
    cloudError,
    getDetails,
  };
};

const useUIState = () => {
  const [alertIsOpen, setAlertIsOpen] = useState(false);
  const [verifyIsOpen, setVerifyIsOpen] = useState(false);
  const [openRotateKeyModal, setOpenRotateKeyModal] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [enableCameraDirection, setEnableCameraDirection] = useState(false);

  return {
    alertIsOpen,
    setAlertIsOpen,
    verifyIsOpen,
    setVerifyIsOpen,
    openRotateKeyModal,
    setOpenRotateKeyModal,
    hidden,
    setHidden,
    isScanOpen,
    setIsScanOpen,
    enableCameraDirection,
    setEnableCameraDirection,
  };
};

const useConnectionLogic = (
  confirmConnection: boolean,
  scannedValue: string,
  profileAid: string | undefined,
  dispatch: any,
  setIsOpen: (isOpen: boolean) => void,
  onConnectionComplete: () => void,
  beforeConnectionComplete?: () => void
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const connectionAttemptRef = useRef<string | null>(null);

  const handleConnectWrapper = async () => {
    setIsOpen(false);
    beforeConnectionComplete?.();
    setTimeout(async () => {
      try {
        await handleConnect({
          content: scannedValue,
          profileAid,
          dispatch,
        });
      } finally {
        setIsProcessing(false);
        connectionAttemptRef.current = null;
        onConnectionComplete();
      }
    }, DELAY_TO_CLOSE_MODAL);
  };

  useEffect(() => {
    if (confirmConnection === true && scannedValue && !isProcessing) {
      const currentAttempt = scannedValue;
      if (connectionAttemptRef.current !== currentAttempt) {
        connectionAttemptRef.current = currentAttempt;
        setIsProcessing(true);
        handleConnectWrapper();
      }
    } else if (confirmConnection === false) {
      connectionAttemptRef.current = null;
    }
  }, [confirmConnection, scannedValue]);

  return {};
};

const getCurrentModalState = (
  cloudError: boolean,
  isScanOpen: boolean
): ModalState => {
  if (cloudError) return MODAL_STATES.ERROR;
  if (isScanOpen) return MODAL_STATES.SCAN;
  return MODAL_STATES.PROFILE;
};

const ProfileDetailsModule = ({
  profileId,
  onClose: handleDone,
  setIsOpen,
  pageId,
  hardwareBackButtonConfig,
  restrictedOptions,
  confirmConnection,
  scannedValue,
  onScanFinish,
  onConnectionComplete,
  beforeConnectionComplete,
}: ProfileDetailsModuleProps) => {
  const history = useHistory();
  const dispatch = useAppDispatch();
  const biometrics = useAppSelector(getBiometricsCache);
  const passwordAuthentication =
    useAppSelector(getAuthentication).passwordIsSet;
  const scanRef = useRef<ScanRef>(null);
  const { cameraDirection, changeCameraDirection, supportMultiCamera } =
    useCameraDirection();
  const { setRecentProfileAsDefault, defaultProfile, defaultName } =
    useProfile();

  const { profile, setProfile, oobi, cloudError, getDetails } = useProfileData(
    profileId,
    handleDone,
    dispatch
  );

  const {
    alertIsOpen,
    setAlertIsOpen,
    verifyIsOpen,
    setVerifyIsOpen,
    openRotateKeyModal,
    setOpenRotateKeyModal,
    hidden,
    setHidden,
    isScanOpen,
    setIsScanOpen,
    enableCameraDirection,
    setEnableCameraDirection,
  } = useUIState();

  useConnectionLogic(
    confirmConnection,
    scannedValue,
    profileId,
    dispatch,
    setIsOpen,
    onConnectionComplete,
    beforeConnectionComplete
  );

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
        ERROR_MESSAGES.UNABLE_TO_DELETE_IDENTIFIER,
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

  const handleCloseScan = () => {
    setIsScanOpen(false);
  };

  const handleShowConfirmation = async (content: string) => {
    onScanFinish(content);
  };

  const currentModalState = getCurrentModalState(cloudError, isScanOpen);

  return (
    <>
      {(() => {
        switch (currentModalState) {
          case MODAL_STATES.SCAN:
            return (
              <ResponsivePageLayout
                pageId={pageId}
                customClass={"scan"}
                header={
                  <PageHeader
                    closeButton={true}
                    closeButtonLabel={`${i18n.t("profiledetails.close")}`}
                    closeButtonAction={handleCloseScan}
                    actionButton={supportMultiCamera}
                    actionButtonIcon={syncOutline}
                    actionButtonAction={changeCameraDirection}
                    actionButtonDisabled={!enableCameraDirection}
                  />
                }
              >
                <Scan
                  ref={scanRef}
                  onFinishScan={handleShowConfirmation}
                  cameraDirection={cameraDirection}
                  onCheckPermissionFinish={setEnableCameraDirection}
                  displayOnModal={true}
                />
              </ResponsivePageLayout>
            );

          case MODAL_STATES.ERROR:
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

          case MODAL_STATES.PROFILE:
          default:
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
                      setIsScanOpen={setIsScanOpen}
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
        }
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
  const dispatch = useAppDispatch();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmConnection, setConfirmConnection] = useState(false);
  const [scannedValue, setScannedValue] = useState<string>("");
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

  const handleShowConfirmation = useCallback(
    (content: string) => {
      try {
        const { sessionAid, backendOobi, backendApi } = JSON.parse(content);

        if (!sessionAid || !backendApi || !backendOobi) {
          showError(
            ERROR_MESSAGES.UNSUPPORTED_TYPE,
            new Error("Missing sessionAid, backendApi and/or backendOobi"),
            dispatch,
            ToastMsgType.UNKNOWN_ERROR
          );
        }

        const url = new URL(backendOobi);
        const type = url.searchParams.get("type");

        if (!type) {
          showError(
            ERROR_MESSAGES.MISSING_TYPE,
            new Error("Missing 'type' parameter in scanned URL"),
            dispatch,
            ToastMsgType.UNKNOWN_ERROR
          );
          return;
        }

        if (type !== QR_CODE_TYPES.GUARDIANSHIP) {
          showError(
            ERROR_MESSAGES.UNSUPPORTED_TYPE,
            new Error(`Type '${type}' is not supported.`),
            dispatch,
            ToastMsgType.UNKNOWN_ERROR
          );
          return;
        }

        setScannedValue(content);
        setShowConfirmation(true);
      } catch (error) {
        showError(
          "Invalid QR code",
          error instanceof Error
            ? error
            : new Error("Scanned content is not a valid URL"),
          dispatch,
          ToastMsgType.UNKNOWN_ERROR
        );
      }
    },
    [dispatch]
  );

  const handleConnectionComplete = useCallback(() => {
    setConfirmConnection(false);
    setScannedValue("");
  }, []);

  return (
    <SideSlider
      isOpen={isOpen}
      renderAsModal
    >
      {showConfirmation ? (
        <IncomingRequest
          setShowConfirmation={setShowConfirmation}
          setConfirmConnection={setConfirmConnection}
          scannedValue={scannedValue}
        />
      ) : (
        <ProfileDetailsModule
          {...props}
          onClose={handleBack}
          setIsOpen={setIsOpen}
          hardwareBackButtonConfig={hardwareBackButtonConfig}
          restrictedOptions={props.restrictedOptions}
          setShowConfirmation={setShowConfirmation}
          confirmConnection={confirmConnection}
          setConfirmConnection={setConfirmConnection}
          scannedValue={scannedValue}
          onScanFinish={handleShowConfirmation}
          onConnectionComplete={handleConnectionComplete}
          beforeConnectionComplete={props.onConnectionComplete}
        />
      )}
    </SideSlider>
  );
};

export { ProfileDetailsModal };
