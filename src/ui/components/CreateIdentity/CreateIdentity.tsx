import {
  IonButton,
  IonCol,
  IonGrid,
  IonIcon,
  IonItem,
  IonModal,
  IonRow,
} from "@ionic/react";
import { useEffect, useState } from "react";
import { Keyboard } from "@capacitor/keyboard";
import { Capacitor } from "@capacitor/core";
import { checkmark } from "ionicons/icons";
import { i18n } from "../../../i18n";
import { PageLayout } from "../layout/PageLayout";
import { CreateIdentityProps } from "./CreateIdentity.types";
import { CustomInput } from "../CustomInput";
import { ErrorMessage } from "../ErrorMessage";
import "./CreateIdentity.scss";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  getIdentitiesCache,
  setIdentitiesCache,
} from "../../../store/reducers/identitiesCache";
import {
  IdentifierShortDetails,
  IdentifierType,
} from "../../../core/agent/agent.types";
import { ColorGenerator } from "../../utils/ColorGenerator";
import { AriesAgent } from "../../../core/agent/agent";
import { setCurrentOperation } from "../../../store/reducers/stateCache";
import { toastState } from "../../constants/dictionary";
import { IdentityThemeSelector } from "../IdentityThemeSelector";

const CreateIdentity = ({
  modalIsOpen,
  setModalIsOpen,
}: CreateIdentityProps) => {
  const dispatch = useAppDispatch();
  const identityData = useAppSelector(getIdentitiesCache);
  const [displayNameValue, setDisplayNameValue] = useState("");
  const [selectedType, setSelectedType] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [keyboardIsOpen, setKeyboardIsOpen] = useState(false);
  const displayNameValueIsValid =
    displayNameValue.length > 0 && displayNameValue.length <= 32;
  const typeIsSelectedIsValid = selectedType !== undefined;

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      Keyboard.addListener("keyboardWillShow", () => {
        setKeyboardIsOpen(true);
      });
      Keyboard.addListener("keyboardWillHide", () => {
        setKeyboardIsOpen(false);
      });
    }
  }, []);

  const resetModal = () => {
    setModalIsOpen(false);
    setDisplayNameValue("");
    setSelectedType(0);
  };

  const handleCreateIdentity = async () => {
    const colorGenerator = new ColorGenerator();
    const newColor = colorGenerator.generateNextColor();
    const type = selectedType === 0 ? IdentifierType.KEY : IdentifierType.KERI;
    // @TODO: for test, should set colors
    let theme = selectedTheme;
    if (type === IdentifierType.KERI) {
      theme = selectedTheme === 5 ? 1 : 0;
    }
    const identifier = await AriesAgent.agent.identifiers.createIdentifier({
      displayName: displayNameValue,
      method: type,
      colors: [newColor[1], newColor[0]],
      theme,
    });
    if (identifier) {
      const newIdentity: IdentifierShortDetails = {
        id: identifier,
        method: type,
        displayName: displayNameValue,
        createdAtUTC: new Date().toISOString(),
        colors: [newColor[1], newColor[0]],
        theme: selectedTheme,
      };
      dispatch(setIdentitiesCache([...identityData, newIdentity]));
      dispatch(setCurrentOperation(toastState.identityCreated));
      resetModal();
    }
  };

  interface TypeItemProps {
    index: number;
    text: string;
  }

  const TypeItem = ({ index, text }: TypeItemProps) => {
    return (
      <IonCol>
        <IonItem
          onClick={() => {
            if (selectedTheme > 3) {
              setSelectedTheme(0);
            } else {
              setSelectedTheme(4);
            }
            setSelectedType(index);
          }}
          className={`type-input ${
            selectedType === index ? "selected-type" : ""
          }`}
        >
          <div className="centered-text">
            <span>{text}</span>
          </div>
        </IonItem>
      </IonCol>
    );
  };

  return (
    <IonModal
      isOpen={modalIsOpen}
      initialBreakpoint={0.75}
      breakpoints={[0, 0.75]}
      className={`page-layout ${keyboardIsOpen ? "extended-modal" : ""}`}
      data-testid="create-identity-modal"
      onDidDismiss={() => resetModal()}
    >
      <div className="create-identity modal">
        <PageLayout
          header={true}
          title={`${i18n.t("createidentity.title")}`}
        >
          <IonGrid>
            <IonRow className="identity-name-input">
              <IonCol>
                <CustomInput
                  dataTestId="display-name-input"
                  title={`${i18n.t("createidentity.displayname.title")}`}
                  placeholder={`${i18n.t(
                    "createidentity.displayname.placeholder"
                  )}`}
                  hiddenInput={false}
                  onChangeInput={setDisplayNameValue}
                  value={displayNameValue}
                />
              </IonCol>
            </IonRow>

            <IonRow className="error-message-container">
              {displayNameValue.length !== 0 && !displayNameValueIsValid ? (
                <ErrorMessage
                  message={`${i18n.t("createidentity.error.maxlength")}`}
                  timeout={true}
                />
              ) : null}
            </IonRow>

            <IonRow>
              <span className="type-input-title">{`${i18n.t(
                "createidentity.identitytype.title"
              )}`}</span>
            </IonRow>

            <IonRow className="identity-type-input">
              <TypeItem
                index={0}
                text={i18n.t("createidentity.identitytype.didkey")}
              />
              <TypeItem
                index={1}
                text={i18n.t("createidentity.identitytype.keri")}
              />
            </IonRow>

            <IonRow>
              <span className="type-input-title">{`${i18n.t(
                "createidentity.theme.title"
              )}`}</span>
            </IonRow>
            <IdentityThemeSelector
              identityType={selectedType}
              selectedTheme={selectedTheme}
              setSelectedTheme={setSelectedTheme}
            />

            <IonRow className="continue-button-container">
              <IonCol>
                <IonButton
                  shape="round"
                  expand="block"
                  className="ion-primary-button"
                  data-testid="continue-button"
                  onClick={handleCreateIdentity}
                  disabled={!(displayNameValueIsValid && typeIsSelectedIsValid)}
                >
                  {`${i18n.t("createidentity.confirmbutton")}`}
                </IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
        </PageLayout>
      </div>
    </IonModal>
  );
};

export { CreateIdentity };
