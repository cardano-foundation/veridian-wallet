import { IonCheckbox, IonModal } from "@ionic/react";
import { useState } from "react";
import { Trans } from "react-i18next";
import { Agent } from "../../../core/agent/agent";
import { MiscRecordId } from "../../../core/agent/agent.types";
import { BasicRecord } from "../../../core/agent/records";
import { KeyStoreKeys, SecureStorage } from "../../../core/storage";
import { i18n } from "../../../i18n";
import { RoutePath } from "../../../routes";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { setSeedPhraseCache } from "../../../store/reducers/seedPhraseCache";
import {
  getAuthentication,
  setAuthentication,
  setCurrentRoute,
} from "../../../store/reducers/stateCache";
import { useAppIonRouter } from "../../hooks";
import { showError } from "../../utils/error";
import { CardDetailsBlock } from "../CardDetails";
import { ScrollablePageLayout } from "../layout/ScrollablePageLayout";
import { PageFooter } from "../PageFooter";
import { PageHeader } from "../PageHeader";
import "./SwitchOnboardingModeModal.scss";
import {
  OnboardingMode,
  SwitchOnboardingModeModalProps,
} from "./SwitchOnboardingModeModal.types";

const SwitchOnboardingModeModal = ({
  mode,
  isOpen,
  setOpen,
}: SwitchOnboardingModeModalProps) => {
  const dispatch = useAppDispatch();
  const authentication = useAppSelector(getAuthentication);
  const [agree, setAgree] = useState(false);
  const ionRouter = useAppIonRouter();

  const isCreateMode = mode === OnboardingMode.Create;

  const handleContinue = async () => {
    try {
      const action = isCreateMode
        ? Agent.agent.basicStorage.deleteById(MiscRecordId.APP_RECOVERY_WALLET)
        : Agent.agent.basicStorage.createOrUpdateBasicRecord(
            new BasicRecord({
              id: MiscRecordId.APP_RECOVERY_WALLET,
              content: {
                value: String(true),
              },
            })
          );

      await Promise.all([
        SecureStorage.delete(KeyStoreKeys.SIGNIFY_BRAN),
        action,
      ]);

      dispatch(
        setAuthentication({
          ...authentication,
          recoveryWalletProgress: !isCreateMode,
        })
      );

      dispatch(
        setSeedPhraseCache({
          bran: "",
          seedPhrase: "",
        })
      );

      const nextPath = isCreateMode
        ? RoutePath.SSI_AGENT
        : RoutePath.VERIFY_RECOVERY_SEED_PHRASE;

      dispatch(setCurrentRoute({ path: nextPath }));
      ionRouter.push(nextPath);
      setOpen(false);
    } catch (e) {
      showError("Unable to switch onboarding mode", e, dispatch);
    }
  };

  return (
    <IonModal
      isOpen={isOpen}
      className="switch-modal"
      data-testid="switch-modal"
      onDidDismiss={() => setOpen(false)}
    >
      <ScrollablePageLayout
        pageId="switch-modal-content"
        header={
          <PageHeader
            closeButton={true}
            closeButtonLabel={`${i18n.t("switchmodemodal.button.back")}`}
            closeButtonAction={() => setOpen(false)}
            title={`${i18n.t("switchmodemodal.title")}`}
          />
        }
        footer={
          <PageFooter
            pageId="switch-modal"
            primaryButtonText={`${i18n.t("switchmodemodal.button.continue")}`}
            primaryButtonAction={() => handleContinue()}
            primaryButtonDisabled={!agree}
          >
            <div className="confirm">
              <IonCheckbox
                labelPlacement="end"
                data-testid="confirm-checkbox"
                className="confirm-checkbox"
                checked={agree}
                onIonChange={(event) => setAgree(event.detail.checked)}
              />
              <p>{i18n.t("switchmodemodal.checkbox")}</p>
            </div>
          </PageFooter>
        }
      >
        <h3 className="title">{i18n.t(`switchmodemodal.${mode}.title`)}</h3>
        <p className="paragraph-top">
          {i18n.t(`switchmodemodal.${mode}.paragraphtop`)}
        </p>
        <CardDetailsBlock className="warning">
          <ol>
            <li>
              <Trans>{i18n.t(`switchmodemodal.${mode}.warning.one`)}</Trans>
            </li>
            <li>
              <Trans>{i18n.t(`switchmodemodal.${mode}.warning.two`)}</Trans>
            </li>
            <li>
              <Trans>{i18n.t(`switchmodemodal.${mode}.warning.three`)}</Trans>
            </li>
          </ol>
        </CardDetailsBlock>
        <p className="paragraph-bottom">
          {i18n.t(`switchmodemodal.${mode}.paragraphbot`)}
        </p>
      </ScrollablePageLayout>
    </IonModal>
  );
};

export { SwitchOnboardingModeModal };
