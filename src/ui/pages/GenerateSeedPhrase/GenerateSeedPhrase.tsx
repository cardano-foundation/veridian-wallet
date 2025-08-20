import { IonButton, IonCheckbox, IonIcon } from "@ionic/react";
import { informationCircleOutline, refreshOutline } from "ionicons/icons";
import { useEffect, useState } from "react";
import { Trans } from "react-i18next";
import { useHistory } from "react-router-dom";
import { Agent } from "../../../core/agent/agent";
import { BranAndMnemonic } from "../../../core/agent/agent.types";
import { i18n } from "../../../i18n";
import { RoutePath } from "../../../routes";
import { getNextRoute } from "../../../routes/nextRoute";
import { DataProps } from "../../../routes/nextRoute/nextRoute.types";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { getSeedPhraseCache } from "../../../store/reducers/seedPhraseCache";
import { getStateCache } from "../../../store/reducers/stateCache";
import { updateReduxState } from "../../../store/utils";
import { Alert as AlertConfirm } from "../../components/Alert";
import { ScrollablePageLayout } from "../../components/layout/ScrollablePageLayout";
import { PageFooter } from "../../components/PageFooter";
import { PageHeader } from "../../components/PageHeader";
import { SeedPhraseModule } from "../../components/SeedPhraseModule";
import { SwitchOnboardingModeModal } from "../../components/SwitchOnboardingModeModal";
import { OnboardingMode } from "../../components/SwitchOnboardingModeModal/SwitchOnboardingModeModal.types";
import { TermsModal } from "../../components/TermsModal";
import { useAppIonRouter } from "../../hooks";
import { showError } from "../../utils/error";
import { RecoverySeedPhraseDocumentModal } from "./components/RecoverySeedPhraseDocumentModal";
import "./GenerateSeedPhrase.scss";

const GenerateSeedPhrase = () => {
  const pageId = "generate-seed-phrase";
  const ionRouter = useAppIonRouter();
  const history = useHistory();
  const dispatch = useAppDispatch();
  const stateCache = useAppSelector(getStateCache);
  const seedPhraseStore = useAppSelector(getSeedPhraseCache);
  const [branNMnemonic, setBranNMnemonic] = useState<BranAndMnemonic>();
  const [seedPhrase, setSeedPhrase] = useState<string[]>([]);
  const [hideSeedPhrase, setHideSeedPhrase] = useState(true);
  const [alertConfirmIsOpen, setAlertConfirmIsOpen] = useState(false);
  const [termsModalIsOpen, setTermsModalIsOpen] = useState(false);
  const [privacyModalIsOpen, setPrivacyModalIsOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const [openDocument, setOpenDocument] = useState(false);
  const [showSwitchModeModal, setSwitchModeModal] = useState(false);

  const initializeSeedPhrase = async () => {
    setHideSeedPhrase(true);
    if (seedPhraseStore.seedPhrase.length > 0) {
      setSeedPhrase(seedPhraseStore.seedPhrase.split(" "));
      setBranNMnemonic({
        mnemonic: seedPhraseStore.seedPhrase,
        bran: seedPhraseStore.bran,
      });
    } else {
      try {
        const branAndMnemonic = await Agent.agent.getBranAndMnemonic();
        setSeedPhrase(branAndMnemonic.mnemonic.split(" "));
        setBranNMnemonic(branAndMnemonic);
      } catch (e) {
        showError("Unable to get mnemonic", e, dispatch);
      }
    }
  };

  useEffect(() => {
    if (history?.location.pathname === RoutePath.GENERATE_SEED_PHRASE) {
      initializeSeedPhrase();
    }
  }, [history?.location.pathname]);

  const handleClearState = () => {
    setSeedPhrase([]);
    initializeSeedPhrase();
    setHideSeedPhrase(false);
    setAlertConfirmIsOpen(false);
    setChecked(false);
  };

  const HandleTerms = () => {
    return (
      <u
        data-testid="terms-of-use-modal-handler"
        onClick={() => setTermsModalIsOpen(true)}
      >
        {i18n.t("generateseedphrase.termsandconditions.terms")}
      </u>
    );
  };

  const HandlePrivacy = () => {
    return (
      <u
        data-testid="privacy-policy-modal-handler"
        onClick={() => setPrivacyModalIsOpen(true)}
      >
        {i18n.t("generateseedphrase.termsandconditions.privacy")}
      </u>
    );
  };

  const handleContinue = () => {
    setAlertConfirmIsOpen(false);
    const data: DataProps = {
      store: { stateCache },
      state: {
        seedPhrase: branNMnemonic?.mnemonic,
        bran: branNMnemonic?.bran,
      },
    };
    const { nextPath, updateRedux } = getNextRoute(
      RoutePath.GENERATE_SEED_PHRASE,
      data
    );
    updateReduxState(nextPath.pathname, data, dispatch, updateRedux);
    handleClearState();
    ionRouter.push(nextPath.pathname, "forward", "push");
  };

  return (
    <ScrollablePageLayout
      pageId={pageId}
      header={
        <PageHeader
          currentPath={RoutePath.GENERATE_SEED_PHRASE}
          progressBar={true}
          progressBarValue={0.75}
          progressBarBuffer={1}
        />
      }
    >
      <h2
        className="title"
        data-testid={`${pageId}-title`}
      >
        {i18n.t("generateseedphrase.onboarding.title")}
      </h2>
      <SeedPhraseModule
        testId="seed-phrase-container"
        seedPhrase={seedPhrase}
        hideSeedPhrase={hideSeedPhrase}
        setHideSeedPhrase={setHideSeedPhrase}
      />
      <IonButton
        onClick={() => setOpenDocument(true)}
        fill="outline"
        data-testid="recovery-phrase-docs-btn"
        className="switch-button secondary-button"
      >
        <IonIcon
          slot="start"
          icon={informationCircleOutline}
        />
        {i18n.t("generateseedphrase.onboarding.button.recoverydocumentation")}
      </IonButton>
      <p data-testid={`${pageId}-paragraph-bottom`}>
        {i18n.t("generateseedphrase.onboarding.paragraph.bottom")}
      </p>
      <div className="terms-and-conditions">
        <IonCheckbox
          labelPlacement="end"
          data-testid="terms-and-conditions-checkbox"
          checked={checked}
          onIonChange={(event) => setChecked(event.detail.checked)}
        />
        <p>
          <Trans
            i18nKey={i18n.t("generateseedphrase.termsandconditions.text")}
            components={[<HandleTerms key="" />, <HandlePrivacy key="" />]}
          />
        </p>
      </div>
      <PageFooter
        pageId={pageId}
        primaryButtonText={`${i18n.t(
          "generateseedphrase.onboarding.button.continue"
        )}`}
        primaryButtonAction={() => {
          setAlertConfirmIsOpen(true);
        }}
        primaryButtonDisabled={hideSeedPhrase || !checked}
        tertiaryButtonText={`${i18n.t(
          "generateseedphrase.onboarding.button.switch"
        )}`}
        tertiaryButtonAction={() => setSwitchModeModal(true)}
        tertiaryButtonIcon={refreshOutline}
      />
      <TermsModal
        name="terms-of-use"
        isOpen={termsModalIsOpen}
        setIsOpen={setTermsModalIsOpen}
        altIsOpen={setPrivacyModalIsOpen}
      />
      <TermsModal
        name="privacy-policy"
        isOpen={privacyModalIsOpen}
        setIsOpen={setPrivacyModalIsOpen}
        altIsOpen={setTermsModalIsOpen}
      />
      <AlertConfirm
        isOpen={alertConfirmIsOpen}
        setIsOpen={setAlertConfirmIsOpen}
        dataTestId="seed-phrase-generate-alert-continue"
        headerText={i18n.t("generateseedphrase.alert.confirm.text")}
        confirmButtonText={`${i18n.t(
          "generateseedphrase.alert.confirm.button.confirm"
        )}`}
        cancelButtonText={`${i18n.t(
          "generateseedphrase.alert.confirm.button.cancel"
        )}`}
        actionConfirm={handleContinue}
      />
      <RecoverySeedPhraseDocumentModal
        isOpen={openDocument}
        setIsOpen={setOpenDocument}
      />
      <SwitchOnboardingModeModal
        mode={OnboardingMode.Recovery}
        isOpen={showSwitchModeModal}
        setOpen={setSwitchModeModal}
      />
    </ScrollablePageLayout>
  );
};

export { GenerateSeedPhrase };
