import { IonButton, IonIcon } from "@ionic/react";
import { alertCircleOutline, informationCircleOutline } from "ionicons/icons";
import { useCallback, useState } from "react";
import { Agent } from "../../../../../core/agent/agent";
import { i18n } from "../../../../../i18n";
import { useAppDispatch } from "../../../../../store/hooks";
import { useOnlineStatusEffect } from "../../../../hooks";
import { showError } from "../../../../utils/error";
import { InfoCard } from "../../../InfoCard";
import { PageFooter } from "../../../PageFooter";
import { SeedPhraseModule } from "../../../SeedPhraseModule";
import { ConfirmModal } from "./ConfirmModal";
import "./RecoverySeedPhrase.scss";
import { RecoverySeedPhraseProps } from "./RecoverySeedPhrase.types";
import { RecoverySeedPhraseDocumentModal } from "./RecoverySeedPhraseDocumentModal";

const RecoverySeedPhrase = ({
  onClose,
  starVerify,
  mode = "view",
}: RecoverySeedPhraseProps) => {
  const componentId = "recovery-seed-phrase";
  const dispatch = useAppDispatch();
  const [seedPhrase, setSeedPhrase] = useState<string[]>(Array(18).fill(""));
  const [hideSeedPhrase, setHideSeedPhrase] = useState(true);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [openDocument, setOpenDocument] = useState(false);
  const isEdit = mode === "verify";

  const footerButtonLabel = isEdit
    ? hideSeedPhrase
      ? i18n.t("settings.sections.security.seedphrase.page.button.next")
      : i18n.t("settings.sections.security.seedphrase.page.button.verify")
    : hideSeedPhrase
    ? i18n.t("settings.sections.security.seedphrase.page.button.view")
    : i18n.t("settings.sections.security.seedphrase.page.button.hide");

  const loadSeedPhrase = useCallback(async () => {
    try {
      const data = await Agent.agent.getMnemonic();
      setSeedPhrase(data.split(" "));
    } catch (e) {
      onClose();
      showError("Unable to generate recovery seed phrase", e, dispatch);
    }
  }, [dispatch, onClose]);

  useOnlineStatusEffect(loadSeedPhrase);

  const handleClickPrimaryButton = () => {
    if (isEdit && !hideSeedPhrase) {
      return starVerify?.(seedPhrase);
    }

    if (!hideSeedPhrase) {
      return setHideSeedPhrase(true);
    }

    setOpenConfirmModal(true);
  };

  const showPhrase = () => {
    setOpenConfirmModal(false);
    setHideSeedPhrase(false);
  };

  return (
    <>
      <div className="recovery-page-container">
        <InfoCard
          className="user-tips"
          icon={alertCircleOutline}
        >
          <div>
            <p>
              {i18n.t("settings.sections.security.seedphrase.page.tips.label")}
            </p>
            <ol className="tips">
              <li>
                {i18n.t("settings.sections.security.seedphrase.page.tips.one")}
              </li>
              <li>
                {i18n.t("settings.sections.security.seedphrase.page.tips.two")}
              </li>
              <li>
                {i18n.t(
                  "settings.sections.security.seedphrase.page.tips.three"
                )}
              </li>
            </ol>
          </div>
        </InfoCard>
        <SeedPhraseModule
          testId="seed-phrase-container"
          seedPhrase={seedPhrase}
          overlayText={`${i18n.t(
            "settings.sections.security.seedphrase.page.hiddentext"
          )}`}
          hideSeedPhrase={hideSeedPhrase}
          setHideSeedPhrase={setHideSeedPhrase}
          showSeedPhraseButton={false}
        />
        {isEdit && (
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
            {i18n.t(
              "generateseedphrase.onboarding.button.recoverydocumentation"
            )}
          </IonButton>
        )}
      </div>
      <PageFooter
        customClass="recovery-seed-phrase-page-footer"
        pageId={componentId}
        primaryButtonText={`${footerButtonLabel}`}
        primaryButtonAction={handleClickPrimaryButton}
      />
      <ConfirmModal
        isOpen={openConfirmModal}
        setIsOpen={setOpenConfirmModal}
        onShowPhrase={showPhrase}
      />
      <RecoverySeedPhraseDocumentModal
        isOpen={openDocument}
        setIsOpen={setOpenDocument}
      />
    </>
  );
};

export { RecoverySeedPhrase };
