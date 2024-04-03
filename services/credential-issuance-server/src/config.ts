const port = process.env.PORT ? Number(process.env.PORT) : 3002;
const endpoint = process.env.ENDPOINT ?? `http://127.0.0.1:${port}`;
const oobiEndpoint = process.env.OOBI_ENDPOINT ?? endpoint; 
const keriaUrl = process.env.KERIA_ENDPOINT ?? "http://127.0.0.1:3901";
const keriaBootUrl = process.env.KERIA_BOOT_ENDPOINT ?? "http://127.0.0.1:3903";

const config = {
  endpoint: endpoint,
  oobiEndpoint: oobiEndpoint,
  endpoints: [endpoint],
  port,
  keria: {
    url: keriaUrl,
    bootUrl: keriaBootUrl,
  },
  path: {
    ping: "/ping",
    getConnectionByDid: "/getConnectionByDid",
    invitation: "/invitation",
    credential: "/credential",
    invitationWithCredential: "/offerCredentialWithConnection",
    invitationWithCredentialConnectionless:
      "/offerCredentialWithConnectionLess",
    shorten: "/shorten/:id",
    createShorten: "/shorten",
    credentials: {
      summit: "/credentials/schemas/summit/v1",
    },
    keriOobi: "/keriOobi",
    issueAcdcCredential : "/issueAcdcCredential",
    schemaOobi: "/oobi/:id",
    contacts: "/contacts",
    resolveOobi: "/resolveOobi",
    requestDisclosure: "/requestDisclosure",
  },
};

export { config };
