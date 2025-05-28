import { IonButton, IonIcon } from "@ionic/react";
import { closeOutline, refreshOutline } from "ionicons/icons";
import { useCallback, useEffect, useState } from "react";
import { KeyStoreKeys, SecureStorage } from "../../../core/storage";
import { i18n } from "../../../i18n";
import { RoutePath } from "../../../routes";
import { getBackRoute } from "../../../routes/backRoute";
import { getNextRoute } from "../../../routes/nextRoute";
import { DataProps } from "../../../routes/nextRoute/nextRoute.types";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { getSeedPhraseCache } from "../../../store/reducers/seedPhraseCache";
import { getStateCache } from "../../../store/reducers/stateCache";
import { updateReduxState } from "../../../store/utils";
import { Alert as AlertFail } from "../../components/Alert";
import { PageFooter } from "../../components/PageFooter";
import { PageHeader } from "../../components/PageHeader";
import { SeedPhraseModule } from "../../components/SeedPhraseModule";
import { SwitchOnboardingModeModal } from "../../components/SwitchOnboardingModeModal";
import { OnboardingMode } from "../../components/SwitchOnboardingModeModal/SwitchOnboardingModeModal.types";
import { ScrollablePageLayout } from "../../components/layout/ScrollablePageLayout";
import { useAppIonRouter } from "../../hooks";
import { showError } from "../../utils/error";
import "./VerifySeedPhrase.scss";

const VerifySeedPhrase = () => {
  const pageId = "verify-seed-phrase";
  const dispatch = useAppDispatch();
  const stateCache = useAppSelector(getStateCache);
  const seedPhraseStore = useAppSelector(getSeedPhraseCache);
  const [seedPhraseRemaining, setSeedPhraseRemaining] = useState<string[]>([]);
  const [seedPhraseSelected, setSeedPhraseSelected] = useState<string[]>([]);
  const [clearAlertOpen, setClearAlertOpen] = useState(false);
  const [alertIsOpen, setAlertIsOpen] = useState(false);
  const ionRouter = useAppIonRouter();
  const [showSwitchModeModal, setSwitchModeModal] = useState(false);

  const originalSeedPhrase = seedPhraseStore.seedPhrase.split(" ");

  const sortSeedPhrase = useCallback(() => {
    setSeedPhraseRemaining(
      [...originalSeedPhrase].sort((a, b) => a.localeCompare(b))
    );
  }, [originalSeedPhrase]);

  const sortCurrentSeedPhrase = useCallback(() => {
    setSeedPhraseRemaining((originalSeedPhrase) =>
      [...originalSeedPhrase].sort((a, b) => a.localeCompare(b))
    );
  }, []);

  useEffect(() => {
    sortSeedPhrase();
  }, []);

  const handleClearSelected = () => {
    setSeedPhraseSelected([]);
    sortSeedPhrase();
    setClearAlertOpen(false);
  };

  const handleClearState = () => {
    setSeedPhraseRemaining([]);
    setSeedPhraseSelected([]);
    setAlertIsOpen(false);
  };

  const addSeedPhraseSelected = (word: string) => {
    setSeedPhraseSelected((seedPhraseSelected) => [
      ...seedPhraseSelected,
      word,
    ]);

    const index = seedPhraseRemaining.indexOf(word);
    if (index > -1) {
      seedPhraseRemaining.splice(index, 1);
    }
    setSeedPhraseRemaining(seedPhraseRemaining);
  };

  const removeSeedPhraseSelected = (index: number) => {
    const removingQuantity = seedPhraseSelected.length - index;
    const newMatch = seedPhraseSelected;
    const words = [];
    for (let i = 0; i < removingQuantity; i++) {
      words.push(newMatch[newMatch.length - 1]);
      newMatch.pop();
    }
    setSeedPhraseRemaining(seedPhraseRemaining.concat(words));
    setSeedPhraseSelected(newMatch);
    sortCurrentSeedPhrase();
  };

  const storeIdentitySeedPhrase = async () => {
    try {
      await SecureStorage.set(KeyStoreKeys.SIGNIFY_BRAN, seedPhraseStore.bran);
      handleNavigate();
    } catch (e) {
      showError("Unable to save seedphrase", e, dispatch);
    }
  };

  const handleContinue = async () => {
    if (
      originalSeedPhrase.length === seedPhraseSelected.length &&
      originalSeedPhrase.every((v, i) => v === seedPhraseSelected[i])
    ) {
      storeIdentitySeedPhrase();
    } else {
      setAlertIsOpen(true);
    }
  };

  const handleNavigate = () => {
    const data: DataProps = {
      store: { stateCache },
      state: {
        currentOperation: stateCache.currentOperation,
      },
    };
    const { nextPath, updateRedux } = getNextRoute(
      RoutePath.VERIFY_SEED_PHRASE,
      data
    );

    updateReduxState(nextPath.pathname, data, dispatch, updateRedux);
    handleClearState();

    ionRouter.push(nextPath.pathname, "root", "replace");
  };

  const handleBack = useCallback(() => {
    handleClearState();
    const { backPath, updateRedux } = getBackRoute(
      RoutePath.VERIFY_SEED_PHRASE,
      {
        store: { stateCache },
      }
    );
    updateReduxState(
      backPath.pathname,
      { store: { stateCache } },
      dispatch,
      updateRedux
    );
    ionRouter.push(backPath.pathname, "back", "pop");
  }, [dispatch, ionRouter, stateCache]);

  const closeFailAlert = () => {
    setAlertIsOpen(false);
  };

  return (
    <ScrollablePageLayout
      pageId={pageId}
      header={
        <PageHeader
          closeButton
          closeButtonLabel={`${i18n.t(
            "verifyseedphrase.onboarding.button.back"
          )}`}
          closeButtonAction={() => {
            handleClearState();
            handleBack();
          }}
          currentPath={RoutePath.VERIFY_SEED_PHRASE}
          progressBar={true}
          progressBarValue={0.8}
          progressBarBuffer={1}
        />
      }
    >
      <div className="content-container">
        <div>
          <h2
            className="title"
            data-testid={`${pageId}-title`}
          >
            {i18n.t("verifyseedphrase.onboarding.title")}
          </h2>
          <p
            className="paragraph-top"
            data-testid={`${pageId}-paragraph-top`}
          >
            {i18n.t("verifyseedphrase.paragraph.top")}
          </p>
          <SeedPhraseModule
            testId="matching-seed-phrase-container"
            seedPhrase={seedPhraseSelected}
            emptyWord={!!seedPhraseRemaining.length}
            removeSeedPhraseSelected={removeSeedPhraseSelected}
          />
          <SeedPhraseModule
            testId="original-seed-phrase-container"
            seedPhrase={seedPhraseRemaining}
            addSeedPhraseSelected={addSeedPhraseSelected}
            hideSeedNumber
          />
          {seedPhraseSelected.length > 0 && (
            <IonButton
              onClick={() => setClearAlertOpen(true)}
              fill="outline"
              data-testid="verify-clear-button"
              className="clear-button secondary-button"
            >
              <IonIcon
                slot="start"
                icon={closeOutline}
              />
              {i18n.t("verifyseedphrase.onboarding.button.clear")}
            </IonButton>
          )}
        </div>
        <PageFooter
          pageId={pageId}
          primaryButtonText={`${i18n.t(
            "verifyseedphrase.onboarding.button.continue"
          )}`}
          primaryButtonAction={() => handleContinue()}
          primaryButtonDisabled={
            !(originalSeedPhrase.length == seedPhraseSelected.length)
          }
          tertiaryButtonText={`${i18n.t(
            "generateseedphrase.onboarding.button.switch"
          )}`}
          tertiaryButtonAction={() => setSwitchModeModal(true)}
          tertiaryButtonIcon={refreshOutline}
        />
      </div>
      <AlertFail
        isOpen={alertIsOpen}
        setIsOpen={setAlertIsOpen}
        dataTestId="alert-fail"
        headerText={i18n.t("verifyseedphrase.alert.fail.text")}
        confirmButtonText={`${i18n.t(
          "verifyseedphrase.alert.fail.button.confirm"
        )}`}
        actionConfirm={closeFailAlert}
      />
      <AlertFail
        isOpen={clearAlertOpen}
        setIsOpen={setClearAlertOpen}
        dataTestId="alert-fail"
        headerText={i18n.t("verifyseedphrase.alert.clear.text")}
        confirmButtonText={`${i18n.t(
          "verifyseedphrase.alert.clear.button.confirm"
        )}`}
        cancelButtonText={`${i18n.t(
          "verifyseedphrase.alert.clear.button.cancel"
        )}`}
        actionConfirm={handleClearSelected}
        actionCancel={() => setClearAlertOpen(false)}
        actionDismiss={() => setClearAlertOpen(false)}
      />
      <SwitchOnboardingModeModal
        mode={OnboardingMode.Recovery}
        isOpen={showSwitchModeModal}
        setOpen={setSwitchModeModal}
      />
    </ScrollablePageLayout>
  );
};

export { VerifySeedPhrase };
