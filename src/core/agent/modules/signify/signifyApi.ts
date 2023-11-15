import { utils } from "@aries-framework/core";
import {
  SignifyClient,
  ready as signifyReady,
  Tier,
  randomPasscode,
} from "signify-ts";
import { KeriContact, CreateIdentifierResult } from "./signifyApi.types";
import { KeyStoreKeys, SecureStorage } from "../../../storage";

export class SignifyApi {
  static readonly LOCAL_KERIA_ENDPOINT =
    "http://dev.keria.cf-keripy.metadata.dev.cf-deployments.org:3901";
  static readonly LOCAL_KERIA_BOOT_ENDPOINT =
    "http://dev.keria.cf-keripy.metadata.dev.cf-deployments.org:3903";
  static readonly BACKER_AID = "BIe_q0F4EkYPEne6jUnSV1exxOYeGf_AMSMvegpF4XQP";
  static readonly FAILED_TO_CREATE_IDENTIFIER =
    "Failed to create new managed AID, operation not completing...";

  // For now we connect to a single backer and hard-code the address - better solution should be provided in the future.
  static readonly BACKER_ADDRESS =
    "addr_test1vq0w66kmwwgkedxpcysfmy6z3lqxnyj7t4zzt5df3xv3qcs6cmmqm";
  static readonly BACKER_CONFIG = {
    toad: 1,
    wits: [SignifyApi.BACKER_AID],
    count: 1,
    ncount: 1,
    isith: "1",
    nsith: "1",
    data: [{ ca: SignifyApi.BACKER_ADDRESS }],
  };
  static readonly DEFAULT_ROLE = "agent";
  static readonly FAILED_TO_RESOLVE_OOBI =
    "Failed to resolve OOBI, operation not completing...";

  private signifyClient!: SignifyClient;
  private opTimeout: number;
  private opRetryInterval: number;

  constructor(opTimeout = 15000, opRetryInterval = 250) {
    this.opTimeout = opTimeout;
    this.opRetryInterval = opRetryInterval;
  }

  /**
   * Must be called first. (guard rails pending)
   */
  async start(): Promise<void> {
    await signifyReady();
    const bran = await this.getBran();
    this.signifyClient = new SignifyClient(
      SignifyApi.LOCAL_KERIA_ENDPOINT,
      bran,
      Tier.low,
      SignifyApi.LOCAL_KERIA_BOOT_ENDPOINT
    );
    try {
      await this.signifyClient.connect();
    } catch (err) {
      await this.signifyClient.boot();
      await this.signifyClient.connect();
    }
  }

  async createIdentifier(): Promise<CreateIdentifierResult> {
    const signifyName = utils.uuid();
    console.log("🚀 ~ file: signifyApi.ts:63 ~ SignifyApi ~ createIdentifier ~ signifyName:", signifyName)
    let operation = await this.signifyClient
      .identifiers()
      .create(signifyName, SignifyApi.BACKER_CONFIG);
    await operation.op();
    await this.signifyClient
      .identifiers()
      .addEndRole(
        signifyName,
        SignifyApi.DEFAULT_ROLE,
        this.signifyClient.agent!.pre
      );
    return {
      signifyName,
      identifier: operation.serder.ked.i,
    };
  }

  async getIdentifierByName(name: string): Promise<any> {
    return this.signifyClient.identifiers().get(name);
  }

  async getOobi(name: string): Promise<string> {
    const result = await this.signifyClient
      .oobis()
      .get(name, SignifyApi.DEFAULT_ROLE);
    return result.oobis[0];
  }

  async getContacts(id?: string): Promise<KeriContact[]> {
    if (id) {
      return this.signifyClient.contacts().list(undefined, "id", id);
    }
    return this.signifyClient.contacts().list();
  }

  async resolveOobi(url: string): Promise<any> {
    const alias = utils.uuid();
    let operation = await this.signifyClient.oobis().resolve(url, alias);
    operation = await this.waitAndGetOp(
      operation,
      this.opTimeout,
      this.opRetryInterval
    );
    if (!operation.done) {
      throw new Error(SignifyApi.FAILED_TO_RESOLVE_OOBI);
    }
    return { ...operation, alias };
  }

  async getNotifications(){
    return this.signifyClient.notifications().list();
  }

  async markNotification(id : string){
    return this.signifyClient.notifications().mark(id)
  }

  async admitIpex(notificationD : string, holderAidName : string){
    const contact = (await this.getContacts())[0]; // TODO: must define how to get it

    const issuerAID = contact.id;
    const dt = new Date().toISOString().replace('Z', '000+00:00');
    const [admit, sigs, aend] = await this.signifyClient.ipex()
      .admit(
        holderAidName,
        '',
        notificationD,
        dt);
    await this.signifyClient.ipex()
      .submitAdmit(holderAidName, admit, sigs, aend, [issuerAID]);
  }

  /**
   * Note - op must be of type any here until Signify cleans up its typing.
   */
  private async waitAndGetOp(
    op: any,
    timeout: number,
    interval: number
  ): Promise<any> {
    const startTime = new Date().getTime();
    while (!op.done && new Date().getTime() < startTime + timeout) {
      op = await this.signifyClient.operations().get(op.name);
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
    return op;
  }

  private async getBran(): Promise<string> {
    let bran;
    try {
      bran = await SecureStorage.get(KeyStoreKeys.SIGNIFY_BRAN);
    } catch (error) {
      bran = randomPasscode();
      await SecureStorage.set(KeyStoreKeys.SIGNIFY_BRAN, bran);
    }
    return bran as string;
  }
}
