import { Polaris } from 'polaris-web';

class KERIAuthService {
  private polaris: any = null;

  async initialize() {
    this.polaris = await Polaris.create();
    return this.polaris;
  }

  async authorize() {
    if (!this.polaris) await this.initialize();
    const result = await this.polaris.authorize();
    return result;
  }

  async disconnect() {
    if (this.polaris) {
      await this.polaris.disconnect();
      this.polaris = null;
    }
  }

  getAID() {
    return this.polaris?.aid || null;
  }
}

export const keriAuthService = new KERIAuthService();
