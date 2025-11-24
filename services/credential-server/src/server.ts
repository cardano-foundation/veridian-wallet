import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { join } from "path";
import { SignifyClient, ready as signifyReady, Tier } from "signify-ts";
import { config } from "./config";
import { ACDC_SCHEMAS_ID, ISSUER_NAME, LE_NAME, GLEIF_NAME } from "./consts";
import { log } from "./log";
import { router } from "./routes";
import { EndRole } from "./server.types";
import { PollingService } from "./services/pollingService";
import {
  createLECredential,
  createOORAuthCredential,
  createQVICredential,
  getEndRoles,
  getRegistry,
  loadBrans,
  REGISTRIES_NOT_FOUND,
  resolveOobi,
  waitAndGetDoneOp,
} from "./utils/utils";


async function getSignifyClient(bran: string): Promise<SignifyClient> {
  const client = new SignifyClient(
    config.keria.url,
    bran,
    Tier.low,
    config.keria.bootUrl
  );

  try {
    await client.connect();
  } catch (err) {
    await client.boot();
    await client.connect();
  }

  await Promise.allSettled(
    ACDC_SCHEMAS_ID.map((schemaId) =>
      resolveOobi(client, `${config.oobiEndpoint}/oobi/${schemaId}`)
    )
  );

  return client;
}

async function ensureIdentifierExists(
  client: SignifyClient,
  aidName: string
): Promise<void> {
  try {
    await client.identifiers().get(aidName);
  } catch (e: any) {
    const status = e.message.split(" - ")[1];
    if (/404/gi.test(status)) {
      const result = await client.identifiers().create(aidName);
      await waitAndGetDoneOp(client, await result.op());
      await client.identifiers().get(aidName);
    } else {
      throw e;
    }
  }
}

async function ensureEndRoles(
  client: SignifyClient,
  aidName: string
): Promise<void> {
  const roles = await getEndRoles(client, aidName);

  const hasDefaultRole = roles.some((role) => role.role === EndRole.AGENT);

  if (!hasDefaultRole) {
    await client
      .identifiers()
      .addEndRole(aidName, EndRole.AGENT, client.agent!.pre);
  }

  if (
    aidName === ISSUER_NAME &&
    !roles.some((role) => role.role === EndRole.INDEXER)
  ) {
    const prefix = (await client.identifiers().get(aidName)).prefix;

    const endResult = await client
      .identifiers()
      .addEndRole(aidName, "indexer", prefix);
    await waitAndGetDoneOp(client, await endResult.op());
    const locRes = await client.identifiers().addLocScheme(aidName, {
      url: config.oobiEndpoint,
      scheme: new URL(config.oobiEndpoint).protocol.replace(":", ""),
    });
    await waitAndGetDoneOp(client, await locRes.op());
  }
}

async function ensureRegistryExists(
  client: SignifyClient,
  aidName: string
): Promise<void> {
  try {
    await getRegistry(client, aidName);
  } catch (e: any) {
    if (e.message.includes(REGISTRIES_NOT_FOUND)) {
      const result = await client
        .registries()
        .create({ name: aidName, registryName: "vLEI" });
      await waitAndGetDoneOp(client, await result.op());
    } else {
      throw e;
    }
  }
}

async function initializeCredentials(
  issuerClient: SignifyClient,
  gleifClient: SignifyClient,
  leClient: SignifyClient
): Promise<[string, string]> {
  const qviCredentialId = await createQVICredential(
    gleifClient,
    issuerClient
  );

  const leCredentialId = await createLECredential(
    issuerClient,
    leClient,
    qviCredentialId
  );

  const oorAuthCredentialId = await createOORAuthCredential(
    leClient,
    issuerClient,
    leCredentialId
  );

  const pollingService = new PollingService(issuerClient);
  pollingService.start();

  return [qviCredentialId, oorAuthCredentialId];
}

async function startServer() {
  const app = express();
  app.use(cors());
  app.use("/static", express.static("static"));
  app.use(
    "/oobi",
    express.static(join(__dirname, "schemas"), {
      setHeaders: (res) => {
        res.setHeader("Content-Type", "application/schema+json");
      },
    })
  );
  app.use(bodyParser.json());
  app.use(router);
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
      error: err.message,
    });
  });

  app.listen(config.port, async () => {
    await signifyReady();
    const brans = await loadBrans();

    const issuerClient = await getSignifyClient(brans.bran); // Effectively a QVI
    const gleifClient = await getSignifyClient(brans.issuerBran);
    const leClient = await getSignifyClient(brans.leBran);

    // Ensure identifiers exist first
    await ensureIdentifierExists(issuerClient, ISSUER_NAME);
    await ensureIdentifierExists(gleifClient, GLEIF_NAME);
    await ensureIdentifierExists(leClient, LE_NAME);

    // Add end roles before creating registries (KERIA bug workaround)
    await ensureEndRoles(issuerClient, ISSUER_NAME);
    await ensureEndRoles(gleifClient, GLEIF_NAME);
    await ensureEndRoles(leClient, LE_NAME);

    // Now create registries
    await ensureRegistryExists(issuerClient, ISSUER_NAME);
    await ensureRegistryExists(gleifClient, GLEIF_NAME);
    await ensureRegistryExists(leClient, LE_NAME);

    app.set("issuerClient", issuerClient);

    const [qviCredentialId, oorAuthCredentialId] = await initializeCredentials(
      issuerClient,
      gleifClient,
      leClient
    );
    app.set("qviCredentialId", qviCredentialId);
    app.set("oorAuthCredentialId", oorAuthCredentialId);

    log(`Listening on port ${config.port}`);
  });
}

void startServer();
