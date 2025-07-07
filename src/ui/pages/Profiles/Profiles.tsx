import { useCallback, useState } from "react";
import { IonModal } from "@ionic/react";
import { i18n } from "../../../i18n";
import "./Profiles.scss";
import { ScrollablePageLayout } from "../../components/layout/ScrollablePageLayout";
import { PageHeader } from "../../components/PageHeader";
import { ProfilesProps } from "./Profiles.types";
import { PageFooter } from "../../components/PageFooter";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { getStateCache } from "../../../store/reducers/stateCache";

const Profiles = ({ isOpen, setIsOpen }: ProfilesProps) => {
  const componentId = "profiles";
  const dispatch = useAppDispatch();
  const stateCache = useAppSelector(getStateCache);
  const defaultProfile = stateCache.authentication.defaultProfile;

  const handleClose = () => {
    setIsOpen(false);
  };
  const handleOpenSettings = () => {
    // TODO: Implement the logic to open settings
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
        header={
          <PageHeader
            closeButton={true}
            closeButtonAction={handleClose}
            closeButtonLabel={`${i18n.t("profiles.cancel")}`}
            title={`${i18n.t("profiles.title")}`}
          />
        }
        footer={
          <PageFooter
            pageId={componentId}
            tertiaryButtonText={`${i18n.t("profiles.options.settings")}`}
            tertiaryButtonAction={handleOpenSettings}
          />
        }
      >
        <div className="profiles__selected-profile">{defaultProfile}</div>
        <div className="profiles__list"></div>
        <div className="profiles__options"></div>
      </ScrollablePageLayout>
    </IonModal>
  );
};

export { Profiles };
