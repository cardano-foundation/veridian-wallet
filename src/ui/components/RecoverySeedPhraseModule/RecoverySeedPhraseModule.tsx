import { IonButton, IonIcon } from "@ionic/react";
import { wordlists } from "bip39";
import { backspaceOutline, addOutline } from "ionicons/icons";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Agent } from "../../../core/agent/agent";
import { i18n } from "../../../i18n";
import { useAppDispatch } from "../../../store/hooks";
import { setSeedPhraseCache } from "../../../store/reducers/seedPhraseCache";
import { showError } from "../../utils/error";
import { Alert as AlertFail } from "../Alert";
import { PageFooter } from "../PageFooter";
import { SeedPhraseModule } from "../SeedPhraseModule";
import { SeedPhraseModuleRef } from "../SeedPhraseModule/SeedPhraseModule.types";
import { SwitchOnboardingModeModal } from "../SwitchOnboardingModeModal";
import { OnboardingMode } from "../SwitchOnboardingModeModal/SwitchOnboardingModeModal.types";
import "./RecoverySeedPhraseModule.scss";
import {
  RecoverySeedPhraseModuleProps,
  RecoverySeedPhraseModuleRef,
  SeedPhraseInfo,
} from "./RecoverySeedPhraseModule.types";

const SEED_PHRASE_LENGTH = 18;
const SUGGEST_SEED_PHRASE_LENGTH = 4;
const SELECT_WORD_LIST = wordlists.english;
const INVALID_SEED_PHRASE = "Invalid seed phrase";

const RecoverySeedPhraseModule = forwardRef<
  RecoverySeedPhraseModuleRef,
  RecoverySeedPhraseModuleProps
>(
  (
    {
      title,
      description,
      testId,
      overrideAlertZIndex,
      displaySwitchModeButton,
      onVerifySuccess,
    },
    ref
  ) => {
    const dispatch = useAppDispatch();

    const [alertIsOpen, setAlertIsOpen] = useState(false);
    const [clearAlertOpen, setClearAlertOpen] = useState(false);
    const [showSwitchModeModal, setSwitchModeModal] = useState(false);
    const [seedPhraseInfo, setSeedPhraseInfo] = useState<SeedPhraseInfo[]>([
      {
        value: "",
        suggestions: [],
      },
    ]);

    const [lastFocusIndex, setLastFocusIndex] = useState<number | null>(null);
    const [isTyping, setIsTyping] = useState<boolean>(false);

    const seedPhraseRef = useRef<SeedPhraseModuleRef>(null);

    const seedPhrase = seedPhraseInfo.map((item) => item.value);
    const suggestSeedPhrase =
      (isTyping &&
        seedPhraseInfo.find((_, index) => index === lastFocusIndex)
          ?.suggestions) ||
      [];
    const errorInputIndex = seedPhraseInfo.reduce((result, nextItem, index) => {
      if (nextItem.suggestions.includes(nextItem.value)) return result;

      if (nextItem.value && nextItem.suggestions.length === 0) {
        result.push(index);
      }

      if (
        nextItem.value &&
        nextItem.suggestions.length &&
        (index !== lastFocusIndex || !isTyping)
      ) {
        result.push(index);
      }

      if (!nextItem.value && index !== seedPhrase.length - 1) {
        result.push(index);
      }

      return result;
    }, [] as number[]);

    const alerClasses = overrideAlertZIndex ? "max-zindex" : undefined;

    const handleClearState = () => {
      setSeedPhraseInfo([
        {
          value: "",
          suggestions: [],
        },
      ]);
      setLastFocusIndex(null);
      setAlertIsOpen(false);
      seedPhraseRef.current?.focusInputByIndex(0);
    };

    useImperativeHandle(ref, () => ({
      clearState: handleClearState,
    }));

    const renderSuggestSeedPhrase = (inputWord: string) => {
      inputWord = inputWord.toLowerCase().trim();

      if (!inputWord) {
        return [];
      }

      const suggestionWords: string[] = [];
      for (let index = 0; index < SELECT_WORD_LIST.length; index++) {
        const word = SELECT_WORD_LIST[index];

        if (word.startsWith(inputWord)) {
          suggestionWords.push(word);
        }

        if (suggestionWords.length >= SUGGEST_SEED_PHRASE_LENGTH) {
          break;
        }
      }

      return suggestionWords;
    };

    const handleUpdateSeedPhrase = (value: string, index: number) => {
      const currentValue = [...seedPhraseInfo];

      const suggestions = renderSuggestSeedPhrase(value);

      currentValue[index] = {
        value,
        suggestions: suggestions,
      };

      if (!value && index === currentValue.length - 2) {
        currentValue.splice(currentValue.length - 2, 1);
      } else if (
        index + 1 === currentValue.length &&
        index + 1 < SEED_PHRASE_LENGTH
      ) {
        currentValue.push({
          value: "",
          suggestions: [],
        });
      }

      setSeedPhraseInfo(currentValue);

      return currentValue;
    };

    const addSeedPhraseSelected = (word: string) => {
      if (lastFocusIndex === null) return;

      const newValue = handleUpdateSeedPhrase(word, lastFocusIndex);

      if (
        lastFocusIndex !== SEED_PHRASE_LENGTH - 1 &&
        filledSeedPhrase.length !== SEED_PHRASE_LENGTH
      ) {
        seedPhraseRef.current?.focusInputByIndex(newValue.length - 1);
      }
    };

    const handleContinue = async () => {
      try {
        const seedPhraseText = seedPhrase.join(" ");
        const verifyResult = await Agent.agent.isMnemonicValid(seedPhraseText);

        if (!verifyResult) {
          throw new Error(INVALID_SEED_PHRASE);
        }

        dispatch(
          setSeedPhraseCache({
            seedPhrase: seedPhraseText,
            bran: "",
          })
        );

        onVerifySuccess();
      } catch (e) {
        setAlertIsOpen(true);
        showError("Unable to verify recovery seed phrase", e);
      }
    };

    const closeFailAlert = () => {
      setAlertIsOpen(false);
    };

    const closeClearAlert = () => {
      setClearAlertOpen(false);
    };

    const onFocusInput = (index: number) => {
      setLastFocusIndex(index);
      setIsTyping(true);
      const word = seedPhrase[index];
      renderSuggestSeedPhrase(word);
    };

    const checkMatchWithSuggestion = (selectWord: string | undefined) => {
      return SELECT_WORD_LIST.some(
        (word) => selectWord?.toLowerCase().trim() === word
      );
    };

    const onBlurInput = () => {
      setIsTyping(false);
    };

    const verifyButtonLabel = `${i18n.t(
      "verifyrecoveryseedphrase.button.continue"
    )}`;

    const displaySuggestionError = errorInputIndex.length > 0;
    const filledSeedPhrase = seedPhrase.filter((item) => !!item);
    const isMatchAllSuggestion = filledSeedPhrase.every((seedPhrase) =>
      checkMatchWithSuggestion(seedPhrase)
    );

    return (
      <>
        <div className="content-container recovery-seed-phrase-module">
          <div>
            {title && (
              <h2
                className="title"
                data-testid={`${testId}-title`}
              >
                {title}
              </h2>
            )}
            {description && (
              <p
                className="paragraph-top"
                data-testid={`${testId}-paragraph-top`}
              >
                {description}
              </p>
            )}
            <SeedPhraseModule
              testId="user-input-seed-phrase-container"
              seedPhrase={seedPhrase}
              inputMode
              onInputChange={handleUpdateSeedPhrase}
              onInputFocus={onFocusInput}
              onInputBlur={onBlurInput}
              ref={seedPhraseRef}
              errorInputIndexs={errorInputIndex}
            />
            {(suggestSeedPhrase.length > 0 || displaySuggestionError) && (
              <div className="suggestions-feature">
                <h3 className="suggestions-title">
                  {i18n.t("verifyrecoveryseedphrase.suggestions.title")}
                </h3>
                {suggestSeedPhrase.length > 0 && (
                  <SeedPhraseModule
                    testId="suggestions-seed-phrase-container"
                    seedPhrase={suggestSeedPhrase}
                    addSeedPhraseSelected={addSeedPhraseSelected}
                    hideSeedNumber
                  />
                )}
                {displaySuggestionError && (
                  <p
                    className="suggest-error"
                    data-testid="no-suggest-error"
                  >
                    {i18n.t("verifyrecoveryseedphrase.suggestions.error")}
                  </p>
                )}
              </div>
            )}
            {seedPhrase.filter((item) => !!item).length > 0 && (
              <IonButton
                onClick={() => setClearAlertOpen(true)}
                fill="outline"
                data-testid="verify-clear-button"
                className="clear-button secondary-button"
              >
                <IonIcon
                  slot="start"
                  icon={backspaceOutline}
                />
                {i18n.t("verifyrecoveryseedphrase.button.clear")}
              </IonButton>
            )}
          </div>
          <PageFooter
            pageId={testId}
            primaryButtonText={verifyButtonLabel}
            primaryButtonAction={() => handleContinue()}
            primaryButtonDisabled={
              filledSeedPhrase.length < SEED_PHRASE_LENGTH ||
              displaySuggestionError ||
              !isMatchAllSuggestion
            }
            tertiaryButtonText={
              displaySwitchModeButton
                ? `${i18n.t("verifyrecoveryseedphrase.button.switch")}`
                : undefined
            }
            tertiaryButtonAction={() => setSwitchModeModal(true)}
            tertiaryButtonIcon={addOutline}
          />
        </div>
        <AlertFail
          isOpen={alertIsOpen}
          setIsOpen={setAlertIsOpen}
          dataTestId="alert-fail"
          className={alerClasses}
          headerText={i18n.t("verifyrecoveryseedphrase.alert.fail.text")}
          confirmButtonText={`${i18n.t(
            "verifyrecoveryseedphrase.alert.fail.button.confirm"
          )}`}
          actionConfirm={closeFailAlert}
          backdropDismiss={false}
        />
        <AlertFail
          isOpen={clearAlertOpen}
          setIsOpen={setClearAlertOpen}
          dataTestId="alert-fail"
          headerText={i18n.t("verifyrecoveryseedphrase.alert.clear.text")}
          confirmButtonText={`${i18n.t(
            "verifyrecoveryseedphrase.alert.clear.button.confirm"
          )}`}
          cancelButtonText={`${i18n.t(
            "verifyrecoveryseedphrase.alert.clear.button.cancel"
          )}`}
          className={alerClasses}
          actionConfirm={handleClearState}
          actionCancel={closeClearAlert}
          actionDismiss={closeClearAlert}
        />
        <SwitchOnboardingModeModal
          mode={OnboardingMode.Create}
          isOpen={showSwitchModeModal}
          setOpen={setSwitchModeModal}
        />
      </>
    );
  }
);

export { RecoverySeedPhraseModule };
