import { Ilks } from "signify-ts";
import { AgentServicesProps } from "../agent.types";
import { AgentService } from "./agentService";
import { CredentialMetadataRecordProps } from "../records/credentialMetadataRecord.types";
import {
  CredentialShortDetails,
  ACDCDetails,
  CredentialStatus,
  KeriaCredential,
} from "./credentialService.types";
import { CredentialMetadataRecord } from "../records/credentialMetadataRecord";
import { getCredentialShortDetails, OnlineOnly, SeedPhraseVerified } from "./utils";
import {
  CredentialStorage,
  IdentifierStorage,
  NotificationStorage,
} from "../records";
import {
  AcdcStateChangedEvent,
  CredentialRemovedEvent,
  EventTypes,
} from "../event.types";
import { IdentifierType } from "./identifier.types";

class CredentialService extends AgentService {
  static readonly CREDENTIAL_MISSING_METADATA_ERROR_MSG =
    "Credential metadata missing for stored credential";
  static readonly CREDENTIAL_NOT_ARCHIVED = "Credential was not archived";
  static readonly CREDENTIAL_NOT_FOUND =
    "Credential with given SAID not found on KERIA";
  static readonly CREDENTIAL_NOT_READY_ON_KERIA =
    "Credential not yet available on KERIA";
  private static readonly CREDENTIAL_FETCH_MAX_RETRIES = 3;
  private static readonly CREDENTIAL_FETCH_RETRY_DELAY_MS = 2000;

  protected readonly credentialStorage: CredentialStorage;
  protected readonly notificationStorage!: NotificationStorage;
  protected readonly identifierStorage!: IdentifierStorage;

  constructor(
    agentServiceProps: AgentServicesProps,
    credentialStorage: CredentialStorage,
    notificationStorage: NotificationStorage,
    identifierStorage: IdentifierStorage
  ) {
    super(agentServiceProps);
    this.credentialStorage = credentialStorage;
    this.notificationStorage = notificationStorage;
    this.identifierStorage = identifierStorage;
  }

  onAcdcStateChanged(callback: (event: AcdcStateChangedEvent) => void) {
    this.props.eventEmitter.on(EventTypes.AcdcStateChanged, callback);
  }

  onCredentialRemoved() {
    this.props.eventEmitter.on(
      EventTypes.CredentialRemovedEvent,
      (data: CredentialRemovedEvent) =>
        this.deleteCredential(data.payload.credentialId)
    );
  }

  async getCredentials(
    isGetArchive = false
  ): Promise<CredentialShortDetails[]> {
    const listMetadatas = await this.credentialStorage.getAllCredentialMetadata(
      isGetArchive
    );
    return listMetadatas.map((element: CredentialMetadataRecord) =>
      getCredentialShortDetails(element)
    );
  }

  async getCredentialShortDetailsById(
    id: string
  ): Promise<CredentialShortDetails> {
    return getCredentialShortDetails(await this.getMetadataById(id));
  }

  @SeedPhraseVerified
  @OnlineOnly
  async getCredentialDetailsById(id: string): Promise<ACDCDetails> {
    const metadata = await this.getMetadataById(id);
    const acdc = await this.props.signifyClient
      .credentials()
      .get(metadata.id)
      .catch((error) => {
        const status = error.message.split(" - ")[1];
        if (/404/gi.test(status)) {
          return undefined;
        } else {
          throw error;
        }
      });

    if (!acdc) {
      throw new Error(CredentialService.CREDENTIAL_NOT_FOUND);
    }

    const credentialShortDetails = getCredentialShortDetails(metadata);
    return {
      id: credentialShortDetails.id,
      schema: credentialShortDetails.schema,
      status: credentialShortDetails.status,
      identifierId: credentialShortDetails.identifierId,
      identifierType: credentialShortDetails.identifierType,
      connectionId: credentialShortDetails.connectionId,
      i: acdc.sad.i,
      a: acdc.sad.a,
      s: {
        title: acdc.schema.title,
        description: acdc.schema.description,
        version: acdc.schema.version,
      },
      lastStatus: {
        s: acdc.status.s,
        dt: new Date(acdc.status.dt).toISOString(),
      },
    };
  }

  async createMetadata(data: CredentialMetadataRecordProps): Promise<void> {
    const metadataRecord = new CredentialMetadataRecord(data);
    await this.credentialStorage.saveCredentialMetadataRecord(metadataRecord);
  }

  @SeedPhraseVerified
  async archiveCredential(id: string): Promise<void> {
    await this.credentialStorage.updateCredentialMetadata(id, {
      isArchived: true,
    });
  }

  @SeedPhraseVerified
  async deleteStaleLocalCredential(id: string): Promise<void> {
    await this.credentialStorage.deleteCredentialMetadata(id);
  }

  async deleteCredential(id: string): Promise<void> {
    await this.props.signifyClient
      .credentials()
      .delete(id)
      .catch(async (error) => {
        const status = error.message.split(" - ")[1];
        if (/404/gi.test(status)) {
          return await this.credentialStorage.deleteCredentialMetadata(id);
        } else {
          throw error;
        }
      });

    await this.credentialStorage.deleteCredentialMetadata(id);
  }

  async deleteAllCredentialsForIdentifier(identifierId: string): Promise<void> {
    const credentialsToDelete =
      await this.credentialStorage.getAllCredentialMetadata(
        undefined,
        identifierId
      );

    for (const credential of credentialsToDelete) {
      await this.deleteCredential(credential.id);
    }
  }

  @SeedPhraseVerified
  async markCredentialPendingDeletion(id: string): Promise<void> {
    const metadata = await this.getMetadataById(id);
    this.validArchivedCredential(metadata);

    await this.credentialStorage.updateCredentialMetadata(id, {
      pendingDeletion: true,
    });

    this.props.eventEmitter.emit<CredentialRemovedEvent>({
      type: EventTypes.CredentialRemovedEvent,
      payload: {
        credentialId: id,
      },
    });
  }

  async removeCredentialsPendingDeletion(): Promise<void> {
    const pendingCredentialDeletions =
      await this.credentialStorage.getCredentialsPendingDeletion();

    for (const credential of pendingCredentialDeletions) {
      await this.deleteCredential(credential.id);
    }
  }

  @SeedPhraseVerified
  async restoreCredential(id: string): Promise<void> {
    const metadata = await this.getMetadataById(id);
    this.validArchivedCredential(metadata);
    await this.credentialStorage.updateCredentialMetadata(id, {
      isArchived: false,
    });
  }

  private validArchivedCredential(metadata: CredentialMetadataRecord): void {
    if (!metadata.isArchived) {
      throw new Error(
        `${CredentialService.CREDENTIAL_NOT_ARCHIVED} ${metadata.id}`
      );
    }
  }

  private async getMetadataById(id: string): Promise<CredentialMetadataRecord> {
    const metadata = await this.credentialStorage.getCredentialMetadata(id);
    if (!metadata) {
      throw new Error(CredentialService.CREDENTIAL_MISSING_METADATA_ERROR_MSG);
    }
    return metadata;
  }

  async syncKeriaCredentials(): Promise<void> {
    const cloudCredentials: KeriaCredential[] = [];
    let returned = -1;
    let iteration = 0;

    while (returned !== 0) {
      const result = await this.props.signifyClient.credentials().list({
        skip: iteration * 24,
        limit: 24 + iteration * 24,
      });
      cloudCredentials.push(...result);

      returned = result.length;
      iteration += 1;
    }

    const localCredentials =
      await this.credentialStorage.getAllCredentialMetadata();

    const unSyncedData = cloudCredentials.filter(
      (credential: KeriaCredential) =>
        !localCredentials.find((item) => credential.sad.d === item.id)
    );

    for (const credential of unSyncedData) {
      const hab = await this.props.signifyClient
        .identifiers()
        .get(credential.sad.a.i);
      const telStatus = (
        await this.props.signifyClient
          .credentials()
          .state(credential.sad.ri, credential.sad.d)
      ).et;

      const metadata = {
        id: credential.sad.d,
        isArchived: false,
        issuanceDate: new Date(credential.sad.a.dt).toISOString(),
        credentialType: credential.schema.title,
        status:
          telStatus === Ilks.iss
            ? CredentialStatus.CONFIRMED
            : CredentialStatus.REVOKED,
        connectionId: credential.sad.i,
        schema: credential.schema.$id,
        identifierId: credential.sad.a.i,
        identifierType: hab.group
          ? IdentifierType.Group
          : IdentifierType.Individual,
        createdAt: new Date(credential.sad.a.dt),
      };

      await this.createMetadata(metadata);
    }
  }

  @SeedPhraseVerified
  @OnlineOnly
  async markAcdc(
    credentialId: string,
    status: CredentialStatus.CONFIRMED | CredentialStatus.REVOKED
  ): Promise<void> {
    const metadata = await this.credentialStorage.getCredentialMetadata(
      credentialId
    );
    if (!metadata) {
      throw new Error(CredentialService.CREDENTIAL_MISSING_METADATA_ERROR_MSG);
    }

    // @TODO: The credential will only become available after the IPEX ADMIT has completed for a valid ACDC.
    // It may never complete in cases like the GRANT message containing an invalid ACDC,
    // so we should re-evaluate how to make this more robust in KERIA.
    // For now `ensureCredentialAvailable` will make sure it stays in pending, which is OK for now.
    if (status === CredentialStatus.CONFIRMED) {
      await this.ensureCredentialAvailable(metadata.id);
    }

    metadata.status = status;
    await this.credentialStorage.updateCredentialMetadata(
      metadata.id,
      metadata
    );

    this.props.eventEmitter.emit<AcdcStateChangedEvent>({
      type: EventTypes.AcdcStateChanged,
      payload: {
        status,
        credential: getCredentialShortDetails(metadata),
      },
    });
  }

  private async ensureCredentialAvailable(credentialId: string): Promise<void> {
    let lastStatusMessage = "";
    for (
      let attempt = 1;
      attempt <= CredentialService.CREDENTIAL_FETCH_MAX_RETRIES;
      attempt++
    ) {
      try {
        await this.props.signifyClient.credentials().get(credentialId);
        return;
      } catch (error) {
        if (error instanceof Error) {
          const statusMessage = error.message.split(" - ")[1] ?? "";
          if (/^404/i.test(statusMessage)) {
            lastStatusMessage = statusMessage;
            if (attempt < CredentialService.CREDENTIAL_FETCH_MAX_RETRIES) {
              await new Promise((resolve) =>
                setTimeout(
                  resolve,
                  CredentialService.CREDENTIAL_FETCH_RETRY_DELAY_MS
                )
              );
              continue;
            }
            throw new Error(
              `${CredentialService.CREDENTIAL_NOT_READY_ON_KERIA} (${lastStatusMessage})`
            );
          }
        }
        throw error;
      }
    }
  }
}

export { CredentialService };
