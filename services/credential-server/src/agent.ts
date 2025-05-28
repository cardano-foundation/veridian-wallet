import { HabState } from "signify-ts";
import { config } from "./config";
import { SignifyApi } from "./modules/signify/signifyApi";
import { NotificationRoute } from "./modules/signify/signifyApi.types";
import {
  HOLDER_AID_NAME,
  ISSUER_AID_NAME,
  LE_SCHEMA_SAID,
  QVI_SCHEMA_SAID,
} from "./consts";

class Agent {
  private static instance: Agent;

  private keriRegistryRegk;
  private keriIssuerRegistryRegk;

  signifyApi!: SignifyApi;
  signifyApiIssuer!: SignifyApi;

  private issuerAid!: HabState;
  private holderAid!: HabState;
  private qviCredentialId!: string;

  static get agent() {
    if (!this.instance) {
      this.instance = new Agent();
    }
    return this.instance;
  }

  // TODO - jorgenavben: to be removed only here to keep things working
  async start(
    signifyApi: SignifyApi,
    signifyApiIssuer: SignifyApi
  ): Promise<void> {
    this.signifyApi = signifyApi;
    this.signifyApiIssuer = signifyApiIssuer;
  }

  async issueAcdcCredentialByAid(schemaSaid, aid, attribute) {
    if (schemaSaid === LE_SCHEMA_SAID) {
      return this.signifyApi.leChainedCredential(
        this.qviCredentialId,
        this.keriRegistryRegk,
        this.holderAid.name,
        aid,
        attribute
      );
    }

    return this.signifyApi.issueCredential(
      HOLDER_AID_NAME,
      this.keriRegistryRegk,
      schemaSaid,
      aid,
      attribute
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
          HOLDER_AID_NAME,
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
      .getRegistry(ISSUER_AID_NAME)
      .catch((e) => {
        console.error(e);
        return undefined;
      });
    const existingKeriRegistryRegk = await this.signifyApi
      .getRegistry(HOLDER_AID_NAME)
      .catch((e) => {
        console.error(e);
        return undefined;
      });
    // Issuer
    if (existingKeriIssuerRegistryRegk) {
      this.keriIssuerRegistryRegk = existingKeriIssuerRegistryRegk;
    } else {
      await this.signifyApiIssuer
        .createIdentifier(ISSUER_AID_NAME)
        .catch((e) => console.error(e));
      this.keriIssuerRegistryRegk = await this.signifyApiIssuer
        .createRegistry(ISSUER_AID_NAME)
        .catch((e) => console.error(e));
    }

    // Holder
    if (existingKeriRegistryRegk) {
      this.keriRegistryRegk = existingKeriRegistryRegk;
    } else {
      await this.signifyApi
        .createIdentifier(HOLDER_AID_NAME)
        .catch((e) => console.error(e));
      await this.signifyApi.addIndexerRole(HOLDER_AID_NAME);
      this.keriRegistryRegk = await this.signifyApi
        .createRegistry(HOLDER_AID_NAME)
        .catch((e) => console.error(e));
    }

    await this.createQVICredential().catch((e) => console.error(e));

    this.pollNotifications();
  }

  async createQVICredential() {
    this.issuerAid = await this.signifyApiIssuer.getIdentifierByName(
      ISSUER_AID_NAME
    );
    this.holderAid = await this.signifyApi.getIdentifierByName(HOLDER_AID_NAME);
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
      `${config.oobiEndpoint}/oobi/${QVI_SCHEMA_SAID}`
    );

    // holder IPEX admit
    await this.signifyApi.admitCredential(
      this.holderAid.name,
      grantNotification.a.d!,
      this.issuerAid.prefix
    );
    await this.signifyApi.deleteNotification(grantNotification.i);
  }
}

export { Agent };
