// Extend the Window interface to include runtime configuration
interface CustomWindow extends Window {
  __RUNTIME_CONFIG__?: {
    SERVER_URL?: string;
  };
}

declare let window: CustomWindow;

// Get the server URL from runtime configuration (envfile.js) or Vite's .env
const serverUrl =
  (typeof window !== "undefined" && window.__RUNTIME_CONFIG__?.SERVER_URL) ||
  import.meta.env.VITE_SERVER_URL || // Vite's .env system
  "http://localhost:3001"; // Default fallback

// Define the config object
const config = {
  endpoint: serverUrl,
  path: {
    ping: "/ping",
    getConnectionByDid: "/getConnectionByDid",
    invitation: "/invitation",
    credential: "/credential",
    invitationWithCredential: "/offerCredentialWithConnection",
    invitationWithCredentialConnectionless:
      "/offerCredentialWithConnectionLess",
    credentials: {
      summit: "/credentials/schemas/summit/v1",
    },
    keriOobi: "/keriOobi",
    issueAcdcCredential: "/issueAcdcCredential",
    schemaOobi: "/oobi/:id",
    contacts: "/contacts",
    deleteContact: "/deleteContact",
    contactCredentials: "/contactCredentials",
    resolveOobi: "/resolveOobi",
    requestDisclosure: "/requestDisclosure",
    revokeCredential: "/revokeCredential",
    schemas: "/schemas",
  },
};

export { config };
