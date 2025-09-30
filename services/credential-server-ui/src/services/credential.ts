import { config } from "../config";
import { CredentialIssueRequest, CredentialRequest } from "./credential.types";
import { httpInstance } from "./http";

const CredentialService = {
  revoke: async (contactId: string, credId: string) => {
    return httpInstance.post(config.path.revokeCredential, {
      credentialId: credId,
      holder: contactId,
    });
  },
  issue: async (data: CredentialIssueRequest) => {
    return httpInstance.post(
      `${config.endpoint}${config.path.issueAcdcCredential}`,
      data
    );
  },
  requestPresentation: (data: CredentialRequest) => {
    return httpInstance.post(
      `${config.endpoint}${config.path.requestDisclosure}`,
      data
    );
  },
  verifyPresentation: async (
    ipexApplySaid: string,
    discloserIdentifier: string
  ) => {
    return httpInstance.post(
      `${config.endpoint}${config.path.verifyIpexPresentation}`,
      {
        ipexApplySaid,
        discloserIdentifier,
      }
    );
  },
  getPresentationRequests: async () => {
    return httpInstance.get(
      `${config.endpoint}${config.path.getPresentationRequests}`
    );
  },
};

export { CredentialService };
