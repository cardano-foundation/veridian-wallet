# Backend helpers for E2E tests

- **Contract:** `backend-api.contract.ts` – types only (`IBackendUser`, `SetupBackendUser`, etc.). Tests and helpers depend on this.
- **Wiring:** `backend-helpers.ts` – re-exports the contract types and the current implementation. Step definitions import from here and from the contract. To use a different implementation, change the export in this file.
- **Implementation:** e.g. `remote-bob.helper.ts` – implements `setupBackendUser(alias)` and `IBackendUser` (getOobi, acceptGroupInvitation, etc.). KERIA URLs come from `getKeriaUrlsForTestRunner()` in `ssi-agent-urls.helper.ts`.

**Backend user (Bob/Charlie):** Used when the app user is the initiator. Tests call `setupBackendUser("Bob")`, `bob.getOobi({ ... })`, and `bob.acceptGroupInvitation(timeoutMs)` after the app sends the group request. The dev implements `acceptGroupInvitation` (wait for ICP, complete join).

**Remote initiator:** Used when the backend is the initiator and the app is the joiner. Contract: `IRemoteInitiator` + `setupRemoteInitiator()`.
