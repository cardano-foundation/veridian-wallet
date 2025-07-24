import { IonButton, IonChip, IonIcon, IonModal } from "@ionic/react";
import {
  addCircleOutline,
  hourglassOutline,
  peopleCircleOutline,
  personCircleOutline,
  settingsOutline,
} from "ionicons/icons";
import { useState } from "react";
import { Agent } from "../../../core/agent/agent";
import { CreationStatus, MiscRecordId } from "../../../core/agent/agent.types";
import { BasicRecord } from "../../../core/agent/records";
import { i18n } from "../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { getIdentifiersCache } from "../../../store/reducers/identifiersCache";
import {
  getAuthentication,
  getStateCache,
  setAuthentication,
  setToastMsg,
  updateCurrentProfile,
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

const ProfileItem = ({ identifier, onClick }: ProfileItemsProps) => {
  if (!identifier) return null;
  const { id, displayName, creationStatus } = identifier;
  return (
    <div
      className="profiles-list-item"
      onClick={onClick}
      data-testid={`profiles-list-item-${id}`}
    >
      <div className="profiles-list-item-avatar">
        <Avatar id={id} />
      </div>
      <span className="profiles-list-item-inner">
        <div className="profiles-list-item-name">{displayName}</div>
        {creationStatus === CreationStatus.PENDING && (
          <IonChip data-testid={`profiles-list-item-${id}-status`}>
            <IonIcon
              icon={hourglassOutline}
              color="primary"
            />
            <span>{CreationStatus.PENDING.toLowerCase()}</span>
          </IonChip>
        )}
      </span>
    </div>
  );
};

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
  const stateCache = useAppSelector(getStateCache);
  const identifiersDataCache = useAppSelector(getIdentifiersCache);
  const defaultProfile = stateCache.currentProfile.identity.id;
  const identifiersData = Object.values(identifiersDataCache);
  const filteredIdentifiersData = identifiersData.filter(
    (item) => item.id !== defaultProfile
  );
  const [openSetting, setOpenSetting] = useState(false);
  const [openSetupProfile, setOpenSetupProfile] = useState(false);

  const handleClose = () => setIsOpen(false);
  const handleOpenSettings = () => setOpenSetting(true);
  const handleAddProfile = () => setOpenSetupProfile(true);
  const handleCloseSetupProfile = () => setOpenSetupProfile(false);

  const handleJoinGroup = () => {
    // TODO: Implement the logic to join a group
  };

  const handleSelectProfile = async (id: string) => {
    try {
      await Agent.agent.basicStorage.createOrUpdateBasicRecord(
        new BasicRecord({
          id: MiscRecordId.DEFAULT_PROFILE,
          content: { defaultProfile: id },
        })
      );
      dispatch(updateCurrentProfile(id));
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
            <ProfileItem identifier={identifiersDataCache[defaultProfile]} />
            <OptionButton
              icon={personCircleOutline}
              text={`${i18n.t("profiles.options.manage")}`}
              action={handleOpenSettings}
              disabled={
                identifiersDataCache[defaultProfile]?.creationStatus ===
                CreationStatus.PENDING
              }
            />
          </div>
          <div className="profiles-list">
            {filteredIdentifiersData.map((identifier) => (
              <ProfileItem
                key={identifier.id}
                identifier={identifier}
                onClick={async () => {
                  handleSelectProfile(identifier.id);
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
      >
        <ProfileSetup
          onClose={(cancel) => {
            handleCloseSetupProfile();
            if (!cancel) setIsOpen(false);
          }}
        />
      </SideSlider>
    </>
  );
};

export { Profiles };
