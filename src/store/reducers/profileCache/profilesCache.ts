import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { KeriaNotification } from "../../../core/agent/services/keriaNotificationService.types";
import { RootState } from "../../index";
import { Profile, ProfileCache } from "./profilesCache.types";

const initialState: ProfileCache = {
  profiles: {},
  recentProfiles: [],
};

export const profilesCacheSlice = createSlice({
  name: "profilesCache",
  initialState,
  reducers: {
    setProfiles: (state, action: PayloadAction<Record<string, Profile>>) => {
      state.profiles = action.payload;
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

export {
  getCurrentProfile,
  getNotificationsCache,
  getProfiles,
  getRecentProfiles,
};
