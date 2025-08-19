import { IonModal } from "@ionic/react";
import { i18n } from "../../../../../i18n";
import { ScrollablePageLayout } from "../../../layout/ScrollablePageLayout";
import { PageHeader } from "../../../PageHeader";
import "./AIDTypeInfoModal.scss";
import { IADTypeInfoModalProps } from "./IADTypeInfoModal.types";

const IADTypeInfoModal = ({ isOpen, setOpen }: IADTypeInfoModalProps) => {
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <IonModal
      data-testid="aid-info-modal"
      isOpen={isOpen}
      onDidDismiss={handleClose}
    >
      <ScrollablePageLayout
        pageId="aid-info-modal"
        activeStatus={isOpen}
        header={
          <PageHeader
            closeButton={true}
            title={`${i18n.t("setupgroupprofile.aidinfo.title")}`}
            closeButtonAction={handleClose}
            closeButtonLabel={`${i18n.t(
              "setupgroupprofile.aidinfo.button.done"
            )}`}
          />
        }
      >
        <p className="paragraph-top">
          {i18n.t("setupgroupprofile.aidinfo.text")}
        </p>
        <h2>{i18n.t("setupgroupprofile.aidinfo.individual.label")}</h2>
        <p>{i18n.t("setupgroupprofile.aidinfo.individual.text")}</p>
        <h2>{i18n.t("setupgroupprofile.aidinfo.group.label")}</h2>
        <p>{i18n.t("setupgroupprofile.aidinfo.group.text")}</p>
        <h2>{i18n.t("setupgroupprofile.aidinfo.delegated.label")}</h2>
        <p>{i18n.t("setupgroupprofile.aidinfo.delegated.text")}</p>
      </ScrollablePageLayout>
    </IonModal>
  );
};

export { IADTypeInfoModal };
