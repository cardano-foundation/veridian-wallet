import {
  IonCard,
  IonCol,
  IonGrid,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonRow,
} from "@ionic/react";
import { personCircleOutline } from "ionicons/icons";
import { useCallback, useState } from "react";
import { Agent } from "../../../../../core/agent/agent";
import { MultiSigIcpRequestDetails } from "../../../../../core/agent/services/identifier.types";
import { NotificationRoute } from "../../../../../core/agent/services/keriaNotificationService.types";
import { MultiSigService } from "../../../../../core/agent/services/multiSigService";
import { i18n } from "../../../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks";
import {
  getNotificationsCache,
  setNotificationsCache,
} from "../../../../../store/reducers/notificationsCache";
import { Alert as AlertDecline } from "../../../../components/Alert";
import { FallbackIcon } from "../../../../components/FallbackIcon";
import { ScrollablePageLayout } from "../../../../components/layout/ScrollablePageLayout";
import { PageFooter } from "../../../../components/PageFooter";
import { PageHeader } from "../../../../components/PageHeader";
import { Spinner } from "../../../../components/Spinner";
import { Verification } from "../../../../components/Verification";
import { BackEventPriorityType, ToastMsgType } from "../../../../globals/types";
import {
  useIonHardwareBackButton,
  useOnlineStatusEffect,
} from "../../../../hooks";
import { showError } from "../../../../utils/error";
import { NotificationDetailsProps } from "../../NotificationDetails.types";
import { ErrorPage } from "./ErrorPage";
import "./MultiSigRequest.scss";

const MultiSigRequest = ({
  pageId,
  activeStatus,
  notificationDetails,
  handleBack,
}: NotificationDetailsProps) => {
  const dispatch = useAppDispatch();
  const notificationsCache = useAppSelector(getNotificationsCache);
  const [notifications, setNotifications] = useState(notificationsCache);
  const [spinner, setSpinner] = useState(false);
  const [alertDeclineIsOpen, setAlertDeclineIsOpen] = useState(false);
  const [multisigIcpDetails, setMultisigIcpDetails] =
    useState<MultiSigIcpRequestDetails | null>(null);
  const [showErrorPage, setShowErrorPage] = useState(false);
  const [verifyIsOpen, setVerifyIsOpen] = useState(false);

  useIonHardwareBackButton(
    BackEventPriorityType.Page,
    handleBack,
    !activeStatus
  );

  const getDetails = useCallback(async () => {
    try {
      const details = await Agent.agent.multiSigs.getMultisigIcpDetails(
        notificationDetails.a.d as string
      );
      setMultisigIcpDetails(details);
      setShowErrorPage(false);
    } catch (e) {
      if (
        (e as Error).message === MultiSigService.UNKNOWN_AIDS_IN_MULTISIG_ICP
      ) {
        setShowErrorPage(true);
      }
    }
  }, [notificationDetails.a.d]);

  useOnlineStatusEffect(getDetails);

  const handleNotificationUpdate = async () => {
    const updatedNotifications = notifications.filter(
      (notification) => notification.id !== notificationDetails.id
    );
    setNotifications(updatedNotifications);
    dispatch(setNotificationsCache(updatedNotifications));
  };

  const actionAccept = async () => {
    setSpinner(true);
    try {
      if (!multisigIcpDetails) {
        throw new Error(
          "Cannot accept a multi-sig inception event before details are loaded from core"
        );
      }

      await Agent.agent.multiSigs.joinGroup(
        notificationDetails.id,
        notificationDetails.a.d as string
      );
      multisigIcpDetails.threshold === 1
        ? ToastMsgType.IDENTIFIER_CREATED
        : ToastMsgType.IDENTIFIER_REQUESTED;
      handleNotificationUpdate();
      handleBack();
    } catch (e) {
      showError("Unable to join multi-sig", e, dispatch);
    } finally {
      setSpinner(false);
    }
  };

  const actionDecline = async () => {
    try {
      setAlertDeclineIsOpen(false);
      await Agent.agent.keriaNotifications.deleteNotificationRecordById(
        notificationDetails.id,
        notificationDetails.a.r as NotificationRoute
      );
      handleNotificationUpdate();
      handleBack();
    } catch (e) {
      showError("Unable to accept acdc", e, dispatch);
    }
  };

  const handleDeclineClick = useCallback(() => setAlertDeclineIsOpen(true), []);

  if (showErrorPage) {
    return (
      <ErrorPage
        pageId={pageId}
        handleBack={handleBack}
        activeStatus={activeStatus}
        notificationDetails={notificationDetails}
        onFinishSetup={() => {
          setShowErrorPage(false);
          setMultisigIcpDetails(null);
          getDetails();
        }}
      />
    );
  }

  if (!multisigIcpDetails) {
    return <Spinner show={true} />;
  }

  return (
    <>
      <ScrollablePageLayout
        pageId={`${pageId}-multi-sig-request`}
        customClass={`${pageId}-multi-sig-request setup-identifier`}
        activeStatus={activeStatus}
        header={
          <PageHeader
            closeButton={true}
            closeButtonAction={handleBack}
            closeButtonLabel={`${i18n.t(
              "tabs.notifications.details.buttons.close"
            )}`}
            title={`${i18n.t("tabs.notifications.details.identifier.title")}`}
          />
        }
        footer={
          <PageFooter
            pageId={pageId}
            customClass="multisig-request-footer"
            primaryButtonText={`${i18n.t(
              "tabs.notifications.details.buttons.accept"
            )}`}
            primaryButtonAction={() => setVerifyIsOpen(true)}
            declineButtonText={`${i18n.t(
              "tabs.notifications.details.buttons.decline"
            )}`}
            declineButtonAction={handleDeclineClick}
          />
        }
      >
        <p className="multisig-request-subtitle">
          {i18n.t("tabs.notifications.details.identifier.subtitle")}
        </p>
        <div className="multisig-request-section">
          <h4>{i18n.t("tabs.notifications.details.identifier.requestfrom")}</h4>
          <IonCard className="multisig-request-details">
            <IonList lines="none">
              <IonItem className="multisig-request-item">
                <IonGrid>
                  <IonRow>
                    <IonCol
                      size="1.25"
                      className="multisig-connection-logo"
                    >
                      {multisigIcpDetails?.sender.logo ? (
                        <img
                          data-testid="multisig-connection-logo"
                          src={multisigIcpDetails?.sender.logo}
                          alt="multisig-connection-logo"
                        />
                      ) : (
                        <div
                          data-testid="multisig-connection-fallback-logo"
                          className="multisig-request-user-logo"
                        >
                          <IonIcon
                            icon={personCircleOutline}
                            color="light"
                          />
                        </div>
                      )}
                    </IonCol>
                    <IonCol
                      size="10.35"
                      className="multisig-connection-info"
                    >
                      <IonLabel>{multisigIcpDetails?.sender.label}</IonLabel>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </IonItem>
            </IonList>
          </IonCard>
        </div>
        {!!multisigIcpDetails?.otherConnections.length && (
          <div className="multisig-request-section">
            <h4>
              {i18n.t("tabs.notifications.details.identifier.othermembers")}
            </h4>
            <IonCard className="multisig-request-details">
              <IonList lines="none">
                {multisigIcpDetails?.otherConnections.map(
                  (connection, index) => {
                    return (
                      <IonItem
                        key={index}
                        className="multisig-request-item"
                        data-testid={`multisig-connection-${index}`}
                      >
                        <IonGrid>
                          <IonRow>
                            <IonCol
                              size="1.25"
                              className="multisig-connection-logo"
                            >
                              <FallbackIcon
                                data-testid={`other-multisig-connection-logo-${index}`}
                                src={connection.logo}
                                alt="multisig-connection-logo"
                              />
                            </IonCol>
                            <IonCol
                              size="10.35"
                              className="multisig-connection-info"
                            >
                              <IonLabel>
                                {connection.label ||
                                  i18n.t("connections.unknown")}
                              </IonLabel>
                            </IonCol>
                          </IonRow>
                        </IonGrid>
                      </IonItem>
                    );
                  }
                )}
              </IonList>
            </IonCard>
          </div>
        )}
        <div className="multisig-request-section">
          <h4>{i18n.t("tabs.notifications.details.identifier.threshold")}</h4>
          <IonCard className="multisig-request-details">
            <IonList lines="none">
              <IonItem className="multisig-request-item">
                <IonLabel>{multisigIcpDetails?.threshold}</IonLabel>
              </IonItem>
            </IonList>
          </IonCard>
        </div>
      </ScrollablePageLayout>
      <AlertDecline
        isOpen={alertDeclineIsOpen}
        setIsOpen={setAlertDeclineIsOpen}
        dataTestId="multisig-request-alert-decline"
        headerText={i18n.t(
          "tabs.notifications.details.identifier.alert.textdecline"
        )}
        confirmButtonText={`${i18n.t(
          "tabs.notifications.details.buttons.decline"
        )}`}
        cancelButtonText={`${i18n.t(
          "tabs.notifications.details.buttons.cancel"
        )}`}
        actionConfirm={() => actionDecline()}
        actionCancel={() => setAlertDeclineIsOpen(false)}
        actionDismiss={() => setAlertDeclineIsOpen(false)}
      />
      <Spinner show={spinner} />
      <Verification
        verifyIsOpen={verifyIsOpen}
        setVerifyIsOpen={setVerifyIsOpen}
        onVerify={() => actionAccept()}
      />
    </>
  );
};

export { MultiSigRequest };
