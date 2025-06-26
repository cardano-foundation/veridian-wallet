import { alertCircleOutline } from "ionicons/icons";
import { useCallback, useState } from "react";
import { Agent } from "../../../../../../../core/agent/agent";
import { i18n } from "../../../../../../../i18n";
import { useAppDispatch } from "../../../../../../../store/hooks";
import { InfoCard } from "../../../../../../components/InfoCard";
import { PageFooter } from "../../../../../../components/PageFooter";
import { SeedPhraseModule } from "../../../../../../components/SeedPhraseModule";
import { useOnlineStatusEffect } from "../../../../../../hooks";
import { showError } from "../../../../../../utils/error";
import { ConfirmModal } from "./ConfirmModal";
import "./RecoverySeedPhrase.scss";
import { RecoverySeedPhraseProps } from "./RecoverySeedPhrase.types";

const RecoverySeedPhrase = ({ onClose }: RecoverySeedPhraseProps) => {
  const componentId = "recovery-seed-phrase";
  const dispatch = useAppDispatch();
  const [seedPhrase, setSeedPhrase] = useState<string[]>(Array(18).fill(""));
  const [hideSeedPhrase, setHideSeedPhrase] = useState(true);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);

  const footerButtonLabel = hideSeedPhrase
    ? i18n.t(
      "tabs.menu.tab.settings.sections.security.seedphrase.page.button.view"
    )
    : i18n.t(
      "tabs.menu.tab.settings.sections.security.seedphrase.page.button.hide"
    );

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
              {i18n.t(
                "tabs.menu.tab.settings.sections.security.seedphrase.page.tips.label"
              )}
            </p>
            <ol className="tips">
              <li>
                {i18n.t(
                  "tabs.menu.tab.settings.sections.security.seedphrase.page.tips.one"
                )}
              </li>
              <li>
                {i18n.t(
                  "tabs.menu.tab.settings.sections.security.seedphrase.page.tips.two"
                )}
              </li>
              <li>
                {i18n.t(
                  "tabs.menu.tab.settings.sections.security.seedphrase.page.tips.three"
                )}
              </li>
            </ol>
          </div>
        </InfoCard>
        <SeedPhraseModule
          testId="seed-phrase-container"
          seedPhrase={seedPhrase}
          overlayText={`${i18n.t(
            "tabs.menu.tab.settings.sections.security.seedphrase.page.hiddentext"
          )}`}
          hideSeedPhrase={hideSeedPhrase}
          setHideSeedPhrase={setHideSeedPhrase}
          showSeedPhraseButton={false}
        />
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
    </>
  );
};

export { RecoverySeedPhrase };
