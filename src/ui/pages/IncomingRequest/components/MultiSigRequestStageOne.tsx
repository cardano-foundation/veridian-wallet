import {
  IonCard,
  IonList,
  IonItem,
  IonGrid,
  IonRow,
  IonCol,
  IonLabel,
} from "@ionic/react";
import { useEffect, useState } from "react";
import {
  Alert as AlertAccept,
  Alert as AlertDecline,
} from "../../../components/Alert";
import { i18n } from "../../../../i18n";
import CardanoLogo from "../../../../ui/assets/images/CardanoLogo.jpg";
import { ScrollablePageLayout } from "../../../components/layout/ScrollablePageLayout";
import { PageFooter } from "../../../components/PageFooter";
import { RequestProps } from "../IncomingRequest.types";
import { PageHeader } from "../../../components/PageHeader";

const MultiSigRequestStageOne = ({
  pageId,
  requestData,
  handleCancel,
  handleIgnore,
  setRequestStage,
}: RequestProps) => {
  const [show, setShow] = useState(false);
  const ANIMATION_DELAY = 1000;
  const [alertAcceptIsOpen, setAlertAcceptIsOpen] = useState(false);
  const [alertDeclineIsOpen, setAlertDeclineIsOpen] = useState(false);

  useEffect(() => {
    setShow(true);
  }, []);

  const actionAccept = () => {
    setAlertAcceptIsOpen(false);
    setRequestStage && setRequestStage(1);
  };

  const actionDecline = () => {
    setAlertDeclineIsOpen(false);
    handleCancel();
  };

  const actionIgnore = () => {
    setShow(false);
    setTimeout(() => {
      handleIgnore && handleIgnore();
    }, ANIMATION_DELAY);
  };

  return (
    <>
      <ScrollablePageLayout
        pageId={pageId}
        activeStatus={!!requestData}
        customClass={`${show ? "show" : "hide"}`}
        header={
          <PageHeader
            closeButton={true}
            closeButtonAction={() => actionIgnore()}
            closeButtonLabel={`${i18n.t("request.button.ignore")}`}
            title={`${i18n.t("request.multisig.stageone.title")}`}
          />
        }
      >
        <p className="multisig-request-subtitle">
          {i18n.t("request.multisig.stageone.subtitle")}
        </p>
        <div className="multisig-request-section">
          <h4>{i18n.t("request.multisig.stageone.requestfrom")}</h4>
          <IonCard className="multisig-request-details">
            <IonList lines="none">
              <IonItem className="multisig-request-item">
                <IonGrid>
                  <IonRow>
                    <IonCol
                      size="1.25"
                      className="multisig-connection-logo"
                    >
                      <img
                        src={
                          requestData.multisigIcpDetails?.sender.logo ??
                          CardanoLogo
                        }
                        alt="multisig-connection-logo"
                      />
                    </IonCol>
                    <IonCol
                      size="10.35"
                      className="multisig-connection-info"
                    >
                      <IonLabel>
                        {requestData.multisigIcpDetails?.sender.label}
                      </IonLabel>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </IonItem>
            </IonList>
          </IonCard>
        </div>
        <div className="multisig-request-section">
          <h4>{i18n.t("request.multisig.stageone.othermembers")}</h4>
          <IonCard className="multisig-request-details">
            <IonList lines="none">
              {requestData.multisigIcpDetails?.otherConnections.map(
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
                            <img
                              src={connection.logo ?? CardanoLogo}
                              alt="multisig-connection-logo"
                            />
                          </IonCol>
                          <IonCol
                            size="10.35"
                            className="multisig-connection-info"
                          >
                            <IonLabel>{connection.label}</IonLabel>
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
        <div className="multisig-request-section">
          <h4>{i18n.t("request.multisig.stageone.threshold")}</h4>
          <IonCard className="multisig-request-details">
            <IonList lines="none">
              <IonItem className="multisig-request-item">
                <IonLabel>{requestData.multisigIcpDetails?.threshold}</IonLabel>
              </IonItem>
            </IonList>
          </IonCard>
        </div>
      </ScrollablePageLayout>
      <PageFooter
        pageId={pageId}
        customClass="multisig-request-footer"
        primaryButtonText={`${i18n.t("request.button.accept")}`}
        primaryButtonAction={() => setAlertAcceptIsOpen(true)}
        secondaryButtonText={`${i18n.t("request.button.decline")}`}
        secondaryButtonAction={() => setAlertDeclineIsOpen(true)}
      />
      <AlertAccept
        isOpen={alertAcceptIsOpen}
        setIsOpen={setAlertAcceptIsOpen}
        dataTestId="multisig-request-alert"
        headerText={i18n.t("request.multisig.stageone.alert.textaccept")}
        confirmButtonText={`${i18n.t(
          "request.multisig.stageone.alert.accept"
        )}`}
        cancelButtonText={`${i18n.t("request.multisig.stageone.alert.cancel")}`}
        actionConfirm={() => actionAccept()}
        actionCancel={() => setAlertAcceptIsOpen(false)}
        actionDismiss={() => setAlertAcceptIsOpen(false)}
      />
      <AlertDecline
        isOpen={alertDeclineIsOpen}
        setIsOpen={setAlertDeclineIsOpen}
        dataTestId="multisig-request-alert"
        headerText={i18n.t("request.multisig.stageone.alert.textdecline")}
        confirmButtonText={`${i18n.t(
          "request.multisig.stageone.alert.decline"
        )}`}
        cancelButtonText={`${i18n.t("request.multisig.stageone.alert.cancel")}`}
        actionConfirm={() => actionDecline()}
        actionCancel={() => setAlertDeclineIsOpen(false)}
        actionDismiss={() => setAlertDeclineIsOpen(false)}
      />
    </>
  );
};

export { MultiSigRequestStageOne };
