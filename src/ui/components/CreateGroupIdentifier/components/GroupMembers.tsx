import { IonCheckbox, IonItem, IonLabel, IonList } from "@ionic/react";
import { useState } from "react";
import { ConnectionShortDetails } from "../../../../core/agent/agent.types";
import { i18n } from "../../../../i18n";
import { FallbackIcon } from "../../FallbackIcon";
import { PageFooter } from "../../PageFooter";
import { PageHeader } from "../../PageHeader";
import { ScrollablePageLayout } from "../../layout/ScrollablePageLayout";
import { IdentifierStageProps, Stage } from "../CreateGroupIdentifier.types";

const GroupMembers = ({
  state,
  setState,
  componentId,
}: IdentifierStageProps) => {
  const [selectedConnections, setSelectedConnections] = useState<
    ConnectionShortDetails[]
  >(state.scannedConections);

  const handleSelectConnection = (connection: ConnectionShortDetails) => {
    let data = selectedConnections;
    if (data.find((item) => item === connection)) {
      data = data.filter((item) => item !== connection);
    } else {
      data = [...selectedConnections, connection];
    }
    setSelectedConnections(data);
  };

  const handleContinue = () => {
    setState((prevState) => ({
      ...prevState,
      identifierCreationStage: Stage.SetupThreshold,
      selectedConnections: selectedConnections,
    }));
  };

  return (
    <ScrollablePageLayout
      pageId={componentId + "-content"}
      header={
        <PageHeader
          closeButton={true}
          closeButtonAction={() => {
            setState((prevState) => ({
              ...prevState,
              identifierCreationStage: Stage.SetupConnection,
              selectedConnections: [],
            }));
          }}
          closeButtonLabel={`${i18n.t("createidentifier.back")}`}
          title={`${i18n.t("createidentifier.connections.title")}`}
        />
      }
      footer={
        <PageFooter
          pageId={componentId}
          primaryButtonText={`${i18n.t(
            "createidentifier.connections.continue"
          )}`}
          primaryButtonAction={() => handleContinue()}
          primaryButtonDisabled={!selectedConnections.length}
        />
      }
    >
      <p className="multisig-subtitle">
        {i18n.t("createidentifier.connections.subtitle")}
      </p>
      <IonList>
        {state.scannedConections.map((connection, index) => {
          return (
            <IonItem
              key={index}
              onClick={() => handleSelectConnection(connection)}
              className={`${
                selectedConnections.includes(connection) &&
                "selected-connection"
              }`}
            >
              <IonLabel className="connection-item">
                <FallbackIcon
                  src={connection?.logo}
                  className="connection-logo"
                  data-testid="identifier-stage-2-logo"
                  alt="connection-logo"
                />
                <span className="connection-name">{connection.label}</span>
                <IonCheckbox
                  checked={selectedConnections.includes(connection)}
                  data-testid={`connection-checkbox-${index}`}
                  onIonChange={() => handleSelectConnection(connection)}
                  aria-label={`connection-checkbox-${index}`}
                />
              </IonLabel>
            </IonItem>
          );
        })}
      </IonList>
    </ScrollablePageLayout>
  );
};

export { GroupMembers };
