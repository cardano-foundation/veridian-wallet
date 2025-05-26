import { randomPasscode, ready as signifyReady } from "signify-ts";
import { config } from "./config";
import { SignifyApi } from "./modules/signify/signifyApi";
import { NotificationRoute } from "./modules/signify/signifyApi.type";
import { readFile, writeFile } from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import path from "path";

class Agent {
  static readonly ISSUER_AID_NAME = "issuer";
  static readonly HOLDER_AID_NAME = "holder";
  static readonly QVI_SCHEMA_SAID =
    "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao";
  static readonly RARE_EVO_DEMO_SCHEMA_SAID =
    "EJxnJdxkHbRw2wVFNe4IUOPLt8fEtg9Sr3WyTjlgKoIb";
  static readonly LE_SCHEMA_SAID =
    "ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY";

  private static instance: Agent;

  private keriRegistryRegk;
  private keriIssuerRegistryRegk;

  signifyApi!: SignifyApi;
  signifyApiIssuer!: SignifyApi;

  private issuerAid;
  private holderAid;
  private qviCredentialId;

  private constructor() {
    this.signifyApi = new SignifyApi();
    this.signifyApiIssuer = new SignifyApi();
  }

  static get agent() {
    if (!this.instance) {
      this.instance = new Agent();
    }
    return this.instance;
  }

  async start(): Promise<void> {
    await signifyReady();
    let bran;
    let issuerBran;
    const bransFilePath = "./data/brans.json";
    const dirPath = path.dirname(bransFilePath);
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
    if (!existsSync(bransFilePath)) {
      // Create new file if the file doesn't exist
      await writeFile(bransFilePath, "");
    }
    const bransFileContent = await readFile(bransFilePath, "utf8");
    if (
      !bransFileContent.includes("bran") &&
      !bransFileContent.includes("issuerBran")
    ) {
      // Write file content if it's empty
      bran = randomPasscode();
      issuerBran = randomPasscode();
      await writeFile(
        bransFilePath,
        JSON.stringify({
          bran,
          issuerBran,
        })
      );
    } else {
      const bransData = JSON.parse(bransFileContent);
      bran = bransData.bran;
      issuerBran = bransData.issuerBran;
    }
    if (bran && issuerBran) {
      await this.signifyApi.start(bran);
      await this.signifyApiIssuer.start(issuerBran);
    }
  }

  async createKeriOobi() {
    return `${await this.signifyApi.getOobi(
      Agent.HOLDER_AID_NAME
    )}?name=CF%20Credential%20Issuance`;
  }

  async resolveOobi(url: string) {
    return this.signifyApi.resolveOobi(url);
  }

  async issueAcdcCredentialByAid(schemaSaid, aid, attribute) {
    if (schemaSaid === Agent.LE_SCHEMA_SAID) {
      return this.signifyApi.leChainedCredential(
        this.qviCredentialId,
        this.keriRegistryRegk,
        this.holderAid.name,
        aid,
        attribute
      );
    }

    return this.signifyApi.issueCredential(
      Agent.HOLDER_AID_NAME,
      this.keriRegistryRegk,
      schemaSaid,
      aid,
      attribute
    );
  }

  async requestDisclosure(schemaSaid, aid, attributes) {
    return this.signifyApi.requestDisclosure(
      Agent.HOLDER_AID_NAME,
      schemaSaid,
      aid,
      attributes
    );
  }

  async contacts() {
    return this.signifyApi.contacts();
  }

  async deleteContact(id: string) {
    return this.signifyApi.deleteContact(id);
  }

  async contactCredentials(contactId: string) {
    const issuer = await this.signifyApi.getIdentifierByName(
      Agent.HOLDER_AID_NAME
    );
    return this.signifyApi.contactCredentials(issuer.prefix, contactId);
  }

  async revokeCredential(credentialId: string, holder: string) {
    return this.signifyApi.revokeCredential(
      Agent.HOLDER_AID_NAME,
      holder,
      credentialId
    );
  }

  async pollNotifications() {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const notifications = await this.signifyApi.getNotifications();
      for (const notif of notifications.notes) {
        await this.processNotification(notif);
      }
      await new Promise((rs) => {
        setTimeout(() => {
          rs(true);
        }, 2000);
      });
    }
  }

  private async processNotification(notif: any) {
    switch (notif.a.r) {
      case NotificationRoute.ExnIpexOffer: {
        const msg = await this.signifyApi.getExchangeMsg(notif.a.d!);
        await this.signifyApi.agreeToAcdcFromOffer(
          Agent.HOLDER_AID_NAME,
          msg.exn.d,
          msg.exn.i
        );
        break;
      }
      default:
        break;
    }
    await this.signifyApi.deleteNotification(notif.i);
  }

  async initKeri(): Promise<void> {
    /* eslint-disable no-console */
    const existingKeriIssuerRegistryRegk = await this.signifyApiIssuer
      .getRegistry(Agent.ISSUER_AID_NAME)
      .catch((e) => {
        console.error(e);
        return undefined;
      });
    const existingKeriRegistryRegk = await this.signifyApi
      .getRegistry(Agent.HOLDER_AID_NAME)
      .catch((e) => {
        console.error(e);
        return undefined;
      });
    // Issuer
    if (existingKeriIssuerRegistryRegk) {
      this.keriIssuerRegistryRegk = existingKeriIssuerRegistryRegk;
    } else {
      await this.signifyApiIssuer
        .createIdentifier(Agent.ISSUER_AID_NAME)
        .catch((e) => console.error(e));
      this.keriIssuerRegistryRegk = await this.signifyApiIssuer
        .createRegistry(Agent.ISSUER_AID_NAME)
        .catch((e) => console.error(e));
    }

    // Holder
    if (existingKeriRegistryRegk) {
      this.keriRegistryRegk = existingKeriRegistryRegk;
    } else {
      await this.signifyApi
        .createIdentifier(Agent.HOLDER_AID_NAME)
        .catch((e) => console.error(e));
      await this.signifyApi.addIndexerRole(Agent.HOLDER_AID_NAME);
      this.keriRegistryRegk = await this.signifyApi
        .createRegistry(Agent.HOLDER_AID_NAME)
        .catch((e) => console.error(e));
    }

    await this.createQVICredential().catch((e) => console.error(e));

    this.pollNotifications();
  }

  async createQVICredential() {
    this.issuerAid = await this.signifyApiIssuer.getIdentifierByName(
      Agent.ISSUER_AID_NAME
    );
    this.holderAid = await this.signifyApi.getIdentifierByName(
      Agent.HOLDER_AID_NAME
    );
    const issuerAidOobi = await this.signifyApiIssuer.getOobi(
      this.issuerAid.name
    );
    const holderAidOobi = await this.signifyApi.getOobi(this.holderAid.name);
    await this.signifyApi.resolveOobi(issuerAidOobi);
    await this.signifyApiIssuer.resolveOobi(holderAidOobi);

    const qviCredentialId = await this.signifyApiIssuer.issueQVICredential(
      this.issuerAid.name,
      this.keriIssuerRegistryRegk,
      this.holderAid.prefix
    );

    this.qviCredentialId = qviCredentialId;

    // wait for notification
    const getHolderNotifications = async () => {
      let holderNotifications = await this.signifyApi.getNotifications();

      while (!holderNotifications.total) {
        holderNotifications = await this.signifyApi.getNotifications();
        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      return holderNotifications;
    };

    const grantNotification = (await getHolderNotifications()).notes[0];

    // resolve schema
    await this.signifyApi.resolveOobi(
      `${config.oobiEndpoint}/oobi/${Agent.QVI_SCHEMA_SAID}`
    );

    // holder IPEX admit
    await this.signifyApi.admitCredential(
      this.holderAid.name,
      grantNotification.a.d!,
      this.issuerAid.prefix
    );
    await this.signifyApi.deleteNotification(grantNotification.i);
  }

  async schemas() {
    return await this.signifyApi.schemas();
  }
}

export { Agent };
