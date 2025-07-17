import { IonSpinner, useIonViewWillEnter } from "@ionic/react";
import { useCallback, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import { Agent } from "../../../core/agent/agent";
import { IdentifierDetails as IdentifierDetailsCore } from "../../../core/agent/services/identifier.types";
import { i18n } from "../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { getBiometricsCache } from "../../../store/reducers/biometricsCache";
import { removeIdentifierCache } from "../../../store/reducers/identifiersCache";
import {
  getAuthentication,
  getStateCache,
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
import { showError } from "../../utils/error";
import { combineClassNames } from "../../utils/style";
import { Alert } from "../Alert";
import { ScrollablePageLayout } from "../layout/ScrollablePageLayout";
import { PageFooter } from "../PageFooter";
import { PageHeader } from "../PageHeader";
import { SideSlider } from "../SideSlider";
import { Verification } from "../Verification";
import { IdentifierContent } from "./components/IdentifierContent";
import { RotateKeyModal } from "./components/RotateKeyModal";
import "./ProfileDetailModal.scss";
import {
  IdentifierDetailModalProps,
  ProfileDetailModalProps,
} from "./ProfileDetailModal.types";

const ProfileDetailModule = ({
  profileId,
  onClose: handleDone,
  pageId,
  hardwareBackButtonConfig,
  restrictedOptions,
}: ProfileDetailModalProps) => {
  const history = useHistory();
  const dispatch = useAppDispatch();
  const stateCache = useAppSelector(getStateCache);
  const biometrics = useAppSelector(getBiometricsCache);
  const passwordAuthentication =
    useAppSelector(getAuthentication).passwordIsSet;
  const [alertIsOpen, setAlertIsOpen] = useState(false);
  const [verifyIsOpen, setVerifyIsOpen] = useState(false);
  const [openRotateKeyModal, setOpenRotateKeyModal] = useState(false);
  const [cardData, setCardData] = useState<IdentifierDetailsCore | undefined>();
  const userName = stateCache.authentication.userName;
  const [oobi, setOobi] = useState("");
  const [cloudError, setCloudError] = useState(false);
  const [hidden, setHidden] = useState(false);

  const fetchOobi = useCallback(async () => {
    try {
      if (!cardData?.id) return;

      const oobiValue = await Agent.agent.connections.getOobi(
        `${cardData.id}`,
        userName
      );
      if (oobiValue) {
        setOobi(oobiValue);
      }
    } catch (e) {
      showError("Unable to fetch oobi", e, dispatch);
    }
  }, [cardData?.id, userName, dispatch]);

  const getDetails = useCallback(async () => {
    try {
      const cardDetailsResult = await Agent.agent.identifiers.getIdentifier(
        profileId
      );
      setCardData(cardDetailsResult);
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
      const filterId = cardData
        ? cardData.id
        : cloudError
          ? profileId
          : undefined;

      await deleteIdentifier();
      dispatch(setToastMsg(ToastMsgType.IDENTIFIER_DELETED));
      dispatch(removeIdentifierCache(filterId || ""));
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

    if (cardData) {
      await Agent.agent.identifiers.markIdentifierPendingDelete(cardData.id);
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

  const pageClasses = combineClassNames("identifier-details-module", {
    "ion-hide": hidden,
  });

  return (
    <>
      <ScrollablePageLayout
        pageId={pageId}
        customClass={pageClasses}
        header={
          <PageHeader
            backButton={true}
            onBack={handleDone}
            title={cardData?.displayName}
            hardwareBackButtonConfig={hardwareBackButtonConfig}
          />
        }
      >
        {!cardData ? (
          <div
            className="identifier-card-detail-spinner-container"
            data-testid="identifier-card-detail-spinner-container"
          >
            <IonSpinner name="circular" />
          </div>
        ) : (
          <>
            <div className="card-details-content">
              <IdentifierContent
                onRotateKey={openRotateModal}
                cardData={cardData as IdentifierDetailsCore}
                oobi={oobi}
                setCardData={setCardData}
              />
              {restrictedOptions ? (
                <></>
              ) : (
                <PageFooter
                  pageId={pageId}
                  deleteButtonText={`${i18n.t("profiledetails.delete.button")}`}
                  deleteButtonAction={deleteButtonAction}
                />
              )}
            </div>
          </>
        )}
      </ScrollablePageLayout>
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
        signingKey={cardData?.k[0] || ""}
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

const ProfileDetailModal = ({
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
      <ProfileDetailModule
        {...props}
        onClose={handleBack}
        hardwareBackButtonConfig={hardwareBackButtonConfig}
        restrictedOptions={props.restrictedOptions}
      />
    </SideSlider>
  );
};

export { ProfileDetailModal };
