import { useEffect, useState } from "react";
import {
  IonButton,
  IonButtons,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonModal,
  IonRow,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { Share } from "@capacitor/share";
import {
  codeSlashOutline,
  pencilOutline,
  shareOutline,
  trashOutline,
  copyOutline,
  downloadOutline,
} from "ionicons/icons";
import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
import { i18n } from "../../../i18n";
import { IdentifierOptionsProps } from "./IdentifierOptions.types";
import "./IdentifierOptions.scss";
import { CustomInput } from "../CustomInput";
import { ErrorMessage } from "../ErrorMessage";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  getIdentifiersCache,
  setIdentifiersCache,
} from "../../../store/reducers/identifiersCache";
import {
  setCurrentOperation,
  setToastMsg,
} from "../../../store/reducers/stateCache";
import { DISPLAY_NAME_LENGTH } from "../../globals/constants";
import { OperationType, ToastMsgType } from "../../globals/types";
import { PageLayout } from "../layout/PageLayout";
import { writeToClipboard } from "../../utils/clipboard";
import { Agent } from "../../../core/agent/agent";
import { IdentifierThemeSelector } from "../CreateIdentifier/components/IdentifierThemeSelector";

const IdentifierOptions = ({
  optionsIsOpen,
  setOptionsIsOpen,
  cardData,
  setCardData,
  handleDeleteIdentifier,
}: IdentifierOptionsProps) => {
  const dispatch = useAppDispatch();
  const identifierData = useAppSelector(getIdentifiersCache);
  const [editorOptionsIsOpen, setEditorIsOpen] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(cardData.displayName);
  const [newSelectedTheme, setNewSelectedTheme] = useState(cardData.theme);
  const [viewIsOpen, setViewIsOpen] = useState(false);
  const [keyboardIsOpen, setkeyboardIsOpen] = useState(false);
  const verifyDisplayName =
    newDisplayName.length > 0 &&
    newDisplayName.length <= DISPLAY_NAME_LENGTH &&
    (newDisplayName !== cardData.displayName ||
      newSelectedTheme !== cardData.theme);

  useEffect(() => {
    setNewDisplayName(cardData.displayName);
  }, [cardData.displayName]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      Keyboard.addListener("keyboardWillShow", () => {
        setkeyboardIsOpen(true);
      });
      Keyboard.addListener("keyboardWillHide", () => {
        setkeyboardIsOpen(false);
      });
    }
  }, []);

  useEffect(() => {
    setNewSelectedTheme(cardData.theme);
  }, [editorOptionsIsOpen]);

  const handleClose = () => {
    setEditorIsOpen(false);
    setOptionsIsOpen(false);
  };

  const handleDelete = () => {
    handleDeleteIdentifier();
    setOptionsIsOpen(false);
  };

  const handleSubmit = async () => {
    setEditorIsOpen(false);
    setOptionsIsOpen(false);
    const updatedIdentifiers = [...identifierData];
    const index = updatedIdentifiers.findIndex(
      (identifier) => identifier.id === cardData.id
    );
    updatedIdentifiers[index] = {
      ...updatedIdentifiers[index],
      displayName: newDisplayName,
      theme: newSelectedTheme,
    };
    await Agent.agent.identifiers.updateIdentifier(cardData.id, {
      displayName: newDisplayName,
      theme: newSelectedTheme,
    });
    setCardData({
      ...cardData,
      displayName: newDisplayName,
      theme: newSelectedTheme,
    });
    dispatch(setIdentifiersCache(updatedIdentifiers));
    dispatch(setToastMsg(ToastMsgType.IDENTIFIER_UPDATED));
  };

  return (
    <>
      <IonModal
        isOpen={optionsIsOpen}
        initialBreakpoint={0.4}
        breakpoints={[0, 0.4]}
        className="page-layout"
        data-testid="identifier-options-modal"
        onDidDismiss={() => setOptionsIsOpen(false)}
      >
        <div className="identifier-options modal menu">
          <IonHeader
            translucent={true}
            className="ion-no-border"
          >
            <IonToolbar color="light">
              <IonTitle data-testid="identifier-options-title">
                <h2>{i18n.t("identifiers.details.options.title")}</h2>
              </IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent
            className="identifier-options-body"
            color="light"
          >
            <IonGrid className="identifier-options-main">
              <IonRow>
                <IonCol size="12">
                  <span
                    className="identifier-options-option"
                    data-testid="view-json-identifier-options"
                    onClick={() => {
                      setOptionsIsOpen(false);
                      setViewIsOpen(true);
                    }}
                  >
                    <span>
                      <IonButton shape="round">
                        <IonIcon
                          slot="icon-only"
                          icon={codeSlashOutline}
                        />
                      </IonButton>
                    </span>
                    <span className="identifier-options-label">
                      {i18n.t("identifiers.details.options.view")}
                    </span>
                  </span>
                  <span
                    className="identifier-options-option"
                    data-testid="edit-identifier-options"
                    onClick={() => {
                      dispatch(
                        setCurrentOperation(OperationType.UPDATE_IDENTIFIER)
                      );
                      setNewDisplayName(cardData.displayName);
                      setOptionsIsOpen(false);
                      setEditorIsOpen(true);
                    }}
                  >
                    <span>
                      <IonButton shape="round">
                        <IonIcon
                          slot="icon-only"
                          icon={pencilOutline}
                        />
                      </IonButton>
                    </span>
                    <span className="identifier-options-label">
                      {i18n.t("identifiers.details.options.edit")}
                    </span>
                  </span>
                  <span
                    className="identifier-options-option"
                    data-testid="share-identifier-options"
                    onClick={async () => {
                      await Share.share({
                        text: cardData.displayName + " " + cardData.id,
                      });
                    }}
                  >
                    <span>
                      <IonButton shape="round">
                        <IonIcon
                          slot="icon-only"
                          icon={shareOutline}
                        />
                      </IonButton>
                    </span>
                    <span className="identifier-options-info-block-data">
                      {i18n.t("identifiers.details.options.share")}
                    </span>
                  </span>
                  <span
                    className="identifier-options-option"
                    data-testid="delete-identifier-options"
                    onClick={() => {
                      setOptionsIsOpen(false);
                      handleDelete();
                      dispatch(
                        setCurrentOperation(OperationType.DELETE_IDENTIFIER)
                      );
                    }}
                  >
                    <span>
                      <IonButton shape="round">
                        <IonIcon
                          slot="icon-only"
                          icon={trashOutline}
                        />
                      </IonButton>
                    </span>
                    <span className="identifier-options-label">
                      {i18n.t("identifiers.details.options.delete")}
                    </span>
                  </span>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonContent>
        </div>
      </IonModal>
      <IonModal
        isOpen={editorOptionsIsOpen}
        initialBreakpoint={0.65}
        breakpoints={[0, 0.65]}
        className={`page-layout ${keyboardIsOpen ? "extended-modal" : ""}`}
        data-testid="edit-identifier-modal"
        onDidDismiss={() => {
          setEditorIsOpen(false);
          setNewDisplayName(cardData.displayName);
          setNewSelectedTheme(cardData.theme);
        }}
      >
        <div className="identifier-options modal editor">
          <IonHeader
            translucent={true}
            className="ion-no-border"
          >
            <IonToolbar color="light">
              <IonButtons slot="start">
                <IonButton
                  className="close-button-label"
                  onClick={() => {
                    handleClose();
                    dispatch(setCurrentOperation(OperationType.IDLE));
                  }}
                  data-testid="close-button"
                >
                  {i18n.t("identifiers.details.options.cancel")}
                </IonButton>
              </IonButtons>
              <IonTitle data-testid="edit-identifier-title">
                <h2>{i18n.t("identifiers.details.options.edit")}</h2>
              </IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent
            className="identifier-options-body"
            color="light"
          >
            <IonGrid className="identifier-options-inner">
              <IonRow>
                <IonCol size="12">
                  <CustomInput
                    dataTestId="edit-name-input"
                    title={`${i18n.t(
                      "identifiers.details.options.inner.label"
                    )}`}
                    hiddenInput={false}
                    autofocus={true}
                    onChangeInput={setNewDisplayName}
                    value={newDisplayName}
                  />
                </IonCol>
              </IonRow>
              <IonRow className="error-message-container">
                {newDisplayName.length > DISPLAY_NAME_LENGTH ? (
                  <ErrorMessage
                    message={`${i18n.t(
                      "identifiers.details.options.inner.error"
                    )}`}
                    timeout={false}
                  />
                ) : null}
              </IonRow>
              <IonRow>
                <span className="theme-input-title">{`${i18n.t(
                  "identifiers.details.options.inner.theme"
                )}`}</span>
              </IonRow>
              <IdentifierThemeSelector
                selectedTheme={newSelectedTheme}
                setSelectedTheme={setNewSelectedTheme}
              />
              <IonButton
                shape="round"
                expand="block"
                className="primary-button"
                data-testid="continue-button"
                onClick={handleSubmit}
                disabled={!verifyDisplayName}
              >
                {i18n.t("identifiers.details.options.inner.confirm")}
              </IonButton>
            </IonGrid>
          </IonContent>
        </div>
      </IonModal>
      <IonModal
        isOpen={viewIsOpen}
        initialBreakpoint={1}
        breakpoints={[0, 1]}
        className="page-layout"
        data-testid="view-identifier-modal"
        onDidDismiss={() => setViewIsOpen(false)}
      >
        <div className="identifier-options modal viewer">
          {!cardData ? null : (
            <PageLayout
              header={true}
              closeButton={true}
              closeButtonLabel={`${i18n.t("identifiers.details.view.cancel")}`}
              closeButtonAction={() => setViewIsOpen(false)}
              title={`${i18n.t("identifiers.details.view.title")}`}
            >
              <IonGrid className="identifier-options-inner">
                <pre>{JSON.stringify(cardData, null, 2)}</pre>
              </IonGrid>
              <IonGrid>
                <IonRow>
                  <IonCol className="footer-col">
                    <IonButton
                      data-testid="copy-json-button"
                      shape="round"
                      expand="block"
                      fill="outline"
                      className="secondary-button"
                      onClick={() => {
                        writeToClipboard(JSON.stringify(cardData, null, 2));
                        dispatch(setToastMsg(ToastMsgType.COPIED_TO_CLIPBOARD));
                      }}
                    >
                      <IonIcon
                        slot="icon-only"
                        size="small"
                        icon={copyOutline}
                      />
                      {i18n.t("identifiers.details.view.copy")}
                    </IonButton>
                    <IonButton
                      data-testid="save-to-device-button"
                      shape="round"
                      expand="block"
                      className="primary-button"
                      onClick={() => {
                        // @TODO - sdisalvo: Save to device
                        return;
                      }}
                    >
                      <IonIcon
                        slot="icon-only"
                        size="small"
                        icon={downloadOutline}
                      />
                      {i18n.t("identifiers.details.view.save")}
                    </IonButton>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </PageLayout>
          )}
        </div>
      </IonModal>
    </>
  );
};

export { IdentifierOptions };
