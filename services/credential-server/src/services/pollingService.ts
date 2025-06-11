import { NotificationRoute } from "../utils/utils.types";
import { ISSUER_NAME } from "../consts";
import { SignifyClient } from "signify-ts";

export class PollingService {
  constructor(private client: SignifyClient) {}

  async start() {
    this.pollNotifications();
  }

  private async pollNotifications() {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const notifications = await this.client.notifications().list();
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
        const msg = await this.client.exchanges().get(notif.a.d!);
        const [apply, sigs] = await this.client.ipex().agree({
          senderName: ISSUER_NAME,
          recipient: msg.exn.i,
          offerSaid: msg.exn.d,
        });
        await this.client
          .ipex()
          .submitAgree(ISSUER_NAME, apply, sigs, [msg.exn.i]);
        break;
      }
      default:
        break;
    }
    await this.client.notifications().delete(notif.i);
  }
}
