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
  ConnectionPairRecord,
  ConnectionPairStorage,
  ConnectionRecord,
  ConnectionStorage,
  ContactRecord,
  ContactStorage,
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
import { LATEST_CONTACT_VERSION } from "../../storage/sqliteStorage/migrations";

class ConnectionService extends AgentService {
  protected readonly connectionStorage!: ConnectionStorage;
  protected readonly connectionPairStorage!: ConnectionPairStorage;
  protected readonly contactStorage!: ContactStorage;
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
    basicStorage: BasicStorage,
    connectionPairStorage: ConnectionPairStorage,
    contactStorage: ContactStorage
  ) {
    super(agentServiceProps);
    this.connectionStorage = connectionStorage;
    this.credentialStorage = credentialStorage;
    this.operationPendingStorage = operationPendingStorage;
    this.identifierStorage = identifierStorage;
    this.basicStorage = basicStorage;
    this.connectionPairStorage = connectionPairStorage;
    this.contactStorage = contactStorage;
  }

  static readonly CONNECTION_NOTE_RECORD_NOT_FOUND =
    "Connection note record not found";
  static readonly CONTACT_METADATA_RECORD_NOT_FOUND =
    "Contact metadata record not found";
  static readonly DEFAULT_ROLE = "agent";
  static readonly FAILED_TO_RESOLVE_OOBI =
    "Failed to resolve OOBI, operation not completing...";
  static readonly CANNOT_GET_OOBI = "No OOBI available from KERIA";
  static readonly OOBI_INVALID = "OOBI URL is invalid";
  static readonly NORMAL_CONNECTIONS_REQUIRE_SHARED_IDENTIFIER =
    "Cannot set up normal connection without specifying a controlling identifier to complete the connection identifier is required for non-multi-sig invites";

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
          this.resolveOobi(event.payload.url);
        }
      }
    );
  }

  onConnectionRemoved() {
    this.props.eventEmitter.on(
      EventTypes.ConnectionRemoved,
      (data: ConnectionRemovedEvent) =>
        this.deleteConnectionByIdAndIdentifier(
          data.payload.contactId,
          data.payload.identifier
        )
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
      const oobiResult = (await this.resolveOobi(url)) as {
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
      if (!sharedIdentifier) {
        throw new Error(ConnectionService.NORMAL_CONNECTIONS_REQUIRE_SHARED_IDENTIFIER);
      }

      this.props.eventEmitter.emit<ConnectionStateChangedEvent>({
        type: EventTypes.ConnectionStateChanged,
        payload: {
          isMultiSigInvite: false,
          connectionId,
          status: ConnectionStatus.PENDING,
          url,
          label: alias,
          identifier: sharedIdentifier,
        },
      });
    }

    return { type: OobiType.NORMAL, connection };
  }

  async getConnections(): Promise<ConnectionShortDetails[]> {
    const connections: any[] = [];

    const connectionPairs = await this.connectionPairStorage.findAllByQuery({
      pendingDeletion: false,
    });

    for (const connectionPair of connectionPairs) {
      const contact = await this.contactStorage.findById(
        connectionPair.contactId
      );

      connections.push({
        id: connectionPair.contactId,
        alias: contact?.alias,
        createdAt: connectionPair.createdAt,
        oobi: contact?.oobi,
        groupId: contact?.groupId,
        creationStatus: connectionPair.creationStatus,
        pendingDeletion: connectionPair.pendingDeletion,
      });
    }

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
    const associatedContacts = await this.contactStorage.findAllByQuery({ groupId });
    for (const contact of associatedContacts) {
      connectionsDetails.push(this.getConnectionShortDetails(contact));
    }
    return connectionsDetails;
  }

  private getConnectionShortDetails(record: any): ConnectionShortDetails {
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
      contactId: record.id,
      groupId: record.groupId,
    };

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

    const sharedIdentifier = connection.sharedIdentifier;

    const notes: Array<ConnectionNoteDetails> = [];
    const historyItems: Array<ConnectionHistoryItem> = [];

    const skippedHistoryTypes = [ConnectionHistoryType.IPEX_AGREE_COMPLETE];

    Object.keys(connection).forEach((key) => {
      if (
        key.startsWith(
          `${sharedIdentifier}:${KeriaContactKeyPrefix.CONNECTION_NOTE}`
        ) &&
        connection[key]
      ) {
        notes.push(JSON.parse(connection[key] as string));
      } else if (
        key.startsWith(
          `${sharedIdentifier}:${KeriaContactKeyPrefix.HISTORY_IPEX}`
        ) ||
        key.startsWith(
          `${sharedIdentifier}:${KeriaContactKeyPrefix.HISTORY_REVOKE}`
        )
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
      createdAtUTC: connection[`${sharedIdentifier}:createdAt`] as string,
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
  async deleteMultisigConnectionById(contactId: string): Promise<void> {
    await this.props.signifyClient
    .contacts()
    .delete(contactId)
    .catch((error) => {
      const status = error.message.split(" - ")[1];
      if (!/404/gi.test(status)) {
        throw error;
      }
      // Idempotent - ignore 404 errors if already deleted
    });
    await this.contactStorage.deleteById(contactId);
  }

  @OnlineOnly
  async deleteConnectionByIdAndIdentifier(
    contactId: string,
    identifier: string
  ): Promise<void> {
    // Check if the connection pair exists
    const connectionPair = await this.connectionPairStorage.findById(
      `${identifier}:${contactId}`
    );

    if (!connectionPair) {
      return; // Nothing to delete
    }

    // Get all connection pairs for this contactId to determine if this is the last one
    const allConnectionPairs = await this.connectionPairStorage.findAllByQuery({
      contactId,
    });

    const isLastConnectionPair = allConnectionPairs.length === 1;

    if (isLastConnectionPair) {
      // If this is the LAST connection pair left:
      // Delete the entire Signify contact immediately
      await this.props.signifyClient
        .contacts()
        .delete(contactId)
        .catch((error) => {
          const status = error.message.split(" - ")[1];
          if (!/404/gi.test(status)) {
            throw error;
          }
          // Idempotent - ignore 404 errors if already deleted
        });

      // Delete the contact locally
      await this.contactStorage.deleteById(contactId);
      await this.connectionPairStorage.deleteById(connectionPair.id);
    } else {
      // If this is not the last (more accounts with this connection):
      // Update KERIA contact to remove fields
      const connection = await this.props.signifyClient
        .contacts()
        .get(contactId)
        .catch((error) => {
          const status = error.message.split(" - ")[1];
          if (!/404/gi.test(status)) {
            throw error;
          }
        });

      if (connection) {
        const contactUpdates: Record<string, unknown> = {};
        Object.keys(connection).forEach((key) => {
          if (key.startsWith(`${identifier}:`)) {
            contactUpdates[key] = null;
          }
        });
  
        await this.props.signifyClient
          .contacts()
          .update(contactId, contactUpdates);

        await this.connectionPairStorage.deleteById(connectionPair.id);
      }
    }
  }

  async markConnectionPendingDelete(
    contactId: string,
    identifier: string
  ): Promise<void> {
    const connectionPairProps = await this.connectionPairStorage.findById(
      `${identifier}:${contactId}`
    );
    if (!connectionPairProps) return;

    connectionPairProps.pendingDeletion = true;
    await this.connectionPairStorage.update(connectionPairProps);

    this.props.eventEmitter.emit<ConnectionRemovedEvent>({
      type: EventTypes.ConnectionRemoved,
      payload: {
        contactId,
        identifier,
      },
    });
  }

  async getConnectionsPendingDeletion(): Promise<ConnectionPairRecord[]> {
    const connectionPairs = await this.connectionPairStorage.findAllByQuery({
      pendingDeletion: true,
    });

    return connectionPairs;
  }

  async getConnectionsPending(): Promise<ContactRecord[]> {
    const connectionPairs = await this.connectionPairStorage.findAllByQuery({
      creationStatus: CreationStatus.PENDING,
    });

    return await Promise.all(
      connectionPairs.map((connectionPair) =>
        this.contactStorage.findExpectedById(connectionPair.contactId)
      )
    );
  }

  async deleteStaleLocalConnectionById(id: string): Promise<void> {
    await this.connectionStorage.deleteById(id);
  }

  async getConnectionShortDetailById(
    id: string
  ): Promise<ConnectionShortDetails> {
    const metadata = await this.getContactMetadataById(id);
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
    const createdAt = new Date(metadata.createdAtUTC as string);
    const contact = await this.contactStorage.findById(connectionId);

    if (!contact) {
      await this.contactStorage.save({
        id: connectionId,
        alias: metadata.alias as string,
        oobi: metadata.oobi as string,
        groupId: metadata.groupId as string,
        createdAt,
      });
    }

    if (!metadata.groupId) {
      await this.connectionPairStorage.save({
        id: `${metadata.sharedIdentifier}:${connectionId}`,
        contactId: connectionId,
        identifier: metadata.sharedIdentifier as string,
        creationStatus: metadata.creationStatus as CreationStatus,
        pendingDeletion: false,
        createdAt,
      });
    }
  }

  private async getContactMetadataById(
    contactId: string
  ): Promise<ContactRecord> {
    const contact = await this.contactStorage.findById(contactId);
    if (!contact) {
      throw new Error(ConnectionService.CONTACT_METADATA_RECORD_NOT_FOUND);
    }
    return contact;
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
              version: LATEST_CONTACT_VERSION,
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

  async removeConnectionsPendingDeletion(): Promise<ConnectionPairRecord[]> {
    const pendingDeletions = await this.getConnectionsPendingDeletion();
    for (const connectionPair of pendingDeletions) {
      await this.deleteConnectionByIdAndIdentifier(
        connectionPair.contactId,
        connectionPair.identifier
      );
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

    const contact = await this.getContactMetadataById(connectionId);
    const externalId = new URL(contact.oobi).searchParams.get(
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
