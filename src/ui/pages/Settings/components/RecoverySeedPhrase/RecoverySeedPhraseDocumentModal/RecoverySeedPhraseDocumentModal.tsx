import { IonModal } from "@ionic/react";
import { i18n } from "../../../../../../i18n";
import Image from "../../../../../assets/images/SeedPhraseDocs.png";
import { InfoCard } from "../../../../../components/InfoCard";
import { ScrollablePageLayout } from "../../../../../components/layout/ScrollablePageLayout";
import { PageHeader } from "../../../../../components/PageHeader";
import { DocumentSection } from "./DocumentSection";
import "./RecoverySeedPhraseDocumentModal.scss";
import { RecoverySeedPhraseDocumentModalProps } from "./RecoverySeedPhraseDocumentModal.types";

const RecoverySeedPhraseDocumentModal = ({
  isOpen,
  setIsOpen,
}: RecoverySeedPhraseDocumentModalProps) => {
  return (
    <IonModal
      isOpen={isOpen}
      className="recovery-seedphrase-docs-modal"
      data-testid="recovery-seedphrase-docs-modal"
      onDidDismiss={() => setIsOpen(false)}
    >
      <ScrollablePageLayout
        pageId="recovery-seedphrase-docs-modal-content"
        header={
          <PageHeader
            closeButton={true}
            closeButtonLabel={`${i18n.t(
              "generateseedphrase.onboarding.recoveryseedphrasedocs.button.done"
            )}`}
            closeButtonAction={() => setIsOpen(false)}
            title={`${i18n.t(
              "generateseedphrase.onboarding.recoveryseedphrasedocs.title"
            )}`}
          />
        }
      >
        <InfoCard
          danger
          content={i18n.t(
            "generateseedphrase.onboarding.recoveryseedphrasedocs.alert"
          )}
        />
        <DocumentSection
          sectionKey="what"
          image={Image}
        />
        <DocumentSection sectionKey="why" />
        <DocumentSection sectionKey="how" />
      </ScrollablePageLayout>
    </IonModal>
  );
};

export { RecoverySeedPhraseDocumentModal };
