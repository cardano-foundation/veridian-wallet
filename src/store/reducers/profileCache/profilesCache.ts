import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CredentialShortDetails } from "../../../core/agent/services/credentialService.types";
import { IdentifierShortDetails } from "../../../core/agent/services/identifier.types";
import {
  RegularConnectionDetails,
  MultisigConnectionDetails,
} from "../../../core/agent/agent.types";
import { KeriaNotification } from "../../../core/agent/services/keriaNotificationService.types";
import { RootState } from "../../index";
import {
  ConnectionData,
  MultiSigGroup,
  Profile,
  ProfileCache,
} from "./profilesCache.types";

// Shared empty arrays — return these to keep selector return references stable
const DefaultArrayValue = {
  Notifications: [] as KeriaNotification[],
  PeerConn: [] as ConnectionData[],
  ArchivedCreds: [] as CredentialShortDetails[],
  Credentials: [] as CredentialShortDetails[],
  Connections: [] as RegularConnectionDetails[],
  MultisigConnections: [] as MultisigConnectionDetails[],
};

const initialState: ProfileCache = {
  profiles: {},
  recentProfiles: [],
  multiSigGroup: undefined,
};

export const profilesCacheSlice = createSlice({
  name: "profilesCache",
  initialState,
  reducers: {
    setProfiles: (state, action: PayloadAction<Record<string, Profile>>) => {
      state.profiles = action.payload;
    },
    setCurrentProfile: (state, action: PayloadAction<string>) => {
      state.defaultProfile = action.payload;
    },
    clearProfiles: (state) => {
      state.profiles = {};
    },
    updateCurrentProfile: (
      state,
      action: PayloadAction<string | undefined>
    ) => {
      state.defaultProfile = action.payload;
    },
    updateRecentProfiles: (state, action: PayloadAction<string[]>) => {
      state.recentProfiles = action.payload;
    },
    setScanGroupId: (state, action: PayloadAction<string | undefined>) => {
      state.scanGroupId = action.payload;
    },
    addOrUpdateProfileIdentity: (
      state,
      action: PayloadAction<IdentifierShortDetails>
    ) => {
      const existedProfile = state.profiles[action.payload.id];
      if (existedProfile) {
        existedProfile.identity = action.payload;
      } else {
        state.profiles[action.payload.id] = {
          identity: action.payload,
          connections: [],
          multisigConnections: [],
          peerConnections: [],
          credentials: [],
          archivedCredentials: [],
          notifications: [],
        };
      }
    },
    addGroupProfile: (state, action: PayloadAction<IdentifierShortDetails>) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      delete state.profiles[action.payload.groupMemberPre!];
      // In case it was already added, we want to avoid inserting a "PENDING" one that could be complete already
      if (!state.profiles[action.payload.id]) {
        state.profiles = {
          ...state.profiles,
          [action.payload.id]: {
            identity: action.payload,
            connections: [],
            multisigConnections: [],
            peerConnections: [],
            credentials: [],
            archivedCredentials: [],
            notifications: [],
          },
        };
      }
    },
    updateProfileCreationStatus: (
      state,
      action: PayloadAction<
        Pick<IdentifierShortDetails, "id" | "creationStatus">
      >
    ) => {
      const profile = state.profiles[action.payload.id];

      if (profile) {
        profile.identity.creationStatus = action.payload.creationStatus;

        state.profiles = {
          ...state.profiles,
          [action.payload.id]: profile,
        };
      }
    },
    removeProfile: (state, action: PayloadAction<string>) => {
      delete state.profiles[action.payload];
    },
    setGroupProfileCache: (
      state,
      action: PayloadAction<MultiSigGroup | undefined>
    ) => {
      state.multiSigGroup = action.payload;
    },
    setNotificationsCache: (
      state,
      action: PayloadAction<KeriaNotification[]>
    ) => {
      if (!state.defaultProfile) return;
      const defaultProfile = state.profiles[state.defaultProfile];

      if (!defaultProfile) return;
      defaultProfile.notifications = action.payload;
    },
    markNotificationAsRead: (
      state,
      action: PayloadAction<{
        id: string;
        read: boolean;
      }>
    ) => {
      if (!state.defaultProfile) return;
      const defaultProfile = state.profiles[state.defaultProfile];
      if (!defaultProfile) return;

      defaultProfile.notifications = defaultProfile.notifications.map(
        (notification) => {
          if (notification.id !== action.payload.id) return notification;

          return {
            ...notification,
            read: action.payload.read,
          };
        }
      );
    },
    deleteNotificationById: (state, action: PayloadAction<string>) => {
      if (!state.defaultProfile) return;
      const defaultProfile = state.profiles[state.defaultProfile];
      if (!defaultProfile) return;

      defaultProfile.notifications = defaultProfile.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    addNotification: (state, action: PayloadAction<KeriaNotification>) => {
      const targetProfile = state.profiles[action.payload.receivingPre];
      if (!targetProfile) return;

      targetProfile.notifications = [
        action.payload,
        ...targetProfile.notifications,
      ];
    },
    setCredsCache: (state, action: PayloadAction<CredentialShortDetails[]>) => {
      if (!state.defaultProfile) return;
      const defaultProfile = state.profiles[state.defaultProfile];
      if (!defaultProfile) return;

      defaultProfile.credentials = action.payload;
    },
    updateOrAddCredsCache: (
      state,
      action: PayloadAction<CredentialShortDetails>
    ) => {
      const targetProfile = state.profiles[action.payload.identifierId];
      if (!targetProfile) return;

      const creds = targetProfile.credentials.filter(
        (cred) => cred.id !== action.payload.id
      );
      targetProfile.credentials = [...creds, action.payload];
    },
    setCredsArchivedCache: (
      state,
      action: PayloadAction<CredentialShortDetails[]>
    ) => {
      if (!state.defaultProfile) return;
      const defaultProfile = state.profiles[state.defaultProfile];
      if (!defaultProfile) return;

      defaultProfile.archivedCredentials = action.payload;
    },
    updateOrAddConnectionCache: (
      state,
      action: PayloadAction<any> /* ConnectionShortDetails */
    ) => {
      const conn = action.payload as any;

      // Determine profile id: prefer explicit identifier, then contactId, then defaultProfile
      const profileId =
        conn.identifier || conn.contactId || state.defaultProfile;
      if (!profileId) return;

      const targetProfile = state.profiles[profileId];
      if (!targetProfile) return;

      const existing = targetProfile.connections.filter(
        (c) => c.id !== conn.id
      );

      // Ensure the stored connection includes identifier/contactId for downstream filters
      const mapped = {
        ...conn,
        identifier: conn.identifier || profileId,
        contactId: conn.contactId || conn.id,
      } as any;

      targetProfile.connections = [...existing, mapped];
    },
    setPeerConnections: (state, action: PayloadAction<ConnectionData[]>) => {
      if (!state.defaultProfile) return;
      const defaultProfile = state.profiles[state.defaultProfile];
      if (!defaultProfile) return;

      defaultProfile.peerConnections = action.payload;
    },
    updatePeerConnectionsFromCore: (
      state,
      action: PayloadAction<ConnectionData[]>
    ) => {
      const updateData: Record<string, ConnectionData[]> =
        action.payload.reduce((result, item) => {
          if (!item.selectedAid) return result;
          let currentArr = result[item.selectedAid];

          if (currentArr) {
            currentArr.push(item);
          } else {
            currentArr = [item];
          }

          result[item.selectedAid] = currentArr;
          return result;
        }, {} as Record<string, ConnectionData[]>);

      Object.keys(updateData).forEach((key) => {
        if (!state.profiles[key]) return;
        state.profiles[key].peerConnections = updateData[key];
      });
    },
    setIndividualFirstCreate: (state, action: PayloadAction<boolean>) => {
      state.individualFirstCreate = action.payload;
    },
    setConnectionsCache: (state, action: PayloadAction<any[]>) => {
      // action.payload expected to be ConnectionShortDetails[]
      const allConns = action.payload as any[];

      Object.keys(state.profiles).forEach((profileId) => {
        const profile = state.profiles[profileId];
        if (!profile) return;
        profile.connections = allConns
          .filter((c) => c.identifier === profileId)
          .map((c) => ({
            ...c,
            identifier: c.identifier || profileId,
            contactId: c.contactId || c.id,
          }));
      });
    },

    removeConnectionCache: (state, action: PayloadAction<string>) => {
      if (!state.defaultProfile) return;
      const defaultProfile = state.profiles[state.defaultProfile];
      if (!defaultProfile) return;

      defaultProfile.connections = defaultProfile.connections.filter(
        (c) => c.id !== action.payload
      );
    },

    setMultisigConnectionsCache: (state, action: PayloadAction<any[]>) => {
      // action.payload expected to be MultisigConnectionDetails[]
      const allMultisig = action.payload as any[];

      Object.keys(state.profiles).forEach((profileId) => {
        const profile = state.profiles[profileId];
        if (!profile) return;

        // For multisig connections, filter by groupId since all group members should see all connections
        // Check if this profile has group metadata to determine if it should have multisig connections
        const profileGroupId = profile.identity?.groupMetadata?.groupId;

        if (profileGroupId) {
          profile.multisigConnections = allMultisig
            .filter((c) => "groupId" in c && c.groupId === profileGroupId)
            .map((c) => ({
              ...c,
              contactId: c.contactId || profileId,
              groupId: c.groupId || profileGroupId,
            }));
        } else {
          // If profile doesn't have group metadata, clear multisig connections
          profile.multisigConnections = [];
        }
      });
    },

    updateOrAddMultisigConnectionCache: (
      state,
      action: PayloadAction<any> /* MultisigConnectionDetails */
    ) => {
      const conn = action.payload as any;

      // For multisig connections, store under the current user's profile, not the contactId
      // The contactId represents the other party, but we want to store this in the current user's profile
      const currentProfileId = state.defaultProfile;
      if (!currentProfileId) return;

      const targetProfile = state.profiles[currentProfileId];
      if (!targetProfile) return;

      const existing = targetProfile.multisigConnections.filter(
        (c) => c.id !== conn.id
      );

      const mapped = {
        ...conn,
        contactId: conn.contactId || currentProfileId,
        groupId: conn.groupId || conn.groupId || "",
      } as any;

      targetProfile.multisigConnections = [...existing, mapped];
    },

    setOpenConnectionId: (state, action: PayloadAction<string | undefined>) => {
      state.openConnectionId = action.payload;
    },
    setMissingAliasConnection: (
      state,
      action: PayloadAction<{ url: string; identifier?: string } | undefined>
    ) => {
      state.missingAliasUrl = action.payload;
    },
  },
});

export const {
  setProfiles,
  clearProfiles,
  updateCurrentProfile,
  updateRecentProfiles,
  setNotificationsCache,
  deleteNotificationById,
  markNotificationAsRead,
  addNotification,
  setCredsCache,
  updateOrAddCredsCache,
  setPeerConnections,
  setCredsArchivedCache,
  addOrUpdateProfileIdentity,
  addGroupProfile,
  updateProfileCreationStatus,
  removeProfile,
  setGroupProfileCache,
  setIndividualFirstCreate,
  setCurrentProfile,
  setScanGroupId,
  updatePeerConnectionsFromCore,
  setConnectionsCache,
  setMultisigConnectionsCache,
  updateOrAddConnectionCache,
  removeConnectionCache,
  updateOrAddMultisigConnectionCache,
  setOpenConnectionId,
  setMissingAliasConnection,
} = profilesCacheSlice.actions;

const getProfiles = (state: RootState) => state.profilesCache.profiles;
const getCurrentProfile = (state: RootState) =>
  state.profilesCache.defaultProfile
    ? state.profilesCache.profiles[state.profilesCache.defaultProfile]
    : undefined;
const getRecentProfiles = (state: RootState) =>
  state.profilesCache.recentProfiles;

const getNotificationsCache = (state: RootState) =>
  getCurrentProfile(state)?.notifications || DefaultArrayValue.Notifications;

const getConnectionsCache = (state: RootState) =>
  getCurrentProfile(state)?.connections || DefaultArrayValue.Connections;

const getMultisigConnectionsCache = (state: RootState) =>
  getCurrentProfile(state)?.multisigConnections ||
  DefaultArrayValue.MultisigConnections;

const getOpenConnectionId = (state: RootState) =>
  state.profilesCache.openConnectionId;

const getMissingAliasConnection = (state: RootState) =>
  state.profilesCache.missingAliasUrl;

const getCredsCache = (state: RootState) =>
  getCurrentProfile(state)?.credentials || DefaultArrayValue.Credentials;

const getPeerConnections = (state: RootState) =>
  getCurrentProfile(state)?.peerConnections || DefaultArrayValue.PeerConn;

const getCredsArchivedCache = (state: RootState) =>
  getCurrentProfile(state)?.archivedCredentials ||
  DefaultArrayValue.ArchivedCreds;

const getProfileGroupCache = (state: RootState) =>
  state.profilesCache.multiSigGroup;

const getIndividualFirstCreateSetting = (state: RootState) =>
  state.profilesCache.individualFirstCreate;

const getScanGroupId = (state: RootState) => state.profilesCache?.scanGroupId;

export {
  getCredsArchivedCache,
  getCredsCache,
  getCurrentProfile,
  getIndividualFirstCreateSetting,
  getProfileGroupCache,
  getNotificationsCache,
  getPeerConnections,
  getProfiles,
  getRecentProfiles,
  getScanGroupId,
  getConnectionsCache,
  getMultisigConnectionsCache,
  getOpenConnectionId,
  getMissingAliasConnection,
};
