import { IonButton, IonIcon, IonPage, useIonViewWillEnter } from "@ionic/react";
import { peopleOutline, addOutline } from "ionicons/icons";
import { useState } from "react";
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
  const credsData = useAppSelector(getCredsCache);
  const [showConnections, setShowConnections] = useState(false);
  const [addCredentialIsOpen, setAddCredentialIsOpen] = useState(false);

  const handleCreateCred = () => {
    setAddCredentialIsOpen(true);
  };

  useIonViewWillEnter(() =>
    dispatch(setCurrentRoute({ path: TabsRoutePath.CREDS }))
  );

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
          {credsData.length ? (
            <CardsStack
              cardsType={cardTypes.creds}
              cardsData={credsData}
            />
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
        </TabLayout>
      </IonPage>
    </>
  );
};

export { Creds };
