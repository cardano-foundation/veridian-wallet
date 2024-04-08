import { useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import "./TunnelConnect.scss";
import {
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonLoading,
} from "@ionic/react";
import { qrCodeOutline, trashOutline } from "ionicons/icons";
import {
  setCurrentRoute,
  setToastMsg,
} from "../../../store/reducers/stateCache";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { RoutePath } from "../../../routes";
import { ScrollablePageLayout } from "../../components/layout/ScrollablePageLayout";
import { PageHeader } from "../../components/PageHeader";
import { AriesAgent } from "../../../core/agent/agent";
import { PreferencesKeys, PreferencesStorage } from "../../../core/storage";
import { LocationState, OobiObject } from "./TunnelConnect.types";
import { CustomInput } from "../../components/CustomInput";
import { ShareOOBI } from "./components/ShareOOBI";
import {
  getIdentifiersCache,
  setIdentifiersCache,
} from "../../../store/reducers/identifiersCache";
import { IdentifierType } from "../../../core/agent/services/identifierService.types";
import { setConnectionsCache } from "../../../store/reducers/connectionsCache";
import { setCredsCache } from "../../../store/reducers/credsCache";
import { ToastMsgType } from "../../globals/types";

const TunnelConnect = () => {
  const pageId = "tunnel-connect";
  const history = useHistory();
  const location = useLocation<LocationState>();
  const dispatch = useAppDispatch();
  const state = location.state;
  const identifiersData = useAppSelector(getIdentifiersCache);

  const [shareModalIsOpen, setShareModalIsOpen] = useState(false);
  const [oobiNameValue, setOobiNameValue] = useState("Tunnel");
  const [oobiUrlValue, setOobiUrlValue] = useState(state?.oobiUrl || "");
  const [showLoading, setShowLoading] = useState(false);
  const [refreshResolvedOobis, setRefreshResolvedOobis] = useState(false);
  const [resolvedOobis, setResolvedOobis] = useState({});
  const [walletOobi, setWalletOobi] = useState("");
  const [sharedAidName, setSharedAidName] = useState("");
  const [resetCounter, setResetCounter] = useState(0);
  const [timer, setTimer] = useState<number | undefined>();

  useEffect(() => {
    if (state?.oobiUrl) {
      setOobiUrlValue(state.oobiUrl);
    }
  }, [state]);

  useEffect(() => {
    PreferencesStorage.get(PreferencesKeys.APP_TUNNEL_CONNECT)
      .then((resolvedOobis) => {
        setResolvedOobis(resolvedOobis);
        if (Object.keys(resolvedOobis).length) {
          setOobiNameValue(`Tunnel(${Object.keys(resolvedOobis).length + 1})`);
        }
      })
      .catch((e) => {
        // TODO: handle error
      });
  }, [refreshResolvedOobis]);

  useEffect(() => {
    const aid = identifiersData.find(
      (id) =>
        id.method === IdentifierType.KERI &&
        id.signifyName !== undefined &&
        id.displayName === "Demo"
    );

    if (aid) {
      if (!aid.signifyName) {
        throw new Error("Missing Signify name");
      }
      AriesAgent.agent.connections.getKeriOobi(aid.signifyName).then((oobi) => {
        setWalletOobi(oobi);
        setSharedAidName(aid.displayName);
      });
    } else {
      setWalletOobi("");
      setSharedAidName("");
    }
  }, [identifiersData]);

  const handleDeleteOobi = async (key: string) => {
    let resolvedOobis: Record<string, any> = {};
    try {
      const storedResolvedOobis = await PreferencesStorage.get(
        PreferencesKeys.APP_TUNNEL_CONNECT
      );
      resolvedOobis = storedResolvedOobis || {};
    } catch (e) {
      return;
    }

    delete resolvedOobis[key];

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
      return;
    }

    await AriesAgent.agent.connections.resolveOObi(oobiUrlValue, oobiNameValue);
    setRefreshResolvedOobis(!refreshResolvedOobis);
    setOobiUrlValue("");
    setOobiNameValue(`Tunnel(${Object.keys(resolvedOobis).length + 1})`);
    setShowLoading(false);
  };

  useEffect(() => {
    async function resetForDemo() {
      for (const identifier of await AriesAgent.agent.identifiers.getIdentifiers()) {
        await AriesAgent.agent.identifiers.archiveIdentifier(identifier.id);
        await AriesAgent.agent.identifiers.deleteIdentifier(identifier.id);
      }
      for (const connection of await AriesAgent.agent.connections.getConnections()) {
        await AriesAgent.agent.connections.deleteConnectionById(connection.id);
      }
      for (const credential of await AriesAgent.agent.credentials.getCredentials()) {
        await AriesAgent.agent.credentials.archiveCredential(credential.id);
        await AriesAgent.agent.credentials.deleteCredential(credential.id);
      }
      await PreferencesStorage.set(PreferencesKeys.APP_TUNNEL_CONNECT, {});
      dispatch(setIdentifiersCache([]));
      dispatch(setConnectionsCache([]));
      dispatch(setCredsCache([]));
      setResolvedOobis({});
      setResetCounter(0);
      dispatch(setToastMsg(ToastMsgType.APP_IS_RESET));
    }

    if (timer && Date.now() - timer > 7500) {
      setTimer(undefined);
      setResetCounter(0);
    } else if (resetCounter === 5) {
      resetForDemo();
    }
  }, [resetCounter]);

  return (
    <ScrollablePageLayout
      pageId={pageId}
      header={
        <PageHeader
          title="Tunnel Connect"
          backButton={true}
          actionButton={true}
          actionButtonAction={() => {
            if (resetCounter === 0) {
              // First time hitting
              setTimer(Date.now());
            }
            setResetCounter(resetCounter + 1);
          }}
          actionButtonLabel={"Reset"}
          currentPath={RoutePath.TUNNEL_CONNECT}
        />
      }
    >
      <div className="content-container">
        <h3 className="resolve-title">Resolve new OOBI</h3>
        <div className="name-input">
          <CustomInput
            dataTestId="name-input"
            title="OOBI Name"
            placeholder="Insert OOBI Name"
            onChangeInput={setOobiNameValue}
            optional={false}
            value={oobiNameValue}
          />
        </div>

        <div className="oobi-input">
          <div className="input-with-button">
            <CustomInput
              dataTestId="oobi-input"
              title="OOBI URL"
              placeholder="Insert OOBI URL"
              onChangeInput={setOobiUrlValue}
              optional={false}
              value={oobiUrlValue}
            />
            <IonButton
              onClick={handleScanOOBI}
              className="scan-qr-button"
            >
              <IonIcon icon={qrCodeOutline} />
            </IonButton>
          </div>
          <IonButton
            onClick={handleResolveOOBI}
            disabled={!oobiUrlValue.length}
            className="resolve-oobi-button"
          >
            Resolve OOBI
            <IonLoading
              isOpen={showLoading}
              message={"Resolving OOBI"}
              duration={5000}
            />
          </IonButton>
        </div>

        {Object.keys(resolvedOobis).length ? (
          <>
            <h3 className="resolved-title">Resolved OOBIs:</h3>
            <IonList className="oobi-list">
              {Object.entries(resolvedOobis as Record<string, OobiObject>).map(
                ([key, oobi]: [string, OobiObject]) => (
                  <IonItem
                    key={key}
                    lines="full"
                    className="oobi-item"
                  >
                    <IonLabel
                      slot="start"
                      className="oobi-label"
                    >
                      <h2>{oobi.name}</h2>
                      <p>{oobi?.url}</p>
                      <p>ID: {key}</p>

                      <p>
                        Date: {new Date(oobi?.dt).toLocaleDateString()}{" "}
                        {new Date(oobi?.dt).toLocaleTimeString()}
                      </p>
                    </IonLabel>
                    <IonButton
                      slot="end"
                      color="danger"
                      onClick={() => handleDeleteOobi(key)}
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
          </>
        ) : null}
      </div>
      {walletOobi !== "" && sharedAidName !== "" ? (
        <>
          <div className="fixed-bottom-component">
            <IonButton
              onClick={() => setShareModalIsOpen(true)}
              expand="block"
            >
              Share wallet OOBI
              <IonIcon
                icon={qrCodeOutline}
                color="light"
              />
            </IonButton>
          </div>

          <ShareOOBI
            modalIsOpen={shareModalIsOpen}
            setModalIsOpen={setShareModalIsOpen}
            content={walletOobi}
            name={sharedAidName}
          />
        </>
      ) : (
        <></>
      )}
    </ScrollablePageLayout>
  );
};

export { TunnelConnect };
