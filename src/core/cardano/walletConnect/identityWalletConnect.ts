import { Buffer } from "buffer";
import {
  Paginate,
  Cip30DataSignature,
  IWalletInfo,
} from "@fabianbormann/cardano-peer-connect/dist/src/types";
import { CardanoPeerConnect } from "@fabianbormann/cardano-peer-connect";
import { Signer } from "signify-ts";
import { AriesAgent } from "../../agent/agent";
import { IdentifierType } from "../../agent/services/identifierService.types";
import { PreferencesStorage } from "../../storage";

class IdentityWalletConnect extends CardanoPeerConnect {
  static readonly IDENTIFIER_ID_NOT_LOCATED =
    "The id doesn't correspond with any stored identifier";
  static readonly NO_IDENTIFIERS_STORED = "No stored identifiers";
  static readonly NO_KERI_IDENTIFIERS_STORED = "No KERI identifiers stored";
  static readonly AID_MISSING_SIGNIFY_NAME =
    "Metadata record for KERI AID is missing the Signify name";

  getIdentifierId: () => Promise<string>;
  signDataWithIdentifier: (
    identifierId: string,
    payload: string
  ) => Promise<string>;
  generateOobi: (identifierId: string) => Promise<string>;

  signerCache: Record<string, Signer>;

  constructor(
    walletInfo: IWalletInfo,
    seed: string | null,
    announce: string[],
    discoverySeed?: string | null
  ) {
    super(walletInfo, {
      seed: seed,
      announce: announce,
      discoverySeed: discoverySeed,
      logLevel: "info",
    });

    this.signerCache = {};

    this.getIdentifierId = async (): Promise<string> => {
      const identifiers = await AriesAgent.agent.identifiers.getIdentifiers();
      if (!(identifiers && identifiers.length > 0)) {
        throw new Error(IdentityWalletConnect.NO_IDENTIFIERS_STORED);
      }

      for (const identifier of identifiers) {
        if (identifier.method === IdentifierType.KERI) {
          return identifier.id;
        }
      }
      throw new Error(IdentityWalletConnect.NO_KERI_IDENTIFIERS_STORED);
    };

    this.signDataWithIdentifier = async (
      identifierId: string,
      payload: string
    ): Promise<string> => {
      if (this.signerCache[identifierId] === undefined) {
        this.signerCache[identifierId] =
          await AriesAgent.agent.identifiers.getSigner(identifierId);
      }
      return this.signerCache[identifierId].sign(Buffer.from(payload)).qb64;
    };

    this.generateOobi = async (identifierId: string): Promise<string> => {
      const identifier = await AriesAgent.agent.identifiers.getIdentifier(
        identifierId
      );

      if (!identifier) {
        throw new Error(
          `${IdentityWalletConnect.IDENTIFIER_ID_NOT_LOCATED} ${identifierId}`
        );
      }

      if (!identifier.result.signifyName) {
        throw new Error(`${IdentityWalletConnect.AID_MISSING_SIGNIFY_NAME}`);
      }

      return await AriesAgent.agent.connections.getKeriOobi(
        identifier.result.signifyName
      );
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
