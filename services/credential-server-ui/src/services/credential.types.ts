interface CredentialIssueRequest {
  schemaSaid: string;
  aid: string;
  [key: string]: string;
}

interface CredentialRequest {
  schemaSaid: string;
  aid: string;
  attributes: Record<string, unknown>;
}

export type { CredentialIssueRequest, CredentialRequest };
