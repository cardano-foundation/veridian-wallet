import { b, Diger, Salter } from "signify-ts";
import { AgentService } from "./agentService";
import { AgentServicesProps, MiscRecordId } from "../agent.types";
import { LoginAttempts } from "./auth.types";
import { BasicRecord, BasicStorage } from "../records";
import { KeyStoreKeys, SecureStorage } from "../../storage";

class AuthService extends AgentService {
  static readonly MIN_LOCK_TIME = 60 * 1000;
  static readonly SECRET_NOT_STORED =
    "Cannot verify auth as it's not stored in the secure storage";
  protected readonly basicStorage: BasicStorage;

  constructor(
    agentServiceProps: AgentServicesProps,
    basicStorage: BasicStorage
  ) {
    super(agentServiceProps);
    this.basicStorage = basicStorage;
  }

  static readonly LOGIN_ATTEMPT_RECORD_NOT_FOUND =
    "Login attempt record not found";

  async getLoginAttempts(): Promise<LoginAttempts> {
    const attemptInfo = await this.basicStorage.findById(
      MiscRecordId.LOGIN_METADATA
    );

    if (attemptInfo) {
      return attemptInfo.content as unknown as LoginAttempts;
    }

    await this.basicStorage.createOrUpdateBasicRecord(
      new BasicRecord({
        id: MiscRecordId.LOGIN_METADATA,
        content: {
          attempts: 0,
          lockedUntil: Date.now(),
        },
      })
    );

    return {
      attempts: 0,
      lockedUntil: Date.now(),
    };
  }

  async incrementLoginAttempts(): Promise<LoginAttempts> {
    const attemptInfo = await this.basicStorage.findById(
      MiscRecordId.LOGIN_METADATA
    );

    if (!attemptInfo) {
      throw new Error(AuthService.LOGIN_ATTEMPT_RECORD_NOT_FOUND);
    }

    const content = attemptInfo.content as unknown as LoginAttempts;
    const attempts: number = ++content.attempts;
    let lockedUntil: number = content.lockedUntil;
    let lockDuration = 0;

    switch (attempts) {
      case 5:
        lockDuration = AuthService.MIN_LOCK_TIME;
        break;
      case 6:
        lockDuration = 5 * AuthService.MIN_LOCK_TIME;
        break;
      case 7:
        lockDuration = 10 * AuthService.MIN_LOCK_TIME;
        break;
      case 8:
        lockDuration = 15 * AuthService.MIN_LOCK_TIME;
        break;
      case 9:
        lockDuration = 60 * AuthService.MIN_LOCK_TIME;
        break;
      case 10:
        lockDuration = 4 * 60 * AuthService.MIN_LOCK_TIME;
        break;
      default:
        lockDuration = 8 * 60 * AuthService.MIN_LOCK_TIME;
        break;
    }

    if (attempts >= 5) {
      lockedUntil = Date.now() + lockDuration;
    }

    attemptInfo.content.attempts = attempts;
    attemptInfo.content.lockedUntil = lockedUntil;

    await this.basicStorage.update(attemptInfo);
    return { attempts, lockedUntil };
  }

  async resetLoginAttempts(): Promise<void> {
    const attemptInfo = await this.basicStorage.findById(
      MiscRecordId.LOGIN_METADATA
    );

    if (!attemptInfo) {
      throw new Error(AuthService.LOGIN_ATTEMPT_RECORD_NOT_FOUND);
    }

    attemptInfo.content.attempts = 0;
    attemptInfo.content.lockedUntil = Date.now();

    await this.basicStorage.update(attemptInfo);
  }

  async storeSecret(
    type: KeyStoreKeys.APP_PASSCODE | KeyStoreKeys.APP_OP_PASSWORD,
    value: string
  ): Promise<void> {
    const salt = new Salter({});
    const secret = b(value);

    const result = new Uint8Array(salt.raw.length + secret.length);
    result.set(salt.raw);
    result.set(secret, salt.raw.length);

    const dig = new Diger({}, result);
    await SecureStorage.set(type, `${salt.qb64}${dig.qb64}`);
  }

  async verifySecret(
    type: KeyStoreKeys.APP_PASSCODE | KeyStoreKeys.APP_OP_PASSWORD,
    secret: string
  ): Promise<boolean> {
    const qb64 = await SecureStorage.get(type);
    if (!qb64) {
      throw new Error(`${AuthService.SECRET_NOT_STORED} [${type}]`);
    }

    const salt = new Salter({ qb64: qb64.substring(0, 24) });
    const p = b(secret);

    const result = new Uint8Array(salt.raw.length + p.length);
    result.set(salt.raw);
    result.set(p, salt.raw.length);

    const dig = new Diger({ qb64: qb64.substring(24) });
    return new Diger({}, result).qb64 === dig.qb64;
  }
}

export { AuthService };
