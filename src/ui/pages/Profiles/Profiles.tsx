import { IonButton, IonIcon, IonModal } from "@ionic/react";
import {
  addCircleOutline,
  peopleCircleOutline,
  personCircleOutline,
  settingsOutline,
} from "ionicons/icons";
import { useEffect, useState } from "react";
import { CreationStatus } from "../../../core/agent/agent.types";
import { IdentifierShortDetails } from "../../../core/agent/services/identifier.types";
import { i18n } from "../../../i18n";
import { RoutePath } from "../../../routes";
import { TabsRoutePath } from "../../../routes/paths";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { getProfiles } from "../../../store/reducers/profileCache";
import { setToastMsg } from "../../../store/reducers/stateCache";
import { ScrollablePageLayout } from "../../components/layout/ScrollablePageLayout";
import { PageHeader } from "../../components/PageHeader";
import { ProfileDetailsModal } from "../../components/ProfileDetailsModal";
import { Settings } from "../../components/Settings";
import { SideSlider } from "../../components/SideSlider";
import { ToastMsgType } from "../../globals/types";
import { useAppIonRouter } from "../../hooks";
import { useProfile } from "../../hooks/useProfile";
import { showError } from "../../utils/error";
import { ProfileSetup } from "../ProfileSetup";
import "./Profiles.scss";
import { OptionButtonProps, ProfilesProps } from "./Profiles.types";
import { ProfileItem } from "./components/ProfileItem";

const OptionButton = ({ icon, text, action, disabled }: OptionButtonProps) => {
  return (
    <IonButton
      expand="block"
      className="profiles-options-button"
      data-testid={`profiles-option-button-${text.toLowerCase()}`}
      onClick={action}
      disabled={disabled}
    >
      {icon && (
        <IonIcon
          slot="icon-only"
          size="small"
          icon={icon}
          color="primary"
        />
      )}
      {text}
    </IonButton>
  );
};

const Profiles = ({ isOpen, setIsOpen }: ProfilesProps) => {
  const componentId = "profiles";
  const dispatch = useAppDispatch();
  const profiles = useAppSelector(getProfiles);
  const ionHistory = useAppIonRouter();
  const { updateDefaultProfile, defaultProfile } = useProfile();
  const profileList = Object.values(profiles);
  const filteredProfiles = profileList
    .filter((item) => item.identity.id !== defaultProfile?.identity.id)
    .sort((prev, next) =>
      prev.identity.displayName.localeCompare(next.identity.displayName)
    );
  const [openSetting, setOpenSetting] = useState(false);
  const [openProfileDetail, setOpenProfileDetail] = useState(false);
  const [openSetupProfile, setOpenSetupProfile] = useState(false);
  const [isJoinGroupMode, setIsJoinGroupMode] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleOpenSettings = () => {
    setOpenSetting(true);
  };

  const handleAddProfile = () => {
    setIsJoinGroupMode(false);
    setOpenSetupProfile(true);
  };

  const handleCloseSetupProfile = () => {
    setOpenSetupProfile(false);
    setIsJoinGroupMode(false);
  };

  const handleOpenProfile = () => {
    setOpenProfileDetail(true);
  };

  const handleJoinGroup = () => {
    setIsJoinGroupMode(true);
    setOpenSetupProfile(true);
  };

  const handleSelectProfile = async (profile: IdentifierShortDetails) => {
    try {
      await updateDefaultProfile(profile.id);
      dispatch(setToastMsg(ToastMsgType.PROFILE_SWITCHED));
      handleClose();
      ionHistory.push(
        !profile.groupMemberPre ||
          profile.creationStatus === CreationStatus.PENDING
          ? RoutePath.GROUP_PROFILE_SETUP.replace(":id", profile.id)
          : TabsRoutePath.CREDENTIALS
      );
    } catch (e) {
      showError(
        "Unable to switch profile",
        e,
        dispatch,
        ToastMsgType.UNABLE_TO_SWITCH_PROFILE
      );
    }
  };

  useEffect(() => {
    if (!defaultProfile || profileList.length === 0) {
      setIsJoinGroupMode(false);
      setOpenSetupProfile(true);
    }
  }, [defaultProfile, profileList.length]);

  return (
    <>
      <IonModal
        className={`${componentId}-modal`}
        data-testid={componentId}
        isOpen={isOpen}
        onDidDismiss={handleClose}
      >
        <ScrollablePageLayout
          pageId={componentId}
          header={
            <PageHeader
              closeButton={true}
              closeButtonAction={handleClose}
              closeButtonLabel={`${i18n.t("profiles.cancel")}`}
              title={`${i18n.t("profiles.title")}`}
            />
          }
          footer={
            <OptionButton
              icon={settingsOutline}
              text={`${i18n.t("profiles.options.settings")}`}
              action={handleOpenSettings}
            />
          }
        >
          <div className="profiles-selected-profile">
            <ProfileItem identifier={defaultProfile?.identity} />
            <OptionButton
              icon={personCircleOutline}
              text={`${i18n.t("profiles.options.manage")}`}
              action={handleOpenProfile}
              disabled={
                defaultProfile?.identity?.creationStatus ===
                CreationStatus.PENDING
              }
            />
          </div>
          <div className="profiles-list">
            {filteredProfiles.map((identifier) => (
              <ProfileItem
                key={identifier.identity.id}
                identifier={identifier.identity}
                onClick={() => {
                  handleSelectProfile(identifier.identity);
                }}
              />
            ))}
          </div>
          <div className="profiles-options">
            <div className="profiles-options-button secondary-button">
              <OptionButton
                icon={addCircleOutline}
                text={`${i18n.t("profiles.options.add")}`}
                action={handleAddProfile}
              />
              <OptionButton
                icon={peopleCircleOutline}
                text={`${i18n.t("profiles.options.join")}`}
                action={handleJoinGroup}
              />
            </div>
          </div>
        </ScrollablePageLayout>
      </IonModal>
      <Settings
        show={openSetting}
        setShow={setOpenSetting}
      />
      <SideSlider
        isOpen={openSetupProfile}
        renderAsModal
        animation={false}
      >
        <ProfileSetup
          onClose={(cancel) => {
            handleCloseSetupProfile();
            if (!cancel) setIsOpen(false);
          }}
          joinGroupMode={isJoinGroupMode}
          displayOnModal
        />
      </SideSlider>
      <ProfileDetailsModal
        pageId="profile-details"
        isOpen={openProfileDetail}
        setIsOpen={setOpenProfileDetail}
        profileId={defaultProfile?.identity.id || ""}
        onConnectionComplete={() => setIsOpen(false)}
      />
    </>
  );
};

export { Profiles };
