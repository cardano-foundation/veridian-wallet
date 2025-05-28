import { IonCheckbox, IonContent } from "@ionic/react";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { IdentifierShortDetails } from "../../../core/agent/services/identifier.types";
import { PeerConnection } from "../../../core/cardano/walletConnect/peerConnection";
import { i18n } from "../../../i18n";
import { useAppSelector } from "../../../store/hooks";
import { getIdentifiersCache } from "../../../store/reducers/identifiersCache";
import { setCurrentOperation } from "../../../store/reducers/stateCache";
import {
  getWalletConnectionsCache,
  setIsConnecting,
  setWalletConnectionsCache,
} from "../../../store/reducers/walletConnectionsCache";
import { CardItem, CardList } from "../../components/CardList";
import { PageFooter } from "../../components/PageFooter";
import { PageHeader } from "../../components/PageHeader";
import { ResponsivePageLayout } from "../../components/layout/ResponsivePageLayout";
import { OperationType, ToastMsgType } from "../../globals/types";
import { showError } from "../../utils/error";
import { combineClassNames } from "../../utils/style";
import "./WalletConnect.scss";
import { WalletConnectStageTwoProps } from "./WalletConnect.types";

const WalletConnectStageTwo = ({
  isOpen,
  pendingDAppMeerkat,
  className,
  onBackClick,
  onClose,
}: WalletConnectStageTwoProps) => {
  const dispatch = useDispatch();
  const identifierCache = Object.values(useAppSelector(getIdentifiersCache));
  const existingConnections = useAppSelector(getWalletConnectionsCache);

  const [selectedIdentifier, setSelectedIdentifier] =
    useState<IdentifierShortDetails | null>(null);
  const [startingMeerkat, setStartingMeerkat] = useState<boolean>(false);

  const displayIdentifiers = identifierCache
    .filter((item) => !item.groupMemberPre && !item.groupMetadata)
    .map(
      (identifier): CardItem<IdentifierShortDetails> => ({
        id: identifier.id,
        title: identifier.displayName,
        data: identifier,
      })
    );

  const classes = combineClassNames("wallet-connect-stage-two", className, {
    show: !!isOpen,
    hide: !isOpen,
  });

  const handleSelectIdentifier = (data: IdentifierShortDetails) => {
    setSelectedIdentifier(selectedIdentifier?.id === data.id ? null : data);
  };

  const handleConnectWallet = async () => {
    try {
      if (selectedIdentifier && pendingDAppMeerkat && !startingMeerkat) {
        setStartingMeerkat(true);
        await PeerConnection.peerConnection.start(selectedIdentifier.id);
        await PeerConnection.peerConnection.connectWithDApp(pendingDAppMeerkat);
        const existingConnection = existingConnections.find(
          (connection) => connection.id === pendingDAppMeerkat
        );
        if (existingConnection) {
          const updatedConnections = [];
          for (const connection of existingConnections) {
            if (connection.id === existingConnection.id) {
              updatedConnections.push({
                ...existingConnection,
                selectedAid: selectedIdentifier.id,
              });
            } else {
              updatedConnections.push(connection);
            }
          }
          dispatch(setWalletConnectionsCache(updatedConnections));
        } else {
          dispatch(
            setWalletConnectionsCache([
              ...existingConnections,
              { id: pendingDAppMeerkat, selectedAid: selectedIdentifier.id },
            ])
          );
        }

        dispatch(setIsConnecting(true));
        dispatch(
          setCurrentOperation(OperationType.OPEN_WALLET_CONNECTION_DETAIL)
        );
      }
      onClose();
    } catch (e) {
      showError(
        "Unable to connect wallet",
        e,
        dispatch,
        ToastMsgType.UNABLE_CONNECT_WALLET
      );
    } finally {
      setStartingMeerkat(false);
    }
  };

  return (
    <ResponsivePageLayout
      pageId="wallet-connect-stage-two"
      activeStatus={isOpen}
      customClass={classes}
      header={
        <PageHeader
          title={`${i18n.t(
            "tabs.menu.tab.items.connectwallet.request.stagetwo.title"
          )}`}
          closeButton
          closeButtonLabel={`${i18n.t(
            "tabs.menu.tab.items.connectwallet.request.button.back"
          )}`}
          closeButtonAction={onBackClick}
          hardwareBackButtonConfig={{
            prevent: !isOpen,
          }}
        />
      }
    >
      <h2 className="title">
        {i18n.t("tabs.menu.tab.items.connectwallet.request.stagetwo.message")}
      </h2>
      <IonContent className="identifier-list">
        <CardList
          data={displayIdentifiers}
          onCardClick={(data, e) => {
            e.stopPropagation();
            handleSelectIdentifier(data);
          }}
          onRenderEndSlot={(data) => {
            return (
              <IonCheckbox
                checked={selectedIdentifier?.id === data.id}
                aria-label=""
                className="checkbox"
                data-testid={`identifier-select-${data.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectIdentifier(data);
                }}
              />
            );
          }}
        />
      </IonContent>
      <PageFooter
        primaryButtonText={`${i18n.t(
          "tabs.menu.tab.items.connectwallet.request.stagetwo.confirm"
        )}`}
        primaryButtonAction={handleConnectWallet}
        primaryButtonDisabled={!selectedIdentifier || startingMeerkat}
      />
    </ResponsivePageLayout>
  );
};

export { WalletConnectStageTwo };
