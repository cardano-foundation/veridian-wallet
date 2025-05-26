const port = process.env.PORT ? Number(process.env.PORT) : 3001;
const endpoint = process.env.ENDPOINT ?? `http://127.0.0.1:${port}`;
const oobiEndpoint = process.env.OOBI_ENDPOINT ?? endpoint;
const keriaUrl = process.env.KERIA_ENDPOINT ?? "http://127.0.0.1:3901";
const keriaBootUrl = process.env.KERIA_BOOT_ENDPOINT ?? "http://127.0.0.1:3903";

const config = {
  endpoint: endpoint,
  oobiEndpoint: oobiEndpoint,
  port,
  keria: {
    url: keriaUrl,
    bootUrl: keriaBootUrl,
  },
  path: {
    ping: "/ping",
    shorten: "/shorten/:id",
    createShorten: "/shorten",
    keriOobi: "/keriOobi",
    issueAcdcCredential: "/issueAcdcCredential",
    schemaOobi: "/oobi/:id",
    contacts: "/contacts",
    contactCredentials: "/contactCredentials",
    resolveOobi: "/resolveOobi",
    requestDisclosure: "/requestDisclosure",
    revokeCredential: "/revokeCredential",
    deleteContact: "/deleteContact",
    schemas: "/schemas",
  },
};

export { config };
