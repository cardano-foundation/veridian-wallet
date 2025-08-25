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

  // Normalize any provided `profilesCache` entries: if tests/fixtures supplied
  // legacy-shaped object maps for `connections` or `multisigConnections`,
  // convert them to per-profile arrays so selectors receive consistent arrays.
  if (
    transformedPreloaded &&
    transformedPreloaded.profilesCache &&
    typeof transformedPreloaded.profilesCache === "object"
  ) {
    const pc = transformedPreloaded.profilesCache as any;
    if (pc.profiles && typeof pc.profiles === "object") {
      Object.keys(pc.profiles).forEach((pid) => {
        const profile = pc.profiles[pid] || {};

        // Normalize connections map -> array
        if (profile.connections && !Array.isArray(profile.connections)) {
          try {
            profile.connections = Object.values(profile.connections || {}).map(
              (c: any) => ({
                ...c,
                id: c?.id || c?.contactId || "",
                identifier: c?.identifier || c?.id || pid,
                contactId: c?.contactId || c?.id || pid,
              })
            );
          } catch (e) {
            profile.connections = [];
          }
        }

        // Normalize multisigConnections map -> array
        if (
          profile.multisigConnections &&
          !Array.isArray(profile.multisigConnections)
        ) {
          try {
            profile.multisigConnections = Object.values(
              profile.multisigConnections || {}
            ).map((c: any) => ({
              ...c,
              id: c?.id || "",
              contactId: c?.contactId || pid,
              groupId: c?.groupId || "",
            }));
          } catch (e) {
            profile.multisigConnections = [];
          }
        }

        pc.profiles[pid] = profile;
      });
    }

    // Ensure a defaultProfile exists to keep selectors that depend on it happy
    if (!pc.defaultProfile) {
      const first = pc.profiles && Object.keys(pc.profiles)[0];
      if (first) pc.defaultProfile = first;
    }
  }

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

    // If there are no existing profiles and no default, coalesce migrated
    // connections into a single synthetic profile so tests that expect a
    // current profile with all connections continue to work during staged
    // migration.
    const shouldCoalesceToSingleProfile =
      !existingProfilesCache.defaultProfile &&
      Object.keys(profiles).length === 0;
    const coalescedProfileId = shouldCoalesceToSingleProfile
      ? "__migrated_default_profile__"
      : undefined;

    // Migrate legacy multisigConnections into per-profile arrays.
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
            id: (mconn && (mconn.id as string)) || key,
            contactId: mconn.contactId || mconn.id || profileId,
            groupId: mconn.groupId || "",
          };

          profiles[profileId].multisigConnections.push(mapped);
        }
      );
    }

    // Migrate legacy keyed connections into per-profile arrays so tests
    // which provide `connectionsCache.connections` still find issuer labels
    // via the new `profilesCache` selectors.
    if (legacy.connections && typeof legacy.connections === "object") {
      Object.entries(legacy.connections).forEach(
        ([key, connRaw]: [string, any]) => {
          const conn = connRaw || {};

          // Determine profile id: prefer identifier, then contactId, then existing default, then fallback to the key
          let profileId =
            conn.identifier ||
            conn.contactId ||
            existingProfilesCache.defaultProfile ||
            key;

          if (coalescedProfileId) {
            profileId = coalescedProfileId;
          }
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
            id: (conn && (conn.id as string)) || key,
            identifier: conn.identifier || conn.id || profileId,
            contactId: conn.contactId || conn.id || key,
          };

          profiles[profileId].connections.push(mapped);
        }
      );
    }

    existingProfilesCache.openConnectionId =
      legacy.openConnectionId || existingProfilesCache.openConnectionId;
    existingProfilesCache.missingAliasUrl =
      legacy.missingAliasUrl || existingProfilesCache.missingAliasUrl;

    existingProfilesCache.profiles = profiles;

    // If there is no defaultProfile set, pick the first migrated profile so
    // selectors that rely on the current profile find the migrated data.
    if (!existingProfilesCache.defaultProfile) {
      const firstProfileId = Object.keys(profiles)[0];
      if (firstProfileId) existingProfilesCache.defaultProfile = firstProfileId;
    }

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
