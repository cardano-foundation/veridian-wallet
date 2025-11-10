import { IonCheckbox, IonContent, IonModal } from "@ionic/react";
import { useState } from "react";
import { CreationStatus } from "../../../core/agent/agent.types";
import { IdentifierShortDetails } from "../../../core/agent/services/identifier.types";
import { i18n } from "../../../i18n";
import { useAppSelector } from "../../../store/hooks";
import { CardItem, CardList } from "../CardList";
import { PageFooter } from "../PageFooter";
import { PageHeader } from "../PageHeader";
import { ResponsivePageLayout } from "../layout/ResponsivePageLayout";
import "./IdentifierSelectorModal.scss";
import { IdentifierSelectorProps } from "./IdentifierSelectorModal.types";
import { getProfiles } from "../../../store/reducers/profileCache";

const IdentifierSelectorModal = ({
  open,
  setOpen,
  onSubmit,
  identifiers,
}: IdentifierSelectorProps) => {
  const profiles = useAppSelector(getProfiles);

  const [selectedIdentifier, setSelectedIdentifier] =
    useState<IdentifierShortDetails | null>(null);

  const displayIdentifiers = (() => {
    const result = identifiers
      ? identifiers
      : Object.values(profiles)
          .filter(
            (item) => item.identity.creationStatus === CreationStatus.COMPLETE
          )
          .filter((item) => !item.identity.groupMetadata?.groupId)
          .map((item) => item.identity);

    return result.map(
      (identifier): CardItem<IdentifierShortDetails> => ({
        id: identifier.id,
        title: identifier.displayName,
        data: identifier,
      })
    );
  })();

  const handleSelectIdentifier = (data: IdentifierShortDetails) => {
    setSelectedIdentifier(selectedIdentifier?.id === data.id ? null : data);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleConnectWallet = async () => {
    if (!selectedIdentifier) return;
    handleClose();
    onSubmit(selectedIdentifier);
    setSelectedIdentifier(null);
  };

  return (
    <IonModal
      isOpen={open}
      onDidDismiss={handleClose}
      className="identifier-selector-modal"
    >
      <ResponsivePageLayout
        pageId="connection-identifier-selector"
        activeStatus={open}
        header={
          <PageHeader
            title={`${i18n.t(
              "tabs.connections.tab.indentifierselector.title"
            )}`}
            closeButton
            closeButtonLabel={`${i18n.t(
              "tabs.connections.tab.indentifierselector.button.cancel"
            )}`}
            closeButtonAction={handleClose}
            hardwareBackButtonConfig={{
              prevent: !open,
            }}
          />
        }
      >
        <h2 className="title">
          {i18n.t("tabs.connections.tab.indentifierselector.message")}
        </h2>
        <IonContent className="identifier-list">
          <CardList
            data={displayIdentifiers}
            onCardClick={(data, e) => {
              e.stopPropagation();
            }}
            onRenderEndSlot={(data) => {
              return (
                <IonCheckbox
                  checked={selectedIdentifier?.id === data.id}
                  aria-label=""
                  className="checkbox"
                  data-testid={`identifier-select-${data.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectIdentifier(data);
                  }}
                />
              );
            }}
          />
        </IonContent>
        <PageFooter
          primaryButtonText={`${i18n.t(
            "tabs.connections.tab.indentifierselector.button.confirm"
          )}`}
          primaryButtonAction={handleConnectWallet}
          primaryButtonDisabled={!selectedIdentifier}
        />
      </ResponsivePageLayout>
    </IonModal>
  );
};

export { IdentifierSelectorModal };
