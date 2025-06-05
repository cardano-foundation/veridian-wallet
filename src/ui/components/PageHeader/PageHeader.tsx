import {
  IonButton,
  IonButtons,
  IonHeader,
  IonIcon,
  IonProgressBar,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { arrowBackOutline, closeOutline } from "ionicons/icons";
import { useCallback, useRef } from "react";
import { PageHeaderProps } from "./PageHeader.types";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { getStateCache } from "../../../store/reducers/stateCache";
import { updateReduxState } from "../../../store/utils";
import { getBackRoute } from "../../../routes/backRoute";
import "./PageHeader.scss";
import { useAppIonRouter, useIonHardwareBackButton } from "../../hooks";
import { BackEventPriorityType } from "../../globals/types";
import { combineClassNames } from "../../utils/style";
import { useSwipeBack } from "../../hooks/swipeBackHook";

const PageHeader = ({
  backButton,
  beforeBack,
  onBack,
  currentPath,
  closeButton,
  closeButtonAction,
  closeButtonLabel,
  closeButtonIcon,
  actionButton,
  actionButtonDisabled,
  actionButtonAction,
  actionButtonLabel,
  actionButtonIcon,
  progressBar,
  progressBarValue,
  progressBarBuffer,
  title,
  additionalButtons,
  hardwareBackButtonConfig,
}: PageHeaderProps) => {
  const ionRouter = useAppIonRouter();
  const dispatch = useAppDispatch();
  const stateCache = useAppSelector(getStateCache);
  const hasLeftButton = !!(backButton || closeButton);
  const hasContent =
    hasLeftButton || !!actionButton || !!progressBar || !!title;

  const headerRef = useRef<never | null>(null);

  const handleOnBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      if (beforeBack) {
        beforeBack();
      }
      if (backButton && currentPath) {
        const { backPath, updateRedux } = getBackRoute(currentPath, {
          store: { stateCache },
        });

        updateReduxState(
          backPath.pathname,
          { store: { stateCache } },
          dispatch,
          updateRedux
        );
        ionRouter.push(backPath.pathname, "back", "pop");
      }
    }
  }, [
    onBack,
    beforeBack,
    backButton,
    currentPath,
    stateCache,
    ionRouter,
    dispatch,
  ]);

  const handleHardwareBackButtonClick = useCallback(
    (processNextHandler?: () => void) => {
      if (hardwareBackButtonConfig?.handler) {
        hardwareBackButtonConfig?.handler(processNextHandler);
        return;
      }

      if (closeButton && closeButtonAction) {
        closeButtonAction();
        return;
      }

      handleOnBack();
    },
    [hardwareBackButtonConfig, closeButtonAction, closeButton, handleOnBack]
  );

  useIonHardwareBackButton(
    hardwareBackButtonConfig?.priority || BackEventPriorityType.Page,
    handleHardwareBackButtonClick,
    hardwareBackButtonConfig?.prevent
  );

  const canStart = useCallback(() => {
    return !hardwareBackButtonConfig || !hardwareBackButtonConfig.prevent;
  }, [hardwareBackButtonConfig]);

  const getSwiperEl = useCallback(() => {
    if (!headerRef.current) return null;

    return (headerRef.current as HTMLElement).closest(
      ".ion-page"
    ) as HTMLElement;
  }, []);

  const onSwipeEnd = useCallback(
    (shouldComplete: boolean) => {
      if (shouldComplete) {
        handleHardwareBackButtonClick();
      }
    },
    [handleHardwareBackButtonClick]
  );

  useSwipeBack(getSwiperEl, canStart, onSwipeEnd);

  const hasAction = backButton || closeButton || actionButton;

  const actionButtonClasses = combineClassNames({
    "has-action": !!hasAction,
    "has-progressbar": !!progressBar,
  });

  return (
    <IonHeader
      className={`ion-no-border page-header ${
        hasContent ? "show-header" : "hide-header"
      }`}
      ref={headerRef}
    >
      <IonToolbar>
        <IonButtons
          className={hasAction ? "has-action" : undefined}
          slot="start"
        >
          {backButton && (
            <IonButton
              slot="icon-only"
              fill="clear"
              onClick={handleOnBack}
              className="back-button"
              data-testid="back-button"
              shape="round"
            >
              <IonIcon
                icon={arrowBackOutline}
                color="primary"
              />
            </IonButton>
          )}

          {closeButton && !closeButtonLabel && (
            <IonButton
              shape="round"
              className="close-button"
              onClick={closeButtonAction}
              data-testid="close-button"
            >
              <IonIcon
                slot="icon-only"
                icon={closeButtonIcon || closeOutline}
                color="primary"
              />
            </IonButton>
          )}

          {closeButton && closeButtonLabel && (
            <IonButton
              className="close-button-label"
              onClick={closeButtonAction}
              data-testid="close-button"
            >
              <h4 data-testid="close-button-label">{closeButtonLabel}</h4>
            </IonButton>
          )}
        </IonButtons>

        {title && (
          <IonTitle>
            <h2
              data-testid={`${title
                .trim()
                .replace(/[^aA-zZ\s]/, "")
                .split(" ")
                .join("-")
                .toLowerCase()}-title`}
            >
              {title}
            </h2>
          </IonTitle>
        )}

        {progressBar && (
          <div
            className={combineClassNames("progress-bar-container", {
              "has-left": hasLeftButton,
            })}
          >
            <IonProgressBar
              value={progressBarValue}
              buffer={progressBarBuffer}
              data-testid="progress-bar"
            />
          </div>
        )}

        {(!!actionButton || !!additionalButtons || hasAction) && (
          <IonButtons
            className={actionButtonClasses}
            slot="end"
          >
            {actionButton && !actionButtonLabel && (
              <IonButton
                shape="round"
                disabled={actionButtonDisabled}
                className="action-button"
                onClick={actionButtonAction}
                data-testid="action-button"
              >
                <IonIcon
                  slot="icon-only"
                  icon={actionButtonIcon}
                  color="secondary"
                />
              </IonButton>
            )}

            {actionButton && actionButtonLabel && (
              <IonButton
                disabled={actionButtonDisabled}
                className="action-button-label"
                onClick={actionButtonAction}
                data-testid="action-button"
              >
                <p>{actionButtonLabel}</p>
              </IonButton>
            )}

            {additionalButtons && additionalButtons}
          </IonButtons>
        )}
      </IonToolbar>
    </IonHeader>
  );
};

export { PageHeader };
