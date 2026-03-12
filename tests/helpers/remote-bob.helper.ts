/**
 * E2E helper for Alice-initiator scenario: Bob = backend user (KERIA/Signify).
 * Bob provides an OOBI (with groupId/groupName) for the app to paste; no group creation on Bob's side.
 */
import { Algos, ready, SignifyClient, Tier } from "signify-ts";
import { getKeriaUrlsForTestRunner } from "./ssi-agent-urls.helper.js";

const OP_POLL_INTERVAL_MS = 2000;
const INITIATOR_BRAN = process.env.REMOTE_INITIATOR_BRAN ?? "0AAAAAAAAAAAAAAAAAAAA";

export async function init(): Promise<void> {
  await ready();
  const { bootUrl } = getKeriaUrlsForTestRunner();
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 5000);
  try {
    await fetch(bootUrl + "/boot", { method: "GET", signal: controller.signal });
  } catch (e) {
    clearTimeout(t);
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `KERIA not reachable at ${bootUrl} (${msg}). Start KERIA on host (e.g. docker-compose up -d keria).`
    );
  }
  clearTimeout(t);
}

export class User {
  private static instance: User | null = null;

  public client!: SignifyClient;
  public prefix!: string;
  public aidAlias: string;

  constructor(prefixArg: string) {
    this.aidAlias = `${prefixArg}_AID`;
  }

  static getInstance(prefixArg = "Bob"): User {
    if (User.instance == null) {
      User.instance = new User(prefixArg);
    }
    return User.instance;
  }

  static reset(): void {
    User.instance = null;
  }

  async setup(): Promise<void> {
    await init();
    const { bootUrl, connectUrl } = getKeriaUrlsForTestRunner();

    this.client = new SignifyClient(connectUrl, INITIATOR_BRAN, Tier.low, bootUrl);

    try {
      const bootResult = await this.client.boot();
      if (!bootResult.ok && bootResult.status !== 409) {
        throw new Error(`KERIA boot failed with status ${bootResult.status}`);
      }
      await this.client.connect();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("fetch failed") || msg.includes("ECONNREFUSED") || msg.includes("ENOTFOUND")) {
        throw new Error(`Cannot reach KERIA at ${bootUrl}. Ensure KERIA is running.`);
      }
      throw err;
    }

    try {
      const createResult = await this.client.identifiers().create(this.aidAlias, { algo: Algos.salty });
      this.prefix = createResult.serder.pre;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/400/gi.test(msg) && /already incepted/gi.test(msg)) {
        const hab = await this.client.identifiers().get(this.aidAlias);
        this.prefix = hab.prefix;
      } else {
        throw err;
      }
    }

    const role = new Role(this);
    await role.add("agent");
    if (role.addOperation) await this.waitOperationInternal(role.addOperation);
  }

  AID = {
    get: async (alias = this.aidAlias) => this.client.identifiers().get(alias),
  };

  oobi = {
    get: async () => {
      const result = await this.client.oobis().get(this.aidAlias);
      if (!result.oobis?.[0]) throw new Error("No OOBI for Bob member AID");
      return result.oobis[0];
    },
  };

  async waitOperationInternal(operation: { name: string }, timeoutMs = 30000): Promise<{ name: string; done?: boolean; error?: unknown }> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      try {
        const op = await this.client.operations().get(operation.name);
        if (op?.done === true) return op as { name: string; done: boolean; error?: unknown };
      } catch (_) {}
      await new Promise((r) => setTimeout(r, OP_POLL_INTERVAL_MS));
    }
    throw new Error(`Operation ${operation.name} did not complete within ${timeoutMs}ms`);
  }

  /** IBackendUser contract: wait for a KERIA operation to complete. */
  async waitOperation(operationId: string, timeoutMs?: number): Promise<void> {
    await this.waitOperationInternal({ name: operationId }, timeoutMs);
  }

  /** IBackendUser contract: return this user's AID (prefix). */
  async getAid(): Promise<string> {
    return this.prefix;
  }

  /** Returns OOBI URL; options.groupId/groupName are for app group connection flow. */
  async getOobi(options?: { alias?: string; groupId?: string; groupName?: string }): Promise<string> {
    const base = await this.oobi.get();
    const oobi = new URL(base);
    if (options?.alias != null) oobi.searchParams.set("name", options.alias);
    if (options?.groupId != null) oobi.searchParams.set("groupId", options.groupId);
    if (options?.groupName != null) oobi.searchParams.set("groupName", options.groupName);
    return oobi.toString();
  }

  /**
   * IBackendUser contract: wait for initiator's multisig ICP and accept/join the group.
   * To be implemented by the dev; see tests/helpers/README-Backend-API.md 
   */
  async acceptGroupInvitation(_timeoutMs = 60000): Promise<void> {
    throw new Error(
      "acceptGroupInvitation is not implemented. The dev will provide the implementation per tests/helpers/README-Backend-API.md."
    );
  }
}

export class Role {
  user: User;
  alias: string;
  addOperation?: { name: string };

  constructor(user: User, alias: string = user.aidAlias) {
    this.user = user;
    this.alias = alias;
  }

  async add(role: string = "agent"): Promise<this> {
    const agentPre = (this.user.client as SignifyClient & { agent?: { pre: string } }).agent?.pre;
    if (!agentPre) return this;
    try {
      const result = await this.user.client.identifiers().addEndRole(this.alias, role, agentPre);
      const op = await result.op();
      this.addOperation = op;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/400/gi.test(msg) && /already/gi.test(msg)) {
        // Role already added
      } else {
        throw err;
      }
    }
    return this;
  }
}

export { User as RemoteBob };

export async function setupRemoteBob(): Promise<User> {
  const user = User.getInstance("Bob");
  await user.setup();
  return user;
}

/**
 * Create and set up a backend user by alias. Use for Bob (singleton) or a second user (e.g. Charlie for 2-of-3).
 * Implements the backend-api.contract SetupBackendUser.
 */
export async function setupBackendUser(alias: string): Promise<User> {
  if (alias === "Bob") {
    return setupRemoteBob();
  }
  const user = new User(alias);
  await user.setup();
  return user;
}

/** Reset backend user state (e.g. Bob singleton). Called from step definitions via backend-helpers. */
export function resetBackendUsers(): void {
  User.reset();
}
