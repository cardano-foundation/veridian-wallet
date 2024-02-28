import { useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import "./TunnelConnect.scss";
import {
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonLoading,
} from "@ionic/react";
import { qrCodeOutline, trashOutline } from "ionicons/icons";
import { setCurrentRoute } from "../../../store/reducers/stateCache";
import { useAppDispatch } from "../../../store/hooks";
import { RoutePath } from "../../../routes";
import { ScrollablePageLayout } from "../../components/layout/ScrollablePageLayout";
import { PageHeader } from "../../components/PageHeader";
import { AriesAgent } from "../../../core/agent/agent";
import { PreferencesKeys, PreferencesStorage } from "../../../core/storage";
import { LocationState, OobiObject } from "./TunnelConnect.types";

const TunnelConnect = () => {
  const pageId = "tunnel-connect";
  const history = useHistory();
  const location = useLocation<LocationState>();
  const dispatch = useAppDispatch();
  const state = location.state;

  const [oobiNameValue, setOobiNameValue] = useState("Tunnel");
  const [oobiUrlValue, setOobiUrlValue] = useState(state?.oobiUrl || "");
  const [showLoading, setShowLoading] = useState(false);
  const [refreshResolvedOobis, setRefreshResolvedOobis] = useState(false);
  const [resolvedOobis, setResolvedOobis] = useState({});

  useEffect(() => {
    try {
      PreferencesStorage.get(PreferencesKeys.APP_TUNNEL_CONNECT).then(
        (resolvedOobis) => {
          setResolvedOobis(resolvedOobis);
          if (Object.keys(resolvedOobis).length) {
            setOobiNameValue(`Tunnel(${Object.keys(resolvedOobis).length})`);
          }
        }
      );
    } catch (e) {
      // TODO: handle error
    }
  }, [refreshResolvedOobis]);

  const handleDeleteOobi = async (name: string) => {
    let resolvedOobis: Record<string, any> = {};
    try {
      const storedResolvedOobis = await PreferencesStorage.get(
        PreferencesKeys.APP_TUNNEL_CONNECT
      );
      resolvedOobis = storedResolvedOobis || {};
    } catch (e) {
      return;
    }

    delete resolvedOobis[name];

    await PreferencesStorage.set(
      PreferencesKeys.APP_TUNNEL_CONNECT,
      resolvedOobis
    );
    setRefreshResolvedOobis(!refreshResolvedOobis);
  };

  const handleScanOOBI = () => {
    dispatch(setCurrentRoute({ path: RoutePath.OOBI_SCANNER }));
    history.push(RoutePath.OOBI_SCANNER);
  };

  const handleResolveOOBI = async () => {
    setShowLoading(true);
    // TODO: Validate oobi url
    if (!oobiUrlValue) {
      alert("Invalid OOBI URL format");
      return;
    }

    await AriesAgent.agent.connections.resolveOObi(oobiUrlValue, oobiNameValue);

    // TODO: store operation in Preferences

    setRefreshResolvedOobis(!refreshResolvedOobis);
    setOobiUrlValue("");
    setOobiNameValue(`Tunnel(${Object.keys(resolvedOobis).length})`);
    setShowLoading(false);
  };

  return (
    <ScrollablePageLayout
      pageId={pageId}
      header={
        <PageHeader
          title="Tunnel Connect"
          backButton={true}
          currentPath={RoutePath.TUNNEL_CONNECT}
        />
      }
    >
      <h3 className="resolve-title">Resolve new OOBI:</h3>
      <div className="name-input">
        <IonInput
          value={oobiNameValue}
          onIonChange={(e) => setOobiNameValue(e.detail.value!)}
          placeholder="Insert OOBI Name"
          clearInput
        />
      </div>
      <div className="oobi-input">
        <IonInput
          value={oobiUrlValue}
          onIonChange={(e) => setOobiUrlValue(e.detail.value!)}
          placeholder="Insert OOBI URL"
          clearInput
        />
        <IonButton onClick={handleScanOOBI}>
          <IonIcon
            icon={qrCodeOutline}
            color="light"
          />
        </IonButton>
        <IonButton
          onClick={handleResolveOOBI}
          disabled={!oobiUrlValue.length}
        >
          Resolve OOBI
          <IonLoading
            isOpen={showLoading}
            message={"Resolving OOBI"}
            duration={5000}
          />
        </IonButton>
      </div>

      <h3>Resolved OOBIs:</h3>
      <IonList>
        {Object.entries(resolvedOobis as Record<string, OobiObject>).map(
          ([name, oobi]: [string, OobiObject]) => (
            <IonItem
              key={oobi.response.i}
              lines="full"
              className="oobi-item"
            >
              <IonLabel
                slot="start"
                className="oobi-label"
              >
                <h2>
                  {name}
                  {oobi.done ? " ✅" : " ❓"}
                </h2>
                <p>{oobi?.metadata?.oobi}</p>
                <p>ID: {oobi?.response?.i}</p>
                <p>
                  Date: {new Date(oobi?.response?.dt).toLocaleDateString()}{" "}
                  {new Date(oobi?.response?.dt).toLocaleTimeString()}
                </p>
              </IonLabel>
              <IonButton
                slot="end"
                color="danger"
                onClick={() => handleDeleteOobi(name)}
              >
                <IonIcon
                  className="delete-button-label"
                  slot="icon-only"
                  icon={trashOutline}
                />
              </IonButton>
            </IonItem>
          )
        )}
      </IonList>
    </ScrollablePageLayout>
  );
};

export { TunnelConnect };
