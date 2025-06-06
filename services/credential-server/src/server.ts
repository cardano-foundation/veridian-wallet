import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { config } from "./config";
import { log } from "./log";
import { ready as signifyReady } from "signify-ts";
import { SignifyApi } from "./modules/signify";
import { router } from "./routes";
import { ISSUER_NAME, QVI_NAME } from "./consts";
import { PollingService } from "./services/pollingService";
import { loadBrans } from "./utils/utils";
import { createQVICredential } from "./modules/signify/utils";

async function getSignifyClient(
  bran: string,
  aidName: string
): Promise<SignifyApi> {
  await signifyReady();

  const signifyApi = new SignifyApi();
  await signifyApi.start(bran);

  const existingRegistry = await signifyApi.getRegistry(aidName).catch((e) => {
    console.error(e);
    return undefined;
  });

  if (!existingRegistry) {
    await signifyApi.createIdentifier(aidName).catch((e) => console.error(e));

    if (aidName === ISSUER_NAME) {
      await signifyApi.addIndexerRole(aidName);
    }

    await signifyApi.createRegistry(aidName).catch((e) => console.error(e));
  }

  return signifyApi;
}

async function initializeCredentials(
  signifyApi: SignifyApi,
  signifyApiIssuer: SignifyApi
): Promise<string> {
  const issuerRegistry = await signifyApiIssuer.getRegistry(QVI_NAME);

  const qviCredentialId = await createQVICredential(
    signifyApi,
    signifyApiIssuer,
    issuerRegistry
  ).catch((e) => {
    console.error(e);
    return "";
  });

  const pollingService = new PollingService(signifyApi);
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
    const brans = await loadBrans();
    const signifyApi = await getSignifyClient(brans.bran, ISSUER_NAME);
    const signifyApiIssuer = await getSignifyClient(brans.issuerBran, QVI_NAME);

    app.set("signifyApi", signifyApi);
    app.set("signifyApiIssuer", signifyApiIssuer);

    const qviCredentialId = await initializeCredentials(
      signifyApi,
      signifyApiIssuer
    );
    app.set("qviCredentialId", qviCredentialId);

    log(`Listening on port ${config.port}`);
  });
}

void startServer();
