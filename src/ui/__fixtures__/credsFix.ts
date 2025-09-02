import { memberIdentifierRecord } from "../../core/__fixtures__/agent/multiSigFixtures";
import {
  ConnectionDetails,
  ConnectionStatus,
} from "../../core/agent/agent.types";
import {
  ACDCDetails,
  CredentialStatus,
} from "../../core/agent/services/credentialService.types";
import { IdentifierType } from "../../core/agent/services/identifier.types";

const connectionDetailsFix: ConnectionDetails = {
  id: "test_id",
  contactId: "test_id",
  identifier: "EMrT7qX0FIMenQoe5pJLahxz_rheks1uIviGW8ch8pfB",
  label: "test_label",
  createdAtUTC: "2010-01-01T19:23:24Z",
  status: ConnectionStatus.CONFIRMED,
  serviceEndpoints: [],
  notes: [],
  historyItems: [],
};

const credsFixAcdc: ACDCDetails[] = [
  {
    id: "EKfweht5lOkjaguB5dz42BMkfejhBFIF9-ghumzCJ6nv",
    status: CredentialStatus.CONFIRMED,
    i: "EGvs2tol4NEtRvYFQDwzRJNnxZgAiGbM4iHB3h4gpRN5",
    a: {
      d: "EJ3HSnEqtSm3WiucWkeBbKspmEAIjf2N6wr5EKOcQ9Vl",
      i: "EJWgO4hwKxNMxu2aUpmGFMozKt9Eq2Jz8n-xXR7CYtY_",
      dt: "2024-01-22T16:03:44.643000+00:00",
      LEI: "5493001KJTIIGC8Y1R17",
    },
    s: {
      title: "Qualified vLEI Issuer Credential",
      description:
        "A vLEI Credential issued by GLEIF to Qualified vLEI Issuers which allows the Qualified vLEI Issuers to issue, verify and revoke Legal Entity vLEI Credentials and Legal Entity Official Organizational Role vLEI Credentials",
      version: "1.0.0",
    },
    lastStatus: {
      s: "0",
      dt: "2024-01-22T16:05:44.643Z",
    },
    schema: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
    identifierType: IdentifierType.Individual,
    identifierId: memberIdentifierRecord.id,
    connectionId: "ebfeb1ebc6f1c276ef71212ec20",
  },
];

const pendingCredFixs: ACDCDetails[] = [
  {
    id: "metadata:EKfweht5lOkjaguB5dz42BMkfejhBFIF9-ghumzCJ6wv",
    status: CredentialStatus.PENDING,
    i: "EGvs2tol4NEtRvYFQDwzRJNnxZgAiGbM4iHB3h4gpRN5",
    a: {
      d: "EJ3HSnEqtSm3WiucWkeBbKspmEAIjf2N6wr5EKOcQ9Vl",
      i: "EJWgO4hwKxNMxu2aUpmGFMozKt9Eq2Jz8n-xXR7CYtY_",
      dt: "2024-08-07T16:03:44.643000+00:00",
      LEI: "5493001KJTIIGC8Y1R17",
    },
    s: {
      title: "Qualified vLEI Issuer Credential",
      description:
        "A vLEI Credential issued by GLEIF to Qualified vLEI Issuers which allows the Qualified vLEI Issuers to issue, verify and revoke Legal Entity vLEI Credentials and Legal Entity Official Organizational Role vLEI Credentials",
      version: "1.0.0",
    },
    lastStatus: {
      s: "0",
      dt: "2024-08-07T16:05:44.643Z",
    },
    schema: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
    identifierType: IdentifierType.Individual,
    identifierId: memberIdentifierRecord.id,
    connectionId: "ebfeb1ebc6f1c276ef71212ec20",
  },
];

const revokedCredFixs: ACDCDetails[] = [
  {
    id: "metadata:EKfweht5lOkjaguB5dz42BMkfejhBFIF9-ghumzCJ6wo",
    status: CredentialStatus.REVOKED,
    i: "EGvs2tol4NEtRvYFQDwzRJNnxZgAiGbM4iHB3h4gpRN5",
    a: {
      d: "EJ3HSnEqtSm3WiucWkeBbKspmEAIjf2N6wr5EKOcQ9Vl",
      i: "EJWgO4hwKxNMxu2aUpmGFMozKt9Eq2Jz8n-xXR7CYtY_",
      dt: "2024-08-07T16:03:44.643000+00:00",
      LEI: "5493001KJTIIGC8Y1R17",
    },
    s: {
      title: "Qualified vLEI Issuer Credential",
      description:
        "A vLEI Credential issued by GLEIF to Qualified vLEI Issuers which allows the Qualified vLEI Issuers to issue, verify and revoke Legal Entity vLEI Credentials and Legal Entity Official Organizational Role vLEI Credentials",
      version: "1.0.0",
    },
    lastStatus: {
      s: "0",
      dt: "2024-08-07T16:05:44.643Z",
    },
    schema: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
    identifierType: IdentifierType.Individual,
    identifierId: memberIdentifierRecord.id,
    connectionId: "ebfeb1ebc6f1c276ef71212ec20",
  },
];

export { credsFixAcdc, connectionDetailsFix, pendingCredFixs, revokedCredFixs };
