import { Buffer } from "buffer";
import {
  Paginate,
  Cip30DataSignature,
  IWalletInfo,
} from "@fabianbormann/cardano-peer-connect/dist/src/types";
import { CardanoPeerConnect } from "@fabianbormann/cardano-peer-connect";
import { Agent } from "../../agent/agent";
import {
  PeerConnectSigningEvent,
  PeerConnectionEventTypes,
  PeerConnectionError,
  TxSignError,
} from "./peerConnection.types";
import { CoreEventEmitter } from "../../agent/event";
import { SeedPhraseVerified } from "../../agent/services/utils";

class IdentityWalletConnect extends CardanoPeerConnect {
  private selectedAid: string;
  private eventEmitter: CoreEventEmitter;
  static readonly MAX_SIGN_TIME = 3600000;
  static readonly TIMEOUT_INTERVAL = 1000;

  constructor(
    walletInfo: IWalletInfo,
    seed: string | null,
    announce: string[],
    selectedAid: string,
    eventService: CoreEventEmitter,
    discoverySeed?: string | null
  ) {
    super(walletInfo, {
      seed: seed,
      announce: announce,
      discoverySeed: discoverySeed,
      logLevel: "info",
    });
    this.selectedAid = selectedAid;
    this.eventEmitter = eventService;
  }

  async getKeriIdentifier(): Promise<{
    id: string;
    oobi: string;
  }> {
    if (!(await Agent.agent.isSeedPhraseVerified())) {
      throw new Error(Agent.SEED_PHRASE_NOT_VERIFIED);
    }

    const identifier = await Agent.agent.identifiers.getIdentifier(
      this.selectedAid
    );
    return {
      id: this.selectedAid,
      oobi: await Agent.agent.connections.getOobi(identifier.id),
    };
  }

  async signKeri(
    identifier: string,
    payload: string
  ): Promise<string | { error: PeerConnectionError }> {
    if (!(await Agent.agent.isSeedPhraseVerified())) {
      throw new Error(Agent.SEED_PHRASE_NOT_VERIFIED);
    }

    let approved: boolean | undefined = undefined;
    // Closure that updates approved variable
    const approvalCallback = (approvalStatus: boolean) => {
      approved = approvalStatus;
    };
    this.eventEmitter.emit<PeerConnectSigningEvent>({
      type: PeerConnectionEventTypes.PeerConnectSign,
      payload: {
        identifier,
        payload,
        approvalCallback,
      },
    });
    const startTime = Date.now();
    // Wait until approved is true or false
    while (approved === undefined) {
      await new Promise((resolve) =>
        setTimeout(resolve, IdentityWalletConnect.TIMEOUT_INTERVAL)
      );
      if (Date.now() > startTime + IdentityWalletConnect.MAX_SIGN_TIME) {
        return { error: TxSignError.TimeOut };
      }
    }
    if (approved) {
      await Agent.agent.recordCriticalAction();
      return (await Agent.agent.identifiers.getSigner(identifier)).sign(
        Buffer.from(payload)
      ).qb64;
    } else {
      return { error: TxSignError.UserDeclined };
    }
  }

  protected getNetworkId(): Promise<number> {
    throw new Error("Method not implemented.");
  }
  protected getUtxos(
    _amount?: string | undefined,
    _paginate?: Paginate | undefined
  ): Promise<string[] | null> {
    throw new Error("Method not implemented.");
  }
  protected getCollateral(
    _params?: { amount?: string | undefined } | undefined
  ): Promise<string[] | null> {
    throw new Error("Method not implemented.");
  }
  protected getBalance(): Promise<string> {
    throw new Error("Method not implemented.");
  }
  protected getUsedAddresses(): Promise<string[]> {
    throw new Error("Method not implemented.");
  }
  protected getUnusedAddresses(): Promise<string[]> {
    throw new Error("Method not implemented.");
  }
  protected getChangeAddress(): Promise<string> {
    throw new Error("Method not implemented.");
  }
  protected async getRewardAddresses(): Promise<string[]> {
    throw new Error("Method not implemented.");
  }
  protected signTx(_tx: string, _partialSign: boolean): Promise<string> {
    throw new Error("Method not implemented.");
  }
  protected async signData(
    _addr: string,
    _payload: string
  ): Promise<Cip30DataSignature> {
    throw new Error("Method not implemented.");
  }
  protected submitTx(_tx: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
}

export { IdentityWalletConnect };
