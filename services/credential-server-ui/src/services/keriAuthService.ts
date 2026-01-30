import { createClient } from 'signify-polaris-web';
import type { ExtensionClient, AuthorizeResult } from 'signify-polaris-web';

/**
 * Service for managing KERI Auth extension interactions
 * Handles authorization, signing, and credential operations
 */
class KERIAuthService {
  private client: ExtensionClient | null = null;
  private authorizeResult: AuthorizeResult | null = null;

  /**
   * Initialize the KERI Auth extension client
   * @returns Extension ID if installed, false otherwise
   */
  async initialize(): Promise<string | false> {
    console.log('[KERIAuth] Initializing...');
    
    this.client = createClient();
    const extensionId = await this.client.isExtensionInstalled();
    
    if (extensionId) {
      console.log('[KERIAuth] Extension detected:', extensionId);
    } else {
      console.log('[KERIAuth] Extension not detected');
    }
    
    return extensionId;
  }

  /**
   * Request authorization from user via KERI Auth extension
   * @param message Optional custom message to display
   * @returns Authorization result containing AID and credentials
   */
  async authorize(message?: string): Promise<AuthorizeResult> {
    if (!this.client) {
      throw new Error('Client not initialized. Call initialize() first.');
    }

    const result = await this.client.authorize({ 
      message: message || 'Do you approve this credential operation?' 
    });
    
    this.authorizeResult = result;
    
    return result;
  }

  /**
   * Generate signed headers for HTTP request
   * @param url Target URL to sign
   * @param method HTTP method (default: GET)
   * @returns Signed headers object
   */
  async signHeaders(url: string, method: string = 'GET'): Promise<Record<string, string>> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }
    if (!this.authorizeResult) {
      throw new Error('Must authorize first');
    }

    const result = await this.client.signRequest({ url, method });
    return result.headers;
  }

  /**
   * Create a data attestation credential
   * This will open the KERIAuth extension UI for credential preview and signing
   * @param params Credential data and schema SAID
   * @returns Signed credential with ACDC, issuance, anchoring, and operation details
   */
  async createDataAttestationCredential(params: {
    credData: any;
    schemaSaid: string;
  }) {
    if (!this.client) {
      throw new Error('Client not initialized. Call initialize() first.');
    }

    if (!this.authorizeResult) {
      throw new Error('Must authorize before creating credentials. Call authorize() first.');
    }

    console.log('[KERIAuth] Creating data attestation credential...');
    console.log('[KERIAuth] Schema SAID:', params.schemaSaid);
    console.log('[KERIAuth] Credential data:', JSON.stringify(params.credData, null, 2));

    try {
      const result = await this.client.createDataAttestationCredential(params);
      
      console.log('[KERIAuth] Credential signed successfully!');
      console.log('[KERIAuth] Result:', {
        acdc: result.acdc ? 'Present' : 'Missing',
        iss: result.iss ? 'Present' : 'Missing',
        anc: result.anc ? 'Present' : 'Missing',
        op: result.op ? 'Present' : 'Missing',
      });
      console.log('[KERIAuth] Full result:', JSON.stringify(result, null, 2));

      return result;
    } catch (error: any) {
      console.error('[KERIAuth] Error creating credential:', error);
      console.error('[KERIAuth] Error details:', {
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Retrieve a credential by its SAID
   * @param credentialSAID The credential's self-addressing identifier
   * @param includeCESR Include CESR-encoded format
   */
  async getCredential(credentialSAID: string, includeCESR: boolean = true) {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    return await this.client.getCredential(credentialSAID, includeCESR);
  }

  // Utility methods
  
  /**
   * Get the authorized AID prefix
   * @returns AID prefix or null if not authorized
   */
  getAuthorizedAID(): string | null {
    return this.authorizeResult?.identifier?.prefix || null;
  }

  /**
   * Check if user has authorized
   * @returns true if authorized, false otherwise
   */
  isAuthorized(): boolean {
    return !!this.authorizeResult;
  }

  /**
   * Get the full authorization result
   * @returns AuthorizeResult or null
   */
  getAuthorizeResult(): AuthorizeResult | null {
    return this.authorizeResult;
  }

  /**
   * Reset authorization state
   */
  reset(): void {
    this.authorizeResult = null;
  }
}

export const keriAuthService = new KERIAuthService();
