import { Schema } from "./schemasSlice.types";

interface A {
  d: string;
  i: string;
  LEI: string;
  dt: string;
}

interface Sad {
  v: string;
  d: string;
  i: string;
  ri: string;
  s: string;
  a: A;
}

interface Status {
  vn: number[];
  i: string;
  s: string;
  d: string;
  ri: string;
  dt: string;
  et: string;
}

interface Credential {
  rev: null;
  revatc: null;
  pre: string;
  contactId: string;
  status: Status;
  schema: Schema;
  sad: Sad;
}

enum PresentationRequestStatus {
  Requested = "requested",
}

interface PresentationRequestData {
  id: string;
  connectionName: string;
  credentialType: string;
  attribute: string;
  requestDate: number;
  status: PresentationRequestStatus;
}

export { PresentationRequestStatus };
export type { Credential, PresentationRequestData };
