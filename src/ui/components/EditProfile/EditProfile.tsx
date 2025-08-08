import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
import { IonModal, IonSpinner } from "@ionic/react";
import { useEffect, useState } from "react";
import { Agent } from "../../../core/agent/agent";
import { i18n } from "../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { setToastMsg } from "../../../store/reducers/stateCache";
import { DISPLAY_NAME_LENGTH } from "../../globals/constants";
import { ToastMsgType } from "../../globals/types";
import { showError } from "../../utils/error";
import { nameChecker } from "../../utils/nameChecker";
import { createThemeValue, getTheme } from "../../utils/theme";
import { CustomInput } from "../CustomInput";
import { ErrorMessage } from "../ErrorMessage";
import { ScrollablePageLayout } from "../layout/ScrollablePageLayout";
import { PageFooter } from "../PageFooter";
import { PageHeader } from "../PageHeader";
import "./EditProfile.scss";
import { EditProfileProps } from "./EditProfile.types";
import {
  addOrUpdateProfileIdentity,
  getProfiles,
} from "../../../store/reducers/profileCache";

const IDENTIFIER_NOT_EXIST = "Identifier not existed. id: ";
const DUPLICATE_NAME = "Identifier name is a duplicate";

const EditProfile = ({
  modalIsOpen,
  setModalIsOpen,
  cardData,
  setCardData,
}: EditProfileProps) => {
  const pageId = "edit-identifier";
  const dispatch = useAppDispatch();
  const profiles = useAppSelector(getProfiles);
  const [isLoading, setLoading] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(cardData.displayName);
  const [newSelectedTheme, setNewSelectedTheme] = useState(0);
  const [newSelectedColor, setNewSelectedColor] = useState(0);
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

  const verifyDisplayName =
    newDisplayName.length > 0 &&
    newDisplayName.length <= DISPLAY_NAME_LENGTH &&
    (newDisplayName.trim() !== cardData.displayName.trim() ||
      createThemeValue(newSelectedColor, newSelectedTheme) !== cardData.theme);

  useEffect(() => {
    setNewDisplayName(cardData.displayName);
  }, [cardData.displayName]);

  useEffect(() => {
    const theme = getTheme(cardData.theme);

    setNewSelectedColor(Number(theme.color));
    setNewSelectedTheme(Number(theme.layout));
  }, [cardData.theme]);

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
      const currentIdentifier = profiles[cardData.id];

      if (!currentIdentifier) {
        throw new Error(`${IDENTIFIER_NOT_EXIST} ${cardData.id}`);
      }

      const theme = Number(`${newSelectedColor}${newSelectedTheme}`);
      const updatedIdentifier = {
        ...currentIdentifier.identity,
        displayName: newDisplayName,
        theme,
      };
      await Agent.agent.identifiers.updateIdentifier(cardData.id, {
        displayName: newDisplayName,
        theme,
      });
      setCardData({
        ...cardData,
        displayName: newDisplayName,
        theme,
      });
      handleCancel();
      dispatch(addOrUpdateProfileIdentity(updatedIdentifier));
      dispatch(setToastMsg(ToastMsgType.IDENTIFIER_UPDATED));
    } catch (e) {
      if ((e as Error).message === DUPLICATE_NAME) {
        setDuplicateName(true);
        return;
      }

      showError(
        "Unable to edit identifier",
        e,
        dispatch,
        ToastMsgType.UNABLE_EDIT_IDENTIFIER
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
            title={`${i18n.t("profiledetails.options.edit")}`}
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
            title={`${i18n.t("profiledetails.options.inner.label")}`}
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
