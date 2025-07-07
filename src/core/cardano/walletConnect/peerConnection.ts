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
import { PeerConnectionStorage } from "../../agent/records";

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
          await Agent.agent.peerConnectionMetadataStorage.updatePeerConnectionMetadata(
            address,
            {
              name,
              selectedAid,
              url,
              iconB64: iconB64,
            }
          );
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

  async connectWithDApp(dAppIdentifier: string) {
    if (this.identityWalletConnect === undefined) {
      throw new Error(PeerConnection.PEER_CONNECTION_START_PENDING);
    }
    const existingPeerConnection =
      await Agent.agent.peerConnectionMetadataStorage
        .getPeerConnectionMetadata(dAppIdentifier)
        .catch((error) => {
          if (
            error.message ===
            PeerConnectionStorage.PEER_CONNECTION_METADATA_RECORD_MISSING
          ) {
            return undefined;
          } else {
            throw error;
          }
        });
    if (!existingPeerConnection) {
      const connectingIdentifier =
        await this.identityWalletConnect.getKeriIdentifier();
      await Agent.agent.peerConnectionMetadataStorage.createPeerConnectionMetadataRecord(
        {
          id: dAppIdentifier,
          selectedAid: connectingIdentifier.id,
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
