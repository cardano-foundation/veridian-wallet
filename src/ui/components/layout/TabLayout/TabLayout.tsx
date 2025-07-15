import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonViewDidEnter,
  useIonViewDidLeave,
} from "@ionic/react";
import { arrowBackOutline } from "ionicons/icons";
import "./TabLayout.scss";
import { useCallback, useState } from "react";
import { TabLayoutProps } from "./TabLayout.types";
import { useIonHardwareBackButton } from "../../../hooks";
import { BackEventPriorityType } from "../../../globals/types";

const TabLayout = ({
  pageId,
  customClass,
  header,
  backButton,
  backButtonAction,
  title,
  doneLabel,
  doneAction,
  additionalButtons,
  actionButton,
  actionButtonAction,
  actionButtonLabel,
  children,
  placeholder,
  hardwareBackButtonConfig,
  headerCustomContent,
}: TabLayoutProps) => {
  const [isActive, setIsActive] = useState(false);

  useIonViewDidEnter(() => {
    setIsActive(true);
  });

  useIonViewDidLeave(() => {
    setIsActive(false);
  });

  const handleHardwareBackButtonClick = useCallback(
    (processNext: () => void) => {
      if (hardwareBackButtonConfig?.handler) {
        hardwareBackButtonConfig.handler(processNext);
        return;
      }

      if (backButton && backButtonAction) {
        backButtonAction?.();
        return;
      }

      if (doneLabel && doneAction) {
        doneAction?.();
        return;
      }
    },
    [
      hardwareBackButtonConfig,
      backButton,
      backButtonAction,
      doneLabel,
      doneAction,
    ]
  );

  useIonHardwareBackButton(
    hardwareBackButtonConfig?.priority || BackEventPriorityType.Tab,
    handleHardwareBackButtonClick,
    hardwareBackButtonConfig?.prevent
  );

  return (
    <IonPage
      className={`tab-layout ${pageId} ${
        !isActive ? " " + "ion-hide hidden" : "visible"
      } ${customClass ? " " + customClass : ""}`}
      data-testid={pageId}
      id={pageId}
    >
      {header && (
        <div className="connections-header-area">
          <IonHeader
            data-testid={`${pageId}-tab-header`}
            className="ion-no-border tab-header"
          >
            <IonToolbar
              color="transparent"
              className={`tab-title ${backButton ? "has-back-button" : ""}`}
            >
              {backButton && backButtonAction && (
                <IonButtons
                  slot="start"
                  className="back-button"
                  data-testid="tab-back-button"
                  onClick={backButtonAction}
                >
                  <IonIcon
                    icon={arrowBackOutline}
                    color="primary"
                  />
                </IonButtons>
              )}

              {doneLabel && doneAction && (
                <IonTitle
                  onClick={doneAction}
                  data-testid="tab-done-button"
                >
                  <h4 data-testid="tab-done-label">{doneLabel}</h4>
                </IonTitle>
              )}

              {title && (
                <IonTitle data-testid={`tab-title-${title.toLowerCase()}`}>
                  <h2>{title}</h2>
                </IonTitle>
              )}

              <IonButtons slot="end">
                {additionalButtons}

                {actionButton && actionButtonLabel && (
                  <IonButton
                    className="action-button-label"
                    onClick={actionButtonAction}
                    data-testid="action-button"
                  >
                    {actionButtonLabel}
                  </IonButton>
                )}
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          {headerCustomContent}
        </div>
      )}
      {placeholder || (
        <IonContent
          id={pageId}
          className="tab-content"
          color="transparent"
        >
          {children}
        </IonContent>
      )}
    </IonPage>
  );
};

export { TabLayout };
