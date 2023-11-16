import { IonModal, IonGrid, IonRow, IonCol, IonButton } from "@ionic/react";
import { useEffect, useRef, useState } from "react";
import crypto from "crypto";
import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
import { i18n } from "../../../i18n";
import { CustomInput } from "../CustomInput";
import { PageLayout } from "../layout/PageLayout";
import { ChooseAccountNameProps } from "./ChooseAccountName.types";
import "./ChooseAccountName.scss";
import { SeedPhraseStorageService } from "../../../core/storage/services";

const ChooseAccountName = ({
  chooseAccountNameIsOpen,
  setChooseAccountNameIsOpen,
  seedPhrase,
  usesIdentitySeedPhrase,
  onDone,
}: ChooseAccountNameProps) => {
  const seedPhraseStorageService = useRef(new SeedPhraseStorageService());

  const [accountName, setAccountName] = useState("");
  const [keyboardIsOpen, setkeyboardIsOpen] = useState(false);

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

  const handleCreateWallet = async (displayName?: string) => {
    const randomizer = crypto.randomBytes(3).toString("hex");
    const name =
      displayName ??
      `${i18n.t("crypto.chooseaccountnamemodal.placeholder")} #${randomizer}`;

    if (usesIdentitySeedPhrase) {
      await seedPhraseStorageService.current.createCryptoAccountFromIdentitySeedPhrase(
        name
      );
    } else if (seedPhrase) {
      await seedPhraseStorageService.current.createCryptoAccountFromSeedPhrase(
        name,
        seedPhrase
      );
    } else {
      throw new Error(
        "Tried to create a new crypto wallet from seed phrase, but no seed phrase was provided to the component"
      );
    }

    setChooseAccountNameIsOpen(false);
    if (onDone) {
      onDone();
    }
  };

  return (
    <IonModal
      isOpen={chooseAccountNameIsOpen}
      initialBreakpoint={0.35}
      breakpoints={[0, 0.35]}
      className={`page-layout ${keyboardIsOpen ? "extended-modal" : ""}`}
      data-testid="choose-account-name"
      onDidDismiss={() => setChooseAccountNameIsOpen(false)}
    >
      <div className="choose-account-name modal">
        <PageLayout
          header={true}
          closeButton={false}
          title={`${i18n.t("crypto.chooseaccountnamemodal.title")}`}
          actionButton={true}
          actionButtonLabel={`${i18n.t("crypto.chooseaccountnamemodal.skip")}`}
          actionButtonAction={() => handleCreateWallet()}
        >
          <IonGrid>
            <IonRow>
              <IonCol size="12">
                <CustomInput
                  dataTestId="edit-display-name"
                  title={`${i18n.t("crypto.chooseaccountnamemodal.label")}`}
                  hiddenInput={false}
                  autofocus={true}
                  placeholder={`${i18n.t(
                    "crypto.chooseaccountnamemodal.placeholder"
                  )}`}
                  onChangeInput={setAccountName}
                  value={accountName}
                />
              </IonCol>
            </IonRow>
            <IonButton
              shape="round"
              expand="block"
              className="primary-button"
              data-testid="continue-button"
              onClick={() => handleCreateWallet(accountName)}
              disabled={!accountName.length}
            >
              {i18n.t("crypto.chooseaccountnamemodal.confirm")}
            </IonButton>
          </IonGrid>
        </PageLayout>
      </div>
    </IonModal>
  );
};

export { ChooseAccountName };
