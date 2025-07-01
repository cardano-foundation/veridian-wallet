import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
import { IonCol, IonGrid, IonIcon, IonModal, IonRow } from "@ionic/react";
import { informationCircleOutline } from "ionicons/icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Salter } from "signify-ts";
import { Agent } from "../../../core/agent/agent";
import { CreationStatus, MiscRecordId } from "../../../core/agent/agent.types";
import { IdentifierService } from "../../../core/agent/services";
import {
  CreateIdentifierInputs,
  IdentifierShortDetails,
} from "../../../core/agent/services/identifier.types";
import { ConfigurationService } from "../../../core/configuration";
import { i18n } from "../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  getIdentifiersCache,
  getIndividualFirstCreateSetting,
  setIndividualFirstCreate,
  setMultiSigGroupCache,
} from "../../../store/reducers/identifiersCache";
import { MultiSigGroup } from "../../../store/reducers/identifiersCache/identifiersCache.types";
import {
  setToastMsg,
  showNoWitnessAlert,
} from "../../../store/reducers/stateCache";
import { BackEventPriorityType, ToastMsgType } from "../../globals/types";
import { useOnlineStatusEffect } from "../../hooks";
import { showError } from "../../utils/error";
import { nameChecker } from "../../utils/nameChecker";
import { combineClassNames } from "../../utils/style";
import { createThemeValue } from "../../utils/theme";
import { CustomInput } from "../CustomInput";
import { ErrorMessage } from "../ErrorMessage";
import { ScrollablePageLayout } from "../layout/ScrollablePageLayout";
import { PageFooter } from "../PageFooter";
import { PageHeader } from "../PageHeader";
import { Spinner } from "../Spinner";
import { IADTypeInfoModal } from "./components/AIDTypeInfoModal";
import {
  IdentifierColor,
  IdentifierColorSelector,
} from "./components/IdentifierColorSelector";
import { IdentifierThemeSelector } from "./components/IdentifierThemeSelector";
import { TypeItem } from "./components/TypeItem";
import "./CreateIdentifier.scss";
import {
  CreateIdentifierProps,
  IdentifierModel,
} from "./CreateIdentifier.types";
import { IndividualOnlyMode } from "../../../core/configuration/configurationService.types";

const CREATE_IDENTIFIER_BLUR_TIMEOUT = 250;
const DUPLICATE_NAME = "Identifier name is a duplicate";

const CreateIdentifier = ({
  modalIsOpen,
  setModalIsOpen,
  onClose,
  groupId,
}: CreateIdentifierProps) => {
  const identifiers = useAppSelector(getIdentifiersCache);
  const individualFirstCreate = useAppSelector(getIndividualFirstCreateSetting);
  const [keyboardIsOpen, setKeyboardIsOpen] = useState(false);
  const componentId = "create-identifier-modal";
  const dispatch = useAppDispatch();
  const initalState = {
    id: "",
    displayName:
      ConfigurationService.env.features.customise?.identifiers?.creation
        ?.defaultName || "",
    selectedAidType: groupId ? 1 : 0,
    selectedTheme: 0,
    color: IdentifierColor.One,
  };

  const [identifierData, setIdentifierData] = useState<IdentifierModel>({
    ...initalState,
  });
  const [blur, setBlur] = useState(false);
  const [multiSigGroup, setMultiSigGroup] = useState<
    MultiSigGroup | undefined
  >();

  const [openAIDInfo, setOpenAIDInfo] = useState(false);

  const [duplicateName, setDuplicateName] = useState(false);
  const [inputChange, setInputChange] = useState(false);
  const localValidateMessage = inputChange
    ? nameChecker.getError(identifierData.displayName)
    : undefined;

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

  useEffect(() => {
    if (blur) {
      document?.querySelector("ion-router-outlet")?.classList.add("blur");
    } else {
      document?.querySelector("ion-router-outlet")?.classList.remove("blur");
    }
  }, [blur]);

  const updateMultiSigGroup = useCallback(async () => {
    try {
      if (!groupId) return;

      const connections =
        await Agent.agent.connections.getMultisigLinkedContacts(groupId);
      const multiSigGroup: MultiSigGroup = {
        groupId,
        connections,
      };
      setMultiSigGroup(multiSigGroup);
      dispatch(setMultiSigGroupCache(multiSigGroup));
    } catch (e) {
      showError("Unable to update multisig", e, dispatch);
    }
  }, [dispatch, groupId]);

  useOnlineStatusEffect(updateMultiSigGroup);

  const resetModal = (identiferData?: IdentifierShortDetails) => {
    setBlur(false);
    document?.querySelector("ion-router-outlet")?.classList.remove("blur");
    setModalIsOpen(false);
    onClose?.(identiferData);
    setMultiSigGroup && setMultiSigGroup(undefined);
    dispatch(setMultiSigGroupCache(undefined));
    setIdentifierData({ ...initalState });
    setInputChange(false);
    setDuplicateName(false);
  };

  const handleCreateIdentifier = async () => {
    const selectedTheme = createThemeValue(
      identifierData.color,
      identifierData.selectedTheme
    );

    const metadata: CreateIdentifierInputs = {
      displayName: identifierData.displayName,
      theme: selectedTheme,
    };
    let groupMetadata;
    if (multiSigGroup) {
      groupMetadata = {
        groupId: multiSigGroup.groupId,
        groupInitiator: false,
        groupCreated: false,
      };
    } else if (identifierData.selectedAidType == 1) {
      groupMetadata = {
        groupId: new Salter({}).qb64,
        groupInitiator: true,
        groupCreated: false,
      };
    }
    metadata.groupMetadata = groupMetadata;
    try {
      if (
        Object.values(identifiers).some(
          (item) =>
            item.displayName.trim() === identifierData.displayName.trim()
        )
      ) {
        throw new Error(DUPLICATE_NAME);
      }

      const { identifier, createdAt } =
        await Agent.agent.identifiers.createIdentifier(metadata);
      if (multiSigGroup) {
        const connections =
          await Agent.agent.connections.getMultisigLinkedContacts(
            multiSigGroup.groupId
          );
        const newMultiSigGroup: MultiSigGroup = {
          groupId: multiSigGroup.groupId,
          connections,
        };
        dispatch(setMultiSigGroupCache(newMultiSigGroup));
      }

      if (individualFirstCreate) {
        await Agent.agent.basicStorage
          .deleteById(MiscRecordId.INDIVIDUAL_FIRST_CREATE)
          .then(() => dispatch(setIndividualFirstCreate(false)));
      }

      resetModal({
        id: identifier,
        creationStatus: CreationStatus.PENDING,
        createdAtUTC: createdAt,
        theme: selectedTheme,
        displayName: identifierData.displayName,
        groupMetadata,
      });

      dispatch(
        setToastMsg(
          identifierData.selectedAidType === 1 || multiSigGroup
            ? ToastMsgType.MULTI_SIGN_IDENTIFIER_CREATED
            : identifierData.selectedAidType === 2
              ? ToastMsgType.DELEGATED_IDENTIFIER_CREATED
              : ToastMsgType.IDENTIFIER_CREATED
        )
      );
    } catch (e) {
      const errorMessage = (e as Error).message;

      if (errorMessage === DUPLICATE_NAME) {
        setDuplicateName(true);
        return;
      }

      if (
        errorMessage.includes(
          IdentifierService.INSUFFICIENT_WITNESSES_AVAILABLE
        ) ||
        errorMessage.includes(
          IdentifierService.MISCONFIGURED_AGENT_CONFIGURATION
        )
      ) {
        dispatch(showNoWitnessAlert(true));
        return;
      }

      showError("Unable to create identifier", e, dispatch);
    } finally {
      setBlur && setBlur(false);
    }
  };

  const handleContinue = async () => {
    setBlur && setBlur(true);
    setTimeout(async () => {
      await handleCreateIdentifier();
    }, CREATE_IDENTIFIER_BLUR_TIMEOUT);
  };

  const openAIDTypeInfoModal = () => {
    setOpenAIDInfo(true);
  };

  const setDisplayName = (value: string) => {
    setIdentifierData((prev) => ({
      ...prev,
      displayName: value,
    }));
    setInputChange(true);
    setDuplicateName(false);
  };

  const setTheme = (value: number) => {
    setIdentifierData((prev) => ({
      ...prev,
      selectedTheme: value,
    }));
  };

  const setAIDType = (index: number) =>
    setIdentifierData((prevState) => ({
      ...prevState,
      selectedAidType: index,
    }));

  const hasError = localValidateMessage || duplicateName;
  const errorMessage =
    localValidateMessage || `${i18n.t("nameerror.duplicatename")}`;

  const inputContainerClass = combineClassNames("identifier-name", {
    "identifier-name-error": !!hasError,
  });

  const hardwareBackButtonConfig = useMemo(
    () => ({
      priority: BackEventPriorityType.Modal,
    }),
    []
  );

  const hiddenTypeSelect =
    ConfigurationService.env.features.customise?.identifiers?.creation
      ?.individualOnly === IndividualOnlyMode.Always ||
    multiSigGroup ||
    individualFirstCreate;

  return (
    <>
      <IonModal
        isOpen={modalIsOpen}
        className={`${componentId} full-page-modal ${blur ? "blur" : ""}`}
        data-testid={componentId}
      >
        <Spinner show={blur} />
        <ScrollablePageLayout
          pageId={componentId + "-content"}
          activeStatus={modalIsOpen}
          customClass={combineClassNames(
            "create-stage-0",
            keyboardIsOpen ? "keyboard-is-open" : ""
          )}
          header={
            <PageHeader
              closeButton={true}
              closeButtonAction={() => resetModal()}
              hardwareBackButtonConfig={hardwareBackButtonConfig}
              closeButtonLabel={`${i18n.t(
                multiSigGroup
                  ? "createidentifier.back"
                  : "createidentifier.cancel"
              )}`}
              title={`${i18n.t(
                multiSigGroup
                  ? "createidentifier.receive.title"
                  : "createidentifier.add.title"
              )}`}
            />
          }
          footer={
            <PageFooter
              pageId={componentId}
              customClass={keyboardIsOpen ? "ion-hide" : ""}
              primaryButtonText={`${i18n.t(
                multiSigGroup
                  ? "createidentifier.receive.confirmbutton"
                  : "createidentifier.add.confirmbutton"
              )}`}
              primaryButtonAction={handleContinue}
              primaryButtonDisabled={
                identifierData.displayName.length === 0 ||
                !!localValidateMessage
              }
            />
          }
        >
          <div className={inputContainerClass}>
            <CustomInput
              dataTestId="display-name-input"
              title={`${i18n.t("createidentifier.displayname.title")}`}
              placeholder={`${i18n.t(
                "createidentifier.displayname.placeholder"
              )}`}
              hiddenInput={false}
              onChangeInput={setDisplayName}
              value={identifierData.displayName}
            />
            <div className="error-message-container">
              {hasError && <ErrorMessage message={errorMessage} />}
            </div>
          </div>
          {!hiddenTypeSelect && (
            <div className="aid-type">
              <div className="type-input-title">
                {`${i18n.t("createidentifier.aidtype.title")}`}
                <IonIcon
                  data-testid="type-input-title"
                  onClick={openAIDTypeInfoModal}
                  slot="icon-only"
                  src={informationCircleOutline}
                />
              </div>
              <IonGrid
                className="aid-type-selector"
                data-testid="aid-type-selector"
              >
                <IonRow>
                  <IonCol>
                    <TypeItem
                      dataTestId="identifier-aidtype-default"
                      index={0}
                      text={i18n.t("createidentifier.aidtype.default.label")}
                      clickEvent={setAIDType}
                      selectedType={identifierData.selectedAidType}
                    />
                  </IonCol>
                  <IonCol>
                    <TypeItem
                      dataTestId="identifier-aidtype-multisig"
                      index={1}
                      text={i18n.t("createidentifier.aidtype.multisig.label")}
                      clickEvent={setAIDType}
                      selectedType={identifierData.selectedAidType}
                    />
                  </IonCol>
                  <IonCol>
                    <div
                      data-testid="identifier-delegated-container"
                      onClick={openAIDTypeInfoModal}
                    >
                      <TypeItem
                        dataTestId="identifier-aidtype-delegated"
                        index={2}
                        text={i18n.t(
                          "createidentifier.aidtype.delegated.label"
                        )}
                        clickEvent={setAIDType}
                        disabled
                        selectedType={identifierData.selectedAidType}
                      />
                    </div>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </div>
          )}
          <div className="identifier-theme">
            <div
              className="theme-input-title"
              data-testid="color-input-title"
            >{`${i18n.t("createidentifier.color.title")}`}</div>
            <IdentifierColorSelector
              value={identifierData.color}
              onColorChange={(color) => {
                setIdentifierData((prevState) => ({
                  ...prevState,
                  color,
                }));
              }}
            />
          </div>
          <div className="identifier-theme">
            <div
              className="theme-input-title"
              data-testid="theme-input-title"
            >{`${i18n.t("createidentifier.theme.title")}`}</div>
            <IdentifierThemeSelector
              color={identifierData.color}
              selectedTheme={identifierData.selectedTheme}
              setSelectedTheme={setTheme}
            />
          </div>
        </ScrollablePageLayout>
      </IonModal>
      <IADTypeInfoModal
        isOpen={openAIDInfo}
        setOpen={setOpenAIDInfo}
      />
    </>
  );
};

export { CreateIdentifier };
