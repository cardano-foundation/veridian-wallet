import { IonSpinner, useIonViewWillEnter } from "@ionic/react";
import { useCallback, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import { Agent } from "../../../core/agent/agent";
import { IdentifierDetails as IdentifierDetailsCore } from "../../../core/agent/services/identifier.types";
import { i18n } from "../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { getBiometricsCache } from "../../../store/reducers/biometricsCache";
import { removeProfile } from "../../../store/reducers/profileCache";
import {
  getAuthentication,
  setCurrentRoute,
  setToastMsg,
} from "../../../store/reducers/stateCache";
import "../../components/CardDetails/CardDetails.scss";
import { BackEventPriorityType, ToastMsgType } from "../../globals/types";
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
import "./ProfileDetailsModal.scss";
import { IdentifierDetailModalProps } from "./ProfileDetailsModal.types";
import { RotateKeyModal } from "../../pages/Home/components/RotateKeyModal";

const ProfileDetailsModal = ({
  profileId,
  pageId,
  restrictedOptions,
  showProfiles,
  isOpen,
  setIsOpen,
}: IdentifierDetailModalProps) => {
  const history = useHistory();
  const dispatch = useAppDispatch();
  const biometrics = useAppSelector(getBiometricsCache);
  const passwordAuthentication =
    useAppSelector(getAuthentication).passwordIsSet;
  const [alertIsOpen, setAlertIsOpen] = useState(false);
  const [verifyIsOpen, setVerifyIsOpen] = useState(false);
  const [profile, setProfile] = useState<IdentifierDetailsCore | undefined>();
  const [oobi, setOobi] = useState("");
  const [cloudError, setCloudError] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [openRotateKeyModal, setOpenRotateKeyModal] = useState(false);
  const { setRecentProfileAsDefault, defaultProfile, defaultName } =
    useProfile();

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  const fetchOobi = useCallback(async () => {
    try {
      if (!profile?.id || !isOpen) return;

      const oobiValue = await Agent.agent.connections.getOobi(`${profile.id}`, {
        alias: profile.displayName,
      });
      if (oobiValue) {
        setOobi(oobiValue);
      }
    } catch (e) {
      showError("Unable to fetch oobi", e, dispatch);
    }
  }, [profile?.id, profile?.displayName, dispatch, isOpen]);

  const getDetails = useCallback(async () => {
    if (!profileId || !isOpen) return;

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
        showProfiles?.(false);
        setCloudError(true);
      } else {
        handleClose();
        showError("Unable to get identifier details", error, dispatch);
      }
    }
  }, [profileId, dispatch, isOpen, handleClose, showProfiles]);

  useOnlineStatusEffect(getDetails);
  useOnlineStatusEffect(fetchOobi);

  useIonViewWillEnter(() => {
    dispatch(setCurrentRoute({ path: history.location.pathname }));
  });

  const handleDelete = async () => {
    try {
      setVerifyIsOpen(false);
      const filterId = profile
        ? profile.id
        : cloudError
        ? profileId
        : undefined;

      setHidden(true);
      await deleteIdentifier();
      if (defaultProfile?.identity.id === filterId) {
        const nextIdentifier = await setRecentProfileAsDefault();
        // If the user upgrades to app version 1.2 and, after deleting a profile,
        // the next profile is a group profile without a username, then close the profiles screen and display the “set profile name” screen.
        const isGroup =
          !!nextIdentifier?.groupMetadata || !!nextIdentifier?.groupMemberPre;
        if (isGroup && !nextIdentifier.groupUsername) {
          setIsOpen(false, true);
        } else {
          handleClose();
        }
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
    } finally {
      setHidden(false);
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

  const cancelDelete = () => setAlertIsOpen(false);

  const hardwareBackButtonConfig = useMemo(
    () => ({
      prevent: false,
      priority: BackEventPriorityType.Modal,
    }),
    []
  );

  const pageClasses = combineClassNames("profile-details-module", {
    "ion-hide": hidden,
  });

  const openRotateModal = useCallback(() => {
    setOpenRotateKeyModal(true);
  }, []);

  return (
    <>
      <SideSlider
        isOpen={isOpen}
        renderAsModal
        className="profile-detail-modal"
      >
        {cloudError ? (
          <CloudError
            pageId={pageId}
            header={
              <PageHeader
                title={defaultName}
                additionalButtons={
                  <Avatar
                    id={defaultProfile?.identity.id || ""}
                    handleAvatarClick={() => showProfiles?.(true)}
                  />
                }
              />
            }
            content={`${i18n.t(
              "profiledetails.loadprofileerror.missingoncloud"
            )}`}
          >
            <PageFooter
              pageId={pageId}
              deleteButtonText={`${i18n.t("profiledetails.delete.button")}`}
              deleteButtonAction={deleteButtonAction}
            />
          </CloudError>
        ) : (
          <ScrollablePageLayout
            pageId={pageId}
            customClass={pageClasses}
            activeStatus={isOpen}
            header={
              <PageHeader
                backButton={true}
                onBack={handleClose}
                title={profile?.displayName}
                hardwareBackButtonConfig={hardwareBackButtonConfig}
              />
            }
          >
            {profile ? (
              <div className="card-details-content">
                <ProfileContent
                  cardData={profile as IdentifierDetailsCore}
                  oobi={oobi}
                  setCardData={setProfile}
                  onRotateKey={openRotateModal}
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
        )}
      </SideSlider>
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
        setVerifyIsOpen={(value, isCancel) => {
          if (isCancel) {
            setHidden(false);
          }

          setVerifyIsOpen(value);
        }}
        onVerify={handleDelete}
      />
      <RotateKeyModal
        identifierId={profileId}
        onReloadData={getDetails}
        signingKey={profile?.k[0] || ""}
        isOpen={openRotateKeyModal}
        onClose={() => setOpenRotateKeyModal(false)}
      />
    </>
  );
};

export { ProfileDetailsModal };
