import { IonModal } from "@ionic/react";
import { informationCircleOutline } from "ionicons/icons";
import { ScrollablePageLayout } from "../../../../components/layout/ScrollablePageLayout";
import { PageHeader } from "../../../../components/PageHeader";
import { i18n } from "../../../../../i18n";
import { ScanToLoginProps } from "./ScanToLogin.types";
import { InfoCard } from "../../../../components/InfoCard";
import "./ScanToLogin.scss";

const ScanToLogin = ({ isOpen, setIsOpen }: ScanToLoginProps) => {
  const componentId = "scan-to-login";

  const handleClose = () => {
    setIsOpen(false);
  };
  return (
    <IonModal
      className={`${componentId}-modal`}
      data-testid={componentId}
      isOpen={isOpen}
      onDidDismiss={handleClose}
    >
      <ScrollablePageLayout
        pageId={componentId}
        activeStatus={isOpen}
        header={
          <PageHeader
            closeButton={true}
            closeButtonAction={handleClose}
            closeButtonLabel={`${i18n.t("tabs.home.tab.modals.scan.close")}`}
            title={`${i18n.t("tabs.home.tab.modals.scan.title")}`}
          />
        }
      >
        <InfoCard
          content={i18n.t("tabs.home.tab.modals.scan.warning")}
          icon={informationCircleOutline}
        />
        <h2>{i18n.t("tabs.home.tab.modals.scan.content.title")}</h2>
        {(() => {
          const desc = String(
            i18n.t("tabs.home.tab.modals.scan.content.description")
          );
          const paragraphs = desc
            .split(/\r?\n\r?\n+/)
            .map((p) => p.trim())
            .filter(Boolean);

          return paragraphs.map((p, i) => <p key={`scan-desc-${i}`}>{p}</p>);
        })()}
      </ScrollablePageLayout>
    </IonModal>
  );
};
export { ScanToLogin };
