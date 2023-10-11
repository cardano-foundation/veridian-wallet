import {
  IonButton,
  IonIcon,
  IonLabel,
  IonPage,
  useIonViewWillEnter,
} from "@ionic/react";
import { peopleOutline, addOutline } from "ionicons/icons";
import { useEffect, useState } from "react";
import { TabLayout } from "../../components/layout/TabLayout";
import { i18n } from "../../../i18n";
import "./Creds.scss";
import { CardsPlaceholder } from "../../components/CardsPlaceholder";
import { CardsStack } from "../../components/CardsStack";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { setCurrentRoute } from "../../../store/reducers/stateCache";
import { TabsRoutePath } from "../../../routes/paths";
import { getCredsCache } from "../../../store/reducers/credsCache";
import { Connections } from "../Connections";
import { cardTypes, connectionType } from "../../constants/dictionary";
import { ConnectModal } from "../../components/ConnectModal";
import { ArchivedCredentials } from "../../components/ArchivedCredentials";

interface AdditionalButtonsProps {
  handleCreateCred: () => void;
  handleConnections: () => void;
}

const AdditionalButtons = ({
  handleCreateCred,
  handleConnections,
}: AdditionalButtonsProps) => {
  return (
    <>
      <IonButton
        shape="round"
        className="connections-button"
        data-testid="connections-button"
        onClick={handleConnections}
      >
        <IonIcon
          slot="icon-only"
          icon={peopleOutline}
          color="primary"
        />
      </IonButton>
      <IonButton
        shape="round"
        className="add-credential-button"
        data-testid="add-credential-button"
        onClick={handleCreateCred}
      >
        <IonIcon
          slot="icon-only"
          icon={addOutline}
          color="primary"
        />
      </IonButton>
    </>
  );
};

const Creds = () => {
  const dispatch = useAppDispatch();
  const credsCache = useAppSelector(getCredsCache);
  const [credsData, setCredsData] = useState(credsCache);
  const confirmedCreds = credsData.filter((item) => item.isArchived === false);
  const archivedCreds = credsData.filter((item) => item.isArchived === true);
  const [showConnections, setShowConnections] = useState(false);
  const [addCredentialIsOpen, setAddCredentialIsOpen] = useState(false);
  const [archivedCredentialsIsOpen, setArchivedCredentialsIsOpen] =
    useState(false);

  const handleCreateCred = () => {
    setAddCredentialIsOpen(true);
  };

  useIonViewWillEnter(() =>
    dispatch(setCurrentRoute({ path: TabsRoutePath.CREDS }))
  );

  useEffect(() => {
    setCredsData(credsCache);
  }, [credsCache]);

  return (
    <>
      <IonPage
        className={`tab-layout connections-tab ${
          showConnections ? "show" : "hide"
        }`}
        data-testid="connections-tab"
      >
        <Connections setShowConnections={setShowConnections} />
      </IonPage>
      <IonPage
        className="tab-layout creds-tab"
        data-testid="creds-tab"
      >
        <TabLayout
          header={true}
          title={`${i18n.t("creds.tab.title")}`}
          menuButton={true}
          additionalButtons={
            <AdditionalButtons
              handleConnections={() => setShowConnections(true)}
              handleCreateCred={handleCreateCred}
            />
          }
        >
          {confirmedCreds.length ? (
            <>
              <CardsStack
                cardsType={cardTypes.creds}
                cardsData={confirmedCreds}
              />
              {archivedCreds.length ? (
                <div className="archived-credentials-button-container">
                  <IonButton
                    fill="outline"
                    className="secondary-button"
                    onClick={() => setArchivedCredentialsIsOpen(true)}
                  >
                    <IonLabel color="secondary">
                      {i18n.t("creds.tab.viewarchived")}
                    </IonLabel>
                  </IonButton>
                </div>
              ) : null}
            </>
          ) : (
            <CardsPlaceholder
              buttonLabel={i18n.t("creds.tab.create")}
              buttonAction={handleCreateCred}
              testId="creds-cards-placeholder"
            />
          )}
          <ConnectModal
            type={connectionType.credential}
            connectModalIsOpen={addCredentialIsOpen}
            setConnectModalIsOpen={setAddCredentialIsOpen}
          />
          {archivedCreds.length ? (
            <ArchivedCredentials
              archivedCredentialsIsOpen={archivedCredentialsIsOpen}
              setArchivedCredentialsIsOpen={setArchivedCredentialsIsOpen}
            />
          ) : null}
        </TabLayout>
      </IonPage>
    </>
  );
};

export { Creds };
