import { Buffer } from "buffer";
import {
  Paginate,
  Cip30DataSignature,
  IWalletInfo,
} from "@fabianbormann/cardano-peer-connect/dist/src/types";
import { CardanoPeerConnect } from "@fabianbormann/cardano-peer-connect";
import { Signer } from "signify-ts";
import { Agent } from "../../agent/agent";
import {
  PeerConnectSigningEvent,
  PeerConnectSigningEventTypes,
} from "./peerConnection.types";
import { EventService } from "../../agent/services/eventService";

class IdentityWalletConnect extends CardanoPeerConnect {
  static readonly IDENTIFIER_ID_NOT_LOCATED =
    "The id doesn't correspond with any stored identifier";
  private selectedAid: string;
  private eventService: EventService;
  getIdentifierOobi: () => Promise<string>;
  sign: (identifier: string, payload: string) => Promise<string>;

  signerCache: Map<string, Signer>;

  constructor(
    walletInfo: IWalletInfo,
    seed: string | null,
    announce: string[],
    selectedAid: string,
    eventService: EventService,
    discoverySeed?: string | null
  ) {
    super(walletInfo, {
      seed: seed,
      announce: announce,
      discoverySeed: discoverySeed,
      logLevel: "info",
    });
    this.selectedAid = selectedAid;
    this.signerCache = new Map();
    this.eventService = eventService;

    this.getIdentifierOobi = async (): Promise<string> => {
      const identifier = await Agent.agent.identifiers.getIdentifier(
        this.selectedAid
      );
      if (!identifier) {
        throw new Error(IdentityWalletConnect.IDENTIFIER_ID_NOT_LOCATED);
      }
      return Agent.agent.connections.getOobi(identifier.signifyName);
    };

    this.sign = async (
      identifier: string,
      payload: string,
      onSignError?: (error: Error) => void
    ): Promise<string> => {
      let approved: boolean | undefined = undefined;
      // Closure that updates approved variable
      const approvalCallback = (approvalStatus: boolean) => {
        approved = approvalStatus;
      };
      this.eventService.emit<PeerConnectSigningEvent>({
        type: PeerConnectSigningEventTypes.PeerConnectSign,
        payload: {
          identifier,
          payload,
          approvalCallback,
        },
      });
      let timeLeft = 3600000;
      // Wait until approved is true or false
      while (approved === undefined) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        timeLeft -= 1000;
        if (timeLeft <= 0) {
          if (typeof onSignError === "function") {
            onSignError(new Error("Time out"));
          }
          throw new Error("Time out");
        }
      }
      if (approved) {
        if (this.signerCache.get(identifier) === undefined) {
          this.signerCache.set(
            identifier,
            await Agent.agent.identifiers.getSigner(identifier)
          );
        }
        return this.signerCache.get(identifier)!.sign(Buffer.from(payload))
          .qb64;
      } else {
        if (typeof onSignError === "function") {
          onSignError(new Error("User declined the signing request"));
        }
        throw new Error("User declined the signing request");
      }
    };
  }

  protected getNetworkId(): Promise<number> {
    throw new Error("Method not implemented.");
  }
  protected getUtxos(
    amount?: string | undefined,
    paginate?: Paginate | undefined
  ): Promise<string[] | null> {
    throw new Error("Method not implemented.");
  }
  protected getCollateral(
    params?: { amount?: string | undefined } | undefined
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
  protected signTx(tx: string, partialSign: boolean): Promise<string> {
    throw new Error("Method not implemented.");
  }
  protected async signData(
    addr: string,
    payload: string
  ): Promise<Cip30DataSignature> {
    throw new Error("Method not implemented.");
  }
  protected submitTx(tx: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
}

export { IdentityWalletConnect };
