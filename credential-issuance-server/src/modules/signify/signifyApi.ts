import { utils } from "@aries-framework/core";
import { d, messagize, Serder, Siger, SignifyClient, ready as signifyReady, Tier } from "signify-ts";

export class SignifyApi {
  static readonly LOCAL_KERIA_ENDPOINT =
    "http://dev.keria.cf-keripy.metadata.dev.cf-deployments.org:3901";
  static readonly LOCAL_KERIA_BOOT_ENDPOINT =
    "http://dev.keria.cf-keripy.metadata.dev.cf-deployments.org:3903";
  static readonly SIGNIFY_BRAN = "0123456a89abcdefghlkk"; // @TODO - foconnor: Shouldn't be hard-coded.
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
    this.signifyClient = new SignifyClient(
      SignifyApi.LOCAL_KERIA_ENDPOINT,
      SignifyApi.SIGNIFY_BRAN,
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

  async createIdentifier(signifyName: string): Promise<any> {
    const op = await this.signifyClient
      .identifiers()
      .create(signifyName, SignifyApi.BACKER_CONFIG);
    await op.op();
    const aid1 = await this.getIdentifierByName(signifyName);
    await this.signifyClient
      .identifiers()
      .addEndRole(
        signifyName,
        SignifyApi.DEFAULT_ROLE,
        this.signifyClient.agent!.pre
      );
    return aid1;
  }

  async getIdentifierByName(name: string): Promise<any> {
    return this.signifyClient.identifiers().get(name);
  }

  async getOobi(signifyName: string): Promise<any> {
    const result = await this.signifyClient
      .oobis()
      .get(signifyName, SignifyApi.DEFAULT_ROLE);
    return result.oobis[0];
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
    return operation;
  }

  async createRegistry(name: string): Promise<void> {
    const result = await this.signifyClient
      .registries()
      .create({ name, registryName: "vLEI" });
    await result.op();
    const registries = await this.signifyClient.registries().list(name);
    return registries[0].regk
  }

  async issueCredential(
    issuer: string,
    regk: string,
    schemaSAID: string,
    holder: string
  ) {
    const vcdata = {
      LEI: "5493001KJTIIGC8Y1R17",
    };
    const result = await this.signifyClient
      .credentials()
      .issue(issuer, regk, schemaSAID, holder, vcdata);
    await result.op();
    const acdc = new Serder(result.acdc);
    const iss = result.iserder;
    const ianc = result.anc;

    const sigers = result.sigs.map((sig: string) => new Siger({ qb64: sig }));
    const ims = d(messagize(ianc, sigers));

    const atc = ims.substring(result.anc.size);
    let dt = new Date().toISOString().replace('Z', '000+00:00');
    
    const [grant, gsigs, gend] = await this.signifyClient
        .ipex()
        .grant(
            issuer,
            holder,
            '',
            acdc,
            result.acdcSaider,
            iss,
            result.issExnSaider,
            result.anc,
            atc,
            undefined,
            dt
        );
    await this.signifyClient
        .exchanges()
        .sendFromEvents(issuer, 'credential', grant, gsigs, gend, [
            holder,
        ]);
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
}
