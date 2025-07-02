import { i18n } from "../../../i18n";
import { RoutePath } from "../../../routes";
import { ScrollablePageLayout } from "../../components/layout/ScrollablePageLayout";
import { PageHeader } from "../../components/PageHeader";
import { useAppIonRouter } from "../../hooks";
import "./Profiles.scss";

const Profiles = () => {
  const pageId = "profiles";
  const ionRouter = useAppIonRouter();

  const handleBack = () => {
    ionRouter.goBack();
  };
  return (
    <ScrollablePageLayout
      pageId={pageId}
      header={
        <PageHeader
          currentPath={RoutePath.PROFILES}
          closeButton={true}
          closeButtonAction={handleBack}
          closeButtonLabel={`${i18n.t("profiles.cancel")}`}
          title={`${i18n.t("profiles.title")}`}
        />
      }
    ></ScrollablePageLayout>
  );
};
export { Profiles };
