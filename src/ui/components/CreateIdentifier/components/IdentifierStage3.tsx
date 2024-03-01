import { IonCard, IonItem, IonLabel, IonIcon } from "@ionic/react";
import { pencilOutline } from "ionicons/icons";
import { useState } from "react";
import { i18n } from "../../../../i18n";
import { PageFooter } from "../../PageFooter";
import { PageHeader } from "../../PageHeader";
import { ScrollablePageLayout } from "../../layout/ScrollablePageLayout";
import { IdentifierStageProps } from "../CreateIdentifier.types";
import CardanoLogo from "../../../assets/images/CardanoLogo.jpg";
import { Alert } from "../../Alert";
import { useAppDispatch } from "../../../../store/hooks";
import { setToastMsg } from "../../../../store/reducers/stateCache";
import { ToastMsgType } from "../../../globals/types";
import { AriesAgent } from "../../../../core/agent/agent";
import { ConnectionShortDetails } from "../../../pages/Connections/Connections.types";

const IdentifierStage3 = ({
  state,
  setState,
  componentId,
  resetModal,
}: IdentifierStageProps) => {
  const dispatch = useAppDispatch();
  const [alertIsOpen, setAlertIsOpen] = useState(false);
  const ourIdentifier = "";
  const otherIdentifierContacts: ConnectionShortDetails[] =
    state.sortedConnections.filter((connection) =>
      state.selectedConnections.includes(connection.id)
    );

  const createMultisigIdentifier = async () => {
    await AriesAgent.agent.identifiers.createMultisig(
      ourIdentifier,
      otherIdentifierContacts,
      {
        theme: state.selectedTheme,
        // @TODO - sdisalvo: Colors will need to be removed
        colors: ["#000000", "#000000"],
        displayName: state.displayNameValue,
      }
    );
  };
  return (
    <>
      <ScrollablePageLayout
        pageId={componentId + "-content"}
        header={
          <PageHeader
            closeButton={true}
            closeButtonAction={() =>
              setState((prevState: IdentifierStageProps) => ({
                ...prevState,
                identifierCreationStage: 2,
              }))
            }
            closeButtonLabel={`${i18n.t("createidentifier.back")}`}
            title={`${i18n.t("createidentifier.confirm.title")}`}
          />
        }
      >
        <p className="multisig-subtitle">
          {i18n.t("createidentifier.confirm.subtitle")}
        </p>
        <div>
          <div className="identifier-list-title">
            {i18n.t("createidentifier.confirm.displayname")}
          </div>
          <IonCard>
            <IonItem className="identifier-list-item">
              <IonLabel>{state.displayNameValue}</IonLabel>
              <IonIcon
                aria-hidden="true"
                icon={pencilOutline}
                slot="end"
                onClick={() =>
                  setState((prevState: IdentifierStageProps) => ({
                    ...prevState,
                    identifierCreationStage: 0,
                  }))
                }
              />
            </IonItem>
          </IonCard>
        </div>
        <div>
          <div className="identifier-list-title">
            {i18n.t("createidentifier.confirm.selectedmembers")}
          </div>
          <IonCard>
            {state.sortedConnections.map((connection, index) => {
              if (state.selectedConnections.includes(connection.id)) {
                return (
                  <IonItem
                    key={index}
                    className="identifier-list-item"
                  >
                    <IonLabel>
                      <img
                        src={connection?.logo ?? CardanoLogo}
                        className="connection-logo"
                        alt="connection-logo"
                      />
                      <span className="connection-name">
                        {connection.label}
                      </span>
                      <IonIcon
                        aria-hidden="true"
                        icon={pencilOutline}
                        slot="end"
                        onClick={() =>
                          setState((prevState: IdentifierStageProps) => ({
                            ...prevState,
                            identifierCreationStage: 1,
                          }))
                        }
                      />
                    </IonLabel>
                  </IonItem>
                );
              }
            })}
          </IonCard>
        </div>
        <div>
          <div className="identifier-list-title">
            {i18n.t("createidentifier.confirm.treshold")}
          </div>
          <IonCard>
            <IonItem className="identifier-list-item">
              <IonLabel>{state.threshold}</IonLabel>
              <IonIcon
                aria-hidden="true"
                icon={pencilOutline}
                slot="end"
                onClick={() =>
                  setState((prevState: IdentifierStageProps) => ({
                    ...prevState,
                    identifierCreationStage: 2,
                  }))
                }
              />
            </IonItem>
          </IonCard>
        </div>
      </ScrollablePageLayout>
      <PageFooter
        pageId={componentId}
        customClass="identifier-stage-3"
        primaryButtonText={`${i18n.t("createidentifier.confirm.continue")}`}
        primaryButtonAction={() => {
          createMultisigIdentifier();
          dispatch(setToastMsg(ToastMsgType.IDENTIFIER_REQUESTED));
          resetModal();
        }}
        secondaryButtonText={`${i18n.t("createidentifier.confirm.cancel")}`}
        secondaryButtonAction={() => setAlertIsOpen(true)}
      />
      <Alert
        isOpen={alertIsOpen}
        setIsOpen={setAlertIsOpen}
        dataTestId="alert-cancel"
        headerText={i18n.t("createidentifier.confirm.alert.text")}
        confirmButtonText={`${i18n.t("createidentifier.confirm.alert.cancel")}`}
        cancelButtonText={`${i18n.t("createidentifier.confirm.alert.back")}`}
        actionConfirm={() => {
          setAlertIsOpen(false);
          resetModal();
        }}
        actionCancel={() => setAlertIsOpen(false)}
        actionDismiss={() => setAlertIsOpen(false)}
      />
    </>
  );
};

export { IdentifierStage3 };
