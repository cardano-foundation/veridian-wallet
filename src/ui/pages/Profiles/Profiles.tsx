import { IonButton, IonIcon, IonModal } from "@ionic/react";
import {
  addCircleOutline,
  peopleCircleOutline,
  personCircleOutline,
  settingsOutline,
} from "ionicons/icons";
import { useState } from "react";
import { Agent } from "../../../core/agent/agent";
import { MiscRecordId } from "../../../core/agent/agent.types";
import { BasicRecord } from "../../../core/agent/records";
import { i18n } from "../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { getIdentifiersCache } from "../../../store/reducers/identifiersCache";
import {
  getAuthentication,
  getCurrentProfile,
  getStateCache,
  setAuthentication,
  setCurrentProfile,
  setToastMsg,
} from "../../../store/reducers/stateCache";
import { Avatar } from "../../components/Avatar";
import { ScrollablePageLayout } from "../../components/layout/ScrollablePageLayout";
import { PageHeader } from "../../components/PageHeader";
import { Settings } from "../../components/Setting";
import { SideSlider } from "../../components/SideSlider";
import { ToastMsgType } from "../../globals/types";
import { showError } from "../../utils/error";
import { ProfileSetup } from "../ProfileSetup";
import "./Profiles.scss";
import {
  OptionButtonProps,
  ProfileItemsProps,
  ProfilesProps,
} from "./Profiles.types";

const ProfileItem = ({ id, displayName, onClick }: ProfileItemsProps) => {
  return (
    <div
      className="profiles-list-item"
      onClick={onClick}
      data-testid={`profiles-list-item-${id}`}
    >
      <div className="profiles-list-item-avatar">
        <Avatar id={id} />
      </div>
      <div className="profiles-list-item-name">{displayName}</div>
    </div>
  );
};

const OptionButton = ({ icon, text, action }: OptionButtonProps) => {
  return (
    <IonButton
      expand="block"
      className="profiles-options-button"
      data-testid={`profiles-option-button-${text.toLowerCase()}`}
      onClick={action}
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
  const identifiersDataCache = useAppSelector(getIdentifiersCache);
  const defaultProfile = useAppSelector(getCurrentProfile);
  const identifiersData = Object.values(identifiersDataCache);
  const filteredIdentifiersData = identifiersData.filter(
    (item) => item.id !== defaultProfile
  );
  const [openSetting, setOpenSetting] = useState(false);

  const [openSetupProfile, setOpenSetupProfile] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
  };
  const handleOpenSettings = () => {
    setOpenSetting(true);
  };

  const handleAddProfile = () => {
    setOpenSetupProfile(true);
  };

  const handleJoinGroup = () => {
    // TODO: Implement the logic to join a group
  };

  const handleSelectProfile = async (id: string) => {
    try {
      await Agent.agent.basicStorage.createOrUpdateBasicRecord(
        new BasicRecord({
          id: MiscRecordId.CURRENT_PROFILE,
          content: { defaultProfile: id },
        })
      );
      dispatch(setCurrentProfile(id));
      dispatch(setToastMsg(ToastMsgType.PROFILE_SWITCHED));
      handleClose();
    } catch (e) {
      showError(
        "Unable to switch profile",
        e,
        dispatch,
        ToastMsgType.UNABLE_TO_SWITCH_PROFILE
      );
    }
  };

  const handleCloseSetupProfile = () => setOpenSetupProfile(false);

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
            <ProfileItem
              id={defaultProfile}
              displayName={identifiersDataCache[defaultProfile]?.displayName}
            />
            <OptionButton
              icon={personCircleOutline}
              text={`${i18n.t("profiles.options.manage")}`}
              action={handleOpenSettings}
            />
          </div>
          <div className="profiles-list">
            {filteredIdentifiersData.map((identifier) => (
              <ProfileItem
                key={identifier.id}
                id={identifier.id}
                onClick={async () => {
                  handleSelectProfile(identifier.id);
                }}
                displayName={identifiersDataCache[identifier.id]?.displayName}
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
      >
        <ProfileSetup />
      </SideSlider>
    </>
  );
};

export { Profiles };
