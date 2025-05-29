import { SignifyApi } from "../modules/signify/signifyApi";
import { NotificationRoute } from "../modules/signify/signifyApi.types";
import { HOLDER_AID_NAME } from "../consts";

export class PollingService {
  constructor(private signifyApi: SignifyApi) {}

  async start() {
    this.pollNotifications();
  }

  private async pollNotifications() {
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
}
