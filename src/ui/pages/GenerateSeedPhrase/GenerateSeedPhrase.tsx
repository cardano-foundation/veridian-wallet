import { useEffect, useState } from "react";
import { Keyboard } from "@capacitor/keyboard";
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCheckbox,
  IonChip,
  IonCol,
  IonGrid,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonRow,
  IonSegment,
  IonSegmentButton,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import "./GenerateSeedPhrase.scss";
import { eyeOffOutline } from "ionicons/icons";
import { generateMnemonic, validateMnemonic } from "bip39";
import { Trans } from "react-i18next";
import { Capacitor } from "@capacitor/core";
import { i18n } from "../../../i18n";
import {
  MNEMONIC_FIFTEEN_WORDS,
  MNEMONIC_TWENTYFOUR_WORDS,
  FIFTEEN_WORDS_BIT_LENGTH,
  TWENTYFOUR_WORDS_BIT_LENGTH,
  GenerateSeedPhraseState,
} from "../../../constants/appConstants";
import { PageLayout } from "../../components/layout/PageLayout";
import {
  Alert as AlertConfirm,
  Alert as AlertExit,
} from "../../components/Alert";
import { getStateCache } from "../../../store/reducers/stateCache";
import { getNextRoute } from "../../../routes/nextRoute";
import { TermsAndConditions } from "../../components/TermsAndConditions";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { updateReduxState } from "../../../store/utils";
import { RoutePath } from "../../../routes";
import { DataProps } from "../../../routes/nextRoute/nextRoute.types";
import { getSeedPhraseCache } from "../../../store/reducers/seedPhraseCache";
import { TabsRoutePath } from "../../../routes/paths";
import { GenerateSeedPhraseProps } from "./GenerateSeedPhrase.types";
import { bip39Seeds } from "../../__mocks__/bip39Seeds";

const GenerateSeedPhrase = () => {
  const history = useHistory();
  const dispatch = useAppDispatch();
  const stateCache = useAppSelector(getStateCache);
  const seedPhraseType = !stateCache.authentication.seedPhraseIsSet
    ? GenerateSeedPhraseState.onboarding
    : (history?.location?.state as GenerateSeedPhraseProps)?.type || "";
  const stateOnboarding = seedPhraseType === GenerateSeedPhraseState.onboarding;
  const stateRestore = seedPhraseType === GenerateSeedPhraseState.restore;
  const seedPhraseStore = useAppSelector(getSeedPhraseCache);
  const [seedPhrase, setSeedPhrase] = useState<string[]>([]);
  const [seedPhrase160, setSeedPhrase160] = useState<string[]>([]);
  const [seedPhrase256, setSeedPhrase256] = useState<string[]>([]);
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [alertConfirmIsOpen, setAlertConfirmIsOpen] = useState(false);
  const [alertExitIsOpen, setAlertExitIsOpen] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const [reloadSeedPhrase, setReloadSeedPhrase] = useState(false);
  const [verifySeedPhrase, setVerifySeedPhrase] = useState(true);
  const [validateSeedPhrase, setValidateSeedPhrase] = useState(false);
  const [keyboardIsOpen, setkeyboardIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

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
    setSeedPhrase(seedPhrase);
    const isVerifiable = () => {
      let verify = true;
      for (let index = 0; index < seedPhrase.length; index++) {
        if (seedPhrase[index] === "") {
          verify = false;
        }
      }
      return verify;
    };
    setVerifySeedPhrase(isVerifiable);
    setValidateSeedPhrase(validateMnemonic(seedPhrase.join(" ")));
  }, [reloadSeedPhrase]);

  useEffect(() => {
    if (history?.location.pathname === RoutePath.GENERATE_SEED_PHRASE) {
      const isFifteenWordsSelected =
        seedPhraseStore.selected === FIFTEEN_WORDS_BIT_LENGTH;
      let seed160;
      let seed256;
      if (stateRestore) {
        setShowSeedPhrase(true);
        seed160 = new Array(MNEMONIC_FIFTEEN_WORDS).fill("");
        setSeedPhrase160(seed160);
        seed256 = new Array(MNEMONIC_TWENTYFOUR_WORDS).fill("");
        setSeedPhrase256(seed256);
      } else if (
        seedPhraseStore.seedPhrase160.length > 0 &&
        seedPhraseStore.seedPhrase256.length > 0
      ) {
        seed160 = seedPhraseStore.seedPhrase160.split(" ");
        setSeedPhrase160(seed160);
        seed256 = seedPhraseStore.seedPhrase256.split(" ");
        setSeedPhrase256(seed256);
      } else {
        seed160 = generateMnemonic(FIFTEEN_WORDS_BIT_LENGTH).split(" ");
        setSeedPhrase160(seed160);
        seed256 = generateMnemonic(TWENTYFOUR_WORDS_BIT_LENGTH).split(" ");
        setSeedPhrase256(seed256);
      }
      setSeedPhrase(isFifteenWordsSelected ? seed160 : seed256);
    }
  }, [history?.location.pathname]);

  const handleClearState = () => {
    setSeedPhrase160([]);
    setSeedPhrase256([]);
    setSeedPhrase([]);
    setShowSeedPhrase(false);
    setAlertConfirmIsOpen(false);
    setAlertExitIsOpen(false);
    setModalIsOpen(false);
    setChecked(false);
  };

  const toggleSeedPhrase = (length: number) => {
    if (length === FIFTEEN_WORDS_BIT_LENGTH) {
      setSeedPhrase(seedPhrase160);
    } else {
      setSeedPhrase(seedPhrase256);
    }
  };

  const HandleTerms = () => {
    return (
      <a
        onClick={() => {
          setModalIsOpen(true);
        }}
      >
        <u>{i18n.t("generateseedphrase.termsandconditions.link")}</u>
      </a>
    );
  };

  const handleShowSeedPhrase = () => {
    setShowSeedPhrase(true);
  };
  const handleContinue = () => {
    setAlertConfirmIsOpen(false);
    const data: DataProps = {
      store: { stateCache },
      state: {
        seedPhrase160: seedPhrase160.join(" "),
        seedPhrase256: seedPhrase256.join(" "),
        selected:
          seedPhrase.length === 15
            ? FIFTEEN_WORDS_BIT_LENGTH
            : TWENTYFOUR_WORDS_BIT_LENGTH,
      },
    };
    const { nextPath, updateRedux } = getNextRoute(
      RoutePath.GENERATE_SEED_PHRASE,
      data
    );
    updateReduxState(nextPath.pathname, data, dispatch, updateRedux);
    handleClearState();
    history.push({
      pathname: nextPath.pathname,
      state: {
        type: seedPhraseType,
      },
    });
  };

  const handleExit = () => {
    handleClearState();
    history.push(TabsRoutePath.CRYPTO);
  };

  const Suggestions = () => {
    return (
      <div className="seed-phrase-container">
        {suggestions.map((suggestion, index) => (
          <IonChip
            className=""
            key={index}
            onClick={() => {
              updateSeedPhrase(currentIndex, suggestion);
            }}
          >
            <span className="">{suggestion}</span>
          </IonChip>
        ))}
      </div>
    );
  };

  const handleSuggestions = (index: number, word: string) => {
    setCurrentIndex(index);
    const query = word.toLowerCase();
    if (query.length > 1) {
      const filteredSuggestions = bip39Seeds.filter(
        (suggestion: string) => suggestion.toLowerCase().indexOf(query) > -1
      );
      filteredSuggestions.length = isTyping ? 3 : 0;
      setSuggestions(filteredSuggestions);
    }
  };

  const updateSeedPhrase = (index: number, word: string) => {
    const newSeedPhrase = seedPhrase;
    newSeedPhrase[index] = word;
    setSeedPhrase(newSeedPhrase);
    setReloadSeedPhrase(!reloadSeedPhrase);
  };

  return (
    <IonPage className="page-layout generate-seedphrase">
      <PageLayout
        header={true}
        title={
          !stateOnboarding
            ? `${i18n.t("generateseedphrase." + seedPhraseType + ".title")}`
            : undefined
        }
        backButton={stateOnboarding}
        onBack={handleClearState}
        closeButton={!stateOnboarding}
        closeButtonAction={() => setAlertExitIsOpen(true)}
        currentPath={RoutePath.GENERATE_SEED_PHRASE}
        progressBar={stateOnboarding}
        progressBarValue={0.66}
        progressBarBuffer={1}
        footer={true}
        primaryButtonText={`${i18n.t(
          "generateseedphrase." + seedPhraseType + ".continue.button"
        )}`}
        primaryButtonAction={() => setAlertConfirmIsOpen(true)}
        primaryButtonDisabled={!(showSeedPhrase && checked && verifySeedPhrase)}
      >
        <IonGrid>
          <IonRow>
            <IonCol size="12">
              {stateOnboarding && (
                <h2>
                  {i18n.t("generateseedphrase." + seedPhraseType + ".title")}
                </h2>
              )}
              <p className="page-paragraph">
                {i18n.t(
                  "generateseedphrase." + seedPhraseType + ".paragraph.top"
                )}
              </p>
            </IonCol>
          </IonRow>
        </IonGrid>
        <IonGrid>
          <IonRow>
            <IonCol size="12">
              <IonSegment
                data-testid="mnemonic-length-segment"
                value={`${
                  seedPhrase.length === MNEMONIC_TWENTYFOUR_WORDS
                    ? TWENTYFOUR_WORDS_BIT_LENGTH
                    : FIFTEEN_WORDS_BIT_LENGTH
                }`}
                onIonChange={(event) => {
                  setShowSeedPhrase(stateRestore);
                  toggleSeedPhrase(Number(event.detail.value));
                }}
              >
                <IonSegmentButton value={String(FIFTEEN_WORDS_BIT_LENGTH)}>
                  <IonLabel>
                    {i18n.t("generateseedphrase.segment", {
                      length: MNEMONIC_FIFTEEN_WORDS,
                    })}
                  </IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value={String(TWENTYFOUR_WORDS_BIT_LENGTH)}>
                  <IonLabel>
                    {i18n.t("generateseedphrase.segment", {
                      length: MNEMONIC_TWENTYFOUR_WORDS,
                    })}
                  </IonLabel>
                </IonSegmentButton>
              </IonSegment>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="12">
              <IonCard>
                <div
                  data-testid="seed-phrase-privacy-overlay"
                  className={`overlay ${showSeedPhrase ? "hidden" : "visible"}`}
                >
                  <IonCardHeader>
                    <IonIcon icon={eyeOffOutline} />
                  </IonCardHeader>
                  <IonCardContent>
                    {i18n.t("generateseedphrase.privacy.overlay.text")}
                  </IonCardContent>
                  <IonButton
                    shape="round"
                    fill="outline"
                    data-testid="reveal-seed-phrase-button"
                    onClick={() => handleShowSeedPhrase()}
                  >
                    {i18n.t("generateseedphrase.privacy.overlay.button")}
                  </IonButton>
                </div>
                <div
                  data-testid="seed-phrase-container"
                  className={`seed-phrase-container ${seedPhraseType} ${
                    showSeedPhrase
                      ? "seed-phrase-visible"
                      : "seed-phrase-blurred"
                  }
                }`}
                >
                  {seedPhrase.map((word, index) => {
                    return stateRestore ? (
                      <IonChip
                        key={index}
                        className={word.length ? "full" : "empty"}
                      >
                        <span className="index">{index + 1}.</span>
                        <IonInput
                          onClick={() => {
                            updateSeedPhrase(index, "");
                            setIsTyping(true);
                          }}
                          onIonChange={(e) => {
                            handleSuggestions(index, `${e.target.value}`);
                            updateSeedPhrase(index, `${e.target.value}`);
                          }}
                          onIonBlur={() => {
                            setIsTyping(false);
                          }}
                          value={word}
                        />
                      </IonChip>
                    ) : (
                      <IonChip key={index}>
                        <span className="index">{index + 1}.</span>
                        <span data-testid={`word-index-${index}`}>{word}</span>
                      </IonChip>
                    );
                  })}
                </div>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
        <IonGrid>
          <IonRow>
            <IonCol size="12">
              <p className="page-paragraph">
                {i18n.t(
                  "generateseedphrase." + seedPhraseType + ".paragraph.bottom"
                )}
              </p>
            </IonCol>
          </IonRow>
        </IonGrid>
        <IonGrid>
          <IonRow>
            <IonCol size="12">
              <IonItem
                color="light"
                lines="none"
              >
                <IonCheckbox
                  slot="start"
                  checked={checked}
                  data-testid="termsandconditions-checkbox"
                  onIonChange={(e) => setChecked(e.detail.checked)}
                />
                <IonLabel
                  slot="end"
                  className="ion-text-wrap termsandconditions-label"
                  color="primary"
                  data-testid="termsandconditions-label"
                >
                  <Trans
                    i18nKey={i18n.t(
                      "generateseedphrase.termsandconditions.text"
                    )}
                    components={[<HandleTerms key="" />]}
                  />
                </IonLabel>
              </IonItem>
              <TermsAndConditions
                isOpen={modalIsOpen}
                setIsOpen={setModalIsOpen}
              />
            </IonCol>
          </IonRow>
          {isTyping && suggestions.length ? (
            <IonRow>
              <IonCol>
                <Suggestions />
              </IonCol>
            </IonRow>
          ) : null}
        </IonGrid>
        <AlertConfirm
          isOpen={alertConfirmIsOpen}
          setIsOpen={setAlertConfirmIsOpen}
          dataTestId="alert-confirm"
          headerText={i18n.t("generateseedphrase.alert.confirm.text")}
          confirmButtonText={`${i18n.t(
            "generateseedphrase.alert.confirm.button.confirm"
          )}`}
          cancelButtonText={`${i18n.t(
            "generateseedphrase.alert.confirm.button.cancel"
          )}`}
          actionConfirm={handleContinue}
        />
        <AlertExit
          isOpen={alertExitIsOpen}
          setIsOpen={setAlertExitIsOpen}
          dataTestId="alert-exit"
          headerText={i18n.t("generateseedphrase.alert.exit.text")}
          confirmButtonText={`${i18n.t(
            "generateseedphrase.alert.exit.button.confirm"
          )}`}
          cancelButtonText={`${i18n.t(
            "generateseedphrase.alert.exit.button.cancel"
          )}`}
          actionConfirm={handleExit}
        />
      </PageLayout>
    </IonPage>
  );
};

export { GenerateSeedPhrase };
