import { configureStore } from "@reduxjs/toolkit";
import { biometricsCacheSlice } from "../../store/reducers/biometricsCache";
import { seedPhraseCacheSlice } from "../../store/reducers/seedPhraseCache";
import { ssiAgentSlice } from "../../store/reducers/ssiAgent";
import { stateCacheSlice } from "../../store/reducers/stateCache";
import { viewTypeCacheSlice } from "../../store/reducers/viewTypeCache";
import { walletConnectionsCacheSlice } from "../../store/reducers/walletConnectionsCache";
import { profilesCacheSlice } from "../../store/reducers/profileCache";

export function makeTestStore(preloadedState?: any) {
  const transformedPreloaded = preloadedState
    ? { ...preloadedState }
    : undefined;

  if (transformedPreloaded && transformedPreloaded.connectionsCache) {
    const legacy = transformedPreloaded.connectionsCache as any;
    const existingProfilesCache =
      transformedPreloaded.profilesCache &&
      typeof transformedPreloaded.profilesCache === "object"
        ? { ...transformedPreloaded.profilesCache }
        : { profiles: {}, recentProfiles: [] };

    const profiles: Record<string, any> = {
      ...(existingProfilesCache.profiles || {}),
    };

    if (
      legacy.multisigConnections &&
      typeof legacy.multisigConnections === "object"
    ) {
      Object.entries(legacy.multisigConnections).forEach(
        ([key, mconnRaw]: [string, any]) => {
          const mconn = mconnRaw || {};
          const profileId =
            mconn.contactId ||
            existingProfilesCache.defaultProfile ||
            mconn.identifier ||
            key;
          if (!profileId) return;
          if (!profiles[profileId]) {
            profiles[profileId] = {
              identity: {
                id: profileId,
                displayName: mconn.label || profileId,
                createdAtUTC: "2000-01-01T00:00:00.000Z",
              },
              connections: [],
              multisigConnections: [],
              peerConnections: [],
              credentials: [],
              archivedCredentials: [],
              notifications: [],
            };
          }

          const mapped = {
            ...mconn,
            id: key,
            contactId: mconn.contactId || profileId,
            groupId: mconn.groupId || "",
          };

          profiles[profileId].multisigConnections.push(mapped);
        }
      );

      // Migrate legacy keyed connections into per-profile arrays so tests
      // which provide `connectionsCache.connections` still find issuer labels
      // via the new `profilesCache` selectors.
      if (legacy.connections && typeof legacy.connections === "object") {
        Object.entries(legacy.connections).forEach(
          ([key, connRaw]: [string, any]) => {
            const conn = connRaw || {};

            // Determine profile id: prefer identifier, then contactId, then existing default, then fallback to the key
            const profileId =
              conn.identifier ||
              conn.contactId ||
              existingProfilesCache.defaultProfile ||
              key;
            if (!profileId) return;

            if (!profiles[profileId]) {
              profiles[profileId] = {
                identity: {
                  id: profileId,
                  displayName: conn.label || profileId,
                  createdAtUTC: "2000-01-01T00:00:00.000Z",
                },
                connections: [],
                multisigConnections: [],
                peerConnections: [],
                credentials: [],
                archivedCredentials: [],
                notifications: [],
              };
            }

            const mapped = {
              ...conn,
              id: key,
              identifier: conn.identifier || profileId,
              contactId: conn.contactId || conn.id || key,
            };

            profiles[profileId].connections.push(mapped);
          }
        );
      }
    }

    existingProfilesCache.openConnectionId =
      legacy.openConnectionId || existingProfilesCache.openConnectionId;
    existingProfilesCache.missingAliasUrl =
      legacy.missingAliasUrl || existingProfilesCache.missingAliasUrl;

    existingProfilesCache.profiles = profiles;
    transformedPreloaded.profilesCache = existingProfilesCache;

    delete transformedPreloaded.connectionsCache;
  }

  return configureStore({
    reducer: {
      stateCache: stateCacheSlice.reducer,
      seedPhraseCache: seedPhraseCacheSlice.reducer,
      walletConnectionsCache: walletConnectionsCacheSlice.reducer,
      viewTypeCache: viewTypeCacheSlice.reducer,
      biometricsCache: biometricsCacheSlice.reducer,
      ssiAgentCache: ssiAgentSlice.reducer,
      profilesCache: profilesCacheSlice.reducer,
    },
    preloadedState: transformedPreloaded,
  });
}
