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
  MultisigConnectionDetails,
  MultisigConnectionDetailsFull,
  OobiType,
  OOBI_AGENT_ONLY_RE,
  OOBI_RE,
  OobiScan,
  RegularConnectionDetails,
  RegularConnectionDetailsFull,
  WOOBI_RE,
} from "../agent.types";
import {
  BasicStorage,
  ConnectionPairRecord,
  ConnectionPairStorage,
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
  ConnectionHistoryType,
  KeriaContactKeyPrefix,
  OobiQueryParams,
  RpyRoute,
} from "./connectionService.types";
import type {
  ConnectionHistoryItem,
  ContactDetailsRecord,
  GetOobiParameters,
  HumanReadableMessage,
} from "./connectionService.types";
import { LATEST_CONTACT_VERSION } from "../../storage/sqliteStorage/cloudMigrations";

class ConnectionService extends AgentService {
  protected readonly connectionPairStorage!: ConnectionPairStorage;
  protected readonly contactStorage!: ContactStorage;
  protected readonly credentialStorage: CredentialStorage;
  protected readonly operationPendingStorage: OperationPendingStorage;
  protected readonly identifierStorage: IdentifierStorage;
  protected readonly basicStorage: BasicStorage;

  constructor(
    agentServiceProps: AgentServicesProps,
    credentialStorage: CredentialStorage,
    operationPendingStorage: OperationPendingStorage,
    identifierStorage: IdentifierStorage,
    basicStorage: BasicStorage,
    connectionPairStorage: ConnectionPairStorage,
    contactStorage: ContactStorage
  ) {
    super(agentServiceProps);
    this.credentialStorage = credentialStorage;
    this.operationPendingStorage = operationPendingStorage;
    this.identifierStorage = identifierStorage;
    this.basicStorage = basicStorage;
    this.connectionPairStorage = connectionPairStorage;
    this.contactStorage = contactStorage;
  }

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
          this.resolveOobi(event.payload.url, false);
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
    const oobiPath = new URL(url).pathname.split("/oobi/").pop();
    if (!oobiPath) {
      throw new Error(ConnectionService.OOBI_INVALID);
    }
    const connectionId = oobiPath.split("/")[0];

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

    const connection: ConnectionShortDetails = {
      id: connectionId,
      createdAtUTC: connectionDate,
      oobi: url,
      status: ConnectionStatus.PENDING,
      label: alias,
      contactId: connectionId,
      ...(groupId ? { groupId } : { identifier: sharedIdentifier ?? "" }),
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
        throw new Error(
          ConnectionService.NORMAL_CONNECTIONS_REQUIRE_SHARED_IDENTIFIER
        );
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

  async getConnections(identifier?: string): Promise<ConnectionShortDetails[]> {
    const connections: ContactDetailsRecord[] = [];

    const connectionPairs = await this.connectionPairStorage.findAllByQuery({
      pendingDeletion: false,
      ...(identifier ? { identifier } : {}),
    });

    const contactRecordMap = new Map<string, ContactRecord>();

    for (const connectionPair of connectionPairs) {
      if (!contactRecordMap.has(connectionPair.contactId)) {
        contactRecordMap.set(
          connectionPair.contactId,
          await this.contactStorage.findExpectedById(connectionPair.contactId)
        );
      }
      const contact = contactRecordMap.get(connectionPair.contactId);

      if (contact?.alias && contact?.oobi) {
        connections.push({
          id: connectionPair.contactId,
          alias: contact.alias,
          createdAt: connectionPair.createdAt,
          oobi: contact.oobi,
          groupId: contact.groupId,
          creationStatus: connectionPair.creationStatus,
          pendingDeletion: connectionPair.pendingDeletion,
          identifier: connectionPair.identifier, // Include identifier from connection pair
        });
      }
    }

    return connections.map((connection) =>
      this.getConnectionShortDetails(connection)
    );
  }

  async getMultisigConnections(): Promise<ConnectionShortDetails[]> {
    const multisigConnections = await this.contactStorage.findAllByQuery({
      $not: {
        groupId: undefined,
      },
    });

    return multisigConnections.map((connection) =>
      this.getConnectionShortDetails(connection)
    );
  }

  async getMultisigLinkedContacts(
    groupId: string
  ): Promise<ConnectionShortDetails[]> {
    const connectionsDetails: ConnectionShortDetails[] = [];
    const associatedContacts = await this.contactStorage.findAllByQuery({
      groupId,
    });
    for (const contact of associatedContacts) {
      connectionsDetails.push(this.getConnectionShortDetails(contact));
    }
    return connectionsDetails;
  }

  private getConnectionShortDetails(
    record: ContactDetailsRecord
  ): ConnectionShortDetails {
    let status = ConnectionStatus.PENDING;
    if (record.creationStatus === CreationStatus.COMPLETE) {
      status = ConnectionStatus.CONFIRMED;
    } else if (record.creationStatus === CreationStatus.FAILED) {
      status = ConnectionStatus.FAILED;
    }

    return {
      id: record.id,
      label: record.alias,
      createdAtUTC: record.createdAt.toISOString(),
      status,
      oobi: record.oobi,
      contactId: record.id,
      ...(record.groupId
        ? { groupId: record.groupId }
        : { identifier: record.identifier || "" }),
    };
  }

  async getConnectionById(
    contactId: string
  ): Promise<MultisigConnectionDetailsFull>;
  async getConnectionById(
    contactId: string,
    full: boolean,
    identifier: string
  ): Promise<RegularConnectionDetailsFull>;
  @OnlineOnly
  async getConnectionById(
    contactId: string,
    full = false,
    identifier?: string
  ): Promise<ConnectionDetails> {
    const connection = await this.props.signifyClient
      .contacts()
      .get(contactId)
      .catch((error) => {
        const status = error.message.split(" - ")[1];
        if (/404/gi.test(status)) {
          throw new Error(`${Agent.MISSING_DATA_ON_KERIA}: ${contactId}`, {
            cause: error,
          });
        } else {
          throw error;
        }
      });

    const baseConnectionDetails = {
      label: connection.alias,
      id: connection.id,
      contactId: connection.id,
      status: ConnectionStatus.CONFIRMED,
      serviceEndpoints: [connection.oobi],
    };

    if (identifier) {
      const createdAt = connection[`${identifier}:createdAt`] as string;

      const notes: Array<ConnectionNoteDetails> = [];
      const historyItems: Array<ConnectionHistoryItem> = [];
      const skippedHistoryTypes = [ConnectionHistoryType.IPEX_AGREE_COMPLETE];

      Object.keys(connection).forEach((key) => {
        if (
          key.startsWith(
            `${identifier}:${KeriaContactKeyPrefix.CONNECTION_NOTE}`
          ) &&
          connection[key]
        ) {
          notes.push(JSON.parse(connection[key] as string));
        } else if (
          key.startsWith(
            `${identifier}:${KeriaContactKeyPrefix.HISTORY_IPEX}`
          ) ||
          key.startsWith(
            `${identifier}:${KeriaContactKeyPrefix.HISTORY_REVOKE}`
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
        ...baseConnectionDetails,
        createdAtUTC: createdAt,
        identifier,
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
    } else {
      return {
        ...baseConnectionDetails,
        createdAtUTC: connection.createdAt as string,
        groupId: connection.groupCreationId as string,
        notes: [],
        historyItems: [],
      };
    }
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
    const connectionPair = await this.connectionPairStorage.findExpectedById(
      `${identifier}:${contactId}`
    );

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
    const connectionPairProps =
      await this.connectionPairStorage.findExpectedById(
        `${identifier}:${contactId}`
      );

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

  async deleteStaleLocalConnectionById(
    id: string,
    identifier: string
  ): Promise<void> {
    // Delete the connection pair
    await this.connectionPairStorage.deleteById(`${identifier}:${id}`);

    // Check if this was the last pair for this contact
    const remainingPairs = await this.connectionPairStorage.findAllByQuery({
      contactId: id,
    });

    // If no remaining pairs, delete the contact
    if (remainingPairs.length === 0) {
      await this.contactStorage.deleteById(id);
    }
  }

  async getConnectionShortDetailById(
    id: string
  ): Promise<MultisigConnectionDetails>;
  async getConnectionShortDetailById(
    id: string,
    identifier: string
  ): Promise<RegularConnectionDetails>;
  async getConnectionShortDetailById(
    id: string,
    identifier?: string
  ): Promise<MultisigConnectionDetails | RegularConnectionDetails> {
    const contact = await this.contactStorage.findExpectedById(id);

    let metadata: ContactDetailsRecord;
    if (identifier) {
      const connectionPair = await this.connectionPairStorage.findExpectedById(
        `${identifier}:${id}`
      );

      metadata = {
        id,
        alias: contact.alias,
        createdAt: connectionPair.createdAt,
        oobi: contact.oobi,
        groupId: contact.groupId,
        creationStatus: connectionPair.creationStatus,
        pendingDeletion: connectionPair.pendingDeletion,
        identifier,
      };
    } else {
      metadata = contact;
    }

    return this.getConnectionShortDetails(metadata);
  }

  async createConnectionNote(
    connectionId: string,
    note: ConnectionNoteProps,
    identifier: string
  ): Promise<void> {
    const id = randomSalt();
    await this.props.signifyClient.contacts().update(connectionId, {
      [`${identifier}:${KeriaContactKeyPrefix.CONNECTION_NOTE}${id}`]:
        JSON.stringify({
          ...note,
          id: `${KeriaContactKeyPrefix.CONNECTION_NOTE}${id}`,
          timestamp: new Date().toISOString(),
        }),
    });
  }

  async updateConnectionNoteById(
    connectionId: string,
    connectionNoteId: string,
    note: ConnectionNoteProps,
    identifier: string
  ): Promise<void> {
    await this.props.signifyClient.contacts().update(connectionId, {
      [`${identifier}:${connectionNoteId}`]: JSON.stringify(note),
    });
  }

  async deleteConnectionNoteById(
    connectionId: string,
    connectionNoteId: string,
    identifier: string
  ): Promise<Contact> {
    return this.props.signifyClient.contacts().update(connectionId, {
      [`${identifier}:${connectionNoteId}`]: null,
    });
  }

  @OnlineOnly
  async getOobi(id: string, parameters?: GetOobiParameters): Promise<string> {
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
    if (parameters?.alias !== undefined) {
      oobi.searchParams.set(OobiQueryParams.NAME, parameters.alias);
    }
    if (parameters?.groupId !== undefined) {
      oobi.searchParams.set(OobiQueryParams.GROUP_ID, parameters.groupId);
    }
    if (parameters?.groupName !== undefined) {
      oobi.searchParams.set(OobiQueryParams.GROUP_NAME, parameters.groupName);
    }
    if (parameters?.externalId !== undefined) {
      oobi.searchParams.set(OobiQueryParams.EXTERNAL_ID, parameters.externalId);
    }

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

  async syncKeriaContacts(): Promise<void> {
    const localIdentifiers = await this.identifierStorage.getAllIdentifiers();
    const localAIDs = localIdentifiers.map((id) => id.id);
    const cloudContacts = await this.props.signifyClient.contacts().list();

    for (const contact of cloudContacts) {
      const contactExists = await this.contactStorage.findById(contact.id);

      if (!contactExists) {
        await this.contactStorage.save({
          id: contact.id,
          alias: contact.alias,
          oobi: contact.oobi,
          groupId: contact.groupCreationId as string | undefined,
          createdAt: contact.groupCreationId
            ? new Date(contact.createdAt as string)
            : new Date(),
        });
      }

      for (const key of Object.keys(contact)) {
        const keyParts = key.split(":");
        if (keyParts.length === 2 && keyParts[1] === "createdAt") {
          const aid = keyParts[0];
          if (localAIDs.includes(aid)) {
            const pairId = `${aid}:${contact.id}`;
            const pairExists = await this.connectionPairStorage.findById(
              pairId
            );

            if (!pairExists) {
              await this.connectionPairStorage.save({
                id: pairId,
                contactId: contact.id,
                identifier: aid,
                creationStatus: CreationStatus.COMPLETE,
                pendingDeletion: false,
                createdAt: new Date(contact[key] as string),
              });
            }
          }
        }
      }
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
      await this.resolveOobi(pendingConnection.oobi, false);
    }
  }

  async oneWayScanningLogin(
    connectionId: string,
    backendApi: string,
    profileAid: string
  ): Promise<void> {
    try {
      await this.props.signifyClient.contacts().get(connectionId);
    } catch (error) {
      if (
        error instanceof Error &&
        /404/gi.test(error.message.split(" - ")[1])
      ) {
        await this.props.signifyClient
          .contacts()
          .update(connectionId, { alias: backendApi });
        // TODO: create a real contact for this profile/profileAid if not notifications appear as unknown  
      } else {
        throw error;
      }
    }

    const identifierMetadata =
      await this.identifierStorage.getIdentifierMetadata(profileAid);

    const profileOobi = await this.getOobi(profileAid, {
      alias: identifierMetadata.displayName,
    });

    const signer = new Signer({ transferable: false });
    const rpyData = {
      cid: signer.verfer.qb64,
      oobi: profileOobi,
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

  async shareIdentifier(
    connectionId: string,
    identifier: string
  ): Promise<void> {
    const contact = await this.contactStorage.findExpectedById(connectionId);
    const externalId = new URL(contact.oobi).searchParams.get(
      OobiQueryParams.EXTERNAL_ID
    );
    const identifierMetadata =
      await this.identifierStorage.getIdentifierMetadata(identifier);
    const oobi = await this.getOobi(identifier, {
      alias: identifierMetadata.displayName,
      externalId: externalId ?? undefined,
    });

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

  async deleteAllConnectionsForIdentifier(identifierId: string): Promise<void> {
    const pairsToDelete = await this.connectionPairStorage.findAllByQuery({
      identifier: identifierId,
    });

    for (const pair of pairsToDelete) {
      await this.deleteConnectionByIdAndIdentifier(
        pair.contactId,
        pair.identifier
      );
    }
  }

  async deleteAllConnectionsForGroup(groupId: string): Promise<void> {
    const groupContacts = await this.contactStorage.findAllByQuery({ groupId });

    for (const contact of groupContacts) {
      await this.deleteMultisigConnectionById(contact.id);
    }
  }
}

export { ConnectionService };
