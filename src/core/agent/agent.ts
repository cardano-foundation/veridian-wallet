import { Capacitor } from "@capacitor/core";
import {
  randomPasscode,
  SignifyClient,
  ready as signifyReady,
  Tier,
} from "signify-ts";
import { entropyToMnemonic, mnemonicToEntropy } from "bip39";
import {
  AuthService,
  ConnectionService,
  CredentialService,
  IdentifierService,
  KeriaNotificationService,
  MultiSigService,
  IpexCommunicationService,
} from "./services";
import {
  AgentServicesProps,
  BranAndMnemonic,
  AgentUrls,
  MiscRecordId,
  CriticalActionState,
} from "./agent.types";
import { CoreEventEmitter } from "./event";
import {
  BasicRecord,
  BasicStorage,
  CredentialMetadataRecord,
  CredentialStorage,
  IdentifierMetadataRecord,
  IdentifierStorage,
  NotificationRecord,
  NotificationStorage,
  ContactStorage,
  ConnectionPairStorage,
  ContactRecord,
  ConnectionPairRecord,
  PeerConnectionPairRecord,
  PeerConnectionPairStorage,
} from "./records";
import { KeyStoreKeys, SecureStorage } from "../storage";
import { SqliteSession } from "../storage/sqliteStorage/sqliteSession";
import { IonicSession } from "../storage/ionicStorage/ionicSession";
import { IonicStorage } from "../storage/ionicStorage";
import { SqliteStorage } from "../storage/sqliteStorage";
import { BaseRecord } from "../storage/storage.types";
import { OperationPendingStorage } from "./records/operationPendingStorage";
import { OperationPendingRecord } from "./records/operationPendingRecord";
import { EventTypes, KeriaStatusChangedEvent } from "./event.types";
import { isNetworkError, OnlineOnly, randomSalt } from "./services/utils";
import { PeerConnection } from "../cardano/walletConnect/peerConnection";

const walletId = "idw";
class Agent {
  static readonly KERIA_CONNECTION_BROKEN =
    "The app is not connected to KERIA at the moment";
  static readonly SEED_PHRASE_NOT_VERIFIED =
    "Operation blocked: Seed phrase has not been verified.";
  static readonly KERIA_BOOT_FAILED_BAD_NETWORK =
    "Failed to boot due to network connectivity";
  static readonly KERIA_CONNECT_FAILED_BAD_NETWORK =
    "Failed to connect due to network connectivity";
  static readonly SYNC_DATA_NETWORK_ERROR =
    "Failed to sync data due to network connectivity";
  static readonly KERIA_BOOT_FAILED = "Failed to boot signify client";
  static readonly KERIA_BOOTED_ALREADY_BUT_CANNOT_CONNECT =
    "KERIA agent is already booted but cannot connect";
  static readonly KERIA_NOT_BOOTED =
    "Agent has not been booted for a given Signify passcode";
  static readonly MISSING_BRAN_SECURE_STORAGE = "Bran not in secure storage";
  static readonly INVALID_MNEMONIC = "Seed phrase is invalid";
  static readonly CONNECT_URL_DISCOVERY_FAILED = "Cannot discover connect URL";
  static readonly CONNECT_URL_NOT_FOUND = "Connect URL not found in response";
  static readonly MISSING_DATA_ON_KERIA =
    "Attempted to fetch data by ID on KERIA, but was not found. May indicate stale data records in the local database.";
  static readonly BUFFER_ALLOC_SIZE = 3;
  static readonly DEFAULT_RECONNECT_INTERVAL = 1000;
  static readonly CRITICAL_ACTION_LIMIT = 5;
  static readonly VERIFICATION_TIME_LIMIT_MS = 14 * 24 * 60 * 60 * 1000; // 2 weeks
  static readonly REDUCED_TIME_LIMIT_MS = 24 * 60 * 60 * 1000; // 1 day

  private static instance: Agent | undefined;
  private agentServicesProps!: AgentServicesProps;
  private signifyClient!: SignifyClient;
  private seedPhraseVerifiedCache: boolean | undefined;

  private storageSession!: SqliteSession | IonicSession;

  private basicStorageService!: BasicStorage;
  private identifierStorage!: IdentifierStorage;
  private credentialStorage!: CredentialStorage;
  private notificationStorage!: NotificationStorage;

  private operationPendingStorage!: OperationPendingStorage;
  private connectionPairStorage!: ConnectionPairStorage;
  private contactStorage!: ContactStorage;
  private peerConnectionPairStorage!: PeerConnectionPairStorage;
  private identifierService!: IdentifierService;
  private multiSigService!: MultiSigService;
  private ipexCommunicationService!: IpexCommunicationService;
  private connectionService!: ConnectionService;
  private credentialService!: CredentialService;
  private keriaNotificationService!: KeriaNotificationService;
  private authService!: AuthService;

  static isOnline = false;
  public dependenciesInitialized = false;
  public eventListenersSetup = false;
  public isPolling = false;

  get identifiers() {
    if (!this.identifierService) {
      this.identifierService = new IdentifierService(
        this.agentServicesProps,
        this.identifierStorage,
        this.operationPendingStorage,
        this.basicStorage,
        this.notificationStorage,
        this.connections,
        this.credentials
      );
    }
    return this.identifierService;
  }

  get multiSigs() {
    if (!this.multiSigService) {
      this.multiSigService = new MultiSigService(
        this.agentServicesProps,
        this.identifierStorage,
        this.operationPendingStorage,
        this.notificationStorage,
        this.basicStorage,
        this.connections,
        this.identifierService
      );
    }
    return this.multiSigService;
  }

  get ipexCommunications() {
    if (!this.ipexCommunicationService) {
      this.ipexCommunicationService = new IpexCommunicationService(
        this.agentServicesProps,
        this.identifierStorage,
        this.credentialStorage,
        this.notificationStorage,
        this.operationPendingStorage,
        this.multiSigs,
        this.connections
      );
    }
    return this.ipexCommunicationService;
  }

  get connections() {
    if (!this.connectionService) {
      this.connectionService = new ConnectionService(
        this.agentServicesProps,
        this.credentialStorage,
        this.operationPendingStorage,
        this.identifierStorage,
        this.basicStorage,
        this.connectionPairStorage,
        this.contactStorage
      );
    }
    return this.connectionService;
  }

  get credentials() {
    if (!this.credentialService) {
      this.credentialService = new CredentialService(
        this.agentServicesProps,
        this.credentialStorage,
        this.notificationStorage,
        this.identifierStorage
      );
    }
    return this.credentialService;
  }

  get peerConnectionPair() {
    return this.peerConnectionPairStorage;
  }

  get basicStorage() {
    return this.basicStorageService;
  }

  get keriaNotifications() {
    if (!this.keriaNotificationService) {
      this.keriaNotificationService = new KeriaNotificationService(
        this.agentServicesProps,
        this.notificationStorage,
        this.identifierStorage,
        this.operationPendingStorage,
        this.contactStorage,
        this.connectionPairStorage,
        this.credentialStorage,
        this.basicStorage,
        this.multiSigs,
        this.ipexCommunications,
        this.credentialService,
        this.connections,
        this.getKeriaOnlineStatus.bind(this),
        this.markAgentStatus.bind(this),
        this.connect.bind(this)
      );
    }
    return this.keriaNotificationService;
  }

  get auth() {
    if (!this.authService) {
      this.authService = new AuthService(
        this.agentServicesProps,
        this.basicStorage
      );
    }
    return this.authService;
  }

  get client() {
    return this.agentServicesProps.signifyClient;
  }

  private constructor() {
    this.storageSession = Capacitor.isNativePlatform()
      ? new SqliteSession()
      : new IonicSession();
  }

  static get agent() {
    if (!this.instance) {
      this.instance = new Agent();
    }
    return this.instance;
  }

  onKeriaStatusStateChanged(
    callback: (event: KeriaStatusChangedEvent) => void
  ) {
    this.agentServicesProps.eventEmitter.on(
      EventTypes.KeriaStatusChanged,
      callback
    );
  }

  async start(keriaConnectUrl: string): Promise<void> {
    if (!Agent.isOnline) {
      await signifyReady();
      const bran = await this.getBran();
      this.signifyClient = new SignifyClient(keriaConnectUrl, bran, Tier.low);
      this.agentServicesProps.signifyClient = this.signifyClient;
      await this.connectSignifyClient();
    }
  }

  /**
   * Boot and connect to KERIA with automatic connect URL discovery.
   * This overload takes only a boot URL and discovers the connect URL automatically.
   *
   * @param bootUrl The boot URL to use for creating the agent
   * @returns Promise that resolves when boot and connect are complete
   */
  async bootAndConnect(bootUrl: string): Promise<void>;
  /**
   * Boot and connect to KERIA with explicit URLs.
   * This overload takes both boot and connect URLs explicitly.
   *
   * @param agentUrls Object containing both boot and connect URLs
   * @returns Promise that resolves when boot and connect are complete
   */
  async bootAndConnect(agentUrls: AgentUrls): Promise<void>;
  async bootAndConnect(bootUrlOrAgentUrls: string | AgentUrls): Promise<void> {
    if (!Agent.isOnline) {
      let agentUrls: AgentUrls;

      if (typeof bootUrlOrAgentUrls === "string") {
        // Auto-discover connect URL from boot URL
        const bootUrl = bootUrlOrAgentUrls;
        const connectUrl = await this.discoverConnectUrl(bootUrl);
        agentUrls = { bootUrl, url: connectUrl };
      } else {
        // Use provided AgentUrls
        agentUrls = bootUrlOrAgentUrls;
      }

      await signifyReady();
      const bran = await this.getBran();
      this.signifyClient = new SignifyClient(
        agentUrls.url,
        bran,
        Tier.low,
        agentUrls.bootUrl
      );
      this.agentServicesProps.signifyClient = this.signifyClient;
      const bootResult = await this.signifyClient.boot().catch((e) => {
        /* eslint-disable no-console */
        console.error(e);
        if (e.message === "Failed to fetch") {
          throw new Error(Agent.KERIA_BOOT_FAILED_BAD_NETWORK, {
            cause: e,
          });
        }
        throw new Error(Agent.KERIA_BOOT_FAILED, {
          cause: e,
        });
      });

      if (!bootResult.ok && bootResult.status !== 409) {
        /* eslint-disable no-console */
        console.warn(
          `Unexpected KERIA boot status returned: ${bootResult.status} ${bootResult.statusText}`
        );
        throw new Error(Agent.KERIA_BOOT_FAILED);
      }

      await this.connectSignifyClient();
      await this.saveAgentUrls(agentUrls);
      await this.getCriticalActionState(); // Initialize tracking
      this.markAgentStatus(true);
    }
  }

  async recoverKeriaAgent(
    seedPhrase: string[],
    connectUrl: string
  ): Promise<void> {
    const mnemonic = seedPhrase.join(" ");
    let bran = "";
    try {
      const entropy = mnemonicToEntropy(mnemonic);
      const branBuffer = Buffer.from(entropy, "hex").slice(
        0,
        -Agent.BUFFER_ALLOC_SIZE
      );

      bran = branBuffer.toString("utf-8");
    } catch (error) {
      if (error instanceof Error && error.message === "Invalid mnemonic") {
        throw new Error(Agent.INVALID_MNEMONIC, {
          cause: error,
        });
      }
      throw error;
    }

    this.signifyClient = new SignifyClient(connectUrl, bran, Tier.low);
    this.agentServicesProps.signifyClient = this.signifyClient;
    await this.connectSignifyClient();

    await this.basicStorage.save({
      id: MiscRecordId.CLOUD_RECOVERY_STATUS,
      content: { syncing: true },
    });

    await this.markSeedPhraseAsVerified();

    await SecureStorage.set(KeyStoreKeys.SIGNIFY_BRAN, bran);
    await this.saveAgentUrls({
      url: connectUrl,
      bootUrl: "",
    });

    await this.syncWithKeria();
  }

  async syncWithKeria() {
    try {
      await this.identifiers.syncKeriaIdentifiers();
      await this.connections.syncKeriaContacts();
      await this.credentials.syncKeriaCredentials();

      await this.basicStorage.createOrUpdateBasicRecord(
        new BasicRecord({
          id: MiscRecordId.CLOUD_RECOVERY_STATUS,
          content: { syncing: false },
        })
      );
    } catch (e) {
      if (e instanceof Error && isNetworkError(e)) {
        throw new Error(Agent.SYNC_DATA_NETWORK_ERROR);
      }

      throw e;
    }
  }

  private async connectSignifyClient(): Promise<void> {
    await this.signifyClient.connect().catch((error) => {
      if (!(error instanceof Error)) {
        throw error;
      }

      if (isNetworkError(error)) {
        throw new Error(Agent.KERIA_CONNECT_FAILED_BAD_NETWORK, {
          cause: error,
        });
      }

      const status = error.message.split(" - ")[1];
      if (/404/gi.test(status)) {
        throw new Error(Agent.KERIA_NOT_BOOTED, {
          cause: error,
        });
      }

      throw new Error(Agent.KERIA_BOOTED_ALREADY_BUT_CANNOT_CONNECT, {
        cause: error,
      });
    });
  }

  // For now this is called by UI/AppWrapper to not prematurely mark online while mid-recovery
  markAgentStatus(online: boolean) {
    Agent.isOnline = online;

    if (online) {
      // Execute cloud migrations when we come online
      if (this.storageSession instanceof SqliteSession) {
        this.storageSession.executeCloudMigrationsOnConnection();
      }

      this.connections.removeConnectionsPendingDeletion();
      this.connections.resolvePendingConnections();
      this.identifiers.removeIdentifiersPendingDeletion();
      this.identifiers.processIdentifiersPendingCreation();
      this.identifiers.processIdentifiersPendingUpdate();
      this.credentials.removeCredentialsPendingDeletion();
      this.multiSigs.processGroupsPendingCreation();
    }

    this.agentServicesProps.eventEmitter.emit<KeriaStatusChangedEvent>({
      type: EventTypes.KeriaStatusChanged,
      payload: {
        isOnline: online,
      },
    });
  }

  async devPreload() {
    const APP_PASSSCODE_DEV_MODE = "111111";

    const appPasscode = await SecureStorage.get(KeyStoreKeys.APP_PASSCODE);
    if (!appPasscode) {
      await this.auth.storeSecret(
        KeyStoreKeys.APP_PASSCODE,
        APP_PASSSCODE_DEV_MODE
      );
    }

    const appSignifyBran = await SecureStorage.get(KeyStoreKeys.SIGNIFY_BRAN);
    if (!appSignifyBran) {
      await SecureStorage.set(
        KeyStoreKeys.SIGNIFY_BRAN,
        randomPasscode().substring(0, 21)
      );
    }

    await this.basicStorage.createOrUpdateBasicRecord(
      new BasicRecord({
        id: MiscRecordId.APP_ALREADY_INIT,
        content: {
          initialized: true,
        },
      })
    );

    await this.basicStorage.createOrUpdateBasicRecord(
      new BasicRecord({
        id: MiscRecordId.APP_PASSWORD_SKIPPED,
        content: { value: true },
      })
    );

    await this.markSeedPhraseAsVerified();
  }

  /**
   * Discovers the connect URL from the boot URL by calling the /connect endpoint
   * on the same domain as the boot URL.
   *
   * @param bootUrl The boot URL to derive the connect URL from
   * @returns Promise resolving to the connect URL
   * @throws Error if the connect URL cannot be discovered
   */
  async discoverConnectUrl(bootUrl: string): Promise<string> {
    const url = new URL(bootUrl);
    const connectEndpoint = `${url.protocol}//${url.host}/connect`;

    const response = await fetch(connectEndpoint, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(
        `${Agent.CONNECT_URL_DISCOVERY_FAILED} (${response.status})`
      );
    }

    const data = await response.json();
    if (!data.connectUrl) {
      throw new Error(Agent.CONNECT_URL_NOT_FOUND);
    }

    return data.connectUrl;
  }

  private async saveAgentUrls(agentUrls: AgentUrls): Promise<void> {
    await this.basicStorageService.save({
      id: MiscRecordId.KERIA_CONNECT_URL,
      content: {
        url: agentUrls.url,
      },
    });
    await this.basicStorageService.save({
      id: MiscRecordId.KERIA_BOOT_URL,
      content: {
        url: agentUrls.bootUrl,
      },
    });
  }

  async setupLocalDependencies(): Promise<void> {
    this.agentServicesProps = {
      signifyClient: this.signifyClient,
      eventEmitter: new CoreEventEmitter(),
    };
    await this.storageSession.open(walletId);
    this.basicStorageService = new BasicStorage(
      this.getStorageService<BasicRecord>(this.storageSession)
    );
    this.identifierStorage = new IdentifierStorage(
      this.getStorageService<IdentifierMetadataRecord>(this.storageSession)
    );
    this.credentialStorage = new CredentialStorage(
      this.getStorageService<CredentialMetadataRecord>(this.storageSession)
    );
    this.notificationStorage = new NotificationStorage(
      this.getStorageService<NotificationRecord>(this.storageSession)
    );

    this.operationPendingStorage = new OperationPendingStorage(
      this.getStorageService<OperationPendingRecord>(this.storageSession),
      this.agentServicesProps.eventEmitter
    );
    this.connectionPairStorage = new ConnectionPairStorage(
      this.getStorageService<ConnectionPairRecord>(this.storageSession)
    );
    this.contactStorage = new ContactStorage(
      this.getStorageService<ContactRecord>(this.storageSession)
    );
    this.peerConnectionPairStorage = new PeerConnectionPairStorage(
      this.getStorageService<PeerConnectionPairRecord>(this.storageSession)
    );
    this.connections.onConnectionRemoved();
    this.connections.onConnectionAdded();
    this.identifiers.onIdentifierRemoved();
    this.credentials.onCredentialRemoved();
  }

  async connect(
    retryInterval = Agent.DEFAULT_RECONNECT_INTERVAL,
    updateAgentStatus = true
  ) {
    try {
      if (Agent.isOnline) {
        this.markAgentStatus(false);
      }
      await this.signifyClient.connect();

      if (updateAgentStatus) {
        this.markAgentStatus(true);
      }
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, retryInterval));
      await this.connect(retryInterval);
    }
  }

  getKeriaOnlineStatus(): boolean {
    return Agent.isOnline;
  }

  private async getBran(): Promise<string> {
    const bran = await SecureStorage.get(KeyStoreKeys.SIGNIFY_BRAN);
    if (!bran) {
      throw new Error(Agent.MISSING_BRAN_SECURE_STORAGE);
    }
    return bran;
  }

  private getStorageService<T extends BaseRecord>(
    instance: IonicSession | SqliteSession
  ) {
    if (!instance.session) {
      throw new Error("Storage session not initialized");
    }
    if (instance instanceof IonicSession) {
      return new IonicStorage<T>(instance.session);
    }
    return new SqliteStorage<T>(instance.session);
  }

  getBranAndMnemonic(): BranAndMnemonic {
    // This converts the 21 character Signify-TS passcode/bran to a BIP-39 compatible word list.
    // The passcode is assumed as UTF-8 in our recovery. In actuality, it is the qb64 CESR salt without the code.
    // We believe it's easier to encode it as UTF-8 in case there is a change in Signify TS in how the passcode is handled.
    const bran = randomPasscode().substring(0, 21);
    return { bran, mnemonic: this.convertToMnemonic(bran) };
  }

  async getMnemonic(): Promise<string> {
    return this.convertToMnemonic(await this.getBran());
  }

  private convertToMnemonic(bran: string): string {
    // This converts the 21 character Signify-TS passcode/bran to a BIP-39 compatible word list.
    // The passcode is assumed as UTF-8 in our recovery. In actuality, it is the qb64 CESR salt without the code.
    // We believe it's easier to encode it as UTF-8 in case there is a change in Signify TS in how the passcode is handled.
    const passcodeBytes = Buffer.concat([
      Buffer.from(bran, "utf-8"),
      Buffer.alloc(Agent.BUFFER_ALLOC_SIZE),
    ]);
    return entropyToMnemonic(passcodeBytes);
  }

  async isMnemonicValid(mnemonic: string): Promise<boolean> {
    try {
      Buffer.from(mnemonicToEntropy(mnemonic), "hex")
        .toString("utf-8")
        .replace(/\0/g, "");
      return true;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Invalid mnemonic") {
          return false;
        }
      }
      throw error;
    }
  }

  async isSeedPhraseVerified(): Promise<boolean> {
    if (this.seedPhraseVerifiedCache !== undefined) {
      return this.seedPhraseVerifiedCache;
    }
    const record = await this.basicStorage.findById(
      MiscRecordId.SEED_PHRASE_VERIFIED
    );
    this.seedPhraseVerifiedCache = record?.content.verified === true;
    return this.seedPhraseVerifiedCache;
  }

  async markSeedPhraseAsVerified(): Promise<void> {
    this.seedPhraseVerifiedCache = true;
    await this.basicStorage.createOrUpdateBasicRecord(
      new BasicRecord({
        id: MiscRecordId.SEED_PHRASE_VERIFIED,
        content: { verified: true },
      })
    );
  }

  async getCriticalActionState(): Promise<CriticalActionState> {
    const record = await this.basicStorage.findById(
      MiscRecordId.CRITICAL_ACTION_STATE
    );

    if (record) {
      return record.content as CriticalActionState;
    }

    // Initialize if not found (should be done at boot, but safe fallback)
    const initialState: CriticalActionState = {
      actionCount: 0,
      deadline: new Date(
        Date.now() + Agent.VERIFICATION_TIME_LIMIT_MS
      ).toISOString(),
    };

    await this.basicStorage.createOrUpdateBasicRecord(
      new BasicRecord({
        id: MiscRecordId.CRITICAL_ACTION_STATE,
        content: initialState,
      })
    );

    return initialState;
  }

  async recordCriticalAction(): Promise<void> {
    if (await this.isSeedPhraseVerified()) {
      return;
    }

    const state = await this.getCriticalActionState();
    state.actionCount += 1;

    // Check if threshold reached
    if (state.actionCount >= Agent.CRITICAL_ACTION_LIMIT) {
      const currentDeadline = new Date(state.deadline).getTime();
      const now = Date.now();
      const reducedDeadline = now + Agent.REDUCED_TIME_LIMIT_MS;

      // If current deadline is further away than 1 day from now, reduce it
      if (currentDeadline > reducedDeadline) {
        state.deadline = new Date(reducedDeadline).toISOString();
      }
    }

    await this.basicStorage.createOrUpdateBasicRecord(
      new BasicRecord({
        id: MiscRecordId.CRITICAL_ACTION_STATE,
        content: state,
      })
    );
  }

  async isVerificationEnforced(): Promise<boolean> {
    if (await this.isSeedPhraseVerified()) {
      return false;
    }

    const state = await this.getCriticalActionState();
    const deadline = new Date(state.deadline).getTime();
    const now = Date.now();

    return now > deadline;
  }

  @OnlineOnly
  async deleteWallet() {
    const connectedDApp =
      PeerConnection.peerConnection.getConnectedDAppAddress();
    if (connectedDApp !== "") {
      PeerConnection.peerConnection.disconnectDApp(connectedDApp, true);
    }

    this.keriaNotificationService.stopPolling();

    const identifiers = await this.identifierStorage.getAllIdentifiers();
    for (const identifier of identifiers) {
      await this.agentServicesProps.signifyClient
        .identifiers()
        .update(identifier.id, {
          name: `${
            IdentifierService.DELETED_IDENTIFIER_THEME
          }-${randomSalt()}:${identifier.displayName}`,
        });
    }

    const credentials = await this.credentialStorage.getAllCredentialMetadata();
    for (const credential of credentials) {
      await this.agentServicesProps.signifyClient
        .credentials()
        .delete(credential.id)
        .catch(async (error) => {
          const status = error.message.split(" - ")[1];
          if (!/404/gi.test(status)) {
            throw error;
          }
        });
    }

    const connections = await this.contactStorage.getAll();
    for (const connection of connections) {
      await this.agentServicesProps.signifyClient
        .contacts()
        .delete(connection.id)
        .catch((error) => {
          const status = error.message.split(" - ")[1];
          if (!/404/gi.test(status)) {
            throw error;
          }
        });
    }

    const notifications = await this.notificationStorage.getAll();
    for (const notification of notifications) {
      if (!/^\/local/.test(notification.route)) {
        await this.agentServicesProps.signifyClient
          .notifications()
          .mark(notification.id)
          .catch((error) => {
            const status = error.message.split(" - ")[1];
            if (!/404/gi.test(status)) {
              throw error;
            }
          });
      }
    }

    await this.storageSession.wipe(walletId);
    await SecureStorage.wipe();
    this.markAgentStatus(false);
    Agent.instance = undefined;
  }

  /**
   * Wipe local database and secure storage to start fresh.
   */
  async wipeLocalDatabase(): Promise<void> {
    this.keriaNotificationService.stopPolling();
    await this.storageSession.wipe(walletId);
    await SecureStorage.wipe();
    this.markAgentStatus(false);
  }
}

export { Agent };
