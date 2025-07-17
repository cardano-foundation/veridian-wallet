import { arrowBackOutline } from "ionicons/icons";
import { useCallback, useMemo } from "react";
import { ScrollablePageLayout } from "../../../../components/layout/ScrollablePageLayout";
import { PageHeader } from "../../../../components/PageHeader";
import { SideSlider } from "../../../../components/SideSlider";
import "./SubMenu.scss";
import { SubMenuProps } from "./SubMenu.types";

const SubMenu = ({
  showSubMenu,
  setShowSubMenu,
  switchView,
  nestedMenu,
  closeButtonLabel,
  closeButtonAction,
  title,
  additionalButtons,
  actionButton,
  actionButtonAction,
  actionButtonLabel,
  children,
  pageId: customPageId,
  renderAsModal = true,
}: SubMenuProps) => {
  const pageId = `sub-menu ${customPageId}`;
  const handleClose = useCallback(() => {
    setShowSubMenu(false);
  }, [setShowSubMenu]);

  const hardwareBackButtonConfig = useMemo(
    () => ({
      prevent: !showSubMenu,
    }),
    [showSubMenu]
  );

  return (
    <SideSlider
      renderAsModal={renderAsModal}
      isOpen={showSubMenu}
    >
      <ScrollablePageLayout
        pageId={pageId}
        activeStatus={showSubMenu}
        header={
          <PageHeader
            closeButton={true}
            closeButtonLabel={closeButtonLabel}
            closeButtonAction={closeButtonAction || handleClose}
            closeButtonIcon={closeButtonLabel || arrowBackOutline}
            title={title}
            additionalButtons={additionalButtons}
            actionButton={actionButton}
            actionButtonAction={actionButtonAction}
            actionButtonLabel={actionButtonLabel}
            hardwareBackButtonConfig={hardwareBackButtonConfig}
          />
        }
      >
        <div
          className={
            `${title?.toLowerCase().replace(" ", "-")}-content` +
            `${nestedMenu ? " nested-content" : ""}`
          }
          data-testid={`${title?.toLowerCase().replace(" ", "-")}-content`}
        >
          {children}
        </div>
      </ScrollablePageLayout>
    </SideSlider>
  );
};

export { SubMenu };
