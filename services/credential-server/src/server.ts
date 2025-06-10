import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { config } from "./config";
import { log } from "./log";
import { ready as signifyReady, SignifyClient, Tier } from "signify-ts";
import { router } from "./routes";
import { ISSUER_NAME, QVI_NAME, ACDC_SCHEMAS_ID } from "./consts";
import { PollingService } from "./services/pollingService";
import { loadBrans } from "./utils/utils";
import {
  createQVICredential,
  DEFAULT_ROLE,
  getRegistry,
  resolveOobi,
  waitAndGetDoneOp,
} from "./utils/signify";

async function getSignifyClient(
  bran: string,
  aidName: string
): Promise<SignifyClient> {
  await signifyReady();

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

  const existingRegistry = await getRegistry(client, aidName).catch((e) => {
    console.error(e);
    return undefined;
  });

  if (!existingRegistry) {
    // Create Identifier
    try {
      const result = await client.identifiers().create(aidName);
      await waitAndGetDoneOp(client, await result.op());
      await client
        .identifiers()
        .addEndRole(aidName, DEFAULT_ROLE, client.agent!.pre);
    } catch (e) {
      console.error(e);
    }

    // Add Indexer role if it's the issuer
    if (aidName === ISSUER_NAME) {
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

    // Create Registry
    try {
      const result = await client
        .registries()
        .create({ name: aidName, registryName: "vLEI" });
      await result.op();
    } catch (e) {
      console.error(e);
    }
  }

  return client;
}

async function initializeCredentials(
  client: SignifyClient,
  issuerClient: SignifyClient
): Promise<string> {
  const issuerRegistry = await getRegistry(issuerClient, QVI_NAME);

  const qviCredentialId = await createQVICredential(
    client,
    issuerClient,
    issuerRegistry
  ).catch((e) => {
    console.error(e);
    return "";
  });

  const pollingService = new PollingService(client);
  pollingService.start();

  return qviCredentialId;
}

async function startServer() {
  const app = express();
  app.use("/static", express.static("static"));
  app.use(cors());
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
    const signifyClient = await getSignifyClient(brans.bran, ISSUER_NAME);
    const signifyClientIssuer = await getSignifyClient(
      brans.issuerBran,
      QVI_NAME
    );

    app.set("signifyClient", signifyClient);
    app.set("signifyClientIssuer", signifyClientIssuer);

    const qviCredentialId = await initializeCredentials(
      signifyClient,
      signifyClientIssuer
    );
    app.set("qviCredentialId", qviCredentialId);

    log(`Listening on port ${config.port}`);
  });
}

void startServer();
