import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
import { IonModal, IonSpinner } from "@ionic/react";
import { useEffect, useState } from "react";
import { Agent } from "../../../core/agent/agent";
import { IdentifierMetadataRecordProps } from "../../../core/agent/records";
import { IdentifierShortDetails } from "../../../core/agent/services/identifier.types";
import { i18n } from "../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  addOrUpdateProfileIdentity,
  getProfiles,
} from "../../../store/reducers/profileCache";
import { setToastMsg } from "../../../store/reducers/stateCache";
import { DISPLAY_NAME_LENGTH } from "../../globals/constants";
import { ToastMsgType } from "../../globals/types";
import { showError } from "../../utils/error";
import { nameChecker } from "../../utils/nameChecker";
import { CustomInput } from "../CustomInput";
import { ErrorMessage } from "../ErrorMessage";
import { ScrollablePageLayout } from "../layout/ScrollablePageLayout";
import { PageFooter } from "../PageFooter";
import { PageHeader } from "../PageHeader";
import "./EditProfile.scss";
import { EditProfileProps } from "./EditProfile.types";

const IDENTIFIER_NOT_EXIST = "Identifier not existed. id: ";
const DUPLICATE_NAME = "Identifier name is a duplicate";

const EditProfile = ({
  modalIsOpen,
  setModalIsOpen,
  cardData,
  setCardData,
  editType = "name",
}: EditProfileProps) => {
  const pageId = "edit-identifier";
  const isGroup = !!cardData.groupMemberPre;
  const dispatch = useAppDispatch();
  const profiles = useAppSelector(getProfiles);
  const currentIdentifier = profiles[cardData.id];
  const [isLoading, setLoading] = useState(false);

  const getCurrentUsername = () =>
    cardData.groupMemberPre
      ? cardData.groupUsername || ""
      : cardData.groupMetadata?.proposedUsername || "";

  const [newDisplayName, setNewDisplayName] = useState(
    editType === "userName" ? getCurrentUsername() : cardData.displayName
  );
  const [keyboardIsOpen, setKeyboardIsOpen] = useState(false);

  const [duplicateName, setDuplicateName] = useState(false);
  const [inputChange, setInputChange] = useState(false);
  const localValidateMessage = inputChange
    ? nameChecker.getError(newDisplayName)
    : undefined;

  useEffect(() => {
    if (Capacitor.isNativePlatform() && modalIsOpen) {
      Keyboard.addListener("keyboardWillShow", () => {
        setKeyboardIsOpen(true);
      });
      Keyboard.addListener("keyboardWillHide", () => {
        setKeyboardIsOpen(false);
      });

      return () => {
        Keyboard.removeAllListeners();
      };
    }
  }, [modalIsOpen]);

  const handleCancel = async () => {
    setModalIsOpen(false);
  };

  const baselineValue =
    editType === "userName" ? getCurrentUsername() : cardData.displayName;

  const verifyDisplayName =
    newDisplayName.length > 0 &&
    newDisplayName.length <= DISPLAY_NAME_LENGTH &&
    newDisplayName.trim() !== baselineValue.trim();

  useEffect(() => {
    setNewDisplayName(
      editType === "userName" ? getCurrentUsername() : cardData.displayName
    );
  }, [
    editType,
    cardData.displayName,
    cardData.groupMetadata?.proposedUsername,
    cardData.groupUsername,
    cardData.groupMemberPre,
  ]);

  const handleSubmit = async () => {
    try {
      if (
        newDisplayName.trim() !== cardData.displayName.trim() &&
        Object.values(profiles).some(
          (item) => item.identity.displayName === newDisplayName
        )
      ) {
        throw new Error(DUPLICATE_NAME);
      }

      setLoading(true);

      if (!currentIdentifier) {
        throw new Error(`${IDENTIFIER_NOT_EXIST} ${cardData.id}`);
      }

      if (editType === "name") {
        const params: Pick<
          IdentifierMetadataRecordProps,
          "theme" | "displayName"
        > = {
          displayName: newDisplayName,
          theme: currentIdentifier.identity.theme,
        };
        await Agent.agent.identifiers.updateIdentifier(cardData.id, params);

        const updatedIdentifier: IdentifierShortDetails = {
          ...currentIdentifier.identity,
          displayName: params.displayName,
        };

        setCardData({
          ...cardData,
          displayName: params.displayName,
        });
        dispatch(addOrUpdateProfileIdentity(updatedIdentifier));
      } else if (editType === "userName") {
        // UI only allows editing username for fully created groups (with members)
        await Agent.agent.identifiers.updateGroupUsername(
          cardData.id,
          newDisplayName
        );

        const updatedIdentifier: IdentifierShortDetails = {
          ...currentIdentifier.identity,
          groupUsername: newDisplayName,
        };

        setCardData({
          ...cardData,
          groupUsername: newDisplayName,
        });
        dispatch(addOrUpdateProfileIdentity(updatedIdentifier));
      }

      handleCancel();
      dispatch(
        setToastMsg(
          isGroup
            ? ToastMsgType.GROUP_UPDATED
            : editType === "userName"
            ? ToastMsgType.IDENTIFIER_USERNAME_UPDATED
            : ToastMsgType.IDENTIFIER_NAME_UPDATED
        )
      );
    } catch (e) {
      if ((e as Error).message === DUPLICATE_NAME) {
        setDuplicateName(true);
        return;
      }

      showError(
        "Unable to edit identifier",
        e,
        dispatch,
        isGroup && editType !== "userName"
          ? ToastMsgType.GROUP_UPDATED_FAIL
          : ToastMsgType.UNABLE_EDIT_IDENTIFIER
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChangeName = (value: string) => {
    setNewDisplayName(value);
    setInputChange(true);
    setDuplicateName(false);
  };

  const hasError = localValidateMessage || duplicateName;
  const errorMessage =
    localValidateMessage || `${i18n.t("nameerror.duplicatename")}`;

  return (
    <IonModal
      isOpen={modalIsOpen}
      className={`${pageId}-modal full-page-modal ${isLoading ? "blur" : ""}`}
      data-testid={`${pageId}-modal`}
    >
      <ScrollablePageLayout
        header={
          <PageHeader
            closeButton={true}
            closeButtonAction={handleCancel}
            closeButtonLabel={`${i18n.t("profiledetails.options.cancel")}`}
            title={
              isGroup && editType !== "userName"
                ? `${i18n.t("profiledetails.options.editGroup")}`
                : `${i18n.t("profiledetails.options.edit")}`
            }
          />
        }
        pageId={pageId}
        footer={
          <PageFooter
            customClass={keyboardIsOpen ? "ion-hide" : undefined}
            pageId={pageId}
            primaryButtonText={`${i18n.t(
              "profiledetails.options.inner.confirm"
            )}`}
            primaryButtonAction={handleSubmit}
            primaryButtonDisabled={!verifyDisplayName}
          />
        }
      >
        <div className={`indentifier-input${hasError ? " has-error" : ""}`}>
          <CustomInput
            dataTestId="edit-name-input"
            title={`${
              editType === "userName"
                ? i18n.t("profiledetails.options.inner.usernamelabel")
                : isGroup
                ? i18n.t("profiledetails.options.inner.groupLabel")
                : i18n.t("profiledetails.options.inner.label")
            }`}
            hiddenInput={false}
            autofocus={true}
            onChangeInput={handleChangeName}
            value={newDisplayName}
          />
          {hasError ? (
            <ErrorMessage
              message={errorMessage}
              timeout={false}
            />
          ) : null}
        </div>
      </ScrollablePageLayout>
      {isLoading && (
        <div
          className="spinner-container"
          data-testid="spinner-container"
        >
          <IonSpinner name="circular" />
        </div>
      )}
    </IonModal>
  );
};

export { EditProfile };
