import {
  SignifyClient,
  ready as signifyReady,
  Tier,
  Operation,
  Saider,
  Serder,
  State,
  Contact,
} from "signify-ts";
import { waitAndGetDoneOp } from "./utils";
import { config } from "../../config";
import { Agent } from "../../agent";
import { randomSalt } from "../../utils/utils";

export class SignifyApi {
  static readonly DEFAULT_ROLE = "agent";
  static readonly FAILED_TO_RESOLVE_OOBI =
    "Failed to resolve OOBI, operation not completing...";
  static readonly UNKNOW_SCHEMA_ID = "Unknow Schema ID: ";
  static readonly CREDENTIAL_NOT_FOUND = "Not found credential with ID: ";
  static readonly CREDENTIAL_REVOKED_ALREADY =
    "The credential has been revoked already";
  private client!: SignifyClient;
  private opTimeout: number;
  private opRetryInterval: number;

  constructor(opTimeout = 15000, opRetryInterval = 250) {
    this.opTimeout = opTimeout;
    this.opRetryInterval = opRetryInterval;
  }

  /**
   * Must be called first.
   */
  async start(bran: string): Promise<void> {
    await signifyReady();
    this.client = new SignifyClient(
      config.keria.url,
      bran,
      Tier.low,
      config.keria.bootUrl
    );
    try {
      await this.client.connect();
    } catch (err) {
      await this.client.boot();
      await this.client.connect();
    }
  }

  async createIdentifier(name: string): Promise<void> {
    const result = await this.client.identifiers().create(name);
    await waitAndGetDoneOp(this.client, await result.op());
    await this.client
      .identifiers()
      .addEndRole(name, SignifyApi.DEFAULT_ROLE, this.client.agent!.pre);
  }

  async addIndexerRole(name: string): Promise<void> {
    const prefix = (await this.client.identifiers().get(name)).prefix;

    const endResult = await this.client
      .identifiers()
      .addEndRole(name, "indexer", prefix);
    await waitAndGetDoneOp(this.client, await endResult.op());

    const locRes = await this.client.identifiers().addLocScheme(name, {
      url: config.oobiEndpoint,
      scheme: new URL(config.oobiEndpoint).protocol.replace(":", ""),
    });
    await waitAndGetDoneOp(this.client, await locRes.op());
  }

  async getIdentifierByName(name: string): Promise<any> {
    return this.client.identifiers().get(name);
  }

  async getOobi(signifyName: string): Promise<any> {
    const result = await this.client
      .oobis()
      .get(signifyName, SignifyApi.DEFAULT_ROLE);
    return result.oobis[0];
  }

  async resolveOobi(url: string): Promise<any> {
    const urlObj = new URL(url);
    const alias = urlObj.searchParams.get("name") ?? randomSalt();
    urlObj.searchParams.delete("name");
    const strippedUrl = urlObj.toString();

    const operation = (await waitAndGetDoneOp(
      this.client,
      await this.client.oobis().resolve(strippedUrl),
      this.opTimeout,
      this.opRetryInterval
    )) as Operation & { response: State };
    if (!operation.done) {
      throw new Error(SignifyApi.FAILED_TO_RESOLVE_OOBI);
    }
    if (operation.response && operation.response.i) {
      const connectionId = operation.response.i;
      const createdAt = new Date((operation.response as State).dt);
      await this.client.contacts().update(connectionId, {
        alias,
        createdAt,
        oobi: url,
      });
    }
    return operation;
  }

  async createRegistry(name: string) {
    const result = await this.client
      .registries()
      .create({ name, registryName: "vLEI" });
    await result.op();
    const registries = await this.client.registries().list(name);
    return registries[0].regk;
  }

  async getRegistry(name: string) {
    const registries = await this.client.registries().list(name);
    return registries[0].regk;
  }

  async issueCredential(
    issuerName: string,
    registryId: string,
    schemaId: string,
    recipient: string,
    attribute: { [key: string]: string }
  ) {
    await this.resolveOobi(`${config.oobiEndpoint}/oobi/${schemaId}`);

    let vcdata = {};
    if (
      schemaId === Agent.RARE_EVO_DEMO_SCHEMA_SAID ||
      schemaId === Agent.QVI_SCHEMA_SAID
    ) {
      vcdata = attribute;
    } else {
      throw new Error(SignifyApi.UNKNOW_SCHEMA_ID + schemaId);
    }

    const result = await this.client.credentials().issue(issuerName, {
      ri: registryId,
      s: schemaId,
      a: {
        i: recipient,
        ...vcdata,
      },
    });
    await waitAndGetDoneOp(
      this.client,
      result.op,
      this.opTimeout,
      this.opRetryInterval
    );

    const datetime = new Date().toISOString().replace("Z", "000+00:00");
    const [grant, gsigs, gend] = await this.client.ipex().grant({
      senderName: issuerName,
      recipient,
      acdc: result.acdc,
      iss: result.iss,
      anc: result.anc,
      datetime,
    });
    await this.client
      .ipex()
      .submitGrant(issuerName, grant, gsigs, gend, [recipient]);
  }

  async issueQVICredential(
    issuerName: string,
    registryId: string,
    recipientPrefix: string
  ) {
    await this.resolveOobi(
      `${config.oobiEndpoint}/oobi/${Agent.QVI_SCHEMA_SAID}`
    );

    const vcdata = {
      LEI: "5493001KJTIIGC8Y1R17",
    };
    const result = await this.client.credentials().issue(issuerName, {
      ri: registryId,
      s: Agent.QVI_SCHEMA_SAID,
      a: {
        i: recipientPrefix,
        ...vcdata,
      },
    });
    await waitAndGetDoneOp(
      this.client,
      result.op,
      this.opTimeout,
      this.opRetryInterval
    );
    const issuerCredential = await this.client
      .credentials()
      .get(result.acdc.ked.d);
    const datetime = new Date().toISOString().replace("Z", "000+00:00");
    const [grant, gsigs, gend] = await this.client.ipex().grant({
      senderName: issuerName,
      recipient: recipientPrefix,
      acdc: new Serder(issuerCredential.sad),
      anc: new Serder(issuerCredential.anc),
      iss: new Serder(issuerCredential.iss),
      ancAttachment: issuerCredential.ancAttachment,
      datetime,
    });
    const smg = await this.client
      .ipex()
      .submitGrant(issuerName, grant, gsigs, gend, [recipientPrefix]);
    await waitAndGetDoneOp(
      this.client,
      smg,
      this.opTimeout,
      this.opRetryInterval
    );
    return result.acdc.ked.d;
  }

  async admitCredential(
    holderAidName: string,
    d: string,
    issuerAidPrefix: string
  ) {
    const [admit, sigs, aend] = await this.client.ipex().admit({
      senderName: holderAidName,
      message: "",
      grantSaid: d,
      recipient: issuerAidPrefix,
      datetime: new Date().toISOString().replace("Z", "000+00:00"),
    });
    const op = await this.client
      .ipex()
      .submitAdmit(holderAidName, admit, sigs, aend, [issuerAidPrefix]);
    await waitAndGetDoneOp(
      this.client,
      op,
      this.opTimeout,
      this.opRetryInterval
    );
  }

  async leChainedCredential(
    qviCredentialId: string,
    registryId: string,
    holderAidName: string,
    legalEntityAidPrefix: string,
    attribute: { [key: string]: string }
  ) {
    await this.resolveOobi(
      `${config.oobiEndpoint}/oobi/${Agent.LE_SCHEMA_SAID}`
    );
    await this.resolveOobi(
      `${config.oobiEndpoint}/oobi/${Agent.QVI_SCHEMA_SAID}`
    );
    const qviCredential = await this.client.credentials().get(qviCredentialId);

    const result = await this.client.credentials().issue(holderAidName, {
      ri: registryId,
      s: Agent.LE_SCHEMA_SAID,
      a: {
        i: legalEntityAidPrefix,
        ...attribute,
      },
      r: Saider.saidify({
        d: "",
        usageDisclaimer: {
          l: "Usage of a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, does not assert that the Legal Entity is trustworthy, honest, reputable in its business dealings, safe to do business with, or compliant with any laws or that an implied or expressly intended purpose will be fulfilled.",
        },
        issuanceDisclaimer: {
          l: "All information in a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, is accurate as of the date the validation process was complete. The vLEI Credential has been issued to the legal entity or person named in the vLEI Credential as the subject; and the qualified vLEI Issuer exercised reasonable care to perform the validation process set forth in the vLEI Ecosystem Governance Framework.",
        },
      })[1],
      e: Saider.saidify({
        d: "",
        qvi: {
          n: qviCredential.sad.d,
          s: qviCredential.sad.s,
        },
      })[1],
    });

    const leCredential = await this.client.credentials().get(result.acdc.ked.d);

    await waitAndGetDoneOp(
      this.client,
      result.op,
      this.opTimeout,
      this.opRetryInterval
    );

    const [grant, gsigs, gend] = await this.client.ipex().grant({
      senderName: holderAidName,
      acdc: new Serder(leCredential.sad),
      anc: new Serder(leCredential.anc),
      iss: new Serder(leCredential.iss),
      ancAttachment: leCredential.ancAttachment,
      recipient: legalEntityAidPrefix,
      datetime: new Date().toISOString().replace("Z", "000+00:00"),
    });
    await this.client
      .ipex()
      .submitGrant(holderAidName, grant, gsigs, gend, [legalEntityAidPrefix]);
    return result.acdc.ked.d;
  }

  async requestDisclosure(
    senderName: string,
    schemaSaid: string,
    recipient: string,
    attributes: { [key: string]: string }
  ) {
    const [apply, sigs] = await this.client.ipex().apply({
      senderName,
      recipient,
      schemaSaid,
      attributes,
    });
    await this.client.ipex().submitApply(senderName, apply, sigs, [recipient]);
  }

  async contacts(): Promise<Contact[]> {
    // @TODO - foconnor: Temporary hack to add createdAt after one-way scan, doing this now
    // to avoid updating keripy and making a change which might make backwards compatability or migrations harder later.
    const contacts = await this.client.contacts().list();
    for (const contact of contacts) {
      if (!contact.createdAt) {
        contact.createdAt = new Date();
        this.client.contacts().update(contact.id, {
          createdAt: contact.createdAt,
        });
      }
    }

    return contacts;
  }

  async deleteContact(id: string): Promise<any> {
    return this.client.contacts().delete(id);
  }

  async contactCredentials(
    issuerPrefix: string,
    connectionId: string
  ): Promise<any> {
    return this.client.credentials().list({
      filter: {
        "-i": issuerPrefix,
        "-a-i": connectionId,
      },
    });
  }

  async agreeToAcdcFromOffer(
    senderName: string,
    offerSaid: string,
    recipient: string
  ) {
    const [apply, sigs] = await this.client.ipex().agree({
      senderName,
      recipient,
      offerSaid,
    });
    await this.client.ipex().submitAgree(senderName, apply, sigs, [recipient]);
  }

  async getNotifications() {
    return this.client.notifications().list();
  }

  async deleteNotification(said: string) {
    return this.client.notifications().delete(said);
  }

  async getExchangeMsg(said: string) {
    return this.client.exchanges().get(said);
  }

  async revokeCredential(
    issuerName: string,
    holder: string,
    credentialId: string
  ) {
    // TODO: If the credential does not exist, this will throw 500 at the moment. Will change this later
    let credential = await this.client
      .credentials()
      .get(credentialId)
      .catch(() => undefined);
    if (!credential) {
      throw new Error(`${SignifyApi.CREDENTIAL_NOT_FOUND} ${credentialId}`);
    }
    if (credential.status.s === "1") {
      throw new Error(SignifyApi.CREDENTIAL_REVOKED_ALREADY);
    }

    await this.client.credentials().revoke(issuerName, credentialId);

    while (credential.status.s !== "1") {
      credential = await this.client
        .credentials()
        .get(credentialId)
        .catch(() => undefined);
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    const datetime = new Date().toISOString().replace("Z", "000+00:00");
    const [grant, gsigs, gend] = await this.client.ipex().grant({
      senderName: issuerName,
      recipient: holder,
      acdc: new Serder(credential.sad),
      anc: new Serder(credential.anc),
      iss: new Serder(credential.iss),
      datetime,
    });
    const submitGrantOp = await this.client
      .ipex()
      .submitGrant(issuerName, grant, gsigs, gend, [holder]);
    await waitAndGetDoneOp(
      this.client,
      submitGrantOp,
      this.opTimeout,
      this.opRetryInterval
    );
  }
  /**
   * Note - op must be of type any here until Signify cleans up its typing.
   */
  private async waitAndGetDoneOp(
    op: Operation,
    timeout: number,
    interval: number
  ): Promise<Operation> {
    const startTime = new Date().getTime();
    while (!op.done && new Date().getTime() < startTime + timeout) {
      op = await this.client.operations().get(op.name);
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
    return op;
  }

  async schemas() {
    return await this.client.schemas().list();
  }
}
