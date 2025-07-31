import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CredentialShortDetails } from "../../../core/agent/services/credentialService.types";
import { IdentifierShortDetails } from "../../../core/agent/services/identifier.types";
import { KeriaNotification } from "../../../core/agent/services/keriaNotificationService.types";
import { RootState } from "../../index";
import {
  ConnectionData,
  MultiSigGroup,
  Profile,
  ProfileCache,
} from "./profilesCache.types";

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
    setPeerConnections: (state, action: PayloadAction<ConnectionData[]>) => {
      if (!state.defaultProfile) return;
      const defaultProfile = state.profiles[state.defaultProfile];
      if (!defaultProfile) return;

      defaultProfile.peerConnections = action.payload;
    },
    setIndividualFirstCreate: (state, action: PayloadAction<boolean>) => {
      state.individualFirstCreate = action.payload;
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
} = profilesCacheSlice.actions;

const getProfiles = (state: RootState) => state.profilesCache.profiles;
const getCurrentProfile = (state: RootState) =>
  state.profilesCache.defaultProfile
    ? state.profilesCache.profiles[state.profilesCache.defaultProfile]
    : undefined;
const getRecentProfiles = (state: RootState) =>
  state.profilesCache.recentProfiles;

const getNotificationsCache = (state: RootState) =>
  getCurrentProfile(state)?.notifications || [];

const getCredsCache = (state: RootState) =>
  getCurrentProfile(state)?.credentials || [];

const getPeerConnections = (state: RootState) =>
  getCurrentProfile(state)?.peerConnections || [];

const getCredsArchivedCache = (state: RootState) =>
  getCurrentProfile(state)?.archivedCredentials || [];

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
};
