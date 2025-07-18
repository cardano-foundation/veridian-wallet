import { i18n } from "../../../i18n";
import { InfoCard } from "../InfoCard";
import { ResponsivePageLayout } from "../layout/ResponsivePageLayout";
import "./CloudError.scss";
import { CloudErrorProps } from "./CloudError.types";

const CloudError = ({ pageId, header, children }: CloudErrorProps) => {
  const getMessage = (pageId: string) => {
    switch (pageId) {
      case "identifier-card-details":
        return i18n.t("profiledetails.clouderror");
      case "credential-card-details":
        return i18n.t("tabs.credentials.details.clouderror");
      case "connection-details":
        return i18n.t("tabs.connections.details.clouderror");
      default:
        return "";
    }
  };

  return (
    <ResponsivePageLayout
      pageId={`${pageId}-cloud-error`}
      header={header}
      activeStatus={true}
      customClass={"cloud-error"}
    >
      <InfoCard content={getMessage(pageId)} />
      {children}
    </ResponsivePageLayout>
  );
};

export { CloudError };
