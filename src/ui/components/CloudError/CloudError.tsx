import { i18n } from "../../../i18n";
import { InfoCard } from "../InfoCard";
import { ResponsivePageLayout } from "../layout/ResponsivePageLayout";
import "./CloudError.scss";
import { CloudErrorProps } from "./CloudError.types";

const CloudError = ({
  pageId,
  header,
  children,
  content,
  type = "error",
}: CloudErrorProps) => {
  const getMessage = (pageId: string) => {
    if (content) return content;

    switch (pageId) {
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
      customClass="cloud-error"
    >
      <InfoCard
        danger={type === "error"}
        content={getMessage(pageId)}
      />
      {children}
    </ResponsivePageLayout>
  );
};

export { CloudError };
