/**
 * Entry point for E2E backend helpers. Step definitions import from here and from backend-api.contract.
 * Wired to dev's createBackendUser (backend-api.contract.ts). To use stub, point to remote-bob.helper.js.
 */
export type { IBackendUser, GetOobiOptions, SetupBackendUser } from "./backend-api.contract.js";
import { createRemoteJoiner } from "./backend-api.contract.js";
import { getKeriaUrlsForTestRunner } from "./ssi-agent-urls.helper.js";

const DEFAULT_WITNESSES_CONFIG = { toad: 0, witnesses: [] };

export async function setupBackendUser(alias: string) {
  const config = getKeriaUrlsForTestRunner();
  return createRemoteJoiner(alias, config, DEFAULT_WITNESSES_CONFIG);
}

export function resetBackendUsers(): void {}
