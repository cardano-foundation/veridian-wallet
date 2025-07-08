import { IConnectMessage } from "@fabianbormann/cardano-peer-connect/dist/src/types";
import { ExperimentalContainer } from "@fabianbormann/cardano-peer-connect";
import { IdentityWalletConnect } from "./identityWalletConnect";
import packageInfo from "../../../../package.json";
import ICON_BASE64 from "../../../assets/icon-only";
import { KeyStoreKeys, SecureStorage } from "../../storage";
import { CoreEventEmitter } from "../../agent/event";
import {
  ExperimentalAPIFunctions,
  PeerConnectSigningEvent,
  PeerConnectedEvent,
  PeerConnectionBrokenEvent,
  PeerConnectionEventTypes,
  PeerDisconnectedEvent,
} from "./peerConnection.types";
import { Agent } from "../../agent/agent";

class PeerConnection {
  static readonly PEER_CONNECTION_START_PENDING =
    "The PeerConnection.start() has not been called yet";

  private walletInfo = {
    address: "",
    name: "idw_p2p",
    icon: ICON_BASE64,
    version: packageInfo.version,
    requestAutoconnect: true,
  };

  private announce = [
    "wss://tracker.webtorrent.dev:443/announce",
    "wss://dev.btt.cf-identity-wallet.metadata.dev.cf-deployments.org",
  ];

  private identityWalletConnect: IdentityWalletConnect | undefined;
  private connectedDAppAddress = "";
  private eventEmitter = new CoreEventEmitter();
  private static instance: PeerConnection;

  onPeerConnectRequestSignStateChanged(
    callback: (event: PeerConnectSigningEvent) => void
  ) {
    this.eventEmitter.on(PeerConnectionEventTypes.PeerConnectSign, callback);
  }

  onPeerConnectedStateChanged(callback: (event: PeerConnectedEvent) => void) {
    this.eventEmitter.on(PeerConnectionEventTypes.PeerConnected, callback);
  }

  onPeerDisconnectedStateChanged(
    callback: (event: PeerDisconnectedEvent) => void
  ) {
    this.eventEmitter.on(PeerConnectionEventTypes.PeerDisconnected, callback);
  }

  offPeerDisconnectedStateChanged(
    callback: (event: PeerDisconnectedEvent) => void
  ) {
    this.eventEmitter.off(PeerConnectionEventTypes.PeerDisconnected, callback);
  }

  onPeerConnectionBrokenStateChanged(
    callback: (event: PeerConnectionBrokenEvent) => void
  ) {
    this.eventEmitter.on(
      PeerConnectionEventTypes.PeerConnectionBroken,
      callback
    );
  }

  static get peerConnection() {
    if (!this.instance) {
      this.instance = new PeerConnection();
    }
    return this.instance;
  }

  async start(selectedAid: string) {
    const meerkatSeed = await SecureStorage.get(KeyStoreKeys.MEERKAT_SEED);

    if (
      this.identityWalletConnect &&
      this.connectedDAppAddress.trim().length !== 0
    ) {
      this.disconnectDApp(this.connectedDAppAddress);
    }
    this.identityWalletConnect = new IdentityWalletConnect(
      this.walletInfo,
      meerkatSeed,
      this.announce,
      selectedAid,
      this.eventEmitter
    );
    this.identityWalletConnect.setOnConnect(
      async (connectMessage: IConnectMessage) => {
        if (!connectMessage.error) {
          const { name, url, address, icon } = connectMessage.dApp;
          this.connectedDAppAddress = address;
          let iconB64;
          // Check if the icon is base64
          if (
            icon &&
            /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$/.test(
              icon
            )
          ) {
            iconB64 = icon;
          }

          const peerConnectionRecord =
            await Agent.agent.peerConnectionAccounts.getPeerConnection(
              `${address}:${selectedAid}`
            );

          if (peerConnectionRecord) {
            peerConnectionRecord.name = name;
            peerConnectionRecord.url = url;
            peerConnectionRecord.iconB64 = iconB64;
            await Agent.agent.peerConnectionAccounts.updatePeerConnectionAccount(
              `${address}:${selectedAid}`,
              peerConnectionRecord
            );
          } else {
            await Agent.agent.peerConnectionAccounts.createPeerConnectionAccountRecord(
              {
                peerConnectionId: address,
                accountId: selectedAid,
                name,
                url,
                iconB64: iconB64,
              }
            );
          }
          this.eventEmitter.emit<PeerConnectedEvent>({
            type: PeerConnectionEventTypes.PeerConnected,
            payload: {
              identifier: selectedAid,
              dAppAddress: address,
            },
          });
        }
      }
    );

    this.identityWalletConnect.setOnDisconnect(
      (disConnectMessage: IConnectMessage) => {
        this.connectedDAppAddress = "";
        this.eventEmitter.emit<PeerDisconnectedEvent>({
          type: PeerConnectionEventTypes.PeerDisconnected,
          payload: {
            dAppAddress: disConnectMessage.dApp.address as string,
          },
        });
      }
    );

    this.identityWalletConnect.setEnableExperimentalApi(
      new ExperimentalContainer<ExperimentalAPIFunctions>({
        getKeriIdentifier: this.identityWalletConnect.getKeriIdentifier,
        signKeri: this.identityWalletConnect.signKeri,
      })
    );
  }

  async connectWithDApp(peerConnectionId: string) {
    if (this.identityWalletConnect === undefined) {
      throw new Error(PeerConnection.PEER_CONNECTION_START_PENDING);
    }

    const dAppIdentifier = peerConnectionId.split(":")[0];
    const connectingIdentifier = peerConnectionId.split(":")[1];
    const existingPeerConnection =
      await Agent.agent.peerConnectionAccounts.getPeerConnection(
        peerConnectionId
      );
    if (!existingPeerConnection) {
      await Agent.agent.peerConnectionAccounts.createPeerConnectionAccountRecord(
        {
          peerConnectionId: dAppIdentifier,
          accountId: connectingIdentifier,
          iconB64: ICON_BASE64,
        }
      );
    }
    const seed = this.identityWalletConnect.connect(dAppIdentifier);

    SecureStorage.set(KeyStoreKeys.MEERKAT_SEED, seed);
  }

  disconnectDApp(dAppIdentifier: string, isBroken?: boolean) {
    if (this.identityWalletConnect === undefined) {
      throw new Error(PeerConnection.PEER_CONNECTION_START_PENDING);
    }
    this.identityWalletConnect.disconnect(dAppIdentifier);

    if (isBroken) {
      this.eventEmitter.emit<PeerConnectionBrokenEvent>({
        type: PeerConnectionEventTypes.PeerConnectionBroken,
        payload: {},
      });
    }
  }

  getConnectedDAppAddress() {
    return this.connectedDAppAddress;
  }

  async getConnectingIdentifier() {
    if (this.identityWalletConnect === undefined) {
      throw new Error(PeerConnection.PEER_CONNECTION_START_PENDING);
    }
    return this.identityWalletConnect.getKeriIdentifier();
  }
}

export { PeerConnection };
