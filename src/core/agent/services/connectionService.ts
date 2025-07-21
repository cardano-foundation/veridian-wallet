import {
  b,
  Cigar,
  Contact,
  d,
  messagize,
  Operation,
  reply,
  Serials,
  Signer,
  State,
} from "signify-ts";
import { Agent } from "../agent";
import {
  AgentServicesProps,
  ConnectionDetails,
  ConnectionNoteDetails,
  ConnectionNoteProps,
  ConnectionShortDetails,
  ConnectionStatus,
  CreationStatus,
  DOOBI_RE,
  OobiType,
  OOBI_AGENT_ONLY_RE,
  OOBI_RE,
  OobiScan,
  WOOBI_RE,
  MiscRecordId,
} from "../agent.types";
import {
  BasicStorage,
  ConnectionRecord,
  ConnectionStorage,
  CredentialStorage,
  IdentifierStorage,
  OperationPendingStorage,
} from "../records";
import { OperationPendingRecordType } from "../records/operationPendingRecord.type";
import { AgentService } from "./agentService";
import { OnlineOnly, randomSalt, waitAndGetDoneOp } from "./utils";
import { StorageMessage } from "../../storage/storage.types";
import {
  ConnectionRemovedEvent,
  ConnectionStateChangedEvent,
  EventTypes,
} from "../event.types";
import {
  ConnectionHistoryItem,
  ConnectionHistoryType,
  HumanReadableMessage,
  KeriaContactKeyPrefix,
  OobiQueryParams,
  RpyRoute,
} from "./connectionService.types";

class ConnectionService extends AgentService {
  protected readonly connectionStorage!: ConnectionStorage;
  protected readonly credentialStorage: CredentialStorage;
  protected readonly operationPendingStorage: OperationPendingStorage;
  protected readonly identifierStorage: IdentifierStorage;
  protected readonly basicStorage: BasicStorage;

  constructor(
    agentServiceProps: AgentServicesProps,
    connectionStorage: ConnectionStorage,
    credentialStorage: CredentialStorage,
    operationPendingStorage: OperationPendingStorage,
    identifierStorage: IdentifierStorage,
    basicStorage: BasicStorage
  ) {
    super(agentServiceProps);
    this.connectionStorage = connectionStorage;
    this.credentialStorage = credentialStorage;
    this.operationPendingStorage = operationPendingStorage;
    this.identifierStorage = identifierStorage;
    this.basicStorage = basicStorage;
  }

  static readonly CONNECTION_NOTE_RECORD_NOT_FOUND =
    "Connection note record not found";
  static readonly CONNECTION_METADATA_RECORD_NOT_FOUND =
    "Connection metadata record not found";
  static readonly DEFAULT_ROLE = "agent";
  static readonly FAILED_TO_RESOLVE_OOBI =
    "Failed to resolve OOBI, operation not completing...";
  static readonly CANNOT_GET_OOBI = "No OOBI available from KERIA";
  static readonly OOBI_INVALID = "OOBI URL is invalid";

  onConnectionStateChanged(
    callback: (event: ConnectionStateChangedEvent) => void
  ) {
    this.props.eventEmitter.on(EventTypes.ConnectionStateChanged, callback);
  }

  onConnectionAdded() {
    this.props.eventEmitter.on(
      EventTypes.ConnectionStateChanged,
      (event: ConnectionStateChangedEvent) => {
        if (
          event.payload.url &&
          event.payload.status === ConnectionStatus.PENDING
        ) {
          this.resolveOobi(event.payload.url, event.payload.isMultiSigInvite);
        }
      }
    );
  }

  onConnectionRemoved() {
    this.props.eventEmitter.on(
      EventTypes.ConnectionRemoved,
      (data: ConnectionRemovedEvent) =>
        this.deleteConnectionById(data.payload.connectionId)
    );
  }

  @OnlineOnly
  async connectByOobiUrl(
    url: string,
    sharedIdentifier?: string
  ): Promise<OobiScan> {
    if (sharedIdentifier) {
      await this.identifierStorage.getIdentifierMetadata(sharedIdentifier); // Error if missing
    }

    if (
      !new URL(url).pathname.match(OOBI_AGENT_ONLY_RE) &&
      !new URL(url).pathname.match(WOOBI_RE)
    ) {
      throw new Error(ConnectionService.OOBI_INVALID);
    }

    const multiSigInvite = url.includes(OobiQueryParams.GROUP_ID);
    const connectionId = new URL(url).pathname
      .split("/oobi/")
      .pop()!
      .split("/")[0];

    const alias =
      new URL(url).searchParams.get(OobiQueryParams.NAME) ?? randomSalt();
    const connectionDate = new Date().toISOString();
    const groupId =
      new URL(url).searchParams.get(OobiQueryParams.GROUP_ID) ?? "";

    const connectionMetadata: Record<string, unknown> = {
      alias,
      oobi: url,
      creationStatus: CreationStatus.PENDING,
      createdAtUTC: connectionDate,
      sharedIdentifier,
    };

    const connection = {
      id: connectionId,
      createdAtUTC: connectionDate,
      oobi: url,
      status: ConnectionStatus.PENDING,
      label: alias,
      groupId,
    };

    if (multiSigInvite) {
      const oobiResult = (await this.resolveOobi(url, multiSigInvite)) as {
        op: Operation & { response: State };
        connection: Contact;
        alias: string;
      };
      connection.id = oobiResult.op.response.i;
      connection.status = ConnectionStatus.CONFIRMED;
      connectionMetadata.creationStatus = CreationStatus.COMPLETE;
      connectionMetadata.createdAtUTC = oobiResult.op.response.dt;
      connectionMetadata.status = ConnectionStatus.CONFIRMED;
      connectionMetadata.groupId = groupId;

      const identifierWithGroupId =
        await this.identifierStorage.getIdentifierMetadataByGroupId(groupId);

      // This allows the calling function to create our smid/rmid member identifier.
      // We let the UI handle it as it requires some metadata from the user like display name.
      if (!identifierWithGroupId) {
        await this.createConnectionMetadata(
          oobiResult.op.response.i,
          connectionMetadata
        ).catch((error) => {
          if (
            !(error instanceof Error) ||
            !error.message.includes(
              StorageMessage.RECORD_ALREADY_EXISTS_ERROR_MSG
            )
          ) {
            throw error;
          }
        });
        return {
          type: OobiType.MULTI_SIG_INITIATOR,
          groupId,
          connection,
        };
      }
    }

    await this.createConnectionMetadata(connectionId, connectionMetadata);

    if (!multiSigInvite) {
      this.props.eventEmitter.emit<ConnectionStateChangedEvent>({
        type: EventTypes.ConnectionStateChanged,
        payload: {
          isMultiSigInvite: false,
          connectionId,
          status: ConnectionStatus.PENDING,
          url,
          label: alias,
        },
      });
    }

    return { type: OobiType.NORMAL, connection };
  }

  async getConnections(): Promise<ConnectionShortDetails[]> {
    const connections = await this.connectionStorage.findAllByQuery({
      groupId: undefined,
      pendingDeletion: false,
    });
    return connections.map((connection) =>
      this.getConnectionShortDetails(connection)
    );
  }

  async getMultisigConnections(): Promise<ConnectionShortDetails[]> {
    const multisigConnections = await this.connectionStorage.findAllByQuery({
      $not: {
        groupId: undefined,
      },
      pendingDeletion: false,
    });

    return multisigConnections.map((connection) =>
      this.getConnectionShortDetails(connection)
    );
  }

  async getMultisigLinkedContacts(
    groupId: string
  ): Promise<ConnectionShortDetails[]> {
    const connectionsDetails: ConnectionShortDetails[] = [];
    const associatedContacts = await this.connectionStorage.findAllByQuery({
      groupId,
      pendingDeletion: false,
    });
    for (const connection of associatedContacts) {
      connectionsDetails.push(this.getConnectionShortDetails(connection));
    }
    return connectionsDetails;
  }

  private getConnectionShortDetails(
    record: ConnectionRecord
  ): ConnectionShortDetails {
    let status = ConnectionStatus.PENDING;
    if (record.creationStatus === CreationStatus.COMPLETE) {
      status = ConnectionStatus.CONFIRMED;
    } else if (record.creationStatus === CreationStatus.FAILED) {
      status = ConnectionStatus.FAILED;
    }

    const connection: ConnectionShortDetails = {
      id: record.id,
      label: record.alias,
      createdAtUTC: record.createdAt.toISOString(),
      status,
      oobi: record.oobi,
    };
    const groupId = record.getTag(OobiQueryParams.GROUP_ID);
    if (groupId) {
      connection.groupId = groupId as string;
    }
    return connection;
  }

  @OnlineOnly
  async getConnectionById(
    id: string,
    full = false
  ): Promise<ConnectionDetails> {
    const connection = await this.props.signifyClient
      .contacts()
      .get(id)
      .catch((error) => {
        const status = error.message.split(" - ")[1];
        if (/404/gi.test(status)) {
          throw new Error(`${Agent.MISSING_DATA_ON_KERIA}: ${id}`, {
            cause: error,
          });
        } else {
          throw error;
        }
      });

    const notes: Array<ConnectionNoteDetails> = [];
    const historyItems: Array<ConnectionHistoryItem> = [];

    const skippedHistoryTypes = [ConnectionHistoryType.IPEX_AGREE_COMPLETE];

    Object.keys(connection).forEach((key) => {
      if (
        key.startsWith(KeriaContactKeyPrefix.CONNECTION_NOTE) &&
        connection[key]
      ) {
        notes.push(JSON.parse(connection[key] as string));
      } else if (
        key.startsWith(KeriaContactKeyPrefix.HISTORY_IPEX) ||
        key.startsWith(KeriaContactKeyPrefix.HISTORY_REVOKE)
      ) {
        const historyItem: ConnectionHistoryItem = JSON.parse(
          connection[key] as string
        );
        if (full || !skippedHistoryTypes.includes(historyItem.historyType)) {
          historyItems.push(historyItem);
        }
      }
    });

    return {
      label: connection.alias,
      id: connection.id,
      status: ConnectionStatus.CONFIRMED,
      createdAtUTC: connection.createdAt as string,
      serviceEndpoints: [connection.oobi],
      notes,
      historyItems: historyItems
        .sort((a, b) => new Date(b.dt).getTime() - new Date(a.dt).getTime())
        .map((messageRecord) => {
          const { historyType, dt, credentialType, id } = messageRecord;
          return {
            id,
            type: historyType,
            timestamp: dt,
            credentialType,
          };
        }),
    };
  }

  @OnlineOnly
  async deleteConnectionById(id: string): Promise<void> {
    await this.props.signifyClient
      .contacts()
      .delete(id)
      .catch((error) => {
        const status = error.message.split(" - ")[1];
        if (!/404/gi.test(status)) {
          throw error;
        }
      });
    await this.connectionStorage.deleteById(id);
  }

  async markConnectionPendingDelete(id: string): Promise<void> {
    const connectionProps = await this.connectionStorage.findById(id);
    if (!connectionProps) return;

    connectionProps.pendingDeletion = true;
    await this.connectionStorage.update(connectionProps);

    this.props.eventEmitter.emit<ConnectionRemovedEvent>({
      type: EventTypes.ConnectionRemoved,
      payload: {
        connectionId: id,
      },
    });
  }

  async getConnectionsPendingDeletion(): Promise<string[]> {
    const connections = await this.connectionStorage.findAllByQuery({
      pendingDeletion: true,
    });

    return connections.map((connection) => connection.id);
  }

  async getConnectionsPending(): Promise<ConnectionRecord[]> {
    const connections = await this.connectionStorage.findAllByQuery({
      creationStatus: CreationStatus.PENDING,
      groupId: undefined,
    });

    return connections;
  }

  async deleteStaleLocalConnectionById(id: string): Promise<void> {
    await this.connectionStorage.deleteById(id);
  }

  async getConnectionShortDetailById(
    id: string
  ): Promise<ConnectionShortDetails> {
    const metadata = await this.getConnectionMetadataById(id);
    return this.getConnectionShortDetails(metadata);
  }

  async createConnectionNote(
    connectionId: string,
    note: ConnectionNoteProps
  ): Promise<void> {
    const id = randomSalt();
    await this.props.signifyClient.contacts().update(connectionId, {
      [`${KeriaContactKeyPrefix.CONNECTION_NOTE}${id}`]: JSON.stringify({
        ...note,
        id: `${KeriaContactKeyPrefix.CONNECTION_NOTE}${id}`,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  async updateConnectionNoteById(
    connectionId: string,
    connectionNoteId: string,
    note: ConnectionNoteProps
  ): Promise<void> {
    await this.props.signifyClient.contacts().update(connectionId, {
      [connectionNoteId]: JSON.stringify(note),
    });
  }

  async deleteConnectionNoteById(
    connectionId: string,
    connectionNoteId: string
  ): Promise<Contact> {
    return this.props.signifyClient.contacts().update(connectionId, {
      [connectionNoteId]: null,
    });
  }

  @OnlineOnly
  async getOobi(
    id: string,
    alias?: string,
    groupId?: string,
    externalId?: string
  ): Promise<string> {
    const result = await this.props.signifyClient.oobis().get(id);
    if (!result.oobis[0]) {
      throw new Error(ConnectionService.CANNOT_GET_OOBI);
    }

    const oobi = new URL(result.oobis[0]);
    const identifier = await this.props.signifyClient.identifiers().get(id);

    // This condition is used for multi-sig oobi
    if (identifier && identifier.group) {
      const pathName = oobi.pathname;
      const agentIndex = pathName.indexOf("/agent/");
      if (agentIndex !== -1) {
        oobi.pathname = pathName.substring(0, agentIndex);
      }
    }
    if (alias !== undefined) oobi.searchParams.set(OobiQueryParams.NAME, alias);
    if (groupId !== undefined)
      oobi.searchParams.set(OobiQueryParams.GROUP_ID, groupId);
    if (externalId !== undefined)
      oobi.searchParams.set(OobiQueryParams.EXTERNAL_ID, externalId);

    return oobi.toString();
  }

  private async createConnectionMetadata(
    connectionId: string,
    metadata: Record<string, unknown> // @TODO - foconnor: Proper typing here.
  ): Promise<void> {
    await this.connectionStorage.save({
      id: connectionId,
      alias: metadata.alias as string,
      oobi: metadata.oobi as string,
      groupId: metadata.groupId as string,
      creationStatus: metadata.creationStatus as CreationStatus,
      createdAt: new Date(metadata.createdAtUTC as string),
      sharedIdentifier: metadata.sharedIdentifier as string,
    });
  }

  private async getConnectionMetadataById(
    connectionId: string
  ): Promise<ConnectionRecord> {
    const connection = await this.connectionStorage.findById(connectionId);
    if (!connection) {
      throw new Error(ConnectionService.CONNECTION_METADATA_RECORD_NOT_FOUND);
    }
    return connection;
  }

  async syncKeriaContacts(): Promise<void> {
    const cloudContacts = await this.props.signifyClient.contacts().list();
    const localContacts = await this.connectionStorage.getAll();

    const unSyncedData = cloudContacts.filter(
      (contact: Contact) =>
        !localContacts.find((item: ConnectionRecord) => contact.id == item.id)
    );

    for (const contact of unSyncedData) {
      await this.createConnectionMetadata(contact.id, {
        alias: contact.alias,
        oobi: contact.oobi,
        groupId: contact.groupCreationId,
        createdAtUTC: contact.createdAt,
        sharedIdentifier: contact.sharedIdentifier ?? "",
        creationStatus: CreationStatus.COMPLETE,
      });
    }
  }

  @OnlineOnly
  async resolveOobi(
    url: string,
    waitForCompletion = true
  ): Promise<{
    op: Operation & { response: State };
    alias: string;
  }> {
    if (
      !new URL(url).pathname.match(OOBI_RE) &&
      !new URL(url).pathname.match(DOOBI_RE) &&
      !new URL(url).pathname.match(WOOBI_RE)
    ) {
      throw new Error(ConnectionService.OOBI_INVALID);
    }

    const urlObj = new URL(url);
    const alias = urlObj.searchParams.get(OobiQueryParams.NAME) ?? randomSalt();
    urlObj.searchParams.delete(OobiQueryParams.NAME);
    const strippedUrl = urlObj.toString();

    let operation: Operation & { response: State };
    if (waitForCompletion) {
      operation = (await waitAndGetDoneOp(
        this.props.signifyClient,
        await this.props.signifyClient.oobis().resolve(strippedUrl),
        5000
      )) as Operation & { response: State };

      if (!operation.done) {
        throw new Error(
          `${ConnectionService.FAILED_TO_RESOLVE_OOBI} [url: ${url}]`
        );
      }

      if (operation.response.i) {
        // Excludes schemas
        const connectionId = operation.response.i;
        const groupCreationId =
          new URL(url).searchParams.get(OobiQueryParams.GROUP_ID) ?? "";
        const createdAt = new Date((operation.response as State).dt);

        try {
          await this.props.signifyClient.contacts().get(connectionId);
        } catch (error) {
          if (
            error instanceof Error &&
            /404/gi.test(error.message.split(" - ")[1])
          ) {
            await this.props.signifyClient.contacts().update(connectionId, {
              alias,
              groupCreationId,
              createdAt,
              oobi: url,
            });
          } else {
            throw error;
          }
        }
      }
    } else {
      operation = await this.props.signifyClient.oobis().resolve(strippedUrl);
      await this.operationPendingStorage.save({
        id: operation.name,
        recordType: OperationPendingRecordType.Oobi,
      });
    }
    return { op: operation, alias };
  }

  async removeConnectionsPendingDeletion(): Promise<string[]> {
    const pendingDeletions = await this.getConnectionsPendingDeletion();
    for (const id of pendingDeletions) {
      await this.deleteConnectionById(id);
    }

    return pendingDeletions;
  }

  async resolvePendingConnections(): Promise<void> {
    const pendingConnections = await this.getConnectionsPending();
    for (const pendingConnection of pendingConnections) {
      await this.resolveOobi(pendingConnection.oobi);
    }
  }

  async shareIdentifier(
    connectionId: string,
    identifier: string
  ): Promise<void> {
    const userName = (
      await this.identifierStorage.getIdentifierMetadata(identifier)
    ).displayName;

    const connectionRecord = await this.getConnectionMetadataById(connectionId);
    const externalId = new URL(connectionRecord.oobi).searchParams.get(
      OobiQueryParams.EXTERNAL_ID
    );
    const oobi = await this.getOobi(
      identifier,
      userName,
      undefined,
      externalId ?? undefined
    );

    const signer = new Signer({ transferable: false });
    const rpyData = {
      cid: signer.verfer.qb64,
      oobi,
    };

    const rpy = reply(
      RpyRoute.INTRODUCE,
      rpyData,
      undefined,
      undefined,
      Serials.JSON
    );
    const sig = signer.sign(new Uint8Array(b(rpy.raw)));
    const ims = d(
      messagize(rpy, undefined, undefined, undefined, [sig as Cigar])
    );

    await this.props.signifyClient.replies().submitRpy(connectionId, ims);
  }

  async getHumanReadableMessage(
    exnSaid: string
  ): Promise<HumanReadableMessage> {
    const exn = (await this.props.signifyClient.exchanges().get(exnSaid)).exn;
    return {
      t: exn.a.t,
      st: exn.a.st,
      c: exn.a.c,
      l: exn.a.l,
    };
  }
}

export { ConnectionService };
