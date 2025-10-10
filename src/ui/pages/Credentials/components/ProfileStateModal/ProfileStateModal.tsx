import { IonModal } from "@ionic/react";
import { warningOutline } from "ionicons/icons";
import { useEffect, useMemo, useState } from "react";
import { Agent } from "../../../../../core/agent/agent";
import { CreationStatus } from "../../../../../core/agent/agent.types";
import { i18n } from "../../../../../i18n";
import { useAppDispatch } from "../../../../../store/hooks";
import { removeProfile } from "../../../../../store/reducers/profileCache";
import {
  setToastMsg,
  showGlobalLoading,
} from "../../../../../store/reducers/stateCache";
import { Alert } from "../../../../components/Alert";
import { Avatar } from "../../../../components/Avatar";
import { InfoCard } from "../../../../components/InfoCard";
import { ResponsivePageLayout } from "../../../../components/layout/ResponsivePageLayout";
import { PageFooter } from "../../../../components/PageFooter";
import { PageHeader } from "../../../../components/PageHeader";
import { Verification } from "../../../../components/Verification";
import { ToastMsgType } from "../../../../globals/types";
import { useProfile } from "../../../../hooks/useProfile";
import { showError } from "../../../../utils/error";
import "./ProfileStateModal.scss";
import { ProfileStateModalProps } from "./ProfileStateModal.types";

const WAITING_TIME = 5000;

const ProfileStateModal = ({ onOpenProfiles }: ProfileStateModalProps) => {
  const pageId = "profile-state-page";
  const {
    setRecentProfileAsDefault,
    defaultProfile: currentProfile,
    defaultName,
  } = useProfile();
  const dispatch = useAppDispatch();
  const [alertIsOpen, setAlertIsOpen] = useState(false);
  const [verifyIsOpen, setVerifyIsOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (
      !currentProfile ||
      currentProfile.identity.creationStatus === CreationStatus.COMPLETE
    ) {
      setIsOpen(false);
      return;
    }

    const identity = currentProfile.identity;

    if (identity.creationStatus === CreationStatus.FAILED) {
      setIsOpen(true);
      return;
    }

    if (
      identity.creationStatus === CreationStatus.PENDING &&
      !identity.groupMemberPre
    ) {
      const createdTime = new Date(identity.createdAtUTC).getTime();
      const now = Date.now();

      const remainTime = createdTime + WAITING_TIME - now;

      if (remainTime > 0) {
        dispatch(showGlobalLoading(true));
        const timer = setTimeout(() => {
          if (identity.creationStatus === CreationStatus.PENDING) {
            dispatch(showGlobalLoading(false));
            setIsOpen(true);
          }
        }, remainTime);

        return () => {
          dispatch(showGlobalLoading(false));
          clearTimeout(timer);
        };
      }

      setIsOpen(true);
    }
  }, [currentProfile, dispatch]);

  const type = useMemo(() => {
    if (currentProfile?.identity.creationStatus === CreationStatus.PENDING)
      return "warning";
    return "error";
  }, [currentProfile?.identity.creationStatus]);

  const getMessage = () => {
    if (currentProfile?.identity.creationStatus === CreationStatus.PENDING)
      return i18n.t("profiledetails.loadprofileerror.pending");
    if (currentProfile?.identity.creationStatus === CreationStatus.FAILED)
      return i18n.t("profiledetails.loadprofileerror.nowitness");
    return "";
  };

  const deleteButtonAction = () => {
    setAlertIsOpen(true);
  };

  const cancelDelete = () => setAlertIsOpen(false);

  const handleAuthentication = () => {
    setVerifyIsOpen(true);
  };

  const handleDelete = async () => {
    if (!currentProfile) return;
    try {
      setVerifyIsOpen(false);
      const profileId = currentProfile.identity.id;
      await Agent.agent.identifiers.markIdentifierPendingDelete(profileId);
      await setRecentProfileAsDefault();
      dispatch(removeProfile(profileId || ""));
      dispatch(setToastMsg(ToastMsgType.IDENTIFIER_DELETED));
    } catch (e) {
      showError(
        "Unable to delete identifier",
        e,
        dispatch,
        ToastMsgType.DELETE_IDENTIFIER_FAIL
      );
    }
  };

  return (
    <>
      <IonModal
        className="profile-state-modal"
        isOpen={isOpen}
      >
        <ResponsivePageLayout
          pageId={pageId}
          header={
            <PageHeader
              title={defaultName}
              additionalButtons={
                <Avatar
                  id={currentProfile?.identity.id || ""}
                  handleAvatarClick={onOpenProfiles}
                />
              }
            />
          }
          activeStatus={true}
          customClass="profile-state"
        >
          <InfoCard
            className={type}
            danger={type === "error"}
            content={getMessage()}
            icon={type === "warning" ? warningOutline : ""}
          />
          <PageFooter
            pageId={pageId}
            deleteButtonText={`${i18n.t("profiledetails.delete.button")}`}
            deleteButtonAction={deleteButtonAction}
          />
        </ResponsivePageLayout>
      </IonModal>
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
      <Verification
        verifyIsOpen={verifyIsOpen}
        setVerifyIsOpen={setVerifyIsOpen}
        onVerify={handleDelete}
      />
    </>
  );
};

export { ProfileStateModal };
