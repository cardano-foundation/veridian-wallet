/**
 * Contract for E2E tests and backend (KERIA/Signify) helpers.
 * Tests use these types; the implementation lives in the helper you wire from backend-helpers.ts.
 * URLs come from getKeriaUrlsForTestRunner() in ssi-agent-urls.helper.ts.
 */

import {
  Algos,
  d,
  messagize,
  randomPasscode,
  Siger,
  SignifyClient,
  Tier,
  Operation,
} from "signify-ts";

export interface KeriaConfig {
  bootUrl: string;
  connectUrl: string;
}

interface WitnessConfig {
  eid: string;
  oobi: string;
}

export interface WitnessesConfig {
  toad: number;
  witnesses: WitnessConfig[];
}

export interface GetOobiOptions {
  role?: string;
  alias?: string;
  groupId?: string;
  groupName?: string;
}

interface CreateGroupOptions {
  isith: number;
  nsith: number;
  toad?: number;
  wits?: string[];
}

const DEFAULT_WITNESSES_CONFIG = { toad: 0, witnesses: [] };

// --- Virtual Wallet ---

export class VirtualWallet {
  public client: SignifyClient;
  public aidName: string;
  public prefix: string | undefined;
  public oobi?: string;
  private pendingOperations: Operation[] = [];

  constructor(
    public alias: string,
    protected config: KeriaConfig,
    protected passcode: string = randomPasscode()
  ) {
    this.client = new SignifyClient(config.connectUrl, this.passcode, Tier.low, config.bootUrl);
    this.aidName = `${alias}_AID`;
  }

  async init(witnesses: WitnessesConfig = DEFAULT_WITNESSES_CONFIG): Promise<void> {
    await this.client.boot();
    await this.client.connect();

    const result = await this.client.identifiers().create(this.aidName, witnesses);
    await this.waitOperation(await result.op());
    const aid = await this.client.identifiers().get(this.aidName);
    this.prefix = aid.prefix;

    const agentPre = (this.client as SignifyClient & { agent?: { pre: string } }).agent?.pre;
    if (agentPre) {
      try {
        const roleResult = await this.client.identifiers().addEndRole(this.aidName, "agent", agentPre);
        await this.waitOperation(await roleResult.op());
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!/400/gi.test(msg) || !/already/gi.test(msg)) throw err;
      }
    }
  }

  async getAid(): Promise<string> {
    if (!this.prefix) throw new Error("User not initialized");
    return this.prefix;
  }

  async resolveOobi(oobi: string, alias: string): Promise<void> {
    console.log(`[${this.alias}] Resolving OOBI for ${alias}...`);
    const op = await this.client.oobis().resolve(oobi, alias);
    await this.waitOperation(op);
  }

  async getOobi(options?: GetOobiOptions): Promise<string> {
    if (!this.oobi) {
      const role = options?.role ?? "agent";
      const result = await this.client.oobis().get(this.aidName, role);
      this.oobi = result.oobis[0];
    }
    if (!this.oobi) {
      throw new Error("KERIA oobis.get returned no OOBI URL");
    }

    let url = this.oobi;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      const base = this.config.connectUrl.replace(/\/$/, "");
      url = url.startsWith("/") ? `${base}${url}` : `${base}/${url}`;
    }

    const u = new URL(url);
    const { alias, groupId, groupName } = options ?? {};
    if (alias) u.searchParams.set("name", alias);
    if (groupId) u.searchParams.set("groupId", groupId);
    if (groupName) u.searchParams.set("groupName", groupName);

    return u.toString();
  }

  async waitOperation(operation: any, timeoutMs = 30000) {
    return this.client.operations().wait(
      operation,
      { signal: AbortSignal.timeout(timeoutMs) }
    );
  }

  async waitForNotification(route: string, timeoutMs: number, interval = 500) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const { notes } = await this.client.notifications().list();
        const filtered = notes.filter((n: any) => n.a.r === route && n.r === false);
        if (filtered.length > 0) return filtered;
      } catch {
        // ignore fetch errors and retry
      }
      await new Promise(r => setTimeout(r, interval));
    }
    throw new Error(`Timeout waiting for notification on route ${route}`);
  }

  public pushOperation(operation: Operation): void {
    this.pendingOperations.push(operation);
  }

  public pullByType(type?: string): Operation[] {
    const matches: Operation[] = [];

    this.pendingOperations = this.pendingOperations.filter(op => {
      const isMatch = !type || op.name.startsWith(`${type}.`);
      if (isMatch) matches.push(op);
      return !isMatch;
    });

    return matches;
  }

  public async waitPendingOperations(type?: string) {
    console.log(`[${this.alias}] Waiting for pending operations...`);
    const ops = this.pullByType(type);

    for (const op of ops) {
      await this.waitOperation(op);
    }
  }

  async acceptGroupInvitation(timeoutMs: number = 30000, groupName: string = "MultisigGroup") {
    console.log(`[${this.alias}] Waiting for group invitation (multisig/icp)...`);

    const notifications = await this.waitForNotification("/multisig/icp", timeoutMs);
    const icpMsg = await this.client
      .groups()
      .getRequest(notifications[0].a.d)
      .catch((error) => {
        const status = error.message.split(" - ")[1];
        if (/404/gi.test(status)) {
          throw new Error(
            `There's no exchange message for the given SAID ${notifications[0].a.i}`
          );
        } else {
          throw error;
        }
      });

    const exn = icpMsg[0].exn;
    const icpParams = exn.e.icp;
    const smids = exn.a.smids;
    const rmids = exn.a.rmids || smids;

    const states = await Promise.all(
      smids.map((id: string) => this.client.keyStates().get(id).then((s: any) => s[0]))
    );
    const rstates = await Promise.all(
      rmids.map((id: string) => this.client.keyStates().get(id).then((s: any) => s[0]))
    );

    const group = new Group(this.client, this.aidName, groupName, states);

    console.log(`[${this.alias}] Mirroring group creation...`);

    await group.create({
      isith: icpParams.kt,
      nsith: icpParams.nt,
      toad: parseInt(icpParams.bt),
      wits: icpParams.b,
      rstates: rstates,
      delpre: icpParams.di
    });

    const myPrefix = await this.getAid();
    const recipients = smids.filter((id: string) => id !== myPrefix);

    console.log(`[${this.alias}] Joining group. Acknowledging to: ${recipients.join(', ')}`);
    await group.send(recipients);

    this.pushOperation(group.operation)
  }

  async authorizeGroupAgents(groupName: string): Promise<void> {
    console.log(`[${this.alias}] Fetching member details for group ${groupName}...`);

    const membersResult = await this.client.identifiers().members(groupName);
    const signingMembers = membersResult.signing;

    if (!signingMembers || signingMembers.length === 0) {
      throw new Error(`No signing members found for group ${groupName}`);
    }

    const myPrefix = await this.getAid();

    const recipients = signingMembers
      .map((m: any) => m.aid)
      .filter((aid: string) => aid !== myPrefix);

    console.log(`[${this.alias}] Found ${signingMembers.length} members. Starting authorization.`);

    for (const member of signingMembers) {
      let agentEid: string | undefined;

      if (member.ends && member.ends.agent) {
        const agentKeys = Object.keys(member.ends.agent);
        if (agentKeys.length > 0) {
          agentEid = agentKeys[0];
        }
      }

      if (!agentEid && member.aid === myPrefix) {
        agentEid = this.client.agent?.pre;
      }

      if (!agentEid) {
        console.warn(`[${this.alias}] Skipping member ${member.aid}: No Agent Endpoint found.`);
        continue;
      }

      console.log(`[${this.alias}] Authorizing Agent ${agentEid} for Member ${member.aid}`);

      const roleHelper = new Role(this, groupName, true);

      await roleHelper.add("agent", agentEid);
      if (recipients.length > 0) {
        await roleHelper.send(recipients);
        console.log(`[${this.alias}] Sent authorization endorsement to ${recipients.length} recipients.`);
      }
    }

    console.log(`[${this.alias}] Finished Agent Authorization Loop.`);
  }

  async processIncomingGroupAgentsEndorcements(groupName: string) {
    const membersResult = await this.client.identifiers().members(groupName);
    const signingMembers = membersResult.signing;
    const myPrefix = await this.getAid();
    const recipients = signingMembers
      .map((m: any) => m.aid)
      .filter((aid: string) => aid !== myPrefix);

    const notifications = await this.waitForNotification("/multisig/rpy", 60000);
    for (const notification of notifications) {
      const request = await this.client.groups().getRequest(notification.a.d);
      const bankGroupB_Role = new Role(this, groupName, true);
      await bankGroupB_Role.acknowledge(request[0].exn);
      await bankGroupB_Role.send(recipients);
    }
  }
}

export class RemoteJoiner extends VirtualWallet { }

export class RemoteInitiator extends VirtualWallet {

  /**
   * Creates a multisig group with all provided member AIDs (joiner AIDs, excluding initiator)
   * and proposes it to all members via /multisig/icp exchange.
   *
   * @param groupName  - Alias for the new group identifier
   * @param joinerAids - AIDs of all non-initiator members (app joiner + extra virtual members)
   * @param options    - isith (signing threshold), nsith (next key threshold), toad, wits
   * @returns groupId  - The prefix of the newly created multisig identifier
   */
  async createAndProposeGroup(
    groupName: string,
    joinerAids: string[],
    options: CreateGroupOptions = { isith: 1, nsith: 1, toad: 0, wits: [] }
  ): Promise<{ groupId: string }> {
    if (!joinerAids.length) {
      console.warn(`[${this.alias}] No joiner AIDs provided. Creating group with only the initiator as member.`);
      throw new Error("At least one joiner AID must be provided to create a group");
    }

    const myAid = await this.getAid();
    const allMemberIds = [myAid, ...joinerAids];

    console.log(`[${this.alias}] Fetching key states for all members: ${allMemberIds.join(", ")}`);
    const memberStates = await Promise.all(
      allMemberIds.map((id) => this.client.keyStates().get(id).then((s: any) => s[0]))
    );

    const group = new Group(this.client, this.aidName, groupName, memberStates);

    await group.create({
      isith: options.isith,
      nsith: options.nsith,
      toad: options.toad ?? 0,
      wits: options.wits ?? [],
      rstates: memberStates,
    });

    const groupId = await group.getPrefix();
    console.log(`[${this.alias}] Created group ${groupName} with id ${groupId}. Proposing to: ${joinerAids.join(", ")}`);
    await group.send(joinerAids);

    this.pushOperation(group.operation);

    return { groupId };
  }
}

class Group {
  creationResult: any;
  operation: any;

  constructor(
    public client: SignifyClient,
    public userAidName: string,
    public groupAlias: string,
    public memberStates: any[]
  ) { }

  async create(params: {
    isith: number | string,
    nsith: number | string,
    toad: number,
    wits: string[],
    rstates?: any[],
    delpre?: string
  }) {
    const mhab = await this.client.identifiers().get(this.userAidName);

    const result = await this.client.identifiers().create(this.groupAlias, {
      algo: Algos.group,
      mhab,
      isith: params.isith,
      nsith: params.nsith,
      toad: params.toad,
      wits: params.wits,
      states: this.memberStates,
      rstates: params.rstates || this.memberStates,
      ...(params.delpre && { delpre: params.delpre }),
    });

    this.creationResult = result;
    this.operation = await result.op();
    return this;
  }

  async send(recipients: string[]) {
    if (!this.creationResult) throw new Error("Group not created yet");

    const serder = this.creationResult.serder;
    const sigers = this.creationResult.sigs.map((sig: string) => new Siger({ qb64: sig }));

    const ims = d(messagize(serder, sigers));
    const atc = ims.substring(serder.size);
    const embeds = { icp: [serder, atc] };

    const mhab = await this.client.identifiers().get(this.userAidName);
    const smids = this.memberStates.map((s: any) => s.i);

    return this.client.exchanges().send(
      this.userAidName,
      this.groupAlias,
      mhab,
      "/multisig/icp",
      { gid: serder.pre, smids, rmids: smids },
      embeds,
      recipients
    );
  }

  async getPrefix(): Promise<string> {
    if (this.creationResult?.serder?.pre) return this.creationResult.serder.pre;
    const id = await this.client.identifiers().get(this.groupAlias);
    return id.prefix;
  }
}

export class Role {
  user: VirtualWallet;
  alias: string;
  addResult?: any;
  addOperation?: any;
  isMultisig: boolean;
  dt: string;

  constructor(user: VirtualWallet, alias: string = user.aidName, isMultisig: boolean = false) {
    this.user = user;
    this.alias = alias;
    this.isMultisig = isMultisig;
    this.dt = new Date().toISOString().replace("Z", "000+00:00");
  }

  async add(role: string = "agent", eventIdentifier?: string) {
    let eid;
    if (eventIdentifier) {
      eid = eventIdentifier;
    } else if (this.isMultisig) {
      const ghab = await this.user.client.identifiers().get(this.alias);
      eid = ghab.prefix;
    }
    else {
      if (!this.user.client.agent?.pre) return;
      eid = this.user.client.agent.pre;
    }

    const result = await this.user.client.identifiers().addEndRole(
      this.alias,
      role,
      eid,
      this.dt
    );

    const op = await result.op();
    this.addResult = result;
    this.addOperation = op;

    return this;
  }

  async send(recipients: string[]) {
    console.log(`${this.user.aidName} sending endRole to ${recipients.join(', ')}`)
    const ghab = await this.user.client.identifiers().get(this.alias);
    const seal = [
      'SealEvent',
      {
        i: ghab['prefix'],
        s: ghab['state']['ee']['s'],
        d: ghab['state']['ee']['d'],
      }
    ]

    const rpy = this.addResult.serder;
    const sigers = this.addResult.sigs.map((sig: string) => new Siger({ qb64: sig }));

    const roleims = d(
      messagize(rpy, sigers, seal, undefined, undefined, false)
    );
    const atc = roleims.substring(rpy.size);
    const embeds = { rpy: [rpy, atc] };

    const aid = await this.user.client.identifiers().get(this.user.aidName);
    return this.user.client.exchanges().send(
      this.user.aidName,
      "multisig",
      aid,
      "/multisig/rpy",
      { gid: ghab.prefix },
      embeds,
      recipients
    );
  }

  async acknowledge(notification: any) {
    console.log(`${this.user.aidName} akcnoledge endRole`)
    this.dt = notification.e.rpy.dt;

    const result = await this.user.client.identifiers().addEndRole(
      this.alias,
      notification.e.rpy.a.role,
      notification.e.rpy.a.eid,
      notification.e.rpy.dt
    );
    const op = await result.op();
    this.addResult = result;
    this.addOperation = op;

    return this;
  }
}
