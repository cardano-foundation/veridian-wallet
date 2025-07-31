import { memberIdentifierRecord } from "../../core/__fixtures__/agent/multiSigFixtures";
import {
  CredentialShortDetails,
  CredentialStatus,
} from "../../core/agent/services/credentialService.types";
import { IdentifierType } from "../../core/agent/services/identifier.types";

const filteredCredsFix: CredentialShortDetails[] = [
  {
    id: "EKfweht5lOkjaguB5dz42BMkfejhBFIF9-ghumzCJ6nv",
    issuanceDate: "2010-01-01T19:23:24Z",
    credentialType: "University Credential 0",
    status: CredentialStatus.CONFIRMED,
    schema: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
    identifierType: IdentifierType.Individual,
    identifierId: memberIdentifierRecord.id,
    connectionId: "ebfeb1ebc6f1c276ef71212ec20",
  },
  {
    id: "EKfweht5lOkjaguB5dz42BMkfejhBFIF9-ghumzCJ6wv",
    issuanceDate: "2010-01-01T19:23:24Z",
    credentialType: "University Credential 1",
    status: CredentialStatus.CONFIRMED,
    schema: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
    identifierType: IdentifierType.Individual,
    identifierId: memberIdentifierRecord.id,
    connectionId: "ebfeb1ebc6f1c276ef71212ec20",
  },
  {
    id: "did:example:ebfeb1f712ebc6f1c276e12ec23",
    issuanceDate: "2010-01-01T19:23:24Z",
    credentialType: "University Credential 2",
    status: CredentialStatus.CONFIRMED,
    schema: "EMkpplwGGw3fwdktSibRph9NSy_o2MvKDKO8ZoONqTOt",
    identifierType: IdentifierType.Individual,
    identifierId: memberIdentifierRecord.id,
    connectionId: "ebfeb1ebc6f1c276ef71212ec20",
  },
  {
    id: "EAzzrBvrVEYt3kvlXTZgulQhFq4CtkO8zA61eg6JtlMj",
    issuanceDate: "2024-10-21T12:35:26.597Z",
    credentialType: "Qualified vLEI Issuer Credential",
    status: CredentialStatus.CONFIRMED,
    schema: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
    identifierType: IdentifierType.Group,
    identifierId: "EIRdVIgcPYj6LbN4DdxzJFnsvELV-7eWDBQ4a-VsRDQb",
    connectionId: "ebfeb1ebc6f1c276ef71212ec20",
  },
  {
    id: "EAzzrBvrVEYt3kvlXTZgulQhFq4CtkO8zA61eg6JtlMj",
    issuanceDate: "2024-10-21T12:35:26.597Z",
    credentialType: "Qualified vLEI Issuer Credential 2",
    status: CredentialStatus.CONFIRMED,
    schema: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
    identifierType: IdentifierType.Group,
    identifierId: "ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb",
    connectionId: "ebfeb1ebc6f1c276ef71212ec20",
  },
];

const revokedCredsFix: CredentialShortDetails[] = [
  {
    id: "EBgG1lhkxiv_UQ8IiF2G4j5HQlnT5K5XZy_zRFg_EGCS",
    issuanceDate: "2010-01-01T19:23:24Z",
    credentialType: "University Credential",
    status: CredentialStatus.REVOKED,
    schema: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
    identifierType: IdentifierType.Individual,
    identifierId: memberIdentifierRecord.id,
    connectionId: "ebfeb1ebc6f1c276ef71212ec20",
  },
];

export { filteredCredsFix, revokedCredsFix };
