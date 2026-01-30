declare module 'signify-polaris-web' {
  export interface AuthorizeResultCredential {
    raw: unknown;
    cesr: string;
  }

  export interface AuthorizeResultIdentifier {
    prefix: string;
  }

  export interface AuthorizeResult {
    credential?: AuthorizeResultCredential;
    identifier?: AuthorizeResultIdentifier;
    headers?: Record<string, string>;
  }

  export interface SignRequestResult {
    headers: Record<string, string>;
  }

  export interface CreateCredentialResult {
    acdc: Record<string, any>;
    iss: Record<string, any>;
    anc: Record<string, any>;
    op: Record<string, any>;
  }

  export interface GetCredentialResult {
    credential?: string;
    [key: string]: any;
  }

  export interface ExtensionClient {
    isExtensionInstalled(timeout?: number): Promise<string | false>;
    
    authorize(params?: { message?: string }): Promise<AuthorizeResult>;
    
    signRequest(params: { 
      url: string; 
      method?: string;
      headers?: Record<string, string>;
    }): Promise<SignRequestResult>;
    
    createDataAttestationCredential(params: {
      credData: any;
      schemaSaid: string;
    }): Promise<CreateCredentialResult>;
    
    getCredential(
      credentialSAID: string, 
      includeCESR?: boolean
    ): Promise<GetCredentialResult>;
  }

  export function createClient(options?: { targetOrigin?: string }): ExtensionClient;
}

