import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { config } from "./config";
import router from "./routes";
import { log } from "./log";
import { ready as signifyReady } from "signify-ts";
import { SignifyApi } from "./modules/signify";

import { HOLDER_AID_NAME, ISSUER_AID_NAME } from "./consts";
import { PollingService } from "./services/pollingService";
import { createQVICredential } from "./services/qviCredential";
import { loadBrans } from "./utils/utils";

async function initKeri(
  signifyApi: SignifyApi,
  signifyApiIssuer: SignifyApi
): Promise<string> {
  /* eslint-disable no-console */
  const existingKeriIssuerRegistryRegk = await signifyApiIssuer
    .getRegistry(ISSUER_AID_NAME)
    .catch((e) => {
      console.error(e);
      return undefined;
    });
  const existingKeriRegistryRegk = await signifyApi
    .getRegistry(HOLDER_AID_NAME)
    .catch((e) => {
      console.error(e);
      return undefined;
    });

  let keriIssuerRegistryRegk;
  let keriRegistryRegk;

  // Issuer
  if (existingKeriIssuerRegistryRegk) {
    keriIssuerRegistryRegk = existingKeriIssuerRegistryRegk;
  } else {
    await signifyApiIssuer
      .createIdentifier(ISSUER_AID_NAME)
      .catch((e) => console.error(e));
    keriIssuerRegistryRegk = await signifyApiIssuer
      .createRegistry(ISSUER_AID_NAME)
      .catch((e) => console.error(e));
  }

  // Holder
  if (existingKeriRegistryRegk) {
    keriRegistryRegk = existingKeriRegistryRegk;
  } else {
    await signifyApi
      .createIdentifier(HOLDER_AID_NAME)
      .catch((e) => console.error(e));
    await signifyApi.addIndexerRole(HOLDER_AID_NAME);
    keriRegistryRegk = await signifyApi
      .createRegistry(HOLDER_AID_NAME)
      .catch((e) => console.error(e));
  }

  const qviCredentialId = await createQVICredential(
    signifyApi,
    signifyApiIssuer,
    keriIssuerRegistryRegk
  ).catch((e) => {
    console.error(e);
    return "";
  });

  // Start polling service
  const pollingService = new PollingService(signifyApi);
  pollingService.start();

  return qviCredentialId;
}

async function startSignifyApi(
  signifyApi: SignifyApi,
  signifyApiIssuer: SignifyApi
) {
  await signifyReady();
  const brans = await loadBrans();

  if (brans) {
    await signifyApi.start(brans.bran);
    await signifyApiIssuer.start(brans.issuerBran);
  }
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
    const signifyApi = new SignifyApi();
    const signifyApiIssuer = new SignifyApi();
    app.set("signifyApi", signifyApi);
    app.set("signifyApiIssuer", signifyApiIssuer);
    await startSignifyApi(signifyApi, signifyApiIssuer);

    const qviCredentialId = await initKeri(signifyApi, signifyApiIssuer);
    app.set("qviCredentialId", qviCredentialId);

    log(`Listening on port ${config.port}`);
  });
}

void startServer();
