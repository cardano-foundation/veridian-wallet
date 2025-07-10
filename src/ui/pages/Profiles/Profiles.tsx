import {
  settingsOutline,
  personCircleOutline,
  peopleCircleOutline,
  addCircleOutline,
} from "ionicons/icons";
import { IonButton, IonIcon, IonModal } from "@ionic/react";
import { i18n } from "../../../i18n";
import "./Profiles.scss";
import { ScrollablePageLayout } from "../../components/layout/ScrollablePageLayout";
import { PageHeader } from "../../components/PageHeader";
import {
  OptionButtonProps,
  ProfileItemsProps,
  ProfilesProps,
} from "./Profiles.types";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  getAuthentication,
  getStateCache,
  setAuthentication,
  setToastMsg,
} from "../../../store/reducers/stateCache";
import { getIdentifiersCache } from "../../../store/reducers/identifiersCache";
import { Avatar } from "../../components/Avatar";
import { Agent } from "../../../core/agent/agent";
import { BasicRecord } from "../../../core/agent/records";
import { MiscRecordId } from "../../../core/agent/agent.types";
import { ToastMsgType } from "../../globals/types";
import { showError } from "../../utils/error";

const Profiles = ({ isOpen, setIsOpen }: ProfilesProps) => {
  const componentId = "profiles";
  const dispatch = useAppDispatch();
  const stateCache = useAppSelector(getStateCache);
  const authentication = useAppSelector(getAuthentication);
  const identifiersDataCache = useAppSelector(getIdentifiersCache);
  const defaultProfile = stateCache.authentication.defaultProfile;
  const identifiersData = Object.values(identifiersDataCache);
  const filteredIdentifiersData = identifiersData.filter(
    (item) => item.id !== defaultProfile
  );

  const handleClose = () => {
    setIsOpen(false);
  };
  const handleOpenSettings = () => {
    // TODO: Implement the logic to open settings
  };

  const handleAddProfile = () => {
    // TODO: Implement the logic to add a new profile
  };

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
      dispatch(
        setAuthentication({
          ...authentication,
          defaultProfile: id,
        })
      );
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

  const ProfileItem = ({ id, onClick }: ProfileItemsProps) => {
    return (
      <div
        className="profiles-list-item"
        onClick={onClick}
      >
        <div className="profiles-list-item-avatar">
          <Avatar id={id} />
        </div>
        <div className="profiles-list-item-name">
          {identifiersDataCache[id]?.displayName}
        </div>
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

  return (
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
          <ProfileItem id={defaultProfile} />
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
  );
};

export { Profiles };
