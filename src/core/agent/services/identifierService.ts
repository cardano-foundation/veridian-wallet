import { v4 as uuidv4 } from "uuid";
import { Signer } from "signify-ts";
import { CreateIdentifierResult, IdentifierDetails, IdentifierShortDetails } from "./identifier.types";
import { IdentifierMetadataRecord, IdentifierMetadataRecordProps } from "../records/identifierMetadataRecord";
import { AgentService } from "./agentService";
import { OnlineOnly, waitAndGetDoneOp } from "./utils";
import { AgentServicesProps, IdentifierResult } from "../agent.types";
import { IdentifierStorage } from "../records";
import { ConfigurationService } from "../../configuration";
import { BackingMode } from "../../configuration/configurationService.types";
import { OperationPendingStorage } from "../records/operationPendingStorage";
import { OperationPendingRecordType } from "../records/operationPendingRecord.type";

const identifierTypeThemes = [0, 1];

class IdentifierService extends AgentService {
  static readonly IDENTIFIER_METADATA_RECORD_MISSING =
    "Identifier metadata record does not exist";
  static readonly IDENTIFIER_NOT_ARCHIVED = "Identifier was not archived";
  static readonly THEME_WAS_NOT_VALID = "Identifier theme was not valid";
  static readonly EXN_MESSAGE_NOT_FOUND =
    "There's no exchange message for the given SAID";
  static readonly FAILED_TO_ROTATE_AID =
    "Failed to rotate AID, operation not completing...";
  static readonly FAILED_TO_OBTAIN_KEY_MANAGER =
    "Failed to obtain key manager for given AID";

  protected readonly identifierStorage: IdentifierStorage;
  protected readonly operationPendingStorage: OperationPendingStorage;

  constructor(
    agentServiceProps: AgentServicesProps,
    identifierStorage: IdentifierStorage,
    operationPendingStorage: OperationPendingStorage,
  ) {
    super(agentServiceProps);
    this.identifierStorage = identifierStorage;
    this.operationPendingStorage = operationPendingStorage;
    
  }

  async getIdentifiers(getArchived = false): Promise<IdentifierShortDetails[]> {
    const identifiers: IdentifierShortDetails[] = [];
    const listMetadata: IdentifierMetadataRecord[] =
      await this.identifierStorage.getAllIdentifierMetadata(getArchived);

    for (let i = 0; i < listMetadata.length; i++) {
      const metadata = listMetadata[i];
      identifiers.push({
        displayName: metadata.displayName,
        id: metadata.id,
        signifyName: metadata.signifyName,
        createdAtUTC: metadata.createdAt.toISOString(),
        theme: metadata.theme,
        isPending: metadata.isPending ?? false,
        groupMetadata: metadata.groupMetadata,
      });
    }
    return identifiers;
  }

  @OnlineOnly
  async getIdentifier(
    identifier: string
  ): Promise<IdentifierDetails | undefined> {
    const metadata = await this.identifierStorage.getIdentifierMetadata(
      identifier
    );
    if (metadata.isPending && metadata.signifyOpName) {
      return undefined;
    }
    const aid = await this.signifyClient
      .identifiers()
      .get(metadata.signifyName);

    if (!aid) {
      return undefined;
    }

    return {
      id: aid.prefix,
      displayName: metadata.displayName,
      createdAtUTC: metadata.createdAt.toISOString(),
      signifyName: metadata.signifyName,
      theme: metadata.theme,
      signifyOpName: metadata.signifyOpName,
      isPending: metadata.isPending ?? false,
      s: aid.state.s,
      dt: aid.state.dt,
      kt: aid.state.kt,
      k: aid.state.k,
      nt: aid.state.nt,
      n: aid.state.n,
      bt: aid.state.bt,
      b: aid.state.b,
      di: aid.state.di,
    };
  }

  async getKeriIdentifierByGroupId(
    groupId: string
  ): Promise<IdentifierShortDetails | null> {
    const metadata =
      await this.identifierStorage.getIdentifierMetadataByGroupId(groupId);
    if (!metadata) {
      return null;
    }
    return {
      displayName: metadata.displayName,
      id: metadata.id,
      signifyName: metadata.signifyName,
      createdAtUTC: metadata.createdAt.toISOString(),
      theme: metadata.theme,
      isPending: metadata.isPending ?? false,
    };
  }

  @OnlineOnly
  async createIdentifier(
    metadata: Omit<
      IdentifierMetadataRecordProps,
      "id" | "createdAt" | "isArchived" | "signifyName"
    >
  ): Promise<CreateIdentifierResult> {
    this.validIdentifierMetadata(metadata);
    const signifyName = uuidv4();
    const operation = await this.signifyClient
      .identifiers()
      .create(signifyName); //, this.getCreateAidOptions());
    let op = await operation.op();
    const signifyOpName = op.name;
    const addRoleOperation = await this.signifyClient
      .identifiers()
      .addEndRole(signifyName, "agent", this.signifyClient.agent!.pre);
    await addRoleOperation.op();
    const identifier = operation.serder.ked.i;
    const isPending = !op.done;
    if (isPending) {
      op = await waitAndGetDoneOp(this.signifyClient, op, 2000);
      if (!op.done) {
        await this.operationPendingStorage.save({
          id: op.name,
          recordType: OperationPendingRecordType.IDENTIFIER,
          recordId: identifier,
        })
      }
    }
    await this.identifierStorage.createIdentifierMetadataRecord({
      id: identifier,
      ...metadata,
      signifyOpName: signifyOpName,
      isPending: !op.done,
      signifyName: signifyName,
    });
    // TODO: TEST !op.done
    return { identifier, signifyName, isPending:  !op.done };
  }

  async archiveIdentifier(identifier: string): Promise<void> {
    return this.identifierStorage.updateIdentifierMetadata(identifier, {
      isArchived: true,
    });
  }

  async deleteIdentifier(identifier: string): Promise<void> {
    const metadata = await this.identifierStorage.getIdentifierMetadata(
      identifier
    );
    this.validArchivedIdentifier(metadata);
    await this.identifierStorage.updateIdentifierMetadata(identifier, {
      isDeleted: true,
    });
  }

  async restoreIdentifier(identifier: string): Promise<void> {
    const metadata = await this.identifierStorage.getIdentifierMetadata(
      identifier
    );
    this.validArchivedIdentifier(metadata);
    await this.identifierStorage.updateIdentifierMetadata(identifier, {
      isArchived: false,
    });
  }

  async updateIdentifier(
    identifier: string,
    data: Pick<
      IdentifierMetadataRecordProps,
      "theme" | "displayName" | "groupMetadata"
    >
  ): Promise<void> {
    const metadata = await this.identifierStorage.getIdentifierMetadata(
      identifier
    );
    this.validIdentifierMetadata(metadata);
    return this.identifierStorage.updateIdentifierMetadata(identifier, {
      theme: data.theme,
      displayName: data.displayName,
    });
  }

  @OnlineOnly
  async getSigner(identifier: string): Promise<Signer> {
    const metadata = await this.identifierStorage.getIdentifierMetadata(
      identifier
    );
    this.validIdentifierMetadata(metadata);

    const aid = await this.signifyClient
      .identifiers()
      .get(metadata.signifyName);

    const manager = this.signifyClient.manager;
    if (manager) {
      return (await manager.get(aid)).signers[0];
    } else {
      throw new Error(IdentifierService.FAILED_TO_OBTAIN_KEY_MANAGER);
    }
  }

  @OnlineOnly
  async syncKeriaIdentifiers() {
    const { aids: signifyIdentifiers } = await this.signifyClient
      .identifiers()
      .list();
    const storageIdentifiers =
      await this.identifierStorage.getKeriIdentifiersMetadata();
    const unSyncedData = signifyIdentifiers.filter(
      (identifier: IdentifierResult) =>
        !storageIdentifiers.find((item) => identifier.prefix === item.id)
    );
    if (unSyncedData.length) {
      //sync the storage with the signify data
      for (const identifier of unSyncedData) {
        await this.identifierStorage.createIdentifierMetadataRecord({
          id: identifier.prefix,
          displayName: identifier.prefix, //same as the id at the moment
          theme: 0,
          signifyName: identifier.name,
        });
      }
    }
  }

  private validArchivedIdentifier(metadata: IdentifierMetadataRecord): void {
    if (!metadata.isArchived) {
      throw new Error(
        `${IdentifierService.IDENTIFIER_NOT_ARCHIVED} ${metadata.id}`
      );
    }
  }

  validIdentifierMetadata(
    metadata: Pick<IdentifierMetadataRecordProps, "theme">
  ): void {
    if (metadata.theme && !identifierTypeThemes.includes(metadata.theme)) {
      throw new Error(`${IdentifierService.THEME_WAS_NOT_VALID}`);
    }
  }

  @OnlineOnly
  async rotateIdentifier(metadata: IdentifierMetadataRecord) {
    const rotateResult = await this.signifyClient
      .identifiers()
      .rotate(metadata.signifyName);
    const operation = await waitAndGetDoneOp(
      this.signifyClient,
      await rotateResult.op()
    );
    if (!operation.done) {
      throw new Error(IdentifierService.FAILED_TO_ROTATE_AID);
    }
  }

  private getCreateAidOptions() {
    if (ConfigurationService.env.keri.backing.mode === BackingMode.LEDGER) {
      return {
        toad: 1,
        wits: [ConfigurationService.env.keri.backing.ledger.aid],
        count: 1,
        ncount: 1,
        isith: "1",
        nsith: "1",
        data: [{ ca: ConfigurationService.env.keri.backing.ledger.address }],
      };
    } else if (
      ConfigurationService.env.keri.backing.mode === BackingMode.POOLS
    ) {
      return {
        toad: ConfigurationService.env.keri.backing.pools.length,
        wits: ConfigurationService.env.keri.backing.pools,
      };
    }
    return {};
  }
}

export { IdentifierService };
