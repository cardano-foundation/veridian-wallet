import { useRef } from "react";
import { i18n } from "../../../i18n";
import { BackEventPriorityType } from "../../globals/types";
import { PageHeader } from "../PageHeader";
import {
  RecoverySeedPhraseModule,
  RecoverySeedPhraseModuleRef,
} from "../RecoverySeedPhraseModule";
import { ScrollablePageLayout } from "../layout/ScrollablePageLayout";
import "./ForgotAuthInfo.scss";
import { ForgotType, VerifySeedPhraseProps } from "./ForgotAuthInfo.types";

const VerifySeedPhrase = ({
  type,
  overrideAlertZIndex,
  onVerifySuccess,
  onCancel,
}: VerifySeedPhraseProps) => {
  const pageId = "forgot-auth-info-modal";
  const recoverySeedId = "forgot-auth-info";

  const ref = useRef<RecoverySeedPhraseModuleRef>(null);

  const handleClearState = () => {
    ref.current?.clearState();
  };

  const handleAfterVerifySeedPhrase = () => {
    onVerifySuccess();
  };

  const handleClose = () => {
    handleClearState();
    onCancel();
  };

  const pageTitle = (() => {
    return type === ForgotType.Passcode
      ? "forgotauth.passcode.title"
      : "forgotauth.password.title";
  })();

  const seedPhraseDescription =
    type === ForgotType.Passcode
      ? "forgotauth.passcode.description"
      : "forgotauth.password.description";

  return (
    <ScrollablePageLayout
      pageId={pageId}
      activeStatus
      header={
        <PageHeader
          closeButton={true}
          closeButtonLabel={`${i18n.t("forgotauth.cancel")}`}
          closeButtonAction={handleClose}
          title={`${i18n.t(pageTitle)}`}
          hardwareBackButtonConfig={{
            prevent: false,
            priority: BackEventPriorityType.Modal,
          }}
        />
      }
    >
      <RecoverySeedPhraseModule
        description={`${i18n.t(seedPhraseDescription)}`}
        ref={ref}
        testId={recoverySeedId}
        onVerifySuccess={handleAfterVerifySeedPhrase}
        overrideAlertZIndex={overrideAlertZIndex}
      />
    </ScrollablePageLayout>
  );
};

export { VerifySeedPhrase };
