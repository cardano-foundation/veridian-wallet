import { IonModal } from "@ionic/react";
import { warningOutline } from "ionicons/icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Agent } from "../../../../../core/agent/agent";
import { CreationStatus } from "../../../../../core/agent/agent.types";
import { i18n } from "../../../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks";
import {
  getShowProfileState,
  removeProfile,
  setShowProfileState,
} from "../../../../../store/reducers/profileCache";
import { setToastMsg } from "../../../../../store/reducers/stateCache";
import { ToastMsgType } from "../../../../globals/types";
import { useProfile } from "../../../../hooks/useProfile";
import { Profiles } from "../../../Profiles";
import { showError } from "../../../../utils/error";
import { Alert } from "../../../../components/Alert";
import { Avatar } from "../../../../components/Avatar";
import { InfoCard } from "../../../../components/InfoCard";
import { ResponsivePageLayout } from "../../../../components/layout/ResponsivePageLayout";
import { PageFooter } from "../../../../components/PageFooter";
import { PageHeader } from "../../../../components/PageHeader";
import { Spinner } from "../../../../components/Spinner";
import { SpinnerConverage } from "../../../../components/Spinner/Spinner.type";
import { Verification } from "../../../../components/Verification";
import "./ProfileStateModal.scss";

const WAITING_TIME = 5000;

const ProfileStateModal = () => {
  const pageId = "profile-state-page";
  const {
    setRecentProfileAsDefault,
    defaultProfile: currentProfile,
    defaultName,
  } = useProfile();
  const dispatch = useAppDispatch();
  const [alertIsOpen, setAlertIsOpen] = useState(false);
  const [verifyIsOpen, setVerifyIsOpen] = useState(false);
  const [isMissingOnCloud, setMissingOnCloud] = useState(false);
  const [hiddenContent, setHiddenContent] = useState(true);
  const [isOpenProfiles, setOpenProfiles] = useState(false);
  const isOpen = useAppSelector(getShowProfileState);

  const setIsOpen = useCallback(
    (value: boolean) => {
      dispatch(setShowProfileState(value));
    },
    [dispatch]
  );

  const getDetails = useCallback(async () => {
    if (!currentProfile?.identity.id) return;

    try {
      setIsOpen(true);
      setHiddenContent(true);
      await Agent.agent.identifiers.getIdentifier(currentProfile.identity.id);
      setIsOpen(false);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes(Agent.MISSING_DATA_ON_KERIA)
      ) {
        setIsOpen(true);
        setMissingOnCloud(true);
      } else {
        showError("Unable to get identifier details", error, dispatch);
        setIsOpen(false);
      }
    } finally {
      setHiddenContent(false);
    }
  }, [currentProfile?.identity.id, dispatch, setIsOpen]);

  useEffect(() => {
    if (
      !currentProfile?.identity?.creationStatus ||
      !currentProfile?.identity.createdAtUTC
    ) {
      setIsOpen(false);
      return;
    }

    const creationStatus = currentProfile?.identity.creationStatus;
    const groupMemberPre = currentProfile?.identity.groupMemberPre;
    const createdAtUTC = currentProfile?.identity.createdAtUTC;

    if (creationStatus === CreationStatus.FAILED) {
      setIsOpen(true);
      setHiddenContent(false);
      return;
    }

    if (creationStatus === CreationStatus.PENDING && !groupMemberPre) {
      const createdTime = new Date(createdAtUTC).getTime();
      const now = Date.now();

      const remainTime = createdTime + WAITING_TIME - now;

      setIsOpen(true);

      if (remainTime > 0) {
        setHiddenContent(true);

        const timer = setTimeout(() => {
          if (creationStatus === CreationStatus.PENDING) {
            setHiddenContent(false);
          }
        }, remainTime);

        return () => {
          clearTimeout(timer);
        };
      }

      setHiddenContent(false);
      return;
    }

    getDetails();
  }, [
    currentProfile?.identity?.creationStatus,
    currentProfile?.identity?.groupMemberPre,
    currentProfile?.identity?.createdAtUTC,
    dispatch,
    getDetails,
    setIsOpen,
  ]);

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
    if (isMissingOnCloud) {
      return i18n.t("profiledetails.loadprofileerror.missingoncloud");
    }
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
      if (isMissingOnCloud) {
        await Agent.agent.identifiers.deleteStaleLocalIdentifier(profileId);
      } else {
        await Agent.agent.identifiers.markIdentifierPendingDelete(profileId);
      }
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
        onDidDismiss={() => setIsOpen(false)}
        animated={false}
      >
        <ResponsivePageLayout
          pageId={pageId}
          header={
            <PageHeader
              title={defaultName}
              additionalButtons={
                <Avatar
                  id={currentProfile?.identity.id || ""}
                  handleAvatarClick={() => setOpenProfiles(true)}
                />
              }
            />
          }
          activeStatus={true}
          customClass="profile-state"
        >
          {!hiddenContent && (
            <>
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
            </>
          )}
          <Spinner
            show={hiddenContent}
            coverage={SpinnerConverage.Screen}
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
      <Profiles
        isOpen={isOpenProfiles}
        setIsOpen={setOpenProfiles}
      />
    </>
  );
};

export { ProfileStateModal };
