import { IonButton, IonIcon } from "@ionic/react";
import { addOutline, openOutline, refreshOutline } from "ionicons/icons";
import { useState } from "react";
import { i18n } from "../../../../i18n";
import { RoutePath } from "../../../../routes";
import { useAppSelector } from "../../../../store/hooks";
import { getAuthentication } from "../../../../store/reducers/stateCache";
import { ScrollablePageLayout } from "../../../components/layout/ScrollablePageLayout";
import { PageFooter } from "../../../components/PageFooter";
import { PageHeader } from "../../../components/PageHeader";
import { SwitchOnboardingModeModal } from "../../../components/SwitchOnboardingModeModal";
import { OnboardingMode } from "../../../components/SwitchOnboardingModeModal/SwitchOnboardingModeModal.types";
import {
  ONBOARDING_DOCUMENTATION_LINK,
  RECOVERY_DOCUMENTATION_LINK,
} from "../../../globals/constants";
import { openBrowserLink } from "../../../utils/openBrowserLink";
import { ConnectProps } from "../CreateSSIAgent.types";

const Connect = ({ onConnect }: ConnectProps) => {
  const pageId = "ssi-agent-summary";
  const authentication = useAppSelector(getAuthentication);
  const [showSwitchModeModal, setSwitchModeModal] = useState(false);

  const isRecoveryMode = authentication.recoveryWalletProgress;

  const handleOpenUrl = () => {
    openBrowserLink(
      isRecoveryMode
        ? RECOVERY_DOCUMENTATION_LINK
        : ONBOARDING_DOCUMENTATION_LINK
    );
  };

  const mode = isRecoveryMode ? OnboardingMode.Create : OnboardingMode.Recovery;

  const buttonLabel = !isRecoveryMode
    ? i18n.t("generateseedphrase.onboarding.button.switch")
    : i18n.t("verifyrecoveryseedphrase.button.switch");

  return (
    <>
      <ScrollablePageLayout
        pageId={pageId}
        header={
          <PageHeader
            currentPath={RoutePath.SSI_AGENT}
            progressBar={true}
            progressBarValue={1}
            progressBarBuffer={1}
          />
        }
        footer={
          <PageFooter
            pageId={pageId}
            primaryButtonText={`${i18n.t(
              "ssiagent.connect.buttons.connected"
            )}`}
            primaryButtonAction={onConnect}
            tertiaryButtonText={buttonLabel}
            tertiaryButtonAction={() => setSwitchModeModal(true)}
            tertiaryButtonIcon={isRecoveryMode ? addOutline : refreshOutline}
          />
        }
      >
        <h2
          className="title"
          data-testid={`${pageId}-title`}
        >
          {i18n.t("ssiagent.connect.title")}
        </h2>
        <p
          className="page-paragraph"
          data-testid={`${pageId}-top-paragraph`}
        >
          {i18n.t("ssiagent.connect.description")}
        </p>
        <p
          className="second-page-paragraph"
          data-testid={`${pageId}-top-paragraph`}
        >
          {i18n.t("ssiagent.connect.seconddescription")}
        </p>
        <IonButton
          onClick={handleOpenUrl}
          fill="outline"
          data-testid="open-ssi-documentation-button"
          className="open-ssi-documentation-button secondary-button"
        >
          <IonIcon
            slot="end"
            icon={openOutline}
          />
          {`${i18n.t("ssiagent.connect.buttons.onboardingdocumentation")}`}
        </IonButton>
        <p
          className="third-page-paragraph"
          data-testid={`${pageId}-top-paragraph`}
        >
          {i18n.t("ssiagent.connect.bottomdescription")}
        </p>
      </ScrollablePageLayout>
      <SwitchOnboardingModeModal
        mode={mode}
        isOpen={showSwitchModeModal}
        setOpen={setSwitchModeModal}
      />
    </>
  );
};

export { Connect };
