import { IonCheckbox, IonItem, IonList } from "@ionic/react";
import { useCallback, useState } from "react";
import { i18n } from "../../../../../../../i18n";
import { OptionModal } from "../../../../../../components/OptionsModal";
import { PageFooter } from "../../../../../../components/PageFooter";
import { Verification } from "../../../../../../components/Verification";
import "./RecoverySeedPhrase.scss";
import {
  ConditionItemProps,
  ConfirmModalProps,
} from "./RecoverySeedPhrase.types";

const ConditionItem = ({
  text,
  index,
  checked,
  onClick,
}: ConditionItemProps) => {
  return (
    <IonItem
      data-testid={`condition-item-${index}`}
      className="condition-item"
      onClick={(e) => {
        e.stopPropagation();
        onClick(index);
      }}
    >
      <div className="text">
        <p data-testid={`condition-title-${index}`}>{text}</p>
      </div>
      <IonCheckbox
        checked={checked}
        aria-label=""
        className="checkbox"
        slot="end"
        data-testid={`condition-select-${index}`}
      />
    </IonItem>
  );
};

const ConfirmModal = ({
  isOpen,
  setIsOpen,
  onShowPhrase: onVerify,
}: ConfirmModalProps) => {
  const [confirmCondition, setConfirmCondition] = useState([
    false,
    false,
    false,
  ]);
  const [verifyIsOpen, setVerifyIsOpen] = useState(false);
  const isAcceptAll = confirmCondition.every((item) => item);

  const resetModal = useCallback(() => {
    setConfirmCondition([false, false, false]);
    setIsOpen(false);
  }, [setIsOpen]);

  const onConditionClick = (index: number) => {
    confirmCondition[index] = !confirmCondition[index];
    setConfirmCondition([...confirmCondition]);
  };

  const headerOptions = {
    closeButton: true,
    closeButtonLabel: `${i18n.t(
      "tabs.menu.tab.settings.sections.security.seedphrase.page.confirmmodal.button.cancel"
    )}`,
    closeButtonAction: resetModal,
    title: `${i18n.t(
      "tabs.menu.tab.settings.sections.security.seedphrase.page.confirmmodal.title"
    )}`,
  };

  const handleAuthentication = () => {
    setIsOpen(false);
    setVerifyIsOpen(true);
  };

  return (
    <>
      <OptionModal
        modalIsOpen={isOpen}
        componentId="confirm-view-seedpharse"
        customClasses="confirm-view-seedpharse"
        onDismiss={resetModal}
        header={headerOptions}
      >
        <p className="subtitle">
          {i18n.t(
            "tabs.menu.tab.settings.sections.security.seedphrase.page.confirmmodal.subtitle"
          )}
        </p>
        <IonList>
          <ConditionItem
            text={i18n.t(
              "tabs.menu.tab.settings.sections.security.seedphrase.page.confirmmodal.firstcondition"
            )}
            index={0}
            checked={confirmCondition[0]}
            onClick={onConditionClick}
          />
          <ConditionItem
            text={i18n.t(
              "tabs.menu.tab.settings.sections.security.seedphrase.page.confirmmodal.secondcondition"
            )}
            index={1}
            checked={confirmCondition[1]}
            onClick={onConditionClick}
          />
          <ConditionItem
            text={i18n.t(
              "tabs.menu.tab.settings.sections.security.seedphrase.page.confirmmodal.thirdcondition"
            )}
            index={2}
            checked={confirmCondition[2]}
            onClick={onConditionClick}
          />
        </IonList>
        <PageFooter
          pageId="confirm-view-seedpharse"
          primaryButtonText={`${i18n.t(
            "tabs.menu.tab.settings.sections.security.seedphrase.page.confirmmodal.button.confirm"
          )}`}
          primaryButtonAction={handleAuthentication}
          primaryButtonDisabled={!isAcceptAll}
        />
      </OptionModal>
      <Verification
        verifyIsOpen={verifyIsOpen}
        setVerifyIsOpen={setVerifyIsOpen}
        onVerify={onVerify}
      />
    </>
  );
};

export { ConfirmModal };
