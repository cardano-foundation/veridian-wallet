import { ScrollablePageLayout } from "../layout/ScrollablePageLayout";
import { PageHeader } from "../PageHeader";
import { SideSlider } from "../SideSlider";
import "./SettingsTemplate.scss";

interface SettingsTemplateProps {
  show: boolean;
  setShow: (value: boolean) => void;
  title: string;
  children: React.ReactNode;
}

export const SettingsTemplate = ({
  show,
  setShow,
  title,
  children,
}: SettingsTemplateProps) => {
  const handleClose = () => {
    setShow(false);
  };

  return (
    <SideSlider
      renderAsModal={true}
      isOpen={show}
    >
      <ScrollablePageLayout
        pageId="settings-template"
        activeStatus={show}
        header={
          <PageHeader
            backButton={true}
            onBack={handleClose}
            title={title}
          />
        }
      >
        <div
          className={`${title
            ?.toLowerCase()
            .replace(" ", "-")}-content settings-content`}
          data-testid={`${title?.toLowerCase().replace(" ", "-")}-content`}
        >
          {children}
        </div>
      </ScrollablePageLayout>
    </SideSlider>
  );
};
