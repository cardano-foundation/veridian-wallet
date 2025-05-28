import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { config } from "./config";
import { Agent } from "./agent";
import router from "./routes";
import { log } from "./log";
import { ready as signifyReady, randomPasscode } from "signify-ts";
import { SignifyApi } from "./modules/signify";
import path from "path";
import { existsSync, mkdirSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { BranFileContent } from "./agent.types";

async function getBrans(): Promise<BranFileContent> {
  const bransFilePath = "./data/brans.json";
  const dirPath = path.dirname(bransFilePath);

  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }

  let bransFileContent = "";
  if (existsSync(bransFilePath)) {
    bransFileContent = await readFile(bransFilePath, "utf8");
    try {
      const data = JSON.parse(bransFileContent);
      if (data.bran && data.issuerBran) {
        return data;
      }
    } catch {}
  }

  const bran = randomPasscode();
  const issuerBran = randomPasscode();
  const newContent = { bran, issuerBran };
  await writeFile(bransFilePath, JSON.stringify(newContent));
  return newContent;
}

async function startSignifyApi(
  signifyApi: SignifyApi,
  signifyApiIssuer: SignifyApi
) {
  await signifyReady();
  const brans = await getBrans();

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
    await Agent.agent.start(signifyApi, signifyApiIssuer);
    await startSignifyApi(signifyApi, signifyApiIssuer);

    await Agent.agent.initKeri();
    log(`Listening on port ${config.port}`);
  });
}

void startServer();
