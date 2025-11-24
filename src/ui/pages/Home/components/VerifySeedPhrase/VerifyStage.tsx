import { IonButton, IonIcon } from "@ionic/react";
import { backspaceOutline } from "ionicons/icons";
import { useCallback, useEffect, useState } from "react";
import { i18n } from "../../../../../i18n";
import { Alert } from "../../../../components/Alert";
import { PageFooter } from "../../../../components/PageFooter";
import { SeedPhraseModule } from "../../../../components/SeedPhraseModule";
import { VerifyStageProps } from "./VerifySeedPhraseModal.types";
import "./VerifyStage.scss";

const VerifyStage = ({
  seedPhrase: originalSeedPhrase,
  onVerifySuccess,
}: VerifyStageProps) => {
  const pageId = "verify-seed-phrase";
  const [seedPhraseRemaining, setSeedPhraseRemaining] = useState<string[]>([]);
  const [seedPhraseSelected, setSeedPhraseSelected] = useState<string[]>([]);
  const [clearAlertOpen, setClearAlertOpen] = useState(false);
  const [alertIsOpen, setAlertIsOpen] = useState(false);

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
  }, [sortSeedPhrase]);

  const handleClearSelected = () => {
    setSeedPhraseSelected([]);
    sortSeedPhrase();
    setClearAlertOpen(false);
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

  const handleContinue = async () => {
    if (
      originalSeedPhrase.length === seedPhraseSelected.length &&
      originalSeedPhrase.every((v, i) => v === seedPhraseSelected[i])
    ) {
      onVerifySuccess();
    } else {
      setAlertIsOpen(true);
    }
  };

  const closeFailAlert = () => {
    setAlertIsOpen(false);
  };

  return (
    <>
      <div className="content-container">
        <div>
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
                icon={backspaceOutline}
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
        />
      </div>
      <Alert
        isOpen={alertIsOpen}
        setIsOpen={setAlertIsOpen}
        dataTestId="alert-fail"
        headerText={i18n.t("verifyseedphrase.alert.fail.text")}
        confirmButtonText={`${i18n.t(
          "verifyseedphrase.alert.fail.button.confirm"
        )}`}
        actionConfirm={closeFailAlert}
      />
      <Alert
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
    </>
  );
};

export { VerifyStage };
