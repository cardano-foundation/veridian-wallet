import { CredentialMetadataRecordProps } from "../records/credentialMetadataRecord.types";

enum CredentialStatus {
  CONFIRMED = "confirmed",
  PENDING = "pending",
  REVOKED = "revoked",
}

type CredentialShortDetails = Omit<CredentialMetadataRecordProps, "createdAt">;

interface ACDC {
  v: string;
  d: string;
  i: string;
  ri: string;
  s: string;
  a: {
    d: string;
    i: string;
    dt: string;
    [key: string]: unknown;
  };
}

interface ACDCDetails
  extends Omit<CredentialShortDetails, "credentialType" | "issuanceDate"> {
  i: string;
  a: {
    i: string;
    dt: string;
    [key: string]: unknown;
  };
  s: {
    title: string;
    description: string;
    version: string;
  };
  lastStatus: {
    s: "0" | "1";
    dt: string;
  };
}

interface KeriaCredential {
  sad: {
    d: string;
    a: {
      i: string;
      dt: string;
      [key: string]: unknown;
    };
    i: string;
    ri: string;
  };
  schema: {
    title: string;
    $id: string;
  };
}

export { CredentialStatus };
export type { CredentialShortDetails, ACDCDetails, KeriaCredential, ACDC };
